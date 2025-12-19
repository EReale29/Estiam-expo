export function requestLogger(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const method = req.method;
    const url = req.originalUrl;
    console.log(`[${new Date().toISOString()}] ${method} ${url} -> ${status} (${duration}ms)`);
  });
  next();
}
