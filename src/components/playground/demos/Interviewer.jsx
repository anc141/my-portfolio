import { useState, useRef, useEffect } from "react";
import Modal from "react-modal";
import { FiX } from "react-icons/fi";
import { apiUrl, readApiError } from "../../../utils/api";
import "./Interviewer.css";

Modal.setAppElement('#root');

const PRESET_TOPICS = [
  "Design Twitter",
  "Design Uber",
  "Design Netflix",
];

const Interviewer = ({ isOpen, onClose, embedded = false }) => {
  const [stage, setStage] = useState("topic"); // 'topic', 'interview', 'scorecard'
  const [selectedTopic, setSelectedTopic] = useState("");
  const [customTopic, setCustomTopic] = useState("");
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [scorecard, setScorecard] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const topic = selectedTopic || customTopic;

  const startInterview = async () => {
    if (!topic.trim()) {
      setError("Please select or enter a topic");
      return;
    }

    setError("");
    setStage("interview");
    setMessages([]);
    setIsLoading(true);

    try {
      const response = await fetch(apiUrl("/api/interviewer"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, messages: [] }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, "Failed to start interview"));
      }

      const data = await response.json();
      setMessages([{ role: "assistant", content: data.response }]);
    } catch (err) {
      setError(err.message || "Error starting interview");
    } finally {
      setIsLoading(false);
    }
  };

  const sendAnswer = async () => {
    if (!userInput.trim()) return;

    const newMessages = [...messages, { role: "user", content: userInput }];
    setMessages(newMessages);
    setUserInput("");
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(apiUrl("/api/interviewer"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, messages: newMessages }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, "Failed to get response"));
      }

      const data = await response.json();
      const aiResponse = data.response;

      // Check if this is a scorecard
      if (aiResponse.includes("---SCORECARD---")) {
        // Extract scorecard
        const scorecardContent = aiResponse.split("---SCORECARD---")[1].split("---END_SCORECARD---")[0].trim();
        setScorecard(scorecardContent);
        setStage("scorecard");
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: aiResponse }]);
      }
    } catch (err) {
      setError(err.message || "Error getting response");
      setMessages(newMessages); // Keep user message even if error
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (stage === "interview") {
        sendAnswer();
      }
    }
  };

  const handleClose = () => {
    setStage("topic");
    setSelectedTopic("");
    setCustomTopic("");
    setMessages([]);
    setUserInput("");
    setError("");
    setScorecard("");
    onClose?.();
  };

  const content = (
      <div className="interviewer-container">
        <div className="interviewer-header">
          <h2>System Design Interviewer</h2>
          {!embedded && (
            <button className="close-btn" onClick={handleClose} aria-label="Close">
              <FiX />
            </button>
          )}
        </div>

        <div className="interviewer-content">
          {stage === "topic" && (
            <div className="topic-selection">
              <h3>Select a topic or enter your own</h3>

              <div className="preset-topics">
                {PRESET_TOPICS.map((t) => (
                  <button
                    key={t}
                    className={`topic-chip ${selectedTopic === t ? "active" : ""}`}
                    onClick={() => {
                      setSelectedTopic(t);
                      setCustomTopic("");
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="custom-topic-input">
                <label htmlFor="custom-topic">Or enter your own topic:</label>
                <input
                  id="custom-topic"
                  type="text"
                  value={customTopic}
                  onChange={(e) => {
                    setCustomTopic(e.target.value);
                    setSelectedTopic("");
                  }}
                  placeholder="e.g., Design Instagram Feed"
                  className="topic-input"
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button onClick={startInterview} className="start-interview-btn">
                Start Interview
              </button>
            </div>
          )}

          {stage === "interview" && (
            <div className="interview-session">
              <div className="messages">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`message message-${msg.role}`}>
                    <div className="message-avatar">
                      {msg.role === "assistant" ? "AI" : "You"}
                    </div>
                    <div className="message-content">{msg.content}</div>
                  </div>
                ))}
                {isLoading && (
                  <div className="message message-assistant">
                    <div className="message-avatar">AI</div>
                    <div className="message-content loading">
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {error && <div className="error-message">{error}</div>}

              <div className="input-area">
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your answer... (or type 'END INTERVIEW' to finish)"
                  className="interview-input"
                  rows="3"
                />
                <div className="input-controls">
                  <small className="hint">Press Enter to send, Shift+Enter for new line</small>
                  <button
                    onClick={sendAnswer}
                    disabled={isLoading || !userInput.trim()}
                    className="send-btn"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}

          {stage === "scorecard" && (
            <div className="scorecard-view">
              <h3>Interview Scorecard</h3>
              <div className="scorecard-content">
                {scorecard.split("\n").map((line, idx) => {
                  if (line.startsWith("**") && line.includes(":")) {
                    return (
                      <div key={idx} className="scorecard-item">
                        <strong className="scorecard-label">
                          {line.split(":")[0].replace(/\*\*/g, "").trim()}
                        </strong>
                        <p className="scorecard-value">
                          {line.split(":").slice(1).join(":").trim()}
                        </p>
                      </div>
                    );
                  }
                  if (line.trim()) {
                    return (
                      <p key={idx} className="scorecard-line">
                        {line}
                      </p>
                    );
                  }
                  return null;
                })}
              </div>

              <div className="scorecard-actions">
                {!embedded && (
                  <button onClick={() => handleClose()} className="done-btn">
                    Done
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
  );

  if (embedded) {
    return <div className="interviewer-modal embedded-demo">{content}</div>;
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      className="interviewer-modal"
      overlayClassName="interviewer-overlay"
    >
      {content}
    </Modal>
  );
};

export default Interviewer;
