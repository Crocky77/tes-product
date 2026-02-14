const http = require("http");
const { URL } = require("url");

const PORT = Number(process.env.PORT || 8787);

function json(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
  });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "GET" && url.pathname === "/health") {
    return json(res, 200, {
      ok: true,
      service: "tes-backend",
      phase: "B.1",
      timestamp: new Date().toISOString(),
    });
  }

  if (req.method === "GET" && url.pathname === "/") {
    return json(res, 200, {
      name: "TES backend",
      status: "running",
      next: ["/auth/start", "/auth/callback", "/auth/status", "/api/player/:playerId"],
    });
  }

  return json(res, 404, {
    ok: false,
    error: "Not found",
    path: url.pathname,
  });
});

server.listen(PORT, () => {
  console.log(`[tes-backend] listening on http://localhost:${PORT}`);
});
