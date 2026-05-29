import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import Modal from "react-modal";
import { FiX } from "react-icons/fi";
import { apiUrl, readApiError } from "../../../utils/api";
import "./Debate.css";

Modal.setAppElement('#root');

const Debate = ({ isOpen, onClose, embedded = false }) => {
  const [topic, setTopic] = useState("");
  const [debateData, setDebateData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [visibleCount, setVisibleCount] = useState(0);
  const [verdictRequested, setVerdictRequested] = useState(false);
  const [verdictVisible, setVerdictVisible] = useState(false);
  const transcriptEndRef = useRef(null);

  const debateMessages = useMemo(() => {
    if (!debateData) {
      return [];
    }

    const messages = [];
    debateData.rounds.forEach((round) => {
      messages.push({
        id: `round-${round.roundNumber}-pro`,
        agent: "Affirmative",
        role: "pro",
        label: `Round ${round.roundNumber}`,
        content: round.pro,
      });
      messages.push({
        id: `round-${round.roundNumber}-con`,
        agent: "Opposition",
        role: "con",
        label: `Round ${round.roundNumber}`,
        content: round.con,
      });
    });

    return messages;
  }, [debateData]);

  const visibleMessages = debateMessages.slice(0, visibleCount);
  const nextMessage = debateMessages[visibleCount];
  const judgeMessage = debateData
    ? {
        id: "judge-verdict",
        agent: "Judge",
        role: "judge",
        label: "Verdict",
        content: debateData.verdict,
      }
    : null;
  const isDebating = debateData && visibleCount < debateMessages.length && !verdictRequested;
  const isJudgeTyping = verdictRequested && !verdictVisible;
  const debateStatus = isJudgeTyping
    ? "Judge reviewing"
    : isDebating
      ? "Agents debating"
      : verdictVisible
        ? "Verdict delivered"
        : "Awaiting intervention";

  useEffect(() => {
    if (!debateData || verdictRequested || visibleCount >= debateMessages.length) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      setVisibleCount((count) => Math.min(count + 1, debateMessages.length));
    }, visibleCount === 0 ? 500 : 1200);

    return () => clearTimeout(timeout);
  }, [debateData, debateMessages.length, verdictRequested, visibleCount]);

  useEffect(() => {
    if (!verdictRequested || verdictVisible) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      setVerdictVisible(true);
    }, 900);

    return () => clearTimeout(timeout);
  }, [verdictRequested, verdictVisible]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [visibleCount, isLoading, verdictVisible, verdictRequested]);

  const handleStartDebate = async () => {
    if (!topic.trim()) {
      setError("Please enter a topic");
      return;
    }

    setIsLoading(true);
    setError("");
    setDebateData(null);
    setVisibleCount(0);
    setVerdictRequested(false);
    setVerdictVisible(false);

    try {
      const response = await fetch(apiUrl("/api/debate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, "Failed to start debate"));
      }

      const data = await response.json();
      setDebateData(data.debate);
      setVisibleCount(0);
      setVerdictRequested(false);
      setVerdictVisible(false);
    } catch (err) {
      setError(err.message || "Error starting debate");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setTopic("");
    setDebateData(null);
    setError("");
    setVisibleCount(0);
    setVerdictRequested(false);
    setVerdictVisible(false);
    onClose?.();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleStartDebate();
    }
  };

  const handleRequestVerdict = () => {
    if (verdictRequested) {
      return;
    }

    setVisibleCount(debateMessages.length);
    setVerdictRequested(true);
  };

  const content = (
      <div className="debate-container">
        <div className="debate-header">
          <h2>Multi-Agent Debate Arena</h2>
          {!embedded && (
            <button className="close-btn" onClick={handleClose} aria-label="Close">
              <FiX />
            </button>
          )}
        </div>

        <div className="debate-content">
          {!debateData ? (
            <div className="debate-input-section">
              <h3>What topic would you like to debate?</h3>

              <div className="input-group">
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g., Remote work is better than office work"
                  className="debate-topic-input"
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button
                onClick={handleStartDebate}
                disabled={isLoading || !topic.trim()}
                className="start-debate-btn"
              >
                {isLoading ? "Starting Debate..." : "Start Debate"}
              </button>
            </div>
          ) : (
            <div className="debate-chat-section">
              <div className="debate-session-bar">
                <div>
                  <span className="debate-session-label">Live Debate</span>
                  <h3 className="debate-topic-display">
                    {debateData.topic}
                  </h3>
                </div>
                <span className={`debate-status ${isDebating || isJudgeTyping ? "active" : ""}`}>
                  {debateStatus}
                </span>
              </div>
              {!verdictVisible && (
                <button
                  onClick={handleRequestVerdict}
                  disabled={verdictRequested}
                  className="verdict-btn verdict-btn-top"
                >
                  Intervene: Verdict
                </button>
              )}

              {debateData.sources?.length > 0 && (
                <div className="debate-sources">
                  <span>Grounded by search</span>
                  <div className="source-links">
                    {debateData.sources.slice(0, 4).map((source, index) => (
                      <a
                        key={source.url}
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {index + 1}. {source.title}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="debate-chat-window" aria-live="polite">
                {visibleMessages.map((message) => (
                  <motion.div
                    key={message.id}
                    className={`debate-chat-message ${message.role}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28 }}
                  >
                    <div className="agent-avatar">
                      {message.role === "judge" ? "J" : message.role === "pro" ? "P" : "C"}
                    </div>
                    <div className="agent-bubble">
                      <div className="agent-meta">
                        <strong>{message.agent}</strong>
                        <span>{message.label}</span>
                      </div>
                      <p>{message.content}</p>
                    </div>
                  </motion.div>
                ))}

                {isDebating && nextMessage && (
                  <div className={`debate-chat-message typing ${nextMessage.role}`}>
                    <div className="agent-avatar">
                      {nextMessage.role === "judge" ? "J" : nextMessage.role === "pro" ? "P" : "C"}
                    </div>
                    <div className="agent-bubble">
                      <div className="agent-meta">
                        <strong>{nextMessage.agent}</strong>
                        <span>{nextMessage.label}</span>
                      </div>
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}

                {isJudgeTyping && judgeMessage && (
                  <div className="debate-chat-message typing judge">
                    <div className="agent-avatar">J</div>
                    <div className="agent-bubble">
                      <div className="agent-meta">
                        <strong>{judgeMessage.agent}</strong>
                        <span>{judgeMessage.label}</span>
                      </div>
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}

                {verdictVisible && judgeMessage && (
                  <motion.div
                    key={judgeMessage.id}
                    className="debate-chat-message judge"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28 }}
                  >
                    <div className="agent-avatar">J</div>
                    <div className="agent-bubble">
                      <div className="agent-meta">
                        <strong>{judgeMessage.agent}</strong>
                        <span>{judgeMessage.label}</span>
                      </div>
                      <p>{judgeMessage.content}</p>
                    </div>
                  </motion.div>
                )}

                <div ref={transcriptEndRef} />
              </div>

              <div className="debate-actions">
                <button
                  onClick={() => {
                    setTopic("");
                    setDebateData(null);
                    setVisibleCount(0);
                    setVerdictRequested(false);
                    setVerdictVisible(false);
                  }}
                  className="new-debate-btn"
                >
                  Start New Debate
                </button>
                {!embedded && (
                  <button onClick={handleClose} className="done-btn">
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
    return <div className="debate-modal embedded-demo">{content}</div>;
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      className="debate-modal"
      overlayClassName="debate-overlay"
    >
      {content}
    </Modal>
  );
};

export default Debate;
