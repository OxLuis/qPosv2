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
		const ventaDebito = await axios.post(`${pos}/pos/venta/debito`, {
			facturaNro
		}, {
			headers: { "Content-Type": "application/json" }
		});
	
		// Verificamos si la respuesta es exitosa
		if (ventaDebito.status === 400) {
			// Si el servicio responde con un error 400, reenviar ese error
			return res.status(ventaDebito.status).json({
				error: "Bad Request",
				message: ventaDebito.data.message || "FALLO AL DETECTAR LA TARJETA",
				statusCode: ventaDebito.status
			});
		}
	
		const venta = ventaDebito.data; // Usar data en lugar de .json() ya que es axios
		console.log(venta);
	
		const { bin, nsu } = venta;

		// Segundo POST a /pos/descuento con los datos obtenidos
		const descuentoResponse = await fetch(`${pos}/pos/descuento`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				bin: bin,
				nsu: nsu,
				monto: monto,
				vuelto: 0,
			}),
		});

		// Verificamos si la respuesta del segundo POST es exitosa
		if (descuentoResponse.status === 400) {
			// Si el servicio responde con un error 400, reenviar ese error
			const errorData = await descuentoResponse.json();
			return res.status(descuentoResponse.status).json({
				error: errorData.error || "Bad Request",
				message: errorData.message || "Error en la petición a /pos/descuento",
				statusCode: descuentoResponse.status
			});
		}

		if (!descuentoResponse.ok) {
			throw new Error("Error en la petición a /pos/descuento");
		}

		const descuentoData = await descuentoResponse.json();
		console.log("Respuesta de descuento:", descuentoData);

		// Enviar la respuesta al cliente
		res.json(descuentoData.data);

	} catch (error) {
		// Si ocurre un error, verificamos el tipo y retornamos el código adecuado
		console.error("Error en la solicitud:", error.message);

		if (error.response) {
			// Si el error tiene respuesta (como en el caso de Axios), reenviar la respuesta
			return res.status(error.response.status).json({
				error: error.response.data.error || "Error en la solicitud",
				message: error.response.data.message || "Ha ocurrido un error",
				statusCode: error.response.status
			});
		}

		// Enviar un error 500 para otros casos
		res.status(500).json({ message: error.message });
	}
});

app.post("/credito", async (req, res) => {
	// Desestructura los datos del cuerpo de la petición
	const { facturaNro, monto, vuelto, pos } = req.body;

	// Verifica que todos los parámetros requeridos estén presentes
	if (facturaNro === undefined || monto === undefined || vuelto === undefined || !pos) {
		return res.status(400).json({ error: "Faltan parámetros en el cuerpo de la solicitud." });
	}

	try {
		// Configura la solicitud que se enviará a la API externa
		const ventaDebito = await axios.post(`${pos}/pos/venta/credito`, {
			facturaNro,
			"cuotas": 0,
			"plan": 0,
		}, {
			headers: { "Content-Type": "application/json" }
		});

		// Verificamos si la respuesta es exitosa
		if (!ventaDebito.ok) {
			throw new Error("Error en la petición a /pos/debito");
		}

		const venta = await ventaDebito.json();

		console.log(venta);

		const { bin, nsu } = venta;

		// Segundo POST a /pos/descuento con los datos obtenidos
		const descuentoResponse = await fetch(`${pos}/pos/descuento`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					bin: bin,
					nsu: nsu,
					monto: monto,
					vuelto: 0,
				}),
			}
		);

		// Verificamos si la respuesta del segundo POST es exitosa
		if (!descuentoResponse.ok) {
			throw new Error(
				"Error en la petición a /pos/descuento"
			);
		}

		const descuentoData = await descuentoResponse.json();
		console.log("Respuesta de descuento:", descuentoData);
		res.json(descuentoData.data);
	} catch (error) {
		console.error("Error en la solicitud al POS:", error.message);
		res.status(500).json({ error: "Error al realizar la solicitud al POS" });
	}
});



app.listen(port, () => {
	console.log(`Servidor escuchando en http://localhost:${port}`);
});
