import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import AIPlayground from "../../components/playground/AIPlayground";
import Footer from "../../components/Footer";

/**
 * Represents the Playground page component.
 * Displays interactive AI-powered demos and tools.
 *
 * @component
 */

const Playground = () => {
  // Get the current location using React Router's useLocation hook
  const location = useLocation();

  // Scroll to the top of the page when the location changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <>
      {/* Main Playground Page */}
      <main className="playground container">
        {/* Display the page header */}
        <PageHeader title="AI Playground" description="Try interactive AI demos" />

        {/* Display AI Playground section */}
        <AIPlayground />
      </main>
      <Footer />
    </>
  );
};

export default Playground;
