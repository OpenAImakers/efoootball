import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LivelyFeed from "./LivelyFeed";

const InstallBar = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

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
      setIsInstalling(false);
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
      alert("Install not available. Use browser menu → Add to Home Screen.");
      return;
    }

    setIsInstalling(true);

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    if (outcome !== "accepted") {
      setIsInstalling(false);
    }
  };

  if (isStandalone) return null;

  return (
    <>
      {/* LOCAL CSS ONLY */}
      <style>
        {`
          @keyframes dashMove {
            0% {
              transform: translateX(-20px);
              opacity: 0.3;
            }

            50% {
              transform: translateX(20px);
              opacity: 1;
            }

            100% {
              transform: translateX(-20px);
              opacity: 0.3;
            }
          }

          @keyframes floatGlow {
            0% {
              transform: translateY(0px);
            }

            50% {
              transform: translateY(-4px);
            }

            100% {
              transform: translateY(0px);
            }
          }
        `}
      </style>

      <div style={styles.container}>
        {/* INSTALL SCREEN */}
        {isInstalling && (
          <div style={styles.installOverlay}>
            <div style={styles.loaderCard}>
              <div style={styles.loaderIcon}>
                <i className="bi bi-cloud-arrow-down-fill"></i>
              </div>

              <div style={styles.loaderTitle}>
                Installing Application
              </div>

              <div style={styles.dashLoader}>
                <span>-</span>
                <span>---</span>
                <span>-----</span>
              </div>

              <div style={styles.loaderText}>
                Preparing assets...
              </div>
            </div>
          </div>
        )}

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

  installOverlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(2,6,18,0.97)",
    backdropFilter: "blur(14px)",
    zIndex: 100,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },

  loaderCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    padding: "30px",
    borderRadius: "24px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
  },

  loaderIcon: {
    fontSize: "2.5rem",
    color: "#f8c146",
    animation: "floatGlow 1.8s infinite ease-in-out",
  },

  loaderTitle: {
    color: "#fff",
    fontWeight: "800",
    fontSize: "1.1rem",
    letterSpacing: "0.5px",
  },

  dashLoader: {
    display: "flex",
    gap: "10px",
    fontSize: "1.8rem",
    color: "#f8c146",
    fontWeight: "900",
    animation: "dashMove 1.2s infinite ease-in-out",
  },

  loaderText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: "0.9rem",
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