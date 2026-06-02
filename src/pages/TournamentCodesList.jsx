import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";

function TournamentCodesList({ tournamentId, tournamentName }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tournamentId) {
      setTeams([]);
      return;
    }

    async function fetchCodesOnly() {
      setLoading(true);
      const { data, error } = await supabase
        .from("teams")
        .select("name, team_code")
        .eq("tournament_id", tournamentId)
        .order("name");

      if (!error && data) {
        setTeams(data);
      }
      setLoading(false);
    }

    fetchCodesOnly();
  }, [tournamentId]);

const generatePDF = async () => {
  if (teams.length === 0) return;

  let jsPDF;
  try {
    const module = await import("jspdf");
    jsPDF = module.jsPDF || module.default;
  } catch {
    if (window.jspdf?.jsPDF) {
      jsPDF = window.jspdf.jsPDF;
    } else {
      alert("jsPDF library not loaded. Please install it with 'npm install jspdf'");
      return;
    }
  }

  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  let yOffset = 20;

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 32, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(20);
  doc.text("TOURNAMENT TEAM CODES", pageWidth / 2, 16, {
    align: "center",
  });

  doc.setFontSize(10);
  doc.text("Official Player Claim Sheet", pageWidth / 2, 24, {
    align: "center",
  });

  yOffset = 45;

  // Tournament Details
  doc.setTextColor(0, 0, 0);

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(14);
  doc.text(
    tournamentName || "Tournament Session",
    pageWidth / 2,
    yOffset,
    { align: "center" }
  );

  yOffset += 8;

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    `Total Teams: ${teams.length}`,
    pageWidth / 2,
    yOffset,
    { align: "center" }
  );

  yOffset += 12;

  // Instructions
  doc.setTextColor(200, 0, 0);
  doc.setFontSize(9);
  doc.text(
    "Each code should only be shared with the corresponding player.",
    pageWidth / 2,
    yOffset,
    { align: "center" }
  );

  yOffset += 12;

  // Table Header
  doc.setFillColor(240, 240, 240);
  doc.rect(14, yOffset - 6, 182, 10, "F");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);

  doc.text("TEAM NAME", 18, yOffset);
  doc.text("TEAM CODE", 125, yOffset);

  yOffset += 12;

  teams.forEach((team) => {
    if (yOffset > 260) {
      doc.addPage();

      yOffset = 25;

      doc.setFillColor(240, 240, 240);
      doc.rect(14, yOffset - 6, 182, 10, "F");

      doc.setFont("Helvetica", "bold");
      doc.text("TEAM NAME", 18, yOffset);
      doc.text("TEAM CODE", 125, yOffset);

      yOffset += 12;
    }

    doc.setDrawColor(230);
    doc.line(14, yOffset + 3, 196, yOffset + 3);

    doc.setFont("Helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(team.name || "N/A", 18, yOffset);

    // Code Box
    doc.roundedRect(118, yOffset - 5, 42, 8, 2, 2);

    doc.setFont("Courier", "bold");
    doc.text(
      team.team_code || "PENDING",
      139,
      yOffset,
      { align: "center" }
    );

    yOffset += 10;
  });

  // Footer on every page
  const totalPages = doc.getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    doc.setDrawColor(220);
    doc.line(
      14,
      pageHeight - 15,
      pageWidth - 14,
      pageHeight - 15
    );

    doc.setFontSize(8);
    doc.setTextColor(120);

    doc.text(
      "SKYLA™",
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" }
    );

    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - 14,
      pageHeight - 8,
      { align: "right" }
    );
  }

  doc.save(
    `Team_Codes_${
      tournamentName?.replace(/\s+/g, "_") || "Tournament"
    }.pdf`
  );
};


  if (!tournamentId) return null;

  return (
    <div className="card shadow-sm border-0 mb-5">
      <div className="card-header bg-dark text-white fw-bold py-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Team codes to share to players only</h5>
        <button 
          className="btn btn-sm btn-primary fw-bold" 
          onClick={generatePDF}
          disabled={loading || teams.length === 0}
        >
          Download Printable PDF
        </button>
      </div>
      
      <div className="card-body p-0">
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border spinner-border-sm text-primary" />
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover table-striped align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-4">Team Name</th>
                  <th className="pe-4 text-end">Team Code</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team, idx) => (
                  <tr key={idx}>
                    <td className="ps-4 fw-bold">{team.name}</td>
                    <td className="pe-4 text-end">
                      <code className="text-uppercase font-monospace bg-light p-1 rounded border border-secondary-subtle fw-bold text-danger">
                        {team.team_code || "N/A"}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default TournamentCodesList;