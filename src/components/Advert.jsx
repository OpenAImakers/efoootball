import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const LandingPage = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallOverlay, setShowInstallOverlay] = useState(true); // always show first

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches;

    if (isStandalone) {
      setShowInstallOverlay(false);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallOverlay(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () =>
      window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;

    if (choiceResult.outcome === "accepted") {
      setShowInstallOverlay(false);
    }

    setDeferredPrompt(null);
  };

  return (
    <div style={styles.container}>


      {/* Install Overlay */}
      {showInstallOverlay && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Install Required</h2>
            <p style={styles.modalText}>
              For the best experience, install the app.
            </p>

            <button
              style={styles.installBtn}
              onClick={handleInstallClick}
            >
              Install App
            </button>

            <Link to="/auth" style={styles.browserBtn}>
              Continue in Browser
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    background: "linear-gradient(135deg, #0f172a, #0b1120)",
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px 20px",
    position: "relative",
  },

  content: {
    textAlign: "center",
    maxWidth: "500px",
  },

  title: {
    color: "#3b82f6",
    fontSize: "2.8rem",
    fontWeight: "bold",
    marginBottom: "15px",
  },

  subtitle: {
    color: "#94a3b8",
    fontSize: "1.1rem",
    lineHeight: "1.6",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(15, 23, 42, 0.97)",
    backdropFilter: "blur(8px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    padding: "20px",
  },

  modal: {
    backgroundColor: "#1e293b",
    padding: "45px 35px",
    borderRadius: "22px",
    border: "1px solid #3b82f6",
    width: "100%",
    maxWidth: "380px",
    textAlign: "center",
    boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
  },

  modalTitle: {
    color: "#f97316",
    fontSize: "1.6rem",
    marginBottom: "10px",
  },

  modalText: {
    color: "#cbd5e1",
    fontSize: "0.95rem",
    marginBottom: "25px",
  },

  installBtn: {
    background: "linear-gradient(135deg, #f97316, #ea580c)",
    border: "none",
    padding: "16px",
    borderRadius: "12px",
    color: "white",
    fontWeight: "bold",
    fontSize: "1rem",
    width: "100%",
    cursor: "pointer",
    marginBottom: "18px",
    transition: "0.3s ease",
  },

  browserBtn: {
    display: "block",
    color: "#3b82f6",
    fontSize: "0.9rem",
    textDecoration: "none",
    marginTop: "5px",
  },
};

export default LandingPage;