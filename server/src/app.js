const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const serverRoutes = require("./routes/serverRoutes");
const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "32kb" }));
app.use("/api/auth", authRoutes);
app.use("/api/servers", serverRoutes);
app.get("/api/health", (_req, res) => res.json({ status: "OK", message: "MiniDiscord API is running" }));
app.use((err, _req, res, _next) => {
  console.error("API error:", err.message);
  res.status(500).json({ message: "An unexpected server error occurred." });
});
module.exports = app;
