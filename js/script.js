const companyName = "chiperiaTrovari";

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
        editProduct: async (product) =>
            await db.put("products", product.codigo, product),
        deleteProduct: async (product) =>
            await db.delete("products", product.codigo),
        clearDatabase: async function () {
            const tx = db.transaction("products", "readwrite");
            const store = tx.objectStore("products");
            await store.clear();
            await tx.done;
        },
    };
}

function initApp() {
    const app = {
        db: null,
        time: null,
        firstTime: localStorage.getItem("first_time") === null,
        activeMenu: "pos",
        showOptions: false,
        loadingSampleData: false,
        products: [],
        keyword: "",
        cart: [],
        isShowModalReceipt: false,
        isShowModalPayment: false,
        isShowModalConfig: false,
        isAuth: false,
        isShowModalBill: false,
        isLoading: false,
        isAux: false,
        isError: false,
        isSuccess: false,
        tipoPago: "",
        currentStep: 0,
        documento: "",
        nombre: "",
        email: "",
        isExenta: false,
        ocasional: false,
        selectedCategory: null,
        configBancardApi: localStorage.getItem("configBancardApi"),
        configCompanyApi: localStorage.getItem("configCompanyApi"),
        configImageApi: localStorage.getItem("configImageApi"),
        configProxyPos: localStorage.getItem("configProxyPos"),
        configPdvName: localStorage.getItem("configPdvName"),
        configPin: "",
        receiptNo: null,
        lottieInstance: null,
        receiptDate: null,
        userOption: localStorage.getItem("userOption"),
        async initDatabase() {
			enterFullScreen();
            this.db = await loadDatabase();
            this.loadProducts();
            resetInactivityTimer();
            this.initLottieAnimation();
			localStorage.removeItem('isExenta');
        },
        async loadProducts() {
            this.products = await this.db.getProducts();
            console.log("products loaded", this.products);
        },
        async startWithSampleData() {
            try {
                this.getProductsFromAPI();
            } catch (error) {
                console.error("Error fetching products:", error);
                // Cargar datos de sample.json en caso de error
                try {
                    const response = await fetch("./data/sample.json");
                    if (!response.ok) {
                        throw new Error("Error loading sample data");
                    }
                    const sampleData = await response.json();
                    this.products = sampleData.products;
                    for (let product of sampleData) {
                        await this.db.addProduct(product);
                    }
                } catch (sampleError) {
                    console.error("Error loading sample data:", sampleError);
                }
            }

            this.setFirstTime(false);
        },
        async getProductsFromAPI() {
            const response = await fetch(
                localStorage.getItem("configCompanyApi") + "/buscar-productos",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        pCodEmpresa: "1",
                        pCodProducto: null,
                        pDescripcion: null,
                    }),
                }
            );
            if (!response.ok) {
                throw new Error("Error en la respuesta del servidor");
            }
            const data = await response.json();

            for (let product of data) {
                await this.db.addProduct(product);
            }
            window.location.href = "index.html";
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
        /* filteredProducts() {
	  const rg = this.keyword ? new RegExp(this.keyword, "gi") : null;
	  return this.products.filter((p) => !rg || p.descripcion.match(rg)); // Usar 'descripcion' en lugar de 'name'
	}, */
        filteredProducts() {
            const rg = this.keyword ? new RegExp(this.keyword, "gi") : null;
            return this.products.filter(
                (p) =>
                    (!rg || p.descripcion.match(rg)) &&
                    (p.existencia > 0 || p.des_marca === "CAFE FICHA") &&
                    (!this.selectedCategory ||
                        p.des_sub_tipo === this.selectedCategory)
            );
        },
        filteredCategorias() {
            const categoriasUnicas = [
                ...new Set(this.products.map((p) => p.des_sub_tipo)),
            ];
            return categoriasUnicas.filter((categoria) => categoria);
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
            const index = this.cart.findIndex(
                (i) => i.productId === item.productId
            );
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
		resumeExenta(){
			const isExenta = JSON.parse(localStorage.getItem("isExenta"));
			// Si es exenta, ajusta el precio de cada ítem en el carrito
			if (this.isExenta) {
				this.cart = this.cart.map(item => ({
					...item,
					precio:  Math.round(item.precio / 1.1) // Aplica exención de IVA al precio del ítem
				}));
				this.saveCart(); // Guarda el carrito actualizado en localStorage
			}
		},
		getTotalPrice() {
			
			let total = this.cart.reduce(
				(total, item) => total + item.qty * item.precio,
				0
			);
		
			// Redondea el total a 0 decimales
			return Math.round(total);
		},
        canContinue() {
            if (this.nombre) {
                return true;
            }
        },
        submitable() {
            return this.cart.length > 0;
        },
        getExenta() {
            const billingDataApi = localStorage.getItem("billingDataApi");

            if (billingDataApi) {
                let parsedData;
                try {
                    parsedData = JSON.parse(billingDataApi); // Esto lo convierte a objeto si es cadena
                } catch (error) {
                    console.error("Error al parsear 'billingDataApi':", error);
                    return;
                }

                // Asegúrate de que parsedData es un array y asigna el primer elemento
                const data = Array.isArray(parsedData)
                    ? parsedData[0]
                    : parsedData;

                // Verifica si el campo 'tar_exo_fiscal' existe en los datos
                this.isExenta = !!data.tar_exo_fiscal; // Asigna true si existe, false si no
            } else {
                // Si no existe 'billingDataApi' en localStorage, asigna false
                this.isExenta = false;
            }
        },
        async initLottieAnimation() {
            const posLottie = document.getElementById("lottieContainer-POS");
            this.lottieInstance = lottie.loadAnimation({
                container: posLottie,
                renderer: "svg",
                loop: true,
                autoplay: true,
                path: "img/app/pos.json",
                rendererSettings: {
                    preserveAspectRatio: "xMidYMid meet",
                    progressiveLoad: true,
                },
            });
            const successLottie = document.getElementById("lottieContainer-OK");
            this.lottieInstance = lottie.loadAnimation({
                container: successLottie,
                renderer: "svg",
                loop: true,
                autoplay: true,
                path: "img/app/success.json",
                rendererSettings: {
                    preserveAspectRatio: "xMidYMid meet",
                    progressiveLoad: true,
                },
            });

            const errorLottie = document.getElementById(
                "lottieContainer-ERROR"
            );
            this.lottieInstance = lottie.loadAnimation({
                container: errorLottie,
                renderer: "svg",
                loop: true,
                autoplay: true,
                path: "img/app/error.json",
                rendererSettings: {
                    preserveAspectRatio: "xMidYMid meet",
                    progressiveLoad: true,
                },
            });
        },
        modalBill() {
            this.isShowModalBill = true;
            this.inputDocumento = true;
            this.beep();
            console.log(this.isShowModalBill);
        },
        saveModalConfig() {
            localStorage.setItem("configBancardApi", this.configBancardApi);
            localStorage.setItem("configCompanyApi", this.configCompanyApi);
            localStorage.setItem("configImageApi", this.configImageApi);
            localStorage.setItem("configPdvName", this.configPdvName);
            localStorage.setItem("configProxyPos", this.configProxyPos);
            alert("Se ha guardado la configuracion con éxito");
            this.isAuth = false;
            this.isShowModalConfig = false;
            this.configPin = "";
        },
        closeModalConfig() {
            this.isShowModalConfig = false;
            this.configPin = "";
        },
        modalConfig() {
            this.isShowModalConfig = true;
        },
        async nextStep() {
            // Verifica si es el primer paso y que el documento esté seteado
            if (this.currentStep === 1 && this.documento === "") {
                alert("Debe completar todos los campos requeridos");
                return;
            } else if (this.currentStep === 1 && this.documento !== "") {
                try {
                    // Espera a que getClientBillingData() finalice antes de continuar
                    await this.getClientBillingData();
                } catch (error) {
                    alert(
                        "Hubo un error al verificar el documento. Inténtelo de nuevo."
                    );
                    console.error(error);
                    //return;
                }
            }
            // Verifica si es el segundo paso y el campo nombre está completo
            if (
                this.ocasional &&
                this.currentStep === 2 &&
                this.nombre !== ""
            ) {
                this.saveBillingData(); // Guarda los datos en localStorage
                //this.makePayment(); // Cuando llegues al último paso
                this.submit();
                return;
            } else if (this.nombre === "" && this.currentStep === 2) {
                alert("Debe completar el campo de nombre para continuar");
                return;
            }

            // Cambia al siguiente paso si está dentro del rango
            if (this.currentStep < 3) {
                this.currentStep += 1;
            } else {
                this.saveBillingData(); // Guarda los datos en localStorage
                //this.makePayment(); // Cuando llegues al último paso
                this.submit();
            }
        },
        previousStep() {
            if (this.currentStep > 0) {
                this.currentStep -= 1;
            }
        },
        async getClientBillingData() {
            const response = await fetch(
                localStorage.getItem("configCompanyApi") + "/buscar-cliente",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        pCodEmpresa: "1",
                        pDocumento: this.documento,
                    }),
                }
            );

            if (!response.ok) {
                throw new Error("Error en la respuesta del servidor");
            }

            const data = await response.json();

            // Verificar si 'tar_exo_fiscal' existe en la respuesta
            this.isExenta = data && data[0] && data[0].tar_exo_fiscal ? true : false;

			if(this.isExenta){
				console.log('Calculando precio exentas')
				this.resumeExenta();
			}
            // Guardar los datos en localStorage
            localStorage.setItem("billingDataApi", JSON.stringify(data));
            this.nombre = data[0].nombre ?? "";
            this.email = data[0].mail ?? "";
            // Guardar el valor de 'isExenta' en localStorage
            localStorage.setItem("isExenta", this.isExenta);

            console.log(`Es exenta? ${this.isExenta}`); // Para verificar el contenido de 'data'
        },
        cancelOcasionalClient() {
            this.ocasional = false;
            this.currentStep = 0;
        },
        ocasionalClient() {
            this.currentStep = 2;
            this.ocasional = true;
        },
        makePayment() {
            this.isShowModalReceipt = false;
            this.isShowModalBill = false;
            this.isShowModalPayment = true;
        },
        submit() {
            const time = new Date();
            this.isShowModalReceipt = true;
            this.receiptNo = `chiperia-${Math.round(time.getTime() / 1000)}`;
            this.receiptDate = this.dateFormat(time);
        },
        selectPayment(tipo) {
            if (tipo == "qr") {
                this.isLoading = true;
                this.tipoPago = tipo;
            } else {
                this.isLoading = true;
                this.tipoPago = tipo;
                this.pay(tipo);
            }
        },
        modalCloseReceipt() {
            this.isShowModalReceipt = false;
            this.isShowModalBill = false;
        },
        async pay(tipo) {
            console.log("pago de tipo " + tipo);
            this.isAux = true;
            this.isLoading = false;
            const time = new Date();
            const factura = Math.floor(time.getTime() / 10); // Divide por 10 para reducir el número
            monto = this.getTotalPrice();

            console.log("Total a pagar: " + monto);
            console.log("Pagando con: " + tipo);

            if (tipo == "qr credito" || tipo == "qr debito") {
                this.tipoPago = tipo;
                try {
                    const response = await fetch(
                        localStorage.getItem("configProxyPos") + "/qr",
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                facturaNro: factura,
                                monto: monto,
                                vuelto: 0,
                                pos: localStorage.getItem("configBancardApi"),
                            }),
                        }
                    );

                    if (response.ok) {
                        // Verifica que la respuesta sea exitosa (código de estado 2xx)
                        const data = await response.json();
                        console.log("Respuesta del servidor:", data);

                        localStorage.setItem(
                            "paymentData",
                            JSON.stringify(data)
                        );
                        this.submitOrder(tipo);
                    } else {
                        // Si la respuesta no es exitosa, muestra un mensaje de error
                        const errorData = await response.json();
                        console.error(
                            "Error al realizar la transacción:",
                            errorData
                        );
                        this.isAux = false;
                        this.isError = true;
                        //alert("Error al procesar el pago. Por favor, inténtelo de nuevo.");
                    }
                } catch (error) {
                    // Manejo de errores de red u otros errores inesperados
                    console.error("Error al realizar la petición:", error);
                    this.isAux = false;
                    this.isError = true;
                    //alert("Hubo un problema al procesar tu pago. Verifica tu conexión o intenta de nuevo.");
                }
            }

            if (tipo == "debito" || tipo == "credito") {
                this.tipoPago = tipo;
                try {
                    const response = await fetch(
                        localStorage.getItem("configProxyPos") + "/" + tipo,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                facturaNro: factura,
                                monto: monto,
                                vuelto: 0,
                                pos: localStorage.getItem("configBancardApi"),
                            }),
                        }
                    );

                    if (response.ok) {
                        // Verifica que la respuesta sea exitosa (código de estado 2xx)
                        const data = await response.json();
                        console.log("Respuesta del servidor:", data);

                        localStorage.setItem(
                            "paymentData",
                            JSON.stringify(data)
                        );
                        this.submitOrder(tipo);
                    } else {
                        // Si la respuesta no es exitosa, muestra un mensaje de error
                        const errorData = await response.json();
                        console.error(
                            "Error al realizar la transacción:",
                            errorData
                        );
                        this.isAux = false;
                        this.isError = true;
                        //alert("Error al procesar el pago. Por favor, inténtelo de nuevo.");
                    }
                } catch (error) {
                    // Manejo de errores de red u otros errores inesperados
                    console.error("Error al realizar la petición:", error);
                    this.isAux = false;
                    this.isError = true;
                    //alert("Hubo un problema al procesar tu pago. Verifica tu conexión o intenta de nuevo.");
                }
            }

            if (tipo == "efectivo") {
                this.submitOrder(tipo);
                this.tipoPago = tipo;
            }
        },
        closeModalReceipt() {
            this.isShowModalReceipt = false;
        },
        closeModalBill() {
            this.isShowModalBill = false;
        },
        closeModalPayment() {
            this.isShowModalPayment = false;
            this.isAux = false;
            this.isLoading = false;
            this.isError = false;
        },
        dateFormat(date) {
            const formatter = new Intl.DateTimeFormat("id", {
                dateStyle: "short",
                timeStyle: "short",
            });
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
            sound.onended = () => delete sound;
        },
        closeOptionsModal() {
            this.showOptions = false;
        },
        selectOption(selected) {
            localStorage.setItem("userOption", selected);
            localStorage.removeItem("billingData");
            localStorage.removeItem("cart");
            this.beep();
            this.userOption = selected; // Actualiza el estado local
            this.closeOptionsModal(); // Cierra el modal después de seleccionar
        },
        async submitOrder(tipo) {
            const combinedDataJSON = this.createCombinedJSON();
            console.log(combinedDataJSON);

            const response = await fetch(
                localStorage.getItem("configCompanyApi") + "/procesar-pedido",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: combinedDataJSON,
                }
            );

            this.isSuccess = true;
            this.isError = false;
            this.isAux = false;

            // Manejo de errores en la respuesta
            if (!response.ok) {
                throw new Error(
                    `Error en la respuesta del servidor: ${response.status}`
                );
            }

            const data = await response.json();

            console.log(data.message);

            localStorage.removeItem("billingDataApi");
            localStorage.removeItem("paymentData");
            localStorage.removeItem("isExenta");

            if (tipo == "efectivo") {
                const message = document.getElementById("message");
                const title = document.getElementById("title");
                message.innerText =
                    "Por favor pase por caja para pagar y confirmar su pedido. ¡Muchas gracias por la preferencia!";
                title.innerText = "Pedido realizado, abonar en caja.";
            } else {
                const message = document.getElementById("message");
                message.innerText =
                    "¡Gracias por la preferencia! En breve le llamaremos para disfrutar su pedido.";
            }
        },
        newOrder() {
            location.reload(true);
        },
        saveBillingData() {
            let billingData;

            // Verifica si existe 'billingDataApi' en localStorage
            const billingDataApi = localStorage.getItem("billingDataApi");

            if (billingDataApi) {
                // Verifica si el valor es una cadena JSON válida
                let parsedData;
                try {
                    parsedData =
                        typeof billingDataApi === "string"
                            ? JSON.parse(billingDataApi)
                            : billingDataApi;
                } catch (error) {
                    console.error("Error al parsear 'billingDataApi':", error);
                    return;
                }

                // Si parsedData es un array, tomamos el primer elemento
                if (Array.isArray(parsedData)) {
                    billingData = { ...parsedData[0] };
                } else {
                    billingData = { ...parsedData }; // Si no es un array, directamente lo usamos
                }

                // Verifica si es extranjero basado en la existencia de 'tar_exo_fiscal'
                this.isExenta = !!parsedData.tar_exo_fiscal;
            } else {
                // Si no hay datos en 'billingDataApi', asigna de acuerdo a los datos ingresados
                billingData = this.ocasional
                    ? { nombre: this.nombre, ocasional: "S" }
                    : {
                          documento: this.documento,
                          nombre: this.nombre,
                          email: this.email,
                          ocasional: "N",
                      };
            }

            // Guarda 'billingData' en el localStorage
            localStorage.setItem("billingData", JSON.stringify(billingData));
        },
        saveCart() {
            localStorage.setItem("cart", JSON.stringify(this.cart));
        },
        loadCart() {
            const cart = JSON.parse(localStorage.getItem("cart"));
            if (cart) {
                this.cart = cart;
            }
        },
        getImageUrl(imagePath) {
            // Obtiene la URL base desde el localStorage o usa un valor por defecto si no está definida
            const baseUrl =
                localStorage.getItem("configImageApi") ||
                "http://mail.trovari.com.py/imagenes/";
            return baseUrl + imagePath;
        },
        createCombinedJSON() {
            // Recuperar datos del localStorage
            const cart = JSON.parse(localStorage.getItem("cart")) || [];
            const billingData =
                JSON.parse(localStorage.getItem("billingData")) || {};
            const paymentData =
                JSON.parse(localStorage.getItem("paymentData")) || {};

            // Obtener y actualizar transactionId con el prefijo de configPdvName
            let transactionId =
                parseInt(localStorage.getItem("configTransactionId")) || 0;
            transactionId += 1;
            localStorage.setItem("configTransactionId", transactionId);

            // Obtener el nombre del PDV desde configPdvName
            const pdvName = localStorage.getItem("configPdvName") || "";
            const transactionIdWithPrefix = `${pdvName}${transactionId}`;

            // Agregar tipoPago a paymentData
            paymentData.tipoPago = this.tipoPago;

            // Combinar los datos en un solo objeto, incluyendo transactionId con prefijo
            const combinedData = {
                cart,
                billingData,
                paymentData,
                transactionId: transactionIdWithPrefix, // transactionId con prefijo de PDV
            };

            // Convertir a JSON
            const combinedJSON = JSON.stringify(combinedData);

            return combinedJSON;
        },
        configLogin() {
            if (this.configPin == "258225") {
                this.isAuth = true;
            } else {
                alert("Pin inválido");
                return;
            }
        },
        printAndProceed() {
            const receiptContent = document.getElementById("receipt-content");
            const titleBefore = document.title;
            const printArea = document.getElementById("print-area");

            printArea.innerHTML = receiptContent.innerHTML;
            document.title = this.receiptNo;

            window.print();
            this.isShowModalReceipt = false;

            printArea.innerHTML = "";
            document.title = titleBefore;

            this.clear();
        },
    };

    let inactivityTimer;

    function resetInactivityTimer() {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            window.location.href = "index.html"; // Redirigir a index.html
        }, 600000); // 5 minutos
    }

    // Escuchar eventos para resetear el temporizador
    window.addEventListener("mousemove", resetInactivityTimer);
    window.addEventListener("keypress", resetInactivityTimer);
    window.addEventListener("click", resetInactivityTimer);
    window.addEventListener("scroll", resetInactivityTimer);

    return app;
}

