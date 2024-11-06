const express = require("express");
const cors = require("cors");
const axios = require("axios"); // Importa axios para hacer la petición HTTP

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json()); // Middleware para parsear JSON en el cuerpo de las peticiones

app.post("/qr", async (req, res) => {
  // Desestructura los datos del cuerpo de la petición
  const { facturaNro, monto, vuelto, pos } = req.body;

  // Verifica que todos los parámetros requeridos estén presentes
  if (facturaNro === undefined || monto === undefined || vuelto === undefined || !pos) {
    return res.status(400).json({ error: "Faltan parámetros en el cuerpo de la solicitud." });
  }

  try {
    // Configura la solicitud que se enviará a la API externa
    const response = await axios.post(`${pos}/pos/venta-qr`, {
      facturaNro,
      monto,
      vuelto,
    }, {
      headers: { "Content-Type": "application/json" }
    });

    // Envía la respuesta de la API externa como respuesta a esta solicitud
    res.json(response.data);
  } catch (error) {
    console.error("Error en la solicitud al POS:", error.message);
    res.status(500).json({ error: "Error al realizar la solicitud al POS" });
  }
});

app.post("/debito", async (req, res) => {
    // Desestructura los datos del cuerpo de la petición
    const { facturaNro, monto, vuelto, pos } = req.body;
  
    // Verifica que todos los parámetros requeridos estén presentes
    if (facturaNro === undefined || monto === undefined || vuelto === undefined || !pos) {
      return res.status(400).json({ error: "Faltan parámetros en el cuerpo de la solicitud." });
    }

    try {
      // Configura la solicitud que se enviará a la API externa
      const response = await axios.post(`${pos}/pos/venta-qr`, {
        facturaNro,
        monto,
        vuelto,
      }, {
        headers: { "Content-Type": "application/json" }
      });
  
      // Envía la respuesta de la API externa como respuesta a esta solicitud
      res.json(response.data);
    } catch (error) {
      console.error("Error en la solicitud al POS:", error.message);
      res.status(500).json({ error: "Error al realizar la solicitud al POS" });
    }
  });



app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
