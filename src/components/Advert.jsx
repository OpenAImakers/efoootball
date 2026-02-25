import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const LandingPage = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert("To install, please use your browser's 'Add to Home Screen' menu option.");
      return;
    }

    setIsInstalling(true);
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    
    setIsInstalling(false);
    if (choiceResult.outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.topLeftLinks}>
        <button 
          onClick={handleInstallClick} 
          style={styles.simpleNavLink}
          disabled={isInstalling}
        >
          {isInstalling ? "Opening..." : "Download"}
        </button>
        <Link to="/auth" style={styles.simpleNavLink}>Browser</Link>
      </div>
    </div>
  );
};

const styles = {
  container: {
    backgroundImage: "url('/advert.png')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    minHeight: "100vh",
    width: "100vw",
    display: "flex",
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#0f172a", // Fallback color
  },
  topLeftLinks: {
    position: "absolute",
    top: "30px",
    left: "30px",
    display: "flex",
    gap: "30px",
    zIndex: 10,
  },
  simpleNavLink: {
    background: "none",
    border: "none",
    color: "#fff",
    textDecoration: "none",
    fontSize: "1.1rem",
    fontWeight: "700",
    cursor: "pointer",
    // Strong shadow helps readability on any background image
    textShadow: "0 2px 8px rgba(0,0,0,0.8)", 
    padding: 0,
    margin: 0,
    fontFamily: "inherit",
    transition: "opacity 0.2s",
  },
};

export default LandingPage;