function deleteLocalDB(db) {
    const request = indexedDB.deleteDatabase(db);

    request.onsuccess = function (event) {
        localStorage.clear();
        alert("Base de datos eliminada con éxito.");
    };
}

async function checkServer() {
    try {
        const url = `${localStorage.getItem(
            "configCompanyApi"
        )}/ver-habilitacion`;
        const payload = {
            pCodEmpresa: "1",
            pCodSucursal: "132",
            pCodCaja: "1",
            pNroHabilitacion: 1,
        };

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error("Error en la respuesta del servidor");
        }

        const data = await response.text();
        console.log(data);
        // Verificar si la respuesta es "N"
        if (data == "N") {
            setStatePDV(false);
        } else {
            // Restaurar el link si la respuesta no es "N"
            setStatePDV(true);
        }
    } catch (error) {
        console.error("Error al verificar el servidor:", error.message);
        // Cambiar el texto y el link en caso de error
        setStatePDV(false);
    }
}

function setStatePDV(val) {
    if (val) {
        document.getElementById("tocaParaPedir").innerText = "Toca para pedir";
        document.getElementById("tocaParaPedirEn").innerText = "Tap to order";
        document.getElementById("link").setAttribute("href", "menu.html");
    } else {
        document.getElementById("tocaParaPedir").innerText =
            "Terminal fuera de servicio";
        document.getElementById("tocaParaPedirEn").innerText =
            "Terminal Out of Service";
        document.getElementById("link").setAttribute("href", "#");
    }
}

