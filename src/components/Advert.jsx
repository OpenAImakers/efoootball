import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const LandingPage = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showManualInstall, setShowManualInstall] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsPWA(true);
    }

    const handler = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setDeferredPrompt(null);
      setIsInstalling(false);
      setShowManualInstall(false);
      setIsPWA(true);
      console.log("PWA installed successfully");
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // If no native prompt, show the beautiful manual guide
      setShowManualInstall(true);
      return;
    }

    setIsInstalling(true);
    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
    setIsInstalling(false);
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
          {!isPWA ? (
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
                    <i className="bi bi-download" style={styles.icon}></i>
                    GET APP NOW
                  </>
                )}
              </span>
            </button>
          ) : (
            <div style={styles.installedBadge}>
              <i className="bi bi-check-circle-fill" style={{marginRight: '10px'}}></i>
              APP INSTALLED
            </div>
          )}

          {/* Secondary Action - Play in Browser */}
          <Link 
            to="/auth" 
            className="pes-button-secondary" 
            style={styles.pesButtonSecondary}
          >
            <span style={styles.btnContent}>
              <i className="bi bi-globe" style={styles.icon}></i>
              BROWSER MODE
            </span>
          </Link>
        </div>
        

      </div>

      {/* Manual Install Guide */}
      {showManualInstall && (
        <div className="modalOverlay" onClick={() => setShowManualInstall(false)}>
          <div className="modalContent" onClick={e => e.stopPropagation()}>
            <h3 className="modalTitle">INSTALLING APP</h3>
            
            <p className="modalText">
              Follow these steps to add <strong>LIVE CONNECT</strong> to your home screen:
            </p>

            <div className="platformHints">
              <div className="hint">
                <i className="bi bi-android2" style={{color: '#3DDC84', marginRight: '10px'}}></i>
                <strong>ANDROID (Chrome)</strong><br />
                Tap Menu (⁝) → <span style={{color: '#e3ff00'}}>Install App</span>
              </div>
              <div className="hint">
                <i className="bi bi-apple" style={{color: '#FFF', marginRight: '10px'}}></i>
                <strong>IPHONE (Safari)</strong><br />
                Tap Share ( <i className="bi bi-box-arrow-up"></i> ) → <span style={{color: '#e3ff00'}}>Add to Home Screen</span>
              </div>
            </div>

            <button 
              onClick={() => setShowManualInstall(false)} 
              className="modalClose"
            >
              RETURN TO MENU
            </button>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css');

        :root { touch-action: pan-x pan-y; }

        @keyframes bgMove {
          0% { transform: scale(1.1); translate: 0 0; }
          50% { transform: scale(1.2); translate: -1% -1%; }
          100% { transform: scale(1.1); translate: 0 0; }
        }

        .loader-text { animation: blink 1s infinite; }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .modalOverlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.9);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000; backdrop-filter: blur(8px);
        }

        .modalContent {
          background: #0a0a0f; border: 2px solid #e3ff00;
          border-radius: 0; max-width: 420px; width: 90%;
          padding: 30px; color: white; transform: skew(-3deg);
          box-shadow: 0 0 40px rgba(227, 255, 0, 0.15);
        }

        .modalTitle { color: #e3ff00; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 20px; }
        .hint { 
            background: rgba(255,255,255,0.05); padding: 15px; 
            margin-bottom: 10px; border-left: 4px solid #e3ff00; 
            font-size: 0.9rem; line-height: 1.4;
        }

        @media (max-width: 768px) {
          .menu-wrapper { padding-left: 0 !important; align-items: center !important; }
          .pes-button-primary, .pes-button-secondary { width: 90% !important; min-width: unset !important; }
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
    fontFamily: "'Inter', sans-serif",
  },
  imageWrapper: { position: "absolute", inset: 0, zIndex: 1 },
  pesImage: {
    width: "100%", height: "100%", objectFit: "cover",
    opacity: "0.4", animation: "bgMove 30s infinite",
  },
  overlayGradient: {
    position: "absolute", inset: 0,
    background: "linear-gradient(90deg, #020617 10%, transparent 70%, #020617 100%)",
  },
  menuWrapper: {
    position: "relative", zIndex: 10, paddingLeft: "8%",
    display: "flex", flexDirection: "column", width: "100%",
  },
  pesHeader: { display: "flex", alignItems: "center", gap: "15px", marginBottom: "40px" },
  line: { width: "10px", height: "45px", backgroundColor: "#e3ff00" },
  titleText: { color: "#fff", fontSize: "2.2rem", fontWeight: "900", letterSpacing: "5px", fontStyle: "italic" },
  buttonStack: { display: "flex", flexDirection: "column", gap: "20px" },
  pesButtonPrimary: {
    background: "#e3ff00", color: "#000", border: "none", padding: "20px 45px",
    fontSize: "1.2rem", fontWeight: "900", cursor: "pointer",
    transform: "skew(-12deg)", transition: "0.2s", minWidth: "340px",
    boxShadow: "-8px 8px 0px #000",
  },
  pesButtonSecondary: {
    background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)",
    padding: "18px 45px", fontSize: "1.1rem", fontWeight: "700",
    textDecoration: "none", transform: "skew(-12deg)", transition: "0.2s", minWidth: "340px",
  },
  installedBadge: {
    background: "transparent", color: "#00ff88", border: "1px solid #00ff88",
    padding: "15px 45px", fontSize: "1rem", fontWeight: "900",
    transform: "skew(-12deg)", width: "fit-content", minWidth: "340px",
  },
  btnContent: { display: "flex", alignItems: "center", transform: "skew(12deg)" },
  icon: { marginRight: "15px", fontSize: "1.3rem" },
  pesFooter: { marginTop: "40px" },
  footerText: { color: "#fff", fontSize: "0.8rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "10px" },
  statusDot: { width: "8px", height: "8px", backgroundColor: "#00ff88", borderRadius: "50%", boxShadow: "0 0 10px #00ff88" },
  versionText: { color: "rgba(255,255,255,0.4)", fontSize: "0.7rem", marginTop: "5px" },
  modalClose: {
    marginTop: "20px", background: "#e3ff00", border: "none", padding: "12px 25px",
    fontWeight: "900", cursor: "pointer", width: "100%", letterSpacing: "1px"
  }
};

export default LandingPage;