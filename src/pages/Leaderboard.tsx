import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { supabase } from "../supabase";
// ADD THESE TWO LINES BACK IN:
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface LeaderboardRow {
  rank: number;
  username: string;
  tournaments_played: number;
  mp: number;
  w: number;
  d: number;
  l: number;
  goals: number;
  against: number;
  gd: number;
  points: number;
}

const LeaderboardDisplay: React.FC = () => {
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tournamentstats_view")
      .select("*")
      .order("rank", { ascending: true });

    if (error) {
      console.error("Error fetching leaderboard:", error);
      setErrorMsg("Failed to load leaderboard data.");
    } else {
      setRows(data || []);
    }
    setLoading(false);
  };

  const exportToPDF = () => {
    if (loading || rows.length === 0) return;

    const doc = new jsPDF();

    // Dark header background + title
    doc.setFillColor(33, 37, 41);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 40, "F");
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text("Masters Arena Leaderboard", 20, 25);

    // Date
    doc.setFontSize(11);
    doc.setTextColor(180, 180, 180);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 35);

    // Generate table
    autoTable(doc, {
      startY: 45,
      head: [["Rank", "Player", "T", "MP", "W", "D", "L", "GF", "GA", "GD", "Pts"]],
      body: rows.map((row) => [
        row.rank,
        row.username,
        row.tournaments_played,
        row.mp,
        row.w,
        row.d,
        row.l,
        row.goals,
        row.against,
        row.gd > 0 ? `+${row.gd}` : row.gd.toString(),
        row.points,
      ]),
      theme: "grid",
      styles: {
        fontSize: 9,
        cellPadding: 3,
        textColor: [220, 220, 220],
        lineColor: [80, 80, 80],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [33, 37, 41],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
      },
      columnStyles: {
        0: { cellWidth: 18, halign: "center", fontStyle: "bold" }, 
        1: { cellWidth: 50, halign: "left" }, 
        4: { textColor: [34, 197, 94] }, 
        5: { textColor: [156, 163, 175] }, 
        6: { textColor: [239, 68, 68] }, 
        9: { fontStyle: "bold" }, 
        10: { textColor: [234, 179, 8], fontStyle: "bold" }, 
      },
      alternateRowStyles: {
        fillColor: [45, 49, 54],
      },
      margin: { top: 45, left: 14, right: 14 },
      didParseCell: (data) => {
        if (data.column.index === 9 && data.cell.section === "body") {
          const val = parseFloat(data.cell.text[0] as string);
          if (!isNaN(val)) {
            if (val > 0) data.cell.styles.textColor = [34, 197, 94];
            if (val < 0) data.cell.styles.textColor = [239, 68, 68];
          }
        }
      },
    });

    // Page footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(
        `Page ${i} of ${pageCount} • Masters Arena`,
        doc.internal.pageSize.getWidth() / 2,
        290,
        { align: "center" }
      );
    }

    doc.save(`masters-arena-leaderboard_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-dark text-light">
      <Navbar />
      <div className="flex-grow-1 d-flex flex-column pt-4 pb-5" style={{ marginTop: "52px" }}>
        <div className="container flex-grow-1 d-flex flex-column">
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
            <h2 className="fw-bold text-white mb-0">Masters Arena</h2>
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
              <button type="button" className="btn-close" onClick={() => setErrorMsg(null)} />
            </div>
          )}

          <div className="flex-grow-1 bg-dark-subtle rounded-3 shadow-lg overflow-hidden border border-secondary">
            {loading ? (
              <div className="d-flex flex-column justify-content-center align-items-center h-100 text-muted">
                <div className="spinner-border text-primary mb-3" style={{ width: "3rem", height: "3rem" }} role="status" />
                <p className="fs-5">Loading leaderboard...</p>
              </div>
            ) : rows.length === 0 ? (
              <div className="d-flex justify-content-center align-items-center h-100 text-muted">
                <div className="alert alert-info fs-5 m-4 text-center">No standings available yet.</div>
              </div>
            ) : (
              <div className="h-100 overflow-auto">
                <table className="table table-dark table-hover table-striped align-middle mb-0">
                  <thead className="bg-dark border-bottom border-secondary">
                    <tr className="text-uppercase small fw-semibold">
                      <th scope="col" className="ps-4 text-center" style={{ width: "60px" }}>Rank</th>
                      <th scope="col" className="ps-3">Player</th>
                      <th scope="col" className="text-center">T</th>
                      <th scope="col" className="text-center">MP</th>
                      <th scope="col" className="text-center text-success">W</th>
                      <th scope="col" className="text-center text-secondary">D</th>
                      <th scope="col" className="text-center text-danger">L</th>
                      <th scope="col" className="text-center">GF</th>
                      <th scope="col" className="text-center">GA</th>
                      <th scope="col" className="text-center">GD</th>
                      <th scope="col" className="text-center pe-4">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.username} className="border-bottom border-secondary">
                        <td className="ps-4 text-center fw-bold fs-5">{row.rank}</td>
                        <td className="ps-3 fw-semibold text-info">{row.username}</td>
                        <td className="text-center">{row.tournaments_played}</td>
                        <td className="text-center">{row.mp}</td>
                        <td className="text-center text-success fw-medium">{row.w}</td>
                        <td className="text-center text-secondary">{row.d}</td>
                        <td className="text-center text-danger">{row.l}</td>
                        <td className="text-center">{row.goals}</td>
                        <td className="text-center">{row.against}</td>
                        <td className="text-center fw-medium">
                          <span className={row.gd > 0 ? "text-success" : row.gd < 0 ? "text-danger" : "text-muted"}>
                            {row.gd > 0 ? `+${row.gd}` : row.gd}
                          </span>
                        </td>
                        <td className="text-center pe-4 fw-bold text-warning">{row.points}</td>
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