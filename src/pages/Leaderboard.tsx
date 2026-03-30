import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Advert from "../components/Advert";
import { supabase } from "../supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface LeaderboardRow {
  rank: number;
  username: string;
  display_name: string; // Using this for the Player column
  tournaments_played: any;
  mp: any;
  w: any;
  d: any;
  l: any;
  goals: any;
  against: any;
  gd: any;
  points: any;
}

const LeaderboardDisplay: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    // Fetching directly from profiles table
    const { data, error } = await supabase
      .from("profiles")
      .select("username, display_name")
      .order("display_name", { ascending: true });

    if (error) {
      console.error("Error fetching leaderboard:", error);
      setErrorMsg("Failed to load leaderboard data.");
    } else {
      // Maintaining your structure with static data for maintenance
      const mappedRows = (data || []).map((profile, index) => ({
        rank: index + 1,
        username: profile.username,
        display_name: profile.display_name || profile.username,
        tournaments_played: "--",
        mp: 0,
        w: 0,
        d: 0,
        l: 0,
        goals: 0,
        against: 0,
        gd: 0,
        points: 0,
      }));
      setRows(mappedRows);
    }
    setLoading(false);
  };

  const exportToPDF = () => {
    if (loading || rows.length === 0) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // 1. BRANDED HEADER
    doc.setFillColor(10, 26, 94);
    doc.rect(0, 0, pageWidth, 40, "F");

    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("KENYA EFOOTBALL RANKINGS", 14, 22);

    doc.setDrawColor(0, 181, 204);
    doc.setLineWidth(1);
    doc.line(14, 28, 80, 28);

    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text(`Updated: ${new Date().toLocaleDateString()} (Maintenance Mode)`, 14, 35);

    autoTable(doc, {
      startY: 45,
      head: [["Rank", "Player", "T", "MP", "W", "D", "L", "GF", "GA", "GD", "%"]],
      body: rows.map((row, index) => [
        index + 1,
        row.display_name,
        row.tournaments_played,
        row.mp,
        row.w,
        row.d,
        row.l,
        row.goals,
        row.against,
        "0",
        row.points,
      ]),
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 3,
        textColor: [40, 40, 40],
        lineColor: [0, 181, 204],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [10, 26, 94],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: {
        0: { cellWidth: 12, halign: "center", fontStyle: "bold" },
        1: { fontStyle: "bold", textColor: [10, 26, 94] },
        4: { textColor: [0, 150, 0], fontStyle: "bold" },
        10: { textColor: [245, 130, 32], fontStyle: "bold" },
      },
      alternateRowStyles: {
        fillColor: [245, 250, 255],
      },
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.2);
      doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);

      doc.setFontSize(10);
      doc.setTextColor(10, 26, 94);
      doc.setFont("helvetica", "bold");
      doc.text("Skyla", 14, pageHeight - 10);

      const skylaWidth = doc.getTextWidth("Skyla");
      doc.setFontSize(6);
      doc.text("®", 14 + skylaWidth + 0.5, pageHeight - 12);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text("|    smart ecosystem", 14 + skylaWidth + 4, pageHeight - 10);

      doc.setFontSize(8);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth - 14,
        pageHeight - 10,
        { align: "right" }
      );
    }

    doc.save(`Masters_Leaderboard_Maint_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-dark text-light">
      <Advert />
      <div className="flex-grow-1 d-flex flex-column pt-4 pb-5" style={{ marginTop: "52px" }}>
        <div className="container flex-grow-1 d-flex flex-column">
          
          {/* MAINTENANCE ALERT - Using standard bootstrap alert for zero UI impact */}
          <div className="alert alert-warning border-0 shadow-sm mb-4" role="alert">
            <strong>Maintenance:</strong> Live stats are temporarily hidden while we update player records. Showing Profile Display Names.
          </div>

          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
            <h2
              className="fw-bold mb-0 text-uppercase tracking-tighter"
              style={{
                fontSize: "2rem",
                background: "linear-gradient(to right, #000000 20%, #BB0000 40%, #BB0000 60%, #006600 80%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0px 2px 2px rgba(255,255,255,0.1))",
                letterSpacing: "1px",
              }}
            >
              Kenya eFootball Rankings
            </h2>
            <div className="d-flex gap-2">
              <button
                className="btn btn-outline-light btn-sm px-3"
                onClick={fetchLeaderboard}
                disabled={loading}
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>
              <button
                className="btn btn-outline-success btn-sm px-3"
                onClick={exportToPDF}
                disabled={loading || rows.length === 0}
              >
                Download PDF
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              {errorMsg}
              <button
                type="button"
                className="btn-close"
                onClick={() => setErrorMsg(null)}
              />
            </div>
          )}

          <div className="flex-grow-1 bg-dark-subtle rounded-3 shadow-lg overflow-hidden border border-secondary">
            {loading ? (
              <div className="d-flex flex-column justify-content-center align-items-center h-100 text-muted">
                <div
                  className="spinner-border text-primary mb-3"
                  style={{ width: "3rem", height: "3rem" }}
                  role="status"
                />
                <p className="fs-5">Loading leaderboard...</p>
              </div>
            ) : rows.length === 0 ? (
              <div className="d-flex justify-content-center align-items-center h-100 text-muted">
                <div className="alert alert-info fs-5 m-4 text-center">
                  No standings available yet.
                </div>
              </div>
            ) : (
              <div className="h-100 overflow-auto">
                <table className="table table-dark table-hover table-striped align-middle mb-0">
                  <thead className="bg-dark border-bottom border-secondary">
                    <tr className="text-uppercase small fw-semibold">
                      <th scope="col" className="ps-4 text-center" style={{ width: "60px" }}>
                        Rank
                      </th>
                      <th scope="col" className="ps-3">Player</th>
                      <th scope="col" className="text-center">T</th>
                      <th scope="col" className="text-center">MP</th>
                      <th scope="col" className="text-center text-success">W</th>
                      <th scope="col" className="text-center text-secondary">D</th>
                      <th scope="col" className="text-center text-danger">L</th>
                      <th scope="col" className="text-center">GF</th>
                      <th scope="col" className="text-center">GA</th>
                      <th scope="col" className="text-center">GD</th>
                      <th scope="col" className="text-center pe-4">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr
                        key={row.username}
                        className="border-bottom border-secondary"
                        onClick={() => navigate(`/team/${row.username}/matches`)}
                        style={{
                          cursor: "pointer",
                          height: "54px",
                        }}
                      >
                        <td className="ps-4 text-center fw-bold fs-5">{index + 1}</td>
                        <td className="ps-3 fw-semibold text-info d-flex align-items-center gap-2">
                          <i
                            className="bi bi-bar-chart-line-fill text-secondary opacity-75"
                            style={{ fontSize: "1.1rem" }}
                            title="Click to view team stats & match history"
                          ></i>
                          <span>{row.display_name}</span>
                        </td>
                        <td className="text-center opacity-50">{row.tournaments_played}</td>
                        <td className="text-center opacity-50">{row.mp}</td>
                        <td className="text-center text-success fw-medium opacity-50">{row.w}</td>
                        <td className="text-center text-secondary opacity-50">{row.d}</td>
                        <td className="text-center text-danger opacity-50">{row.l}</td>
                        <td className="text-center opacity-50">{row.goals}</td>
                        <td className="text-center opacity-50">{row.against}</td>
                        <td className="text-center fw-medium opacity-50">0</td>
                        <td className="text-center pe-4 fw-bold text-warning opacity-50">{row.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardDisplay;