import { methodGuard, sendJSON } from "../_utils";
import { dbConnect } from "../../lib/db";
import Media from "../../models/Media";
import { requireAuth } from "../_authGuard";
import { cloudinary } from "../../lib/cloudinary";
import formidable from "formidable";
export default async function handler(req, res) {
  await dbConnect();
  if (req.method === "GET") {
    const items = await Media.find().sort({ createdAt: -1 }).lean();
    return sendJSON(res, 200, { items });
  }
  if (req.method === "POST") {
    const auth = requireAuth(req, res);
    if (!auth) return;
    const form = formidable({
      multiples: false,
      keepExtensions: true,
      maxFileSize: 1024 * 1024 * 50,
    }); // 50MB
    form.parse(req, async (err, fields, files) => {
      if (err) return sendJSON(res, 400, { error: "Formulario inválido" });
      const upload_preset =
        fields.upload_preset ||
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
      const resource_type = fields.resource_type || "auto"; // image | video | raw
      // 1) Multipart file
      const file = files.file || files.upload || files.image || files.media;
      if (file) {
        try {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "media",
              upload_preset: upload_preset || undefined,
              resource_type,
            },
            async (error, result) => {
              if (error || !result)
                return sendJSON(res, 500, {
                  error: error?.message || "Fallo de subida",
                });
              const doc = await Media.create({
                url: result.secure_url,
                publicId: result.public_id,
                resourceType: result.resource_type,
                format: result.format,
                bytes: result.bytes,
                createdBy: auth.userId,
              });
              return sendJSON(res, 201, { item: doc, upload: result });
            },
          );
          const fs = await import("fs");
          fs.createReadStream(file.filepath).pipe(stream);
        } catch (e) {
          return sendJSON(res, 500, { error: e.message || "Error de subida" });
        }
        return;
      }
      // 2) Remote URL
      const url = fields.url;
      if (url) {
        try {
          const result = await cloudinary.uploader.upload(url, {
            folder: "media",
            upload_preset: upload_preset || undefined,
            resource_type,
          });
          const doc = await Media.create({
            url: result.secure_url,
            publicId: result.public_id,
            resourceType: result.resource_type,
            format: result.format,
            bytes: result.bytes,
            createdBy: auth.userId,
          });
          return sendJSON(res, 201, { item: doc, upload: result });
        } catch (e) {
          return sendJSON(res, 500, {
            error: e.message || "Error al subir desde URL",
          });
        }
      }
      // 3) Base64 in dataUrl
      const dataUrl = fields.dataUrl;
      if (dataUrl?.startsWith("data:")) {
        try {
          const base64 = dataUrl.split(",")[1];
          const buffer = Buffer.from(base64, "base64");
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "media",
              upload_preset: upload_preset || undefined,
              resource_type,
            },
            async (error, result) => {
              if (error || !result)
                return sendJSON(res, 500, {
                  error: error?.message || "Fallo de subida",
                });
              const doc = await Media.create({
                url: result.secure_url,
                publicId: result.public_id,
                resourceType: result.resource_type,
                format: result.format,
                bytes: result.bytes,
                createdBy: auth.userId,
              });
              return sendJSON(res, 201, { item: doc, upload: result });
            },
          );
          const { Readable } = await import("stream");
          Readable.from(buffer).pipe(stream);
        } catch (e) {
          return sendJSON(res, 500, {
            error: e.message || "Error al subir base64",
          });
        }
        return;
      }
      return sendJSON(res, 400, {
        error: "Envía 'file' multipart, 'url' o 'dataUrl'",
      });
    });
    return;
  }
  return methodGuard(req, res, ["GET", "POST"]);
}
