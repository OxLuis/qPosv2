const companyName = 'chiperiaTrovari';

async function loadDatabase() {
  const db = await idb.openDB(companyName, 1, {
    upgrade(db, oldVersion, newVersion, transaction) {
      db.createObjectStore("products", {
        keyPath: "codigo", // Cambié 'id' a 'codigo' para que coincida con el JSON
        autoIncrement: false,
      });
      db.createObjectStore("sales", {
        keyPath: "id",
        autoIncrement: true,
      });
      db.createObjectStore("categories", {
        keyPath: "id",
        autoIncrement: true,
      });
    },
  });

  return {
    db,
    getProducts: async () => await db.getAll("products"),
    addProduct: async (product) => await db.add("products", product),
    editProduct: async (product) => await db.put("products", product.codigo, product),
    deleteProduct: async (product) => await db.delete("products", product.codigo),
  };
}

function initApp() {
  const app = {
    db: null,
    time: null,
    firstTime: localStorage.getItem("first_time") === null,
    activeMenu: 'pos',
    showOptions: false,
    loadingSampleData: false,
    products: [],
    keyword: "",
    cart: [],
    isShowModalReceipt: false,
    isModalBill: false,
    currentStep: 1,
    documento: '',
    nombres: '',
    email: '',
    receiptNo: null,
    receiptDate: null,
    userOption: localStorage.getItem('userOption'),
    async initDatabase() {
      this.db = await loadDatabase();
      this.loadProducts();
      resetInactivityTimer();
    },
    async loadProducts() {
      this.products = await this.db.getProducts();
      console.log("products loaded", this.products);
    },
    async startWithSampleData() {
      try {
        const response = await fetch("http://mails.trovari.com.py/wsTrovariApp/webresources/AppServ/buscar-productos", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            "pCodEmpresa": "1",
            "pCodProducto": null,
            "pDescripcion": null
          })
        });

        // Verificamos si la respuesta fue exitosa
        if (!response.ok) {
          throw new Error('Error en la respuesta del servidor');
        }

        const data = await response.json();
        this.products = data.products;

        for (let product of data.products) {
          await this.db.addProduct(product);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        // Cargar datos de sample.json en caso de error
        try {
          const response = await fetch('./data/sample.json');
          if (!response.ok) {
            throw new Error('Error loading sample data');
          }
          const sampleData = await response.json();
          this.products = sampleData.products;
          for (let product of sampleData) {
            await this.db.addProduct(product);
          }
        } catch (sampleError) {
          console.error('Error loading sample data:', sampleError);
        }
      }

      this.setFirstTime(false);
    },
    startBlank() {
      this.setFirstTime(false);
    },
    setFirstTime(firstTime) {
      this.firstTime = firstTime;
      if (firstTime) {
        localStorage.removeItem("first_time");
      } else {
        localStorage.setItem("first_time", new Date().getTime());
      }
    },
    filteredProducts() {
      const rg = this.keyword ? new RegExp(this.keyword, "gi") : null;
      return this.products.filter((p) => !rg || p.descripcion.match(rg)); // Usar 'descripcion' en lugar de 'name'
    },
    addToCart(product) {
      const index = this.findCartIndex(product);
      if (index === -1) {
        this.cart.push({
          productId: product.codigo,
          image: product.img_pro_alt,
          name: product.descripcion,
          precio: product.precio,
          qty: 1,
        });
      } else {
        this.cart[index].qty += 1;
      }
      this.saveCart(); // Guarda el carrito después de agregar productos
      this.beep();
    },
    findCartIndex(product) {
      return this.cart.findIndex((p) => p.productId === product.codigo); // Cambiado 'id' a 'codigo'
    },
    addQty(item, qty) {
      const index = this.cart.findIndex((i) => i.productId === item.productId);
      if (index === -1) {
        return;
      }
      const afterAdd = item.qty + qty;
      if (afterAdd === 0) {
        this.cart.splice(index, 1);
        this.clearSound();
      } else {
        this.cart[index].qty = afterAdd;
        this.beep();
      }
    },
    getItemsCount() {
      return this.cart.reduce((count, item) => count + item.qty, 0);
    },
    getTotalPrice() {
      return this.cart.reduce(
        (total, item) => total + item.qty * item.precio, // Cambié 'price' a 'precio'
        0
      );
    },
    submitable() {
      return this.cart.length > 0;
    },
    modalBill(){
      this.isModalBill = true;
      this.inputDocumento = true;
      console.log(this.isModalBill)
    },
    nextStep() {
      if (this.currentStep < 3) {
        this.currentStep += 1;
      } else {
        this.saveBillingData(); // Guarda los datos en localStorage
        this.makePayment(); // Cuando llegues al último paso
      }
    },
    previousStep() {
      if (this.currentStep > 1) {
        this.currentStep -= 1;
      }
    },
    makePayment(){
      const combinedDataJSON = this.createCombinedJSON();
      console.log(combinedDataJSON);
      alert('Realizando el pago en POS')
    },
    submit() {
      const time = new Date();
      this.isShowModalReceipt = true;
      this.receiptNo = `chiperia-${Math.round(time.getTime() / 1000)}`;
      this.receiptDate = this.dateFormat(time);
    },
    closeModalReceipt() {
      this.isShowModalReceipt = false;
    },
    closeModalBill() {
      this.isModalBill = false;
    },
    dateFormat(date) {
      const formatter = new Intl.DateTimeFormat('id', { dateStyle: 'short', timeStyle: 'short' });
      return formatter.format(date);
    },
    numberFormat(number) {
      return (number || "")
        .toString()
        .replace(/^0|\./g, "")
        .replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
    },
    priceFormat(number) {
      return number ? `${this.numberFormat(number)} Gs.` : `0 Gs.`;
    },
    clear() {
      this.cart = [];
      this.receiptNo = null;
      this.receiptDate = null;
      this.clearSound();
    },
    beep() {
      this.playSound("sound/beep-29.mp3");
    },
    clearSound() {
      this.playSound("sound/button-21.mp3");
    },
    playSound(src) {
      const sound = new Audio();
      sound.src = src;
      sound.play();
      sound.onended = () => delete (sound);
    },
    closeOptionsModal() {
      this.showOptions = false;
    },
    selectOption(selected) {
      localStorage.setItem('userOption', selected);
      localStorage.removeItem('billingData');
      localStorage.removeItem('cart');
      this.userOption = selected; // Actualiza el estado local
      this.closeOptionsModal(); // Cierra el modal después de seleccionar
    },
    saveBillingData() {
      const billingData = {
        documento: this.documento,
        nombres: this.nombres,
        email: this.email,
      };
      localStorage.setItem('billingData', JSON.stringify(billingData));
    },
    saveCart() {
      localStorage.setItem('cart', JSON.stringify(this.cart));
    },
    loadCart() {
      const cart = JSON.parse(localStorage.getItem('cart'));
      if (cart) {
        this.cart = cart;
      }
    },
    createCombinedJSON() {
      // Recuperar datos del localStorage
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      const billingData = JSON.parse(localStorage.getItem('billingData')) || {};
      const paymentData = JSON.parse(localStorage.getItem('paymentData')) || {};

      // Combinar los datos en un solo objeto
      const combinedData = {
        cart,
        billingData,
        paymentData
      };

      // Convertir a JSON
      const combinedJSON = JSON.stringify(combinedData);

      return combinedJSON;
    },
    printAndProceed() {
      const receiptContent = document.getElementById('receipt-content');
      const titleBefore = document.title;
      const printArea = document.getElementById('print-area');

      printArea.innerHTML = receiptContent.innerHTML;
      document.title = this.receiptNo;

      window.print();
      this.isShowModalReceipt = false;

      printArea.innerHTML = '';
      document.title = titleBefore;

      // TODO save sale data to database

      this.clear();
    }
  };

  let inactivityTimer;

  function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      window.location.href = 'index.html'; // Redirigir a index.html
    }, 60000); // 5 minutos
  }

  // Escuchar eventos para resetear el temporizador
  window.addEventListener('mousemove', resetInactivityTimer);
  window.addEventListener('keypress', resetInactivityTimer);
  window.addEventListener('click', resetInactivityTimer);
  window.addEventListener('scroll', resetInactivityTimer);

  return app;
}

function deleteLocalDB(db) {
  const request = indexedDB.deleteDatabase(db);

  request.onsuccess = function (event) {
    localStorage.clear();
    alert('Base de datos eliminada con éxito.');
  };
}
