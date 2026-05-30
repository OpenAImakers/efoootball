"use client";

import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../../supabase";
import jsPDF from "jspdf";

export default function ClanPlayersProfile({
  selected,
  setSelected,
}: any) {
  const [clans, setClans] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Client-side cache
  const cache = useRef<{ [key: string]: any[] }>({});

  // LOAD CLANS
  useEffect(() => {
    const fetchClans = async () => {
      try {
        const { data, error } = await supabase
          .from("clans")
          .select("id, clan_name")
          .order("clan_name", { ascending: true });

        if (error) throw error;
        setClans(data || []);
      } catch (err) {
        console.error("Error loading clans:", err);
      }
    };

    fetchClans();
  }, []);

  // LOAD PLAYERS
  useEffect(() => {
    if (!selected) {
      setPlayers([]);
      return;
    }

    if (cache.current[selected]) {
      setPlayers(cache.current[selected]);
      setLoading(false);
      return;
    }

    const fetchPlayers = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("clan_players_profiles")
          .select("*")
          .eq("clan", selected)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const results = data || [];
        cache.current[selected] = results;
        setPlayers(results);
      } catch (err) {
        console.error("Error loading players:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, [selected]);

  // Auto-scroll selected clan into view
  useEffect(() => {
    if (selected && scrollRef.current) {
      const selectedButton = scrollRef.current.querySelector(`[data-clan="${selected}"]`);
      if (selectedButton) {
        selectedButton.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [selected]);

  // ====================== DOWNLOAD PDF ======================
  const downloadClanReport = () => {
    if (!selected || players.length === 0) {
      alert("Please select a clan that has players.");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // --- MAIN CLAN HEADER ---
    doc.setFillColor(3, 10, 26);
    doc.rect(0, 0, pageWidth, 45, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text(`${selected.toUpperCase()} CLAN ROSTER`, pageWidth / 2, 22, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 180, 180);
    doc.text(`kefR • Generated on: ${new Date().toLocaleDateString('en-GB')}`, pageWidth / 2, 33, { align: "center" });

    // --- TABLE STRUCTURE CONFIG ---
    let yPosition = 65;
    const startX = 15;
    const tableWidth = pageWidth - 30;
    
    // Column Widths (Must equal tableWidth)
    const colWidths = { name: 65, gender: 35, age: 30, country: 50 }; 

    // --- DRAW TABLE HEADER ---
    doc.setFillColor(40, 50, 75);
    doc.rect(startX, yPosition, tableWidth, 10, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    
    doc.text("Name", startX + 5, yPosition + 7);
    doc.text("Gender", startX + colWidths.name + 5, yPosition + 7);
    doc.text("Age", startX + colWidths.name + colWidths.gender + 5, yPosition + 7);
    doc.text("Country", startX + colWidths.name + colWidths.gender + colWidths.age + 5, yPosition + 7);

    yPosition += 10;

    // --- DRAW TABLE ROWS ---
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    players.forEach((player, index) => {
      // Check for page overflow
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 25; // Reset top margin on new page

        // Re-draw table header on the new page
        doc.setFillColor(40, 50, 75);
        doc.rect(startX, yPosition, tableWidth, 10, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.text("Name", startX + 5, yPosition + 7);
        doc.text("Gender", startX + colWidths.name + 5, yPosition + 7);
        doc.text("Age", startX + colWidths.name + colWidths.gender + 5, yPosition + 7);
        doc.text("Country", startX + colWidths.name + colWidths.gender + colWidths.age + 5, yPosition + 7);
        
        doc.setFont("helvetica", "normal");
        yPosition += 10;
      }

      // Alternating row background colors
      if (index % 2 === 0) {
        doc.setFillColor(245, 247, 250);
        doc.rect(startX, yPosition, tableWidth, 10, "F");
      }

      // Draw cell text borders/delimiters subtly
      doc.setDrawColor(230, 230, 230);
      doc.rect(startX, yPosition, tableWidth, 10, "S");

      doc.setTextColor(30, 30, 30);
      doc.text(player.name || "Unknown Player", startX + 5, yPosition + 7);
      doc.text(player.gender || "N/A", startX + colWidths.name + 5, yPosition + 7);
      doc.text(String(player.age || "N/A"), startX + colWidths.name + colWidths.gender + 5, yPosition + 7);
      doc.text(player.place || "Unknown", startX + colWidths.name + colWidths.gender + colWidths.age + 5, yPosition + 7);

      yPosition += 10;
    });

    // --- FOOTER ON EVERY PAGE ---
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Footer divider line
      doc.setDrawColor(210, 215, 225);
      doc.line(startX, pageHeight - 18, pageWidth - startX, pageHeight - 18);

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(120, 120, 130);
      
      // Left Side: Brand Logo
      doc.text("SKYLA®", startX, pageHeight - 10);
      
      // Right Side: Page indicator
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - startX, pageHeight - 10, { align: "right" });
    }

    doc.save(`${selected}_Clan_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const styles: any = {
    wrapper: {
      padding: "15px",
      fontFamily: "'Rajdhani', 'Orbitron', 'Segoe UI', Arial, sans-serif",
      color: "#111111",
    },
    title: {
      fontSize: "20px",
      fontWeight: 800,
      letterSpacing: "1.2px",
      textTransform: "uppercase",
      marginBottom: "10px",
    },
    // NEW: Horizontal scroll container
clanScrollContainer: {
  overflowX: "auto",
  whiteSpace: "nowrap",
  padding: "20px 0",
  marginBottom: "15px",
  display: "flex",
  alignItems: "center",
  scrollbarWidth: "none", // Firefox
  msOverflowStyle: "none", // IE/Edge
  WebkitOverflowScrolling: "touch",
  gap: "8px",
},
    // NEW: Individual clan button with size transition
    clanBtn: (active: boolean) => ({
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: active ? "14px 24px" : "10px 18px",
      borderRadius: "12px",
      border: active ? "3px solid transparent" : "2px solid transparent",
      cursor: "pointer",
      fontWeight: 800,
      letterSpacing: "1px",
      textTransform: "uppercase",
      fontSize: active ? "16px" : "13px",
      background: active 
        ? "linear-gradient(135deg, #38b222, #ff9f1c)" 
        : "linear-gradient(135deg, rgba(56,178,34,0.15), rgba(255,159,28,0.15))",
      color: active ? "#000" : "#444",
      opacity: active ? 1 : 0.7,
      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      transform: active ? "scale(1.15)" : "scale(0.9)",
      boxShadow: active 
        ? "0 8px 25px rgba(56,178,34,0.4)" 
        : "0 2px 8px rgba(0,0,0,0.1)",
      whiteSpace: "nowrap",
      flexShrink: 0,
      zIndex: active ? 2 : 1,
      position: "relative" as const,
    }),
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
      gap: "18px",
    },
    card: {
      background: "rgba(255,255,255,0.08)",
      border: "1px solid rgba(0,0,0,0.1)",
      borderRadius: "16px",
      overflow: "hidden",
      backdropFilter: "blur(10px)",
      transition: "0.2s ease",
      boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    },
    imageContainer: {
      width: "100%",
      padding: "20px 20px 10px 20px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "linear-gradient(135deg, #38b222, #ff9f1c)",
    },
    image: {
      width: "100%",
      maxWidth: "180px",
      height: "180px",
      objectFit: "contain",
      borderRadius: "12px",
      border: "3px solid rgba(255,255,255,0.1)",
      boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
      background: "#fff",
    },
    content: {
      padding: "12px 14px",
    },
    name: {
      fontSize: "18px",
      fontWeight: 900,
      letterSpacing: "1px",
      marginBottom: "10px",
      textTransform: "uppercase" as const,
    },
    row: {
      fontSize: "13px",
      marginBottom: "6px",
      opacity: 0.9,
    },
    label: {
      fontWeight: 800,
      marginRight: "5px",
    },
    genderBadge: {
      display: "inline-block",
      marginTop: "8px",
      padding: "6px 10px",
      borderRadius: "999px",
      background: "rgba(56,178,34,0.15)",
      color: "#1d7f11",
      fontSize: "11px",
      fontWeight: "800",
      letterSpacing: "1px",
      textTransform: "uppercase",
    },
    empty: {
      padding: "20px",
      textAlign: "center" as const,
      opacity: 0.7,
      fontWeight: "700",
    },
    skeletonImage: {
      width: "100%",
      maxWidth: "180px",
      height: "180px",
      borderRadius: "12px",
      background: "rgba(255, 255, 255, 0.2)",
      animation: "pulse 1.5s infinite ease-in-out",
    },
    skeletonText: {
      height: "16px",
      background: "rgba(0, 0, 0, 0.1)",
      borderRadius: "4px",
      marginBottom: "10px",
      animation: "pulse 1.5s infinite ease-in-out",
    },
  };

  return (
    <div style={styles.wrapper}>
 <style>{`
  @keyframes pulse {
    0% { opacity: 0.5; }
    50% { opacity: 1; }
    100% { opacity: 0.5; }
  }
  
  /* Hide scrollbar for Chrome, Safari and Opera */
  div::-webkit-scrollbar {
    display: none;
  }
  
  /* Hide scrollbar for IE, Edge and Firefox */
  * {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <h2 style={styles.title}>Clan Players</h2>

        {selected && players.length > 0 && (
          <button
            onClick={downloadClanReport}
            style={{
              padding: "10px 22px",
              background: "linear-gradient(135deg, #38b222, #ff9f1c)",
              color: "#000",
              border: "none",
              borderRadius: "10px",
              fontWeight: 800,
              cursor: "pointer",
              fontSize: "14px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            }}
          >
            Download {selected} (PDF)
          </button>
        )}
      </div>

      {/* NEW: Horizontal Scrollable Clan List with Center Focus */}
      <div 
        ref={scrollRef}
        style={styles.clanScrollContainer}
      >
        {clans.map((c, i) => {
          const active = selected === c.clan_name;
          return (
            <button
              key={i}
              data-clan={c.clan_name}
              onClick={() => setSelected(c.clan_name)}
              style={styles.clanBtn(active)}
            >
              {c.clan_name}
            </button>
          );
        })}
      </div>

      {/* Empty State */}
      {!loading && selected && players.length === 0 && (
        <div style={styles.empty}>
          Select your clan to view Players
        </div>
      )}

      {/* Player Cards Grid */}
      <div style={styles.grid}>
        {loading
          ? Array.from({ length: 3 }).map((_, idx) => (
              <div key={`skeleton-${idx}`} style={styles.card}>
                <div style={styles.imageContainer}>
                  <div style={styles.skeletonImage} />
                </div>
                <div style={styles.content}>
                  <div style={{ ...styles.skeletonText, width: "60%", height: "20px" }} />
                  <div style={{ ...styles.skeletonText, width: "80%" }} />
                  <div style={{ ...styles.skeletonText, width: "40%" }} />
                </div>
              </div>
            ))
          : players.map((p, i) => (
              <div key={i} style={styles.card}>
                <div style={styles.imageContainer}>
                  <img
                    src={p.player_avatar || "/profile.png"}
                    alt={p.name}
                    style={styles.image}
                    onError={(e) => {
                      e.currentTarget.src = "/profile.png";
                    }}
                  />
                </div>

                <div style={styles.content}>
                  <div style={styles.name}>{p.name}</div>

                  <div style={styles.row}>
                    <span style={styles.label}>Country:</span>
                    {p.place || "Unknown"}
                  </div>

                  <div style={styles.row}>
                    <span style={styles.label}>Age:</span>
                    {p.age || "N/A"}
                  </div>

                  {p.gender && (
                    <div style={styles.genderBadge}>
                      {p.gender}
                    </div>
                  )}
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}