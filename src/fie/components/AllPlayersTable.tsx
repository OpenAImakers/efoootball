"use client";

import { supabase } from "../../supabase";
import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";

// Global cache object to hold state outside of lifecycle mounts
const leaderboardCache = {
  data: null as any[] | null,
  timestamp: 0,
};
const CACHE_EXPIRY = 1000 * 60 * 3; // 3 minutes cache lifespan

const LOADING_PHRASES = [
  "CONNECTING TO LEAGUE SERVERS...",
  "SYNCING PLAYER STATS...",
  "CALIBRATING MMR RANKINGS...",
  "COMPILING TOURNAMENT LEADERBOARD...",
];

export default function AllPlayersTable() {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [phraseIdx, setPhraseIdx] = useState<number>(0);

  // Cycle through tactical loading status strings
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setPhraseIdx((prev) => (prev + 1) % LOADING_PHRASES.length);
    }, 800);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const now = Date.now();

      // Serve directly from runtime memory cache if fresh
      if (leaderboardCache.data && (now - leaderboardCache.timestamp < CACHE_EXPIRY)) {
        setPlayers(leaderboardCache.data);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("all_players_leaderboard")
          .select("*")
          .order("rank", { ascending: true });

        if (error) throw error;
        if (data) {
          leaderboardCache.data = data;
          leaderboardCache.timestamp = now;
          setPlayers(data);
        }
      } catch (error) {
        console.error("Error fetching player leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  // Clean strings from corrupt emoji/broken bytes
  const cleanText = (text: string): string => {
    if (!text) return "N/A";
    return text.replace(/[^\x20-\x7E]/g, ""); 
  };

  // ====================== DOWNLOAD PDF LEADERBOARD ======================
  const downloadLeaderboardPDF = () => {
    if (players.length === 0) {
      alert("Leaderboard data is currently empty or loading.");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // --- MAIN HEADER ---
    doc.setFillColor(3, 10, 26);
    doc.rect(0, 0, pageWidth, 45, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("ALL PLAYERS LEADERBOARD", pageWidth / 2, 22, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 180, 180);
    doc.text(`Official Standings • Generated on: ${new Date().toLocaleDateString('en-GB')}`, pageWidth / 2, 33, { align: "center" });

    // --- TABLE STRUCT CONFIG ---
    let yPosition = 60;
    const startX = 12;
    const tableWidth = pageWidth - 24;
    
    // Exact locked column coordinates
    const colX = {
      rank: startX + 2,
      player: startX + 16,
      gender: startX + 66,
      clan: startX + 88,
      mp: startX + 140,
      w: startX + 150,
      l: startX + 160,
      d: startX + 170,
      pts: startX + 179
    };

    // Width thresholds allowed for text columns before wrapping
    const colWidths = {
      player: 46,
      gender: 20,
      clan: 48
    };

    // --- DRAW TABLE HEADER ---
    doc.setFillColor(40, 50, 75);
    doc.rect(startX, yPosition, tableWidth, 10, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");

    doc.text("Rank", colX.rank, yPosition + 7);
    doc.text("Player", colX.player, yPosition + 7);
    doc.text("Gender", colX.gender, yPosition + 7);
    doc.text("Clan", colX.clan, yPosition + 7);
    doc.text("MP", colX.mp, yPosition + 7);
    doc.text("W", colX.w, yPosition + 7);
    doc.text("L", colX.l, yPosition + 7);
    doc.text("D", colX.d, yPosition + 7);
    doc.text("Pts", colX.pts, yPosition + 7);

    yPosition += 10;

    // --- DRAW TABLE ROWS ---
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    players.forEach((p, index) => {
      doc.setFontSize(9);
      
      // Split names/clans dynamically based on their bounding box constraints
      const splitName = doc.splitTextToSize(cleanText(p.name), colWidths.player);
      const splitClan = doc.splitTextToSize(cleanText(p.clan || "Independent"), colWidths.clan);
      const splitGender = doc.splitTextToSize(cleanText(p.gender), colWidths.gender);

      // Determine required row height based on max wrapped lines (standard is 9, multiline scales to 13)
      const maxLines = Math.max(splitName.length, splitClan.length, splitGender.length);
      const rowHeight = maxLines > 1 ? 14 : 9;
      const textOffset = maxLines > 1 ? 5.5 : 6; // Center layout visually

      // Handle Multi-page Overflow dynamically
      if (yPosition + rowHeight > pageHeight - 25) {
        doc.addPage();
        yPosition = 20;

        // Re-draw Header on new page context
        doc.setFillColor(40, 50, 75);
        doc.rect(startX, yPosition, tableWidth, 10, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        
        doc.text("Rank", colX.rank, yPosition + 7);
        doc.text("Player", colX.player, yPosition + 7);
        doc.text("Gender", colX.gender, yPosition + 7);
        doc.text("Clan", colX.clan, yPosition + 7);
        doc.text("MP", colX.mp, yPosition + 7);
        doc.text("W", colX.w, yPosition + 7);
        doc.text("L", colX.l, yPosition + 7);
        doc.text("D", colX.d, yPosition + 7);
        doc.text("Pts", colX.pts, yPosition + 7);
        
        doc.setFont("helvetica", "normal");
        yPosition += 10;
      }

      // Zebra striping backgrounds
      if (index % 2 === 0) {
        doc.setFillColor(246, 248, 252);
        doc.rect(startX, yPosition, tableWidth, rowHeight, "F");
      }

      // Subtle row border matrix
      doc.setDrawColor(235, 235, 240);
      doc.rect(startX, yPosition, tableWidth, rowHeight, "S");

      doc.setTextColor(40, 40, 45);
      
      // Inject details safely locked into columns
      doc.text(`#${p.rank}`, colX.rank, yPosition + textOffset);
      doc.text(splitName, colX.player, yPosition + textOffset);
      doc.text(splitGender, colX.gender, yPosition + textOffset);
      doc.text(splitClan, colX.clan, yPosition + textOffset);
      
      // Numeric targets locked safely to metrics coordinates 
      doc.text(String(p.mp ?? 0), colX.mp, yPosition + textOffset);
      doc.text(String(p.w ?? 0), colX.w, yPosition + textOffset);
      doc.text(String(p.l ?? 0), colX.l, yPosition + textOffset);
      doc.text(String(p.d ?? 0), colX.d, yPosition + textOffset);
      doc.text(String(p.points ?? 0), colX.pts, yPosition + textOffset);

      yPosition += rowHeight;
    });

    // --- BRANDED FOOTER SYSTEM ---
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(210, 215, 225);
      doc.line(startX, pageHeight - 16, pageWidth - startX, pageHeight - 16);

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(110, 110, 120);
      
      // Brand Anchor Pinned Left
      doc.text("SKYLA", startX, pageHeight - 9);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - startX, pageHeight - 9, { align: "right" });
    }

    doc.save(`AllPlayers_Standings_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const styles = {
    card: {
      background: "transparent",
      border: "none",
      padding: "15px",
      marginBottom: "20px",
      fontFamily: "'Rajdhani', 'Orbitron', 'Segoe UI', Arial, sans-serif",
      color: "#111",
    },
    headerRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "15px",
    },
    title: {
      fontSize: "20px",
      fontWeight: 700,
      letterSpacing: "1px",
      textTransform: "uppercase" as const,
      margin: 0,
    },
    downloadBtn: {
      padding: "10px 20px",
      background: "linear-gradient(135deg, #38b222, #ff9f1c)",
      color: "#000",
      border: "none",
      borderRadius: "10px",
      fontWeight: 800,
      cursor: "pointer",
      fontSize: "13px",
      textTransform: "uppercase" as const,
      letterSpacing: "0.5px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      display: "flex",
      alignItems: "center",
      gap: "6px",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse" as const,
      marginTop: "10px",
      fontFamily: "'Rajdhani', 'Orbitron', 'Segoe UI', Arial, sans-serif",
      fontSize: "14px",
    },
    th: {
      padding: "10px",
      textAlign: "left" as const,
      fontWeight: 700,
      letterSpacing: "1.5px",
      textTransform: "uppercase" as const,
      fontSize: "12px",
    },
    td: {
      padding: "12px 10px",
      fontWeight: 500,
      letterSpacing: "0.5px",
    },
    loaderWrapper: {
      padding: "30px 10px",
      textAlign: "center" as const,
    },
    loaderText: {
      fontSize: "12px",
      fontWeight: 700,
      letterSpacing: "1.5px",
      color: "#38b222",
      marginBottom: "8px",
    },
    progressBarTrack: {
      width: "100%",
      maxWidth: "300px",
      height: "6px",
      background: "rgba(0,0,0,0.08)",
      borderRadius: "10px",
      margin: "0 auto",
      overflow: "hidden",
      position: "relative" as const,
    },
    progressBarFill: {
      position: "absolute" as const,
      top: 0,
      left: 0,
      height: "100%",
      width: "40%",
      background: "linear-gradient(90deg, #38b222, #ff9f1c)",
      borderRadius: "10px",
      animation: "matchmaking-slide 1.2s infinite ease-in-out",
    },
  };

  return (
    <div style={styles.card}>
      <style>{`
        @keyframes matchmaking-slide {
          0% { left: -40%; width: 30%; }
          50% { width: 40%; }
          100% { left: 100%; width: 20%; }
        }
      `}</style>

      <div style={styles.headerRow}>
        <h2 style={styles.title}>All Players</h2>
        {!loading && players.length > 0 && (
          <button onClick={downloadLeaderboardPDF} style={styles.downloadBtn}>
            Download Standings (PDF)
          </button>
        )}
      </div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Rank</th>
            <th style={styles.th}>Player</th>
            <th style={styles.th}>Gender</th>
            <th style={styles.th}>Clan</th>
            <th style={styles.th}>MP</th>
            <th style={styles.th}>W</th>
            <th style={styles.th}>L</th>
            <th style={styles.th}>D</th>
            <th style={styles.th}>Points</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td colSpan={9}>
                <div style={styles.loaderWrapper}>
                  <div style={styles.loaderText}>
                    {LOADING_PHRASES[phraseIdx]}
                  </div>
                  <div style={styles.progressBarTrack}>
                    <div style={styles.progressBarFill} />
                  </div>
                </div>
              </td>
            </tr>
          ) : players.length === 0 ? (
            <tr>
              <td colSpan={9} style={{ ...styles.td, textAlign: "center" }}>
                No players registered yet.
              </td>
            </tr>
          ) : (
            players.map((p: any, i: number) => (
              <tr key={p.id || i} style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                <td style={styles.td}>#{p.rank}</td>
                <td style={styles.td}>{p.name}</td>
                <td style={styles.td}>{p.gender}</td>
                <td style={styles.td}>{p.clan}</td>
                <td style={styles.td}>{p.mp}</td>
                <td style={styles.td}>{p.w}</td>
                <td style={styles.td}>{p.l}</td>
                <td style={styles.td}>{p.d}</td>
                <td style={styles.td}>{p.points}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}