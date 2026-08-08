import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface UpgradeToAdminProps {
  role?: string | null;
}

const UpgradeToAdmin: React.FC<UpgradeToAdminProps> = () => {
  const navigate = useNavigate();
  const [isDesktop, setIsDesktop] = useState<boolean>(false);

  // Track screen size to adjust layouts smoothly across devices
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const cards = [
    {
      title: "Create Tournament",
      description: "Launch a new tournament and set up brackets, prizes, and rules.",
      icon: "bi-trophy",
      path: "/create-tournament",
      accentColor: "#2563eb",
    },
    {
      title: "Create Clan",
      description: "Register a new clan and manage members.",
      icon: "bi-people",
      path: "/registerclans",
      accentColor: "#2563eb",
    },
    {
      title: "Create Tournament Registration",
      description: "Open registration forms for players to join tournaments.",
      icon: "bi-clipboard-plus",
      path: "/registrations",
      accentColor: "#2563eb",
    },
    {
      title: "Manage Clans",
      description: "View, edit, and moderate all registered clans.",
      icon: "bi-shield",
      path: "/clans",
      accentColor: "#2563eb",
    },
    {
      title: "View Registrations",
      description: "See all player registrations across tournaments.",
      icon: "bi-list-check",
      path: "/registrations-admin",
      accentColor: "#2563eb",
    },
    {
      title: "Tournament Management",
      description: "Control ongoing and past tournaments.",
      icon: "bi-gear",
      path: "/tournament-list",
      accentColor: "#2563eb",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        backgroundColor: "#ffffff",
        // Increased top padding (100px mobile, 120px desktop) to clear fixed header
        padding: isDesktop ? "120px 24px 80px" : "100px 16px 80px",
        boxSizing: "border-box",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* Header */}
      <div className="text-center mb-5">
        <h1
          style={{
            fontSize: isDesktop ? "2.25rem" : "1.75rem",
            fontWeight: 700,
            color: "#1e3a8a",
            marginBottom: "8px",
            letterSpacing: "-0.025em",
          }}
        >
          Admin Control Panel
        </h1>
        <p style={{ color: "#3b82f6", fontSize: "1rem", margin: "0 auto" }}>
          Manage tournaments, clans, and registrations
        </p>
      </div>

      {/* Responsive Container (Grid on PC, Stack on Mobile) */}
      <div
        style={{
          maxWidth: "1024px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: isDesktop ? "repeat(2, 1fr)" : "1fr",
          gap: isDesktop ? "16px" : "12px",
        }}
      >
        {cards.map((card) => (
          <div
            key={card.path}
            onClick={() => navigate(card.path)}
            style={{
              backgroundColor: "#f8fafc",
              borderRadius: "12px",
              padding: isDesktop ? "20px 24px" : "16px 20px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              cursor: "pointer",
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#3b82f6";
              e.currentTarget.style.backgroundColor = "#eff6ff";
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(37, 99, 235, 0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e2e8f0";
              e.currentTarget.style.backgroundColor = "#f8fafc";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.04)";
            }}
          >
            {/* Icon Wrapper */}
            <div
              style={{
                width: isDesktop ? "48px" : "40px",
                height: isDesktop ? "48px" : "40px",
                borderRadius: "10px",
                backgroundColor: "#dbeafe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <i
                className={`bi ${card.icon}`}
                style={{
                  color: card.accentColor,
                  fontSize: isDesktop ? "1.25rem" : "1.1rem",
                }}
              ></i>
            </div>

            {/* Text Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: isDesktop ? "1.05rem" : "0.95rem",
                  color: "#1e3a8a",
                  marginBottom: "4px",
                }}
              >
                {card.title}
              </div>
              <div
                style={{
                  fontSize: isDesktop ? "0.875rem" : "0.825rem",
                  color: "#475569",
                  lineHeight: 1.4,
                }}
              >
                {card.description}
              </div>
            </div>

            {/* Navigation Chevron */}
            <i
              className="bi bi-chevron-right"
              style={{ color: "#3b82f6", fontSize: "0.9rem", flexShrink: 0 }}
            ></i>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpgradeToAdmin;