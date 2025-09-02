// api/media/trending.js
import dbConnect from "../../lib/dbConnect.js";
import Media from "../../models/Media.js";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      const { orderBy = "views", limit = 10 } = req.query;

      // Validar campo de orden
      const validFields = ["views", "likes", "comments", "createdAt"];
      const sortField = validFields.includes(orderBy) ? orderBy : "views";

      const media = await Media.find()
        .sort({ [sortField]: -1 })
        .limit(Number(limit));

      res.status(200).json(media);
    } catch (err) {
      console.error("❌ Error en /api/media/trending:", err);
      res.status(500).json({ error: err.message });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
