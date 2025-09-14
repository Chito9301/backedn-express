import { methodGuard, sendJSON } from "../_utils";
import { dbConnect } from "../../lib/db";
import User from "../../models/User";
import { signJwt } from "../../lib/jwt";

const allowedOrigins = [
  "http://localhost:3000",
  "https://mi-app-frontend-six.vercel.app",
];

function setCORSHeaders(req, res) {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
}

export default async function handler(req, res) {
  setCORSHeaders(req, res);

  if (req.method === "OPTIONS") {
    res.setHeader("Allow", ["POST", "OPTIONS"]);
    return res.status(204).end();
  }

  if (!methodGuard(req, res, ["POST"])) return;

  await dbConnect();

  const { email, password } = req.body || {};
  if (!email || !password) {
    return sendJSON(res, 400, { success: false, error: "email y password son requeridos" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return sendJSON(res, 401, { success: false, error: "Credenciales inválidas" });

    // Asegúrate de que tu modelo User tenga este método definido
    const ok = await user.comparePassword(password);
    if (!ok) return sendJSON(res, 401, { success: false, error: "Credenciales inválidas" });

    const token = signJwt({ sub: user._id.toString(), email, username: user.username });

    return sendJSON(res, 200, {
      success: true,
      user: { id: user._id, username: user.username, email },
      token,
    });
  } catch (e) {
    return sendJSON(res, 500, { success: false, error: e.message || "Error interno" });
  }
}
