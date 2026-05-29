const { setCorsHeaders, handleOptionsRequest, validatePostRequest, getGroqApiKey, callGroqAPI } = require("./_groqClient");

const INTERVIEWER_SYSTEM_PROMPT = `You are an expert system design interviewer conducting a technical interview.

Your role is to:
1. Ask probing questions about system design
2. Evaluate the candidate's understanding of scalability, trade-offs, and architecture
3. After the interview ends, provide a scorecard

When interviewing, ask ONE question at a time. Wait for the candidate's response before probing deeper.
Be conversational and encouraging. Dig into their reasoning.

When the user sends "END_INTERVIEW", provide a structured scorecard in this exact format:

---SCORECARD---
**Scope Understanding**: [score 1-10] - [brief feedback]
**Trade-offs & Decisions**: [score 1-10] - [brief feedback]
**Scalability & Architecture**: [score 1-10] - [brief feedback]
**Communication**: [score 1-10] - [brief feedback]
**Overall Assessment**: [brief summary]
---END_SCORECARD---

Keep responses concise and focused.`;

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
    const { topic, messages = [] } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: "Topic is required" });
    }

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages must be an array" });
    }

    console.log(`[interviewer.js] Interview on topic: ${topic}`);

    // If no messages yet, start the interview with the topic
    const isFirstQuestion = messages.length === 0;
    
    const systemPrompt = isFirstQuestion
      ? `${INTERVIEWER_SYSTEM_PROMPT}\n\nThe interview topic is: ${topic}\n\nStart by asking the first question to assess the candidate's understanding of this system design problem.`
      : INTERVIEWER_SYSTEM_PROMPT;

    const response = await callGroqAPI(
      messages,
      systemPrompt,
      800,
      0.7
    );

    return res.status(200).json({ response });
  } catch (error) {
    console.error("Interviewer error:", error);
    return res.status(500).json({
      error: "Failed to conduct interview",
      details: error.message,
    });
  }
};
