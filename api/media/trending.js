import dbConnect from "../../lib/dbConnect";
import Media from "../../models/Media";

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      const { orderBy = "views", limit = 10 } = req.query;
      const media = await Media.find()
        .sort({ [orderBy]: -1 })
        .limit(Number(limit));
      res.status(200).json(media);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}