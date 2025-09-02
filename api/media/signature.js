import { methodGuard, sendJSON } from "../_utils";
import { requireAuth } from "../_authGuard";
import { v2 as cloudinary } from "cloudinary";
export default async function handler(req, res) {
  if (!methodGuard(req, res, ["POST"])) return;
  const auth = requireAuth(req, res);
  if (!auth) return;
  const timestamp = Math.floor(Date.now() / 1000);
  const upload_preset =
    (req.body && req.body.upload_preset) ||
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!apiSecret)
    return sendJSON(res, 500, { error: "Falta CLOUDINARY_API_SECRET" });
  const paramsToSign = { timestamp };
  if (upload_preset) paramsToSign.upload_preset = upload_preset;
  const signature = cloudinary.utils.api_sign_request(paramsToSign, apiSecret);
  return sendJSON(res, 200, {
    timestamp,
    upload_preset,
    api_key: process.env.CLOUDINARY_API_KEY,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    signature,
  });
}
