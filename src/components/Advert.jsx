import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LivelyFeed from "./LivelyFeed";

const InstallBar = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
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

    const installedHandler = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      alert("Already Installed. If not, use browser menu → Add to Home Screen.");
      return;
    }

    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
  };

  if (isStandalone) return null;

  return (
    <>
      <div style={styles.container}>
        {/* BUTTONS */}
        <div style={styles.buttonRow}>
          <button style={styles.downloadBtn} onClick={handleInstall}>
            <i className="bi bi-download"></i>
            Download App
          </button>

          <Link to="/auth" style={styles.webBtn}>
            <i className="bi bi-globe2"></i>
            Continue to Website
          </Link>

          <Link to="/announcements" style={styles.blogBtn}>
            <i className="bi bi-megaphone-fill"></i>
            Blog
          </Link>

          <Link to="/fie" style={styles.fie}>
            <i className="bi bi-trophy-fill"></i>
            FIE
          </Link>
        </div>

        <LivelyFeed />
      </div>
    </>
  );
};

const commonButton = {
  padding: "12px 20px",
  borderRadius: "14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  fontWeight: "700",
  textDecoration: "none",
  border: "none",
  cursor: "pointer",
  transition: "0.25s ease",
  backdropFilter: "blur(10px)",
  minWidth: "180px",
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    justifyContent: "center",
    alignItems: "center",
    padding: "18px 20px",
    background:
      "radial-gradient(circle at top, #08172f 0%, #030a1a 70%)",
    width: "100%",
    position: "relative",
    overflow: "hidden",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },

  buttonRow: {
    display: "flex",
    gap: "14px",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
  },

  downloadBtn: {
    ...commonButton,
    background: "linear-gradient(135deg, #f8c146, #ff9f1c)",
    color: "#111",
    boxShadow: "0 10px 25px rgba(255,159,28,0.25)",
  },

  webBtn: {
    ...commonButton,
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.12)",
  },

  blogBtn: {
    ...commonButton,
    background: "linear-gradient(135deg, #fff0f5, #ffe4ec)",
    color: "#db7093",
    boxShadow: "0 10px 25px rgba(219,112,147,0.12)",
  },

  fie: {
    ...commonButton,
    background: "linear-gradient(135deg, #38b222, #207514)",
    color: "#fff",
    boxShadow: "0 10px 25px rgba(56,178,34,0.2)",
  },
};

export default InstallBar;