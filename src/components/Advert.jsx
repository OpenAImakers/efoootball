import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const LandingPage = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallOverlay, setShowInstallOverlay] = useState(true);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setShowInstallOverlay(false);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallOverlay(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert("App is ready for manual installation via browser menu.");
      return;
    }

    setIsInstalling(true);
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === "accepted") {
      setShowInstallOverlay(false);
    }

    setIsInstalling(false);
    setDeferredPrompt(null);
  };

  return (
    <div style={styles.container}>
      {showInstallOverlay && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.iconCircle}>
              <span style={{ fontSize: "3rem" }}>🚀</span>
            </div>

            <h2 style={styles.modalTitle}>Finalizing Setup</h2>
            <p style={styles.modalText}>
              To access high-performance features and offline mode, 
              please add the app to your home screen.
            </p>

            <div style={styles.featureList}>
              <div style={styles.featureItem}>✓ Faster Load Times</div>
              <div style={styles.featureItem}>✓ Full Screen Mode</div>
              <div style={styles.featureItem}>✓ Offline Access</div>
              <div style={styles.featureItem}>✓ Smooth Animations</div>
            </div>

            <button
              style={{
                ...styles.installBtn,
                ...(isInstalling ? styles.installBtnActive : {}),
                animation: !isInstalling ? "pulse 2s infinite" : "none"
              }}
              onClick={handleInstallClick}
              disabled={isInstalling}
            >
              {isInstalling ? "Opening Prompt..." : "Install & Launch"}
            </button>

            <Link to="/auth" style={styles.browserBtn}>
              Proceed with limited web version
            </Link>

          </div>
        </div>
      )}

      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.7); }
            70% { transform: scale(1.03); box-shadow: 0 0 0 20px rgba(249, 115, 22, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); }
          }
        `}
      </style>
    </div>
  );
};

const styles = {
  container: {
    background: "#0f172a",
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(7, 10, 18, 0.98)",
    backdropFilter: "blur(12px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    padding: "20px",
  },
  modal: {
    backgroundColor: "#1e293b",
    padding: "50px 40px",
    borderRadius: "32px",
    border: "1px solid rgba(59, 130, 246, 0.4)",
    width: "95%",
    maxWidth: "500px",
    textAlign: "center",
    boxShadow: "0 30px 70px -10px rgba(0,0,0,0.6)",
  },
  iconCircle: {
    width: "90px",
    height: "90px",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    margin: "0 auto 25px",
    border: "2px solid #3b82f6",
  },
  modalTitle: {
    color: "#fff",
    fontSize: "2.2rem",
    fontWeight: "800",
    marginBottom: "15px",
  },
  modalText: {
    color: "#cbd5e1",
    fontSize: "1.1rem",
    lineHeight: "1.7",
    marginBottom: "25px",
  },
  featureList: {
    textAlign: "left",
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    padding: "20px",
    borderRadius: "16px",
    marginBottom: "30px",
  },
  featureItem: {
    color: "#3b82f6",
    fontSize: "1rem",
    fontWeight: "600",
    marginBottom: "8px",
    cursor: "default",
  },
  installBtn: {
    background: "linear-gradient(135deg, #f97316, #ea580c)",
    border: "none",
    padding: "20px",
    borderRadius: "16px",
    color: "white",
    fontWeight: "800",
    fontSize: "1.3rem",
    width: "100%",
    cursor: "pointer",
    marginBottom: "20px",
    transition: "all 0.3s ease",
  },
  installBtnActive: {
    opacity: 0.7,
    cursor: "not-allowed",
  },
  browserBtn: {
    display: "block",
    color: "#3b82f6",
    fontSize: "1rem",
    textDecoration: "underline",
    marginBottom: "15px",
  },
  linkBtn: {
    display: "block",
    color: "#94a3b8",
    fontSize: "0.95rem",
    textDecoration: "underline",
    marginBottom: "10px",
  },
};

export default LandingPage;