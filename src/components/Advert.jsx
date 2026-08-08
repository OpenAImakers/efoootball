import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LivelyFeed from "./LivelyFeed";

const InstallBar = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const navigate = useNavigate();

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

  const handleContinueAndInstall = async (e) => {
    e.preventDefault();

    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    }

    navigate("/auth");
  };

  if (isStandalone) return null;

  return (
    <div style={styles.container}>
      <button style={styles.webBtn} onClick={handleContinueAndInstall}>
        <i className="bi bi-globe2"></i>
        Continue to Website
      </button>

      <LivelyFeed />
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    justifyContent: "center",
    alignItems: "center",
    padding: "18px 20px",
    background: "radial-gradient(circle at top, #08172f 0%, #030a1a 70%)",
    width: "100%",
    position: "relative",
    overflow: "hidden",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },

  webBtn: {
    padding: "12px 20px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    fontWeight: "700",
    textDecoration: "none",
    border: "1px solid rgba(255,255,255,0.12)",
    cursor: "pointer",
    transition: "0.25s ease",
    backdropFilter: "blur(10px)",
    minWidth: "180px",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
  },
};

export default InstallBar;