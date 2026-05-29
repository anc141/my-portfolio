import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import "./PlaygroundCard.css";

/**
 * Playground card component - displays an AI demo option
 * Similar to ProjectCard but for interactive AI demos
 *
 * @component
 * @param {string} title - The title of the demo
 * @param {string} description - Short description
 * @param {string} color - The background color of the card
 * @param {React.ReactNode} icon - Icon to display
 * @param {function} onClick - Handler when card is clicked
 * @param {number} id - Unique identifier
 */

const PlaygroundCard = ({ title, description, color, icon, onClick, id, active = false }) => {
  const [ref, inView] = useInView({
    threshold: 0.5,
    triggerOnce: true,
  });

  const variants = {
    hidden: { y: "10vw", opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <motion.div
      ref={ref}
      className="playground-card-wrapper"
      variants={variants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      key={id}
    >
      <div
        style={{ backgroundColor: color }}
        className={`playground-card ${active ? "active" : ""}`}
        onClick={onClick}
        role="button"
        aria-pressed={active}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick();
          }
        }}
      >
        <div className="playground-icon-container">
          {icon}
        </div>
        <div className="playground-text-container">
          <h3 className="playground-card-title">{title}</h3>
          <p className="playground-card-description">{description}</p>
          <span className="try-demo">
            {active ? "Open" : "Try It"} <span className="arrow">→</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default PlaygroundCard;
