import express from "express";
import cors from "cors";
import fs from "fs";
import { env } from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import tripRoutes from "./routes/tripRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { runMigrations } from "./db.js";
import { requestLogger } from "./middleware/logger.js";

runMigrations();
fs.mkdirSync(env.uploadsDir, { recursive: true });

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());
app.use(requestLogger);
app.use("/uploads", express.static(env.uploadsDir));

app.get("/health", (req, res) => {
  res.json({ ok: true, timestamp: Date.now(), database: env.dbPath });
});

app.use("/auth", authRoutes);
app.use("/", userRoutes);
app.use("/trip", tripRoutes);
app.use("/", uploadRoutes);

app.use((req, res) => res.status(404).json({ error: "Not found" }));

const PORT = env.port;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
