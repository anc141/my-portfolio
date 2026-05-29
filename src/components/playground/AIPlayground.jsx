import { useState } from "react";
import { FiCode, FiZap } from "react-icons/fi";
import PlaygroundCard from "./PlaygroundCard";
import CodeReviewer from "./demos/CodeReviewer";
import Debate from "./demos/Debate";
import "./AIPlayground.css";

/**
 * AIPlayground component - displays interactive AI demo cards
 * Renders the Code Reviewer, System Design Interviewer, and Debate demos
 *
 * @component
 */

const AIPlayground = () => {
  const [activeDemo, setActiveDemo] = useState("codeReviewer");

  const demos = [
    {
      id: 1,
      title: "AI Code Reviewer",
      description: "Paste your code and get expert-level feedback on bugs, performance, readability, and security.",
      color: "#1e3a5f",
      icon: <FiCode />,
      key: "codeReviewer",
    },
    // {
    //   id: 2,
    //   title: "System Design Interviewer",
    //   description: "Practice system design interviews with AI-powered questions, feedback, and scoring.",
    //   color: "#2d4a3f",
    //   icon: <FiAward />,
    //   key: "interviewer",
    // },
    {
      id: 3,
      title: "Multi-Agent Debate",
      description: "Watch two AI agents debate any topic from multiple perspectives with expert analysis.",
      color: "#4a3a2a",
      icon: <FiZap />,
      key: "debate",
    },
  ];

  const renderActiveDemo = () => {
    if (activeDemo === "debate") {
      return <Debate embedded />;
    }

    return <CodeReviewer embedded />;
  };

  return (
    <section className="ai-playground">
      <div className="playground-section-header">
        <h2 className="playground-section-title">AI Playground</h2>
        <p className="playground-section-description">
          Interactive AI-powered tools to enhance your skills and explore cutting-edge capabilities
        </p>
      </div>

      <div className="playground-workspace">
        <aside className="playground-tool-list" aria-label="AI playground tools">
          {demos.map((demo) => (
            <PlaygroundCard
              key={demo.id}
              id={demo.id}
              title={demo.title}
              description={demo.description}
              color={demo.color}
              icon={demo.icon}
              active={activeDemo === demo.key}
              onClick={() => setActiveDemo(demo.key)}
            />
          ))}
        </aside>

        <div className="playground-tool-panel">
          {renderActiveDemo()}
        </div>
      </div>
    </section>
  );
};

export default AIPlayground;
