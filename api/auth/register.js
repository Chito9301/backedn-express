import { methodGuard, sendJSON } from "../_utils";
import { dbConnect } from "../../lib/db";
import User from "../../models/User";
import { signJwt } from "../../lib/jwt";
export default async function handler(req, res) {
  if (!methodGuard(req, res, ["POST"])) return;
  await dbConnect();
  const { username, email, password } = req.body || {};
  if (!username || !email || !password)
    return sendJSON(res, 400, {
      error: "username, email y password son requeridos",
    });
  try {
    const exists = await User.findOne({ email });
    if (exists) return sendJSON(res, 409, { error: "Email ya registrado" });
    const user = new User({ username, email, password });
    await user.save();
    const token = signJwt({ sub: user._id.toString(), email });
    return sendJSON(res, 201, {
      user: { id: user._id, username, email },
      token,
    });
  } catch (e) {
    return sendJSON(res, 500, { error: e.message || "Error interno" });
  }
}
