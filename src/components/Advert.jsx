import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const InstallBar = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect if running as installed PWA
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    if (standalone) {
      setIsStandalone(true);
      return; // stop everything else
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setIsStandalone(true); // hide after install
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      alert("Install not available. Use browser menu → Add to Home Screen.");
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  // 🔥 MAIN CHANGE: completely hide component
  if (isStandalone) return null;

  return (
    <div style={styles.container}>
      <button style={styles.downloadBtn} onClick={handleInstall}>
        Download App
      </button>

      <Link to="/auth" style={styles.webBtn}>
        Continue to Website
      </Link>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    gap: "10px",
    justifyContent: "center",
    alignItems: "center",
    padding: "15px",
  },
  downloadBtn: {
    padding: "10px 20px",
    background: "black",
    color: "white",
    border: "none",
    cursor: "pointer",
  },
  webBtn: {
    padding: "10px 20px",
    background: "gray",
    color: "white",
    textDecoration: "none",
  },
};

export default InstallBar;