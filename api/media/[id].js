import { methodGuard, sendJSON } from "../_utils";
import { dbConnect } from "../../lib/db";
import Media from "../../models/Media";
import { requireAuth } from "../_authGuard";
import { cloudinary } from "../../lib/cloudinary";
export default async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;
  if (req.method === "GET") {
    const doc = await Media.findById(id);
    if (!doc) return sendJSON(res, 404, { error: "No encontrado" });
    return sendJSON(res, 200, { item: doc });
  }
  if (req.method === "DELETE") {
    const auth = requireAuth(req, res);
    if (!auth) return;
    const doc = await Media.findById(id);
    if (!doc) return sendJSON(res, 404, { error: "No encontrado" });
    try {
      await cloudinary.uploader.destroy(doc.publicId, {
        resource_type: doc.resourceType || "image",
      });
    } catch {}
    await doc.deleteOne();
    return sendJSON(res, 200, { ok: true });
  }
  return methodGuard(req, res, ["GET", "DELETE"]);
}
