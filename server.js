const express = require("express");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const chatHandler = require("./api/chat");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.post("/api/chat", async (req, res) => {
  return chatHandler(req, res);
});

const buildDir = path.join(__dirname, "build");
app.use(express.static(buildDir));

app.get("*", (req, res) => {
  res.sendFile(path.join(buildDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log("Proxying /api/chat to api/chat.js and serving build files");
});
