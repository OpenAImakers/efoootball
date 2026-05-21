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
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setIsStandalone(true);
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

  // Hide when installed
  if (isStandalone) return null;

  return (
    <div style={styles.container}>
      <button style={styles.downloadBtn} onClick={handleInstall}>
        Download App
      </button>

      <Link to="/auth" style={styles.webBtn}>
        Continue to Website
      </Link>

      <Link to="/announcements" style={styles.webBtn}>
        Announcements
      </Link>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    flexWrap: "wrap",
    background: "rgba(0,0,0,0.25)",
    backdropFilter: "blur(10px)",
    borderTop: "1px solid rgba(255,255,255,0.08)",
  },

  downloadBtn: {
    padding: "12px 22px",
    background: "linear-gradient(135deg, #f8c146, #ff9f1c)",
    color: "#111",
    border: "none",
    cursor: "pointer",
    fontWeight: "700",
    borderRadius: "12px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.35)",
    letterSpacing: "0.5px",
  },

  webBtn: {
    padding: "12px 20px",
    background: "rgba(255,255,255,0.06)",
    color: "white",
    textDecoration: "none",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.12)",
    fontWeight: "500",
    backdropFilter: "blur(8px)",
  },
};

export default InstallBar;