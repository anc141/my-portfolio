const { setCorsHeaders, handleOptionsRequest, validatePostRequest, getGroqApiKey, callGroqAPI } = require("./_groqClient");
const { searchTopicEvidence } = require("./_searchClient");

const DEBATE_SYSTEM_PROMPT = `You moderate a 3-round debate generating ONLY valid JSON.

MUST-FOLLOW RULES (VIOLATING = FAILURE):
1. EVERY argument is EXACTLY 1-2 SHORT sentences. Count them. If >2 sentences, you fail.
2. Strip qualifying words: "while", "may", "potentially", "arguably", "could", "might", "seems", "appears".
3. Strip filler: "foster", "enhance", "optimize", "leverage", "synergy", "approach", "perspective", "aspect", "facilitate".
4. Each claim must be: specific mechanism OR concrete example OR direct rebuttal. No vague generalities.
5. Punctuation: If you use parentheses or "and also" or multiple clauses, simplify to shorter, punchy statements.

FORMAT EXAMPLES (FOLLOW EXACTLY):

WRONG❌: "While AI can write code faster, it still requires human oversight and may not be suitable for all tasks."
RIGHT✓: "AI speeds code production but can't handle architectural decisions alone."

WRONG❌: "The opposition makes a good point, but we should consider that AI development continues to advance."
RIGHT✓: "You're right about oversight—but AI is also improving at code quality checks."

WRONG❌: "There are many perspectives to consider on this topic of employment disruption."
RIGHT✓: "Automation historically killed typist jobs but created software engineer roles."

STRUCTURE (EXACTLY):
- Round 1: Pro claims → Con responds
- Round 2: Pro rebuts + new angle → Con rebuts + new angle (REBUTTAL FIRST, then new point)
- Round 3: Pro exposes Con's weakness + defends strongest counter → Con exposes Pro's weakness + defends strongest counter
- Verdict: Judge picks winner, cites strongest argument from winner, cites weakest argument from loser.

RESPONSE JSON (EXACT FORMAT, NO MARKDOWN):
{
  "topic": "exact user topic",
  "rounds": [
    {"roundNumber": 1, "pro": "one or two short sentences", "con": "one or two short sentences"},
    {"roundNumber": 2, "pro": "rebuttal first, then new angle", "con": "rebuttal first, then new angle"},
    {"roundNumber": 3, "pro": "weakness + defense", "con": "weakness + defense"}
  ],
  "verdict": "Judge picked [Pro/Con]. Strongest: [quote]. Weakest: [quote]."
}

Return ONLY this JSON. No markdown code blocks. No preamble.`;

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
    const { topic } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: "Topic is required" });
    }

    console.log(`[debate.js] Starting debate on: ${topic}`);

    const evidence = await searchTopicEvidence(topic);

    const userMessage = `Generate a 3-round debate on this topic: "${topic}"

Evidence notes for grounding:
${evidence.promptEvidence}`;

    const response = await callGroqAPI(
      [{ role: "user", content: userMessage }],
      DEBATE_SYSTEM_PROMPT,
      1200,
      0.65
    );

    // Parse the JSON response
    let debateData;
    try {
      debateData = JSON.parse(response.replace(/^```json\s*|\s*```$/g, "").trim());
    } catch (parseError) {
      console.error("Failed to parse debate response as JSON:", response);
      // If JSON parsing fails, return raw response wrapped in error
      return res.status(500).json({
        error: "Failed to parse debate response",
        details: "AI response was not valid JSON",
      });
    }

    return res.status(200).json({
      debate: {
        ...debateData,
        sources: evidence.results,
        researchEnabled: evidence.enabled,
      },
    });
  } catch (error) {
    console.error("Debate error:", error);
    return res.status(500).json({
      error: "Failed to generate debate",
      details: error.message,
    });
  }
};
