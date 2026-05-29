/**
 * Shared Groq API client helper
 * Handles CORS headers, API key validation, and Groq fetch logic
 */

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

/**
 * Set standard CORS headers for API responses
 */
function setCorsHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

/**
 * Handle OPTIONS preflight requests
 */
function handleOptionsRequest(req, res) {
  if (req.method === "OPTIONS") {
    setCorsHeaders(res);
    return true;
  }
  return false;
}

/**
 * Validate that request is POST method
 */
function validatePostRequest(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return false;
  }
  return true;
}

/**
 * Get and validate Groq API key from environment
 */
function getGroqApiKey(res) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "GROQ_API_KEY not configured" });
    return null;
  }
  return apiKey;
}

/**
 * Call Groq API with given messages and system prompt
 * @param {Array} messages - Chat messages array
 * @param {string} systemPrompt - System prompt for AI context
 * @param {number} maxTokens - Max tokens for response
 * @param {number} temperature - Temperature for response randomness (0-2)
 * @returns {Promise<string>} - The AI response text
 */
async function callGroqAPI(messages, systemPrompt, maxTokens = 1024, temperature = 0.7) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY not configured");
  }

  const groqMessages = [
    { role: "system", content: systemPrompt },
    ...messages.map((msg) => ({
      role: msg.role === "model" ? "assistant" : msg.role,
      content: msg.content,
    })),
  ];

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: groqMessages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error("Groq API error response:", errorData);
    throw new Error(`Groq API returned ${response.status}: ${errorData}`);
  }

  const data = await response.json();
  console.log("[groqClient] Groq API response received");
  
  return data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";
}

module.exports = {
  setCorsHeaders,
  handleOptionsRequest,
  validatePostRequest,
  getGroqApiKey,
  callGroqAPI,
};
