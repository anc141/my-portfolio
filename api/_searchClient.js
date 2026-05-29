const TAVILY_SEARCH_URL = "https://api.tavily.com/search";

function getTavilyApiKey() {
  return process.env.TAVILY_API_KEY;
}

function formatEvidenceForPrompt(results) {
  if (!results.length) {
    return "No external search evidence was available. Use careful reasoning and avoid unsupported claims.";
  }

  return results
    .map((result, index) => {
      const title = result.title || "Untitled source";
      const url = result.url || "No URL";
      const content = result.content || result.snippet || "";
      return `[${index + 1}] ${title}\nURL: ${url}\nNotes: ${content}`;
    })
    .join("\n\n");
}

async function searchTopicEvidence(topic) {
  const apiKey = getTavilyApiKey();
  if (!apiKey) {
    return { enabled: false, results: [], promptEvidence: formatEvidenceForPrompt([]) };
  }

  try {
    const response = await fetch(TAVILY_SEARCH_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `${topic} debate evidence examples arguments`,
        search_depth: "advanced",
        max_results: 6,
        include_answer: false,
        include_raw_content: false,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Tavily search error:", errorBody);
      return { enabled: true, results: [], promptEvidence: formatEvidenceForPrompt([]) };
    }

    const data = await response.json();
    const results = (data.results || [])
      .filter((result) => result.title && result.url)
      .slice(0, 6)
      .map((result) => ({
        title: result.title,
        url: result.url,
        content: result.content,
      }));

    return {
      enabled: true,
      results,
      promptEvidence: formatEvidenceForPrompt(results),
    };
  } catch (error) {
    console.error("Topic search failed:", error);
    return { enabled: true, results: [], promptEvidence: formatEvidenceForPrompt([]) };
  }
}

module.exports = {
  searchTopicEvidence,
};