function setDefaultConfig() {
    const defaults = {
        configBancardApi: "http://192.168.100.217:3000",
        configCompanyApi: "http://mail.trovari.com.py/wsTrovariApp/webresources/AppServ",
        configImageApi: "http://mail.trovari.com.py/imagenes/",
        configPdvName: "PDV1",
        configTransactionId: "0",
        configProxyPos: "http://192.168.100.200:4000",
    };

    for (const key in defaults) {
        if (localStorage.getItem(key) === null) {
            localStorage.setItem(key, defaults[key]);
        }
    }
}

function enterFullScreen() {
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) {
        // Firefox
        document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
        // Chrome, Safari
        document.documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) {
        // IE/Edge
        document.documentElement.msRequestFullscreen();
    }
}

async function initPDV() {
    // Configuración adicional y limpieza del almacenamiento local
    setDefaultConfig();
    checkServer();
    localStorage.removeItem("cart");
    localStorage.removeItem("isExenta");
    localStorage.removeItem("billingData");
    try {
        // Cargar la base de datos
        db = await loadDatabase();

        // Limpiar la base de datos antes de agregar los nuevos productos
        await db.clearDatabase();

        // Llamada a la API para obtener productos
        const response = await fetch(
            localStorage.getItem("configCompanyApi") + "/buscar-productos",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    pCodEmpresa: "1",
                    pCodProducto: null,
                    pDescripcion: null,
                }),
            }
        );

        // Manejo de errores en la respuesta
        if (!response.ok) {
            throw new Error(
                `Error en la respuesta del servidor: ${response.status}`
            );
        }

        const data = await response.json();

        // Agregar productos a la base de datos
        for (let product of data) {
            await db.addProduct(product);
            console.log(`Agreando producto ${product.nombre}`);
        }

		enterFullScreen();
    } catch (error) {
        console.error("Error inicializando PDV:", error);

        // Desactiva el PDV en caso de error
        setStatePDV(false);
    }
}
