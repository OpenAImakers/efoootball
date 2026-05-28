import React, { useEffect, useState } from "react";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const styles = {
    header: {
      width: "100%",
      position: "sticky" as const,
      top: 0,
      zIndex: 1000,
      background: "linear-gradient(135deg, #38b222, #ff9f1c)",
      color: "#111",
      padding: "14px 20px", 
      textAlign: "center" as const,
      fontFamily: "'Rajdhani', 'Orbitron', 'Segoe UI', Arial, sans-serif",
      boxSizing: "border-box" as const,
      overflow: "hidden",
      boxShadow: scrolled 
        ? "0 10px 30px rgba(0,0,0,0.15)" 
        : "0 0 0 rgba(0,0,0,0)",
      transition: "box-shadow 0.3s ease",
    },

    hudScanline: {
      position: "absolute" as const,
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "linear-gradient(rgba(255,255,255,0.07) 50%, rgba(0,0,0,0.05) 50%)",
      backgroundSize: "100% 4px",
      pointerEvents: "none" as const,
      zIndex: 1,
    },

    title: {
      fontSize: "15px",
      fontWeight: 800,
      letterSpacing: "3px",
      color: "#1a1a2e",
      opacity: 0.85,
      position: "relative" as const,
      zIndex: 3,
    },

    sub: {
      marginTop: "4px",
      fontSize: "16px",
      fontWeight: 900,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "12px",
      textTransform: "uppercase" as const,
      letterSpacing: "1.5px",
      position: "relative" as const,
      zIndex: 3,
    },

    /* The Secret Sauce: Hardware-accelerated CSS translation moves the brackets smoothly without disrupting text elements */
    iconLeft: {
      fontSize: "16px",
      opacity: 0.75,
      transform: scrolled ? "translateX(-25px)" : "translateX(0px)",
      transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
    },

    iconRight: {
      fontSize: "16px",
      opacity: 0.75,
      transform: scrolled ? "translateX(25px)" : "translateX(0px)",
      transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
    },

    ballIcon: {
      fontSize: "16px",
      opacity: 0.8,
    },

    mainText: {
      fontWeight: 900,
      color: "#1a1a2e",
    },

    bottomLeftText: {
      position: "absolute" as const,
      bottom: "14px",
      left: "20px",
      fontSize: "11px",
      fontWeight: 700,
      textTransform: "uppercase" as const,
      color: "#1a1a2e",
      letterSpacing: "1px",
      opacity: scrolled ? 0 : 0.6,
      transition: "opacity 0.25s ease", 
      pointerEvents: "none" as const, 
      zIndex: 3,
    },
  };

  return (
    <div style={styles.header}>
      <div style={styles.hudScanline} />

      <div style={styles.title}>
        FEDERATION INTERNATIONALE
      </div>

      <div style={styles.sub}>
        {/* Left Chevron slides left */}
        <i className="bi bi-chevron-left" style={styles.iconLeft}></i>
        <i className="bi bi-soccer-ball" style={styles.ballIcon}></i>
        
        <span style={styles.mainText}>
          EFOOTBALL
        </span>
        
        <i className="bi bi-soccer-ball" style={styles.ballIcon}></i>
        {/* Right Chevron slides right */}
        <i className="bi bi-chevron-right" style={styles.iconRight}></i>
      </div>

      <div style={styles.bottomLeftText}>
        Results & Competitions
      </div>
    </div>
  );
}