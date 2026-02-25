import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const LandingPage = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallOverlay, setShowInstallOverlay] = useState(true);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Check if already installed
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
              <span style={{ fontSize: "2rem" }}>🚀</span>
            </div>
            
            <h2 style={styles.modalTitle}>Finalizing Setup</h2>
            <p style={styles.modalText}>
              To access high-performance features and offline mode, 
              please add the app to your home screen.
            </p>

            <div style={styles.featureList}>
              <div style={styles.featureItem}>✓ Faster Load Times</div>
              <div style={styles.featureItem}>✓ Full Screen Mode</div>
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

      {/* CSS for Pulse Animation */}
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.7); }
            70% { transform: scale(1.02); box-shadow: 0 0 0 15px rgba(249, 115, 22, 0); }
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
  },
  modal: {
    backgroundColor: "#1e293b",
    padding: "40px 30px",
    borderRadius: "28px",
    border: "1px solid rgba(59, 130, 246, 0.3)",
    width: "90%",
    maxWidth: "400px",
    textAlign: "center",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
  },
  iconCircle: {
    width: "70px",
    height: "70px",
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderRadius: "50%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    margin: "0 auto 20px",
    border: "1px solid #3b82f6",
  },
  modalTitle: {
    color: "#fff",
    fontSize: "1.8rem",
    fontWeight: "800",
    marginBottom: "12px",
  },
  modalText: {
    color: "#94a3b8",
    fontSize: "0.95rem",
    lineHeight: "1.5",
    marginBottom: "20px",
  },
  featureList: {
    textAlign: "left",
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    padding: "15px",
    borderRadius: "12px",
    marginBottom: "25px",
  },
  featureItem: {
    color: "#3b82f6",
    fontSize: "0.85rem",
    fontWeight: "bold",
    marginBottom: "5px",
  },
  installBtn: {
    background: "linear-gradient(135deg, #f97316, #ea580c)",
    border: "none",
    padding: "18px",
    borderRadius: "14px",
    color: "white",
    fontWeight: "800",
    fontSize: "1.1rem",
    width: "100%",
    cursor: "pointer",
    marginBottom: "15px",
    transition: "all 0.3s ease",
  },
  installBtnActive: {
    opacity: 0.7,
    cursor: "not-allowed",
  },
  browserBtn: {
    display: "block",
    color: "#64748b",
    fontSize: "0.85rem",
    textDecoration: "none",
    marginBottom: "20px",
  },
  securityTag: {
    color: "#4ade80",
    fontSize: "0.75rem",
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: "1px",
  }
};

export default LandingPage;