import { methodGuard, sendJSON } from "../_utils";
export default async function handler(req, res) {
  if (!methodGuard(req, res, ["POST"])) return;
  return sendJSON(res, 200, { message: "Logged out" });
}
