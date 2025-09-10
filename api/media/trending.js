import dbConnect from "../../lib/dbConnect.js";
import Media from "../../models/Media.js";

// Configuración CORS: solo orígenes permitidos
const allowedOrigins = [
  "http://localhost:3000",
  "https://mi-app-frontend-six.vercel.app",
];

export default async function handler(req, res) {
  // Configurar CORS manualmente para endpoints API
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  // Manejo de preflight OPTIONS
  if (req.method === "OPTIONS") {
    res.setHeader("Allow", ["GET", "OPTIONS"]);
    return res.status(204).end();
  }

  // Conectar a la base de datos
  try {
    await dbConnect();
  } catch (err) {
    // Error de conexión global
    return res.status(500).json({ error: "Error de conexión a la base de datos" });
  }

  if (req.method === "GET") {
    try {
      const { orderBy = "views", limit = 10 } = req.query;

      // Validar campo de orden
      const validFields = ["views", "likes", "comments", "createdAt"];
      const sortField = validFields.includes(orderBy) ? orderBy : "views";

      const media = await Media.find()
        .sort({ [sortField]: -1 })
        .limit(Number(limit));

      // Respuesta siempre en formato JSON válido
      return res.status(200).json({ success: true, data: media });
    } catch (err) {
      // Manejo de error en la ruta GET
      console.error("❌ Error en /api/media/trending:", err);
      return res.status(500).json({ error: err.message || "Error interno" });
    }
  } else {
    // Método no permitido: 405 y cabecera Allow
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}