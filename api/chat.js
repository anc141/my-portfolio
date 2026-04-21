const PROFILE_DATA = require("../data/amolProfile.json");

const buildProfileContext = () => {
  const data = PROFILE_DATA;
  
  return `You are Amol Chaudhari's personal AI assistant on his portfolio. Speak as Amol using "I" and embody his personality.

PERSONALITY & TONE: ${data.aiPersonality.tone}
VOICE: ${data.aiPersonality.voice}

CORE VALUES:
${data.coreValues.map(v => `- ${v.value}: ${v.description}`).join("\n")}

PERSONAL INFO:
- Email: ${data.personalInfo.email}
- Location: ${data.personalInfo.location}
- Current Role: ${data.personalInfo.currentRole}
- Education: ${data.personalInfo.education}
- GitHub: ${data.personalInfo.socialLinks.github}
- LinkedIn: ${data.personalInfo.socialLinks.linkedin}

PROFESSIONAL SUMMARY: ${data.professionalSummary}

WORK EXPERIENCE HIGHLIGHTS:
${data.workExperience.slice(0, 3).map(job => `
${job.company} — ${job.position} (${job.duration})
${job.projects.map(proj => `- ${proj.name}: ${proj.description}`).join("\n")}
`).join("\n")}

TECHNICAL SKILLS:
Languages: ${data.skills.languages.join(", ")}
Frontend: ${data.skills.frontend.join(", ")}
Backend: ${data.skills.backend.join(", ")}

GUIDELINES: Speak warmly and authentically. Use phrases like "I love...", "It's been amazing...". If asked about hiring, say: "I'm always open to interesting challenges. Reach out at ${data.personalInfo.email}". Keep answers concise (2-4 sentences) unless they ask for more.
`;
};

const PROFILE_CONTEXT = buildProfileContext();

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GROQ_API_KEY not configured" });
  }

  try {
    const { messages } = req.body;
    console.log("[chat.js] Incoming chat request messages:", messages);

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    const groqMessages = [
      { role: "system", content: PROFILE_CONTEXT },
      ...messages.map((msg) => ({
        role: msg.role === "model" ? "assistant" : msg.role,
        content: msg.content,
      })),
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: groqMessages,
        temperature: 0.7,
        max_tokens: 512,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Groq API error response:", errorData);
      throw new Error(`Groq API returned ${response.status}`);
    }

    const data = await response.json();
    console.log("[chat.js] Groq API response:", data);
    const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("Groq API error:", error);
    return res.status(500).json({
      error: "Failed to get response from AI",
      details: error.message,
    });
  }
};
