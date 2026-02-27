import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const LandingPage = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showManualInstall, setShowManualInstall] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalling(false);
      setShowManualInstall(false);
      console.log("PWA was successfully installed");
      // You could add a success toast/notification here later
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Browser supports native install prompt
      setIsInstalling(true);
      deferredPrompt.prompt();

      try {
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        if (outcome === "accepted") {
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.error("Install prompt failed:", err);
      } finally {
        setIsInstalling(false);
      }
    } else {
      // No native prompt available → show friendly instructions
      setShowManualInstall(true);
    }
  };

  const closeManualInstall = () => {
    setShowManualInstall(false);
  };

  return (
    <div style={styles.container}>
      {/* Cinematic Background Layer */}
      <div style={styles.imageWrapper}>
        <img 
          src="/advert.png" 
          alt="Background" 
          style={styles.pesImage} 
        />
        <div style={styles.overlayGradient} />
      </div>

      {/* PES Menu System */}
      <div className="menu-wrapper" style={styles.menuWrapper}>
        <div style={styles.pesHeader}>
          <span style={styles.line} />
          <h2 style={styles.titleText}>LIVE CONNECT</h2>
        </div>

        <div style={styles.buttonStack}>
          {/* Primary Action - Install */}
          <button 
            onClick={handleInstallClick}
            className="pes-button-primary"
            style={styles.pesButtonPrimary}
            disabled={isInstalling}
          >
            <span style={styles.btnContent}>
              {isInstalling ? (
                <span className="loader-text">INITIALIZING...</span>
              ) : (
                <>
                  <i className="bi bi-cloud-arrow-down-fill" style={styles.icon}></i>
                  GET APP NOW
                </>
              )}
            </span>
          </button>

          {/* Secondary Action - Play in Browser */}
          <Link 
            to="/auth" 
            className="pes-button-secondary" 
            style={styles.pesButtonSecondary}
          >
            <span style={styles.btnContent}>
              <i className="bi bi-play-fill" style={styles.icon}></i>
              BROWSER MODE
            </span>
          </Link>
        </div>


      </div>

      {/* Nice game-style manual install guide (shows when native prompt unavailable) */}
      {showManualInstall && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>INSTALL LIVE CONNECT</h3>
            
            <p style={styles.modalText}>
              Tap the menu in your browser and look for:
            </p>

            <div style={styles.platformHints}>
              <div style={styles.hint}>
                <strong>Chrome / Edge (Android):</strong><br />
                Menu (⁝) → Add to home screen / Install app
              </div>
              <div style={styles.hint}>
                <strong>Safari (iPhone / iPad):</strong><br />
                Share (□ with ↑) → Add to Home Screen
              </div>
              <div style={styles.hint}>
                <strong>Other browsers:</strong><br />
                Look for "Install" or "Add to Home Screen" in the browser menu
              </div>
            </div>

            <button 
              onClick={closeManualInstall} 
              style={styles.modalClose}
            >
              GOT IT
            </button>
          </div>
        </div>
      )}

      {/* Global Styles */}
      <style>{`
        @import url('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css');

        :root {
          touch-action: pan-x pan-y;
        }

        @keyframes bgMove {
          0% { transform: scale(1.15) translate(0, 0); }
          50% { transform: scale(1.25) translate(-2%, -1%); }
          100% { transform: scale(1.15) translate(0, 0); }
        }

        .loader-text {
          animation: blink 1s infinite;
        }

        @keyframes blink {
          0% { opacity: 1; }
          50% { opacity: 0.4; }
          100% { opacity: 1; }
        }

        @media (max-width: 768px) {
          .menu-wrapper {
            padding-left: 0 !important;
            align-items: center !important;
            justify-content: center !important;
            width: 90% !important;
            margin: 0 auto;
          }
          
          .pes-button-primary,
          .pes-button-secondary {
            width: 100% !important;
            min-width: unset !important;
            padding: 22px 20px !important;
            font-size: 1.3rem !important;
          }

          .pes-button-primary {
            box-shadow: -8px 8px 0px rgba(0,0,0,0.9) !important;
          }
        }

        .pes-button-primary:active,
        .pes-button-secondary:active {
          transform: skew(-10deg) scale(0.96) !important;
          filter: brightness(0.8);
        }

        /* Modal - PES / cyber aesthetic */
        .modalOverlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.88);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(6px);
        }

        .modalContent {
          background: rgba(8, 8, 18, 0.94);
          border: 2px solid #e3ff00;
          border-radius: 12px;
          max-width: 400px;
          width: 92%;
          padding: 28px 24px;
          color: white;
          text-align: center;
          box-shadow: 0 0 50px rgba(227, 255, 0, 0.2);
          transform: skew(-6deg);
        }

        .modalContent > * {
          transform: skew(6deg);
        }

        .modalTitle {
          color: #e3ff00;
          font-size: 1.7rem;
          font-weight: 900;
          margin: 0 0 20px;
          letter-spacing: 2px;
          text-transform: uppercase;
        }

        .modalText {
          font-size: 1.05rem;
          line-height: 1.5;
          margin: 0 0 24px;
        }

        .platformHints {
          text-align: left;
          margin-bottom: 28px;
        }

        .hint {
          margin: 12px 0;
          padding: 12px 14px;
          background: rgba(227,255,0,0.07);
          border-left: 5px solid #e3ff00;
          border-radius: 4px;
          font-size: 0.98rem;
        }

        .modalClose {
          background: #e3ff00;
          color: #000;
          border: none;
          padding: 16px 48px;
          font-size: 1.15rem;
          font-weight: 900;
          border-radius: 8px;
          cursor: pointer;
          box-shadow: -8px 8px 0px rgba(0,0,0,0.8);
          transition: all 0.15s ease;
        }

        .modalClose:hover {
          filter: brightness(1.1);
        }

        .modalClose:active {
          transform: scale(0.97);
          box-shadow: -4px 4px 0px rgba(0,0,0,0.8);
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: "#020617",
    height: "100vh",
    width: "100vw",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    overflow: "hidden",
    position: "relative",
    fontFamily: "'Segoe UI', Roboto, Helvetica, sans-serif",
  },
  imageWrapper: {
    position: "absolute",
    inset: 0,
    zIndex: 1,
  },
  pesImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    opacity: "0.55",
    animation: "bgMove 25s ease-in-out infinite",
  },
  overlayGradient: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(90deg, #020617 5%, transparent 60%, #020617 100%)",
  },
  menuWrapper: {
    position: "relative",
    zIndex: 10,
    paddingLeft: "7%",
    display: "flex",
    flexDirection: "column",
    width: "100%",
    maxWidth: "600px",
  },
  pesHeader: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginBottom: "35px",
  },
  line: {
    width: "8px",
    height: "40px",
    backgroundColor: "#e3ff00",
  },
  titleText: {
    color: "#fff",
    fontSize: "2rem",
    fontWeight: "900",
    letterSpacing: "4px",
    margin: 0,
    textTransform: "uppercase",
    fontStyle: "italic",
  },
  buttonStack: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    width: "100%",
  },
  pesButtonPrimary: {
    background: "#e3ff00",
    color: "#000",
    border: "none",
    padding: "20px 50px",
    fontSize: "1.2rem",
    fontWeight: "900",
    cursor: "pointer",
    textAlign: "left",
    transform: "skew(-10deg)",
    transition: "all 0.15s ease",
    width: "fit-content",
    minWidth: "350px",
    boxShadow: "-10px 10px 0px rgba(0,0,0,1)",
  },
  pesButtonSecondary: {
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(10px)",
    color: "#fff",
    border: "2px solid rgba(255,255,255,0.2)",
    padding: "18px 50px",
    fontSize: "1.1rem",
    fontWeight: "700",
    textDecoration: "none",
    textAlign: "left",
    transform: "skew(-10deg)",
    transition: "all 0.15s ease",
    width: "fit-content",
    minWidth: "350px",
    display: "inline-block",
  },
  btnContent: {
    transform: "skew(10deg)",
    display: "flex",
    alignItems: "center",
  },
  icon: {
    marginRight: "15px",
    fontSize: "1.4rem",
  },
  pesFooter: {
    marginTop: "50px",
    paddingTop: "20px",
    borderTop: "1px solid rgba(255,255,255,0.1)",
    maxWidth: "350px",
  },
  footerText: {
    color: "#fff",
    fontSize: "0.85rem",
    fontWeight: "bold",
    margin: "0 0 5px 0",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  statusDot: {
    width: "8px",
    height: "8px",
    backgroundColor: "#00ff88",
    borderRadius: "50%",
    boxShadow: "0 0 10px #00ff88",
  },
  versionText: {
    color: "rgba(255,255,255,0.3)",
    fontSize: "0.7rem",
    margin: 0,
    letterSpacing: "1px",
  },
};

export default LandingPage;