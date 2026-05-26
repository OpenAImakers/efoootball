import React, { useEffect, useState } from "react";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
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
      transition: "all 0.3s ease",
      boxShadow: scrolled
        ? "0 4px 15px rgba(0,0,0,0.25)"
        : "none",
      padding: scrolled ? "8px 15px" : "18px 20px",
      textAlign: "center" as const,
      fontFamily: "'Rajdhani', 'Orbitron', 'Segoe UI', Arial, sans-serif",
      boxSizing: "border-box" as const,
    },

    title: {
      fontSize: scrolled ? "14px" : "18px",
      fontWeight: 800,
      letterSpacing: "2px",
      transition: "all 0.3s ease",
      color: "#1a1a2e",
    },

    sub: {
      marginTop: scrolled ? "0px" : "6px",
      fontSize: scrolled ? "13px" : "18px",
      fontWeight: 800,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: scrolled ? "12px" : "20px",
      opacity: scrolled ? 0.9 : 1,
      transition: "all 0.3s ease",
      textTransform: "uppercase" as const,
      letterSpacing: "1px",
    },

    iconLeft: {
      fontSize: scrolled ? "14px" : "20px",
      transition: "all 0.3s ease",
    },

    iconRight: {
      fontSize: scrolled ? "14px" : "20px",
      transition: "all 0.3s ease",
    },

    mainText: {
      fontWeight: 800,
      color: "#1a1a2e",
    },

    bottomLeftText: {
      position: "absolute" as const,
      bottom: scrolled ? "8px" : "12px",
      left: scrolled ? "15px" : "20px",
      fontSize: scrolled ? "11px" : "13px",
      fontWeight: 800,
      textTransform: "uppercase" as const,
      color: "#1a1a2e",
      letterSpacing: "1px",
      transition: "all 0.3s ease",
      pointerEvents: "none" as const, 
    },
  };

  return (
    <div style={styles.header}>
      <div style={styles.title}>
        FEDERATION INTERNATIONALE
      </div>

      <div style={styles.sub}>
        <i className="bi bi-arrow-left" style={styles.iconLeft}></i>
        <i className="bi bi-soccer-ball" style={styles.iconLeft}></i>
        
        <span style={styles.mainText}>
          EFOOTBALL
        </span>
        
        <i className="bi bi-soccer-ball" style={styles.iconRight}></i>
        <i className="bi bi-arrow-right" style={styles.iconRight}></i>
      </div>

      <div style={styles.bottomLeftText}>
        Results & Competitions
      </div>
    </div>
  );
}