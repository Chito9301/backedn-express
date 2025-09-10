import { methodGuard, sendJSON } from "../_utils";
import { dbConnect } from "../../lib/db";
import User from "../../models/User";
import { requireAuth } from "../_authGuard";
export default async function handler(req, res) {
  if (!methodGuard(req, res, ["GET"])) return;
  await dbConnect();
  const auth = requireAuth(req, res);
  if (!auth) return;
  const user = await User.findById(auth.userId).lean();
  if (!user) return sendJSON(res, 404, { error: "Usuario no encontrado" });
  return sendJSON(res, 200, {
    id: user._id,
    username: user.username,
    email: user.email,
  });
}
