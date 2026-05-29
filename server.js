const express = require("express");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const chatHandler = require("./api/chat");
const codeReviewHandler = require("./api/code-review");
const interviewerHandler = require("./api/interviewer");
const debateHandler = require("./api/debate");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Chat API
app.post("/api/chat", async (req, res) => {
  return chatHandler(req, res);
});

// Code Review API
app.post("/api/code-review", async (req, res) => {
  return codeReviewHandler(req, res);
});

// Interviewer API
app.post("/api/interviewer", async (req, res) => {
  return interviewerHandler(req, res);
});

// Debate API
app.post("/api/debate", async (req, res) => {
  return debateHandler(req, res);
});

const buildDir = path.join(__dirname, "build");
app.use(express.static(buildDir));

app.get("*", (req, res) => {
  res.sendFile(path.join(buildDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log("Proxying /api/* to handlers and serving build files");
});
