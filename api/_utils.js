export function sendJSON(res, status, data) {
  res.status(status).json(data);
}
export function methodGuard(req, res, allowed) {
  const method = req.method || "";
  if (!allowed.includes(method)) {
    res.setHeader("Allow", allowed);
    res.status(405).json({ error: "Method Not Allowed" });
    return false;
  }
  return true;
}
