const { setCorsHeaders, handleOptionsRequest, validatePostRequest, getGroqApiKey, callGroqAPI } = require("./_groqClient");

const CODE_REVIEW_SYSTEM_PROMPT = `You are an expert code reviewer. Your job is to analyze code and provide constructive feedback.

When reviewing code, structure your response with these sections (use markdown headers):
## Bugs
List any actual bugs or logical errors found.

## Performance
Point out performance issues or optimization opportunities.

## Readability
Suggest improvements for code clarity and maintainability.

## Security
Highlight any security concerns or vulnerabilities.

## Suggestions
Provide other suggestions for improvement (patterns, best practices, etc.).

Be concise but thorough. Use code snippets when helpful. Be encouraging and constructive.`;

module.exports = async function handler(req, res) {
  setCorsHeaders(res);

  if (handleOptionsRequest(req, res)) {
    return res.status(200).end();
  }

  if (!validatePostRequest(req, res)) {
    return;
  }

  const apiKey = getGroqApiKey(res);
  if (!apiKey) {
    return;
  }

  try {
    const { code, language = "auto" } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ error: "Code input is required" });
    }

    console.log(`[code-review.js] Reviewing code (language: ${language})`);

    const userMessage = `Please review the following ${language === "auto" ? "" : language} code:\n\n\`\`\`\n${code}\n\`\`\``;

    const response = await callGroqAPI(
      [{ role: "user", content: userMessage }],
      CODE_REVIEW_SYSTEM_PROMPT,
      1500,
      0.5
    );

    return res.status(200).json({ review: response });
  } catch (error) {
    console.error("Code review error:", error);
    return res.status(500).json({
      error: "Failed to review code",
      details: error.message,
    });
  }
};
