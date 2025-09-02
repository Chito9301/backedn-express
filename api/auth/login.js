import { methodGuard, sendJSON } from "../_utils";
import { dbConnect } from "../../lib/db";
import User from "../../models/User";
import { signJwt } from "../../lib/jwt";
export default async function handler(req, res) {
  if (!methodGuard(req, res, ["POST"])) return;
  await dbConnect();
  const { email, password } = req.body || {};
  if (!email || !password)
    return sendJSON(res, 400, { error: "email y password son requeridos" });
  try {
    const user = await User.findOne({ email });
    if (!user) return sendJSON(res, 401, { error: "Credenciales inválidas" });
    const ok = await user.comparePassword(password);
    if (!ok) return sendJSON(res, 401, { error: "Credenciales inválidas" });
    const token = signJwt({ sub: user._id.toString(), email });
    return sendJSON(res, 200, {
      user: { id: user._id, username: user.username, email },
      token,
    });
  } catch (e) {
    return sendJSON(res, 500, { error: e.message || "Error interno" });
  }
}
