import Media from "../../models/Media.js";

const allowedOrigins = [
  "http://localhost:3000",
  "https://mi-app-frontend-six.vercel.app",
];

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  if (req.method === "OPTIONS") {
    res.setHeader("Allow", ["GET", "OPTIONS"]);
    return res.status(204).end();
  }

  if (req.method === "GET") {
    try {
      // La conexión global de Mongoose ya está activa desde index.js
      const { orderBy = "views", limit = 10 } = req.query;
      const validFields = ["views", "likes", "comments", "createdAt"];
      const sortField = validFields.includes(orderBy) ? orderBy : "views";
      const lim = Number(limit);
      if (isNaN(lim) || lim < 1 || lim > 100) {
        return res.status(400).json({ success: false, error: "El parámetro 'limit' debe ser un número entre 1 y 100." });
      }
      const media = await Media.find()
        .sort({ [sortField]: -1 })
        .limit(lim);
      return res.status(200).json({ success: true, data: media });
    } catch (err) {
      console.error("❌ Error en /api/media/trending:", err);
      return res.status(500).json({ success: false, error: "Error interno al obtener los medios trending." });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ success: false, error: `Method ${req.method} Not Allowed` });
  }
}
