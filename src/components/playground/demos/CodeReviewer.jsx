import { useState, useRef } from "react";
import Modal from "react-modal";
import { FiX } from "react-icons/fi";
import { apiUrl, readApiError } from "../../../utils/api";
import "./CodeReviewer.css";

Modal.setAppElement('#root');

const LANGUAGES = ["Auto", "JavaScript", "Python", "TypeScript", "Java", "Go"];

const CodeReviewer = ({ isOpen, onClose, embedded = false }) => {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("Auto");
  const [review, setReview] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  const handleReview = async () => {
    if (!code.trim()) {
      setError("Please enter some code to review");
      return;
    }

    setIsLoading(true);
    setError("");
    setReview("");

    try {
      const response = await fetch(apiUrl("/api/code-review"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, "Failed to review code"));
      }

      const data = await response.json();
      setReview(data.review);

      // Scroll to review
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      setError(err.message || "Error reviewing code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCode("");
    setLanguage("Auto");
    setReview("");
    setError("");
    onClose?.();
  };

  const content = (
    <div className="code-reviewer-container">
      <div className="code-reviewer-header">
        <h2>AI Code Reviewer</h2>
        {!embedded && (
          <button className="close-btn" onClick={handleClose} aria-label="Close">
            <FiX />
          </button>
        )}
      </div>

      <div className="code-reviewer-content">
        {!review ? (
          <div className="code-reviewer-input-section">
            <div className="input-group">
              <label htmlFor="language-select">Language</label>
              <select
                id="language-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="language-select"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="code-input">Paste your code</label>
              <textarea
                id="code-input"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste your code here..."
                className="code-input"
                rows="12"
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button
              onClick={handleReview}
              disabled={isLoading || !code.trim()}
              className="review-btn"
            >
              {isLoading ? "Reviewing..." : "Review Code"}
            </button>
          </div>
        ) : (
          <div className="code-reviewer-output-section" ref={scrollRef}>
            <div className="review-content">
              {review.split("\n").map((line, idx) => {
                if (line.startsWith("##")) {
                  return (
                    <h3 key={idx} className="review-section-title">
                      {line.replace(/^##\s*/, "")}
                    </h3>
                  );
                }
                if (line.startsWith("```")) {
                  return null;
                }
                if (line.trim()) {
                  return (
                    <p key={idx} className="review-line">
                      {line}
                    </p>
                  );
                }
                return <div key={idx} className="review-spacer" />;
              })}
            </div>

            <div className="review-actions">
              <button onClick={() => setReview("")} className="review-again-btn">
                Review Another Code
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
    return <div className="code-reviewer-modal embedded-demo">{content}</div>;
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      className="code-reviewer-modal"
      overlayClassName="code-reviewer-overlay"
    >
      {content}
    </Modal>
  );
};

export default CodeReviewer;
