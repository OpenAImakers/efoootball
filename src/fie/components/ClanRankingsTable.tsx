"use client";

import { supabase } from "../../supabase";
import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";

// Global cache outside component lifecycle to preserve state across remounts
const rankingsCache = {
  data: null as any[] | null,
  timestamp: 0,
};
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes cache expiration

export default function ClanRankingsTable() {
  const [clans, setClans] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchRankings = async () => {
      const now = Date.now();
      
      // Serve from cache if data exists and is fresh
      if (rankingsCache.data && (now - rankingsCache.timestamp < CACHE_DURATION)) {
        setClans(rankingsCache.data);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("clan_rankings")
          .select("*")
          .order("rank", { ascending: true });

        if (error) throw error;
        if (data) {
          // Update global cache
          rankingsCache.data = data;
          rankingsCache.timestamp = now;
          setClans(data);
        }
      } catch (error) {
        console.error("Error loading clan rankings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, []);

  // Clean strings from corrupt characters/unsupported symbols
  const cleanText = (text: string): string => {
    if (!text) return "N/A";
    return text.replace(/[^\x20-\x7E]/g, ""); 
  };

  // ====================== DOWNLOAD PDF LEADERBOARD ======================
  const downloadClanRankingsPDF = () => {
    if (clans.length === 0) {
      alert("Rankings data is empty or loading.");
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
    doc.text("CLAN RANKINGS", pageWidth / 2, 22, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 180, 180);
    doc.text(`Official Standings • Generated on: ${new Date().toLocaleDateString('en-GB')}`, pageWidth / 2, 33, { align: "center" });

    // --- TABLE STRUCT CONFIG ---
    let yPosition = 60;
    const startX = 12;
    const tableWidth = pageWidth - 24;
    
    // Explicit static coordinate tracking to prevent text wrapping row collisions
    const colX = {
      rank: startX + 2,
      clan: startX + 18,
      mp: startX + 115,
      w: startX + 127,
      d: startX + 139,
      l: startX + 151,
      pts: startX + 163,
      gd: startX + 177
    };

    const allowedClanWidth = 92; // Dynamic maximum threshold boundary width for multi-line clans

    // --- DRAW TABLE HEADER ---
    doc.setFillColor(40, 50, 75);
    doc.rect(startX, yPosition, tableWidth, 10, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");

    doc.text("Rank", colX.rank, yPosition + 7);
    doc.text("Clan", colX.clan, yPosition + 7);
    doc.text("MP", colX.mp, yPosition + 7);
    doc.text("W", colX.w, yPosition + 7);
    doc.text("D", colX.d, yPosition + 7);
    doc.text("L", colX.l, yPosition + 7);
    doc.text("Points", colX.pts, yPosition + 7);
    doc.text("GD", colX.gd, yPosition + 7);

    yPosition += 10;

    // --- DRAW TABLE ROWS ---
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    clans.forEach((c, index) => {
      // Split text explicitly into up to two lines if name is long
      const splitClanName = doc.splitTextToSize(cleanText(c.name), allowedClanWidth);
      
      const maxLines = splitClanName.length;
      const rowHeight = maxLines > 1 ? 14 : 9;
      const textOffset = maxLines > 1 ? 5.5 : 6;

      // Handle Multi-page Overflow
      if (yPosition + rowHeight > pageHeight - 25) {
        doc.addPage();
        yPosition = 20;

        // Re-draw Header on new page context
        doc.setFillColor(40, 50, 75);
        doc.rect(startX, yPosition, tableWidth, 10, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        
        doc.text("Rank", colX.rank, yPosition + 7);
        doc.text("Clan", colX.clan, yPosition + 7);
        doc.text("MP", colX.mp, yPosition + 7);
        doc.text("W", colX.w, yPosition + 7);
        doc.text("D", colX.d, yPosition + 7);
        doc.text("L", colX.l, yPosition + 7);
        doc.text("Points", colX.pts, yPosition + 7);
        doc.text("GD", colX.gd, yPosition + 7);
        
        doc.setFont("helvetica", "normal");
        yPosition += 10;
      }

      // Zebra striping backgrounds
      if (index % 2 === 0) {
        doc.setFillColor(246, 248, 252);
        doc.rect(startX, yPosition, tableWidth, rowHeight, "F");
      }

      // Border Matrix
      doc.setDrawColor(235, 235, 240);
      doc.rect(startX, yPosition, tableWidth, rowHeight, "S");

      doc.setTextColor(40, 40, 45);
      
      // Inject details cleanly on target layout tracks
      doc.text(`#${c.rank}`, colX.rank, yPosition + textOffset);
      doc.text(splitClanName, colX.clan, yPosition + textOffset);
      doc.text(String(c.mp ?? 0), colX.mp, yPosition + textOffset);
      doc.text(String(c.w ?? 0), colX.w, yPosition + textOffset);
      doc.text(String(c.d ?? 0), colX.d, yPosition + textOffset);
      doc.text(String(c.l ?? 0), colX.l, yPosition + textOffset);
      doc.text(String(c.points ?? 0), colX.pts, yPosition + textOffset);
      
      const displayGD = c.gd > 0 ? `+${c.gd}` : String(c.gd ?? 0);
      doc.text(displayGD, colX.gd, yPosition + textOffset);

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

    doc.save(`Clan_Rankings_${new Date().toISOString().split("T")[0]}.pdf`);
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
      fontWeight: 800,
      letterSpacing: "1.2px",
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
      fontSize: "14px",
      fontFamily: "'Rajdhani', 'Orbitron', 'Segoe UI', Arial, sans-serif",
    },
    th: {
      padding: "10px",
      textAlign: "left" as const,
      fontWeight: 800,
      letterSpacing: "1.5px",
      textTransform: "uppercase" as const,
      fontSize: "12px",
    },
    td: {
      padding: "12px 10px",
      fontWeight: 500,
      letterSpacing: "0.5px",
    },
    skeletonBar: {
      height: "14px",
      background: "rgba(0, 0, 0, 0.08)",
      borderRadius: "4px",
      animation: "pulse-row 1.5s infinite ease-in-out",
      display: "inline-block",
    },
  };

  return (
    <div style={styles.card}>
      <style>{`
        @keyframes pulse-row {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>
      
      {/* Top Header Grid with Right-Aligned Print Downloader Action */}
     <div style={styles.headerRow}>
  <h2 style={styles.title}>Clan Rankings</h2>
  {!loading && clans.length > 0 && (
    <button onClick={downloadClanRankingsPDF} style={styles.downloadBtn}>
      <i className="bi bi-download"></i>
    </button>
  )}
</div>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Rank</th>
            <th style={styles.th}>Clan</th>
            <th style={styles.th}>MP</th>
            <th style={styles.th}>W</th>
            <th style={styles.th}>D</th>
            <th style={styles.th}>L</th>
            <th style={styles.th}>Points</th>
            <th style={styles.th}>GD</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <tr key={`skeleton-row-${idx}`} style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                <td style={styles.td}><div style={{ ...styles.skeletonBar, width: "25px" }} /></td>
                <td style={styles.td}><div style={{ ...styles.skeletonBar, width: "120px" }} /></td>
                <td style={styles.td}><div style={{ ...styles.skeletonBar, width: "20px" }} /></td>
                <td style={styles.td}><div style={{ ...styles.skeletonBar, width: "20px" }} /></td>
                <td style={styles.td}><div style={{ ...styles.skeletonBar, width: "20px" }} /></td>
                <td style={styles.td}><div style={{ ...styles.skeletonBar, width: "20px" }} /></td>
                <td style={styles.td}><div style={{ ...styles.skeletonBar, width: "30px" }} /></td>
                <td style={styles.td}><div style={{ ...styles.skeletonBar, width: "25px" }} /></td>
              </tr>
            ))
          ) : clans.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ ...styles.td, textAlign: "center" }}>
                No clans registered yet.
              </td>
            </tr>
          ) : (
            clans.map((c: any, i: number) => (
              <tr key={c.id || i} style={{ borderBottom: "1px solid rgba(0,0,0,0.03)" }}>
                <td style={{ ...styles.td, fontWeight: 700 }}>
                  #{c.rank}
                </td>
                <td style={{ ...styles.td, fontWeight: 600 }}>
                  {c.name}
                </td>
                <td style={styles.td}>{c.mp}</td>
                <td style={styles.td}>{c.w}</td>
                <td style={styles.td}>{c.d}</td>
                <td style={styles.td}>{c.l}</td>
                <td style={styles.td}>{c.points}</td>
                <td style={styles.td}>
                  {c.gd > 0 ? `+${c.gd}` : c.gd}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}