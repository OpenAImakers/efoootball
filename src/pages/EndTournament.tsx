import React, { useState } from "react";
import { supabase } from "../supabase";
import { logoutFromTournament } from "../Utils/TournamentSession"; // Adjust this path to match your folder structure

interface EndTournamentProps {
  tournamentId: number;
  tournamentName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function EndTournament({
  tournamentId,
  tournamentName,
  isOpen,
  onClose,
  onSuccess,
}: EndTournamentProps) {
  const [loading, setLoading] = useState(false);
  const [typedConfirmation, setTypedConfirmation] = useState("");
  const [complianceChecked, setComplianceChecked] = useState(false);

  const requiredConfirmationText = `END ${tournamentName.toUpperCase()}`;
  const isConfirmed = typedConfirmation.trim() === requiredConfirmationText && complianceChecked;

  const handleEndTournament = async () => {
    if (!isConfirmed) return;

    setLoading(true);

    const { error } = await supabase
      .from("tournaments")
      .update({ status: "finished" })
      .eq("id", tournamentId)
      .select()
      .single();

    if (error) {
      alert("Failed to end tournament: " + error.message);
      setLoading(false);
    } else {
      alert(`${tournamentName} has been marked as finished.`);
      onSuccess?.();
      onClose();
      
      // Clear session data from localStorage and redirect to /teams
      logoutFromTournament();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        
        {/* Header */}
        <div className="modal-header">
          <h4 className="modal-title">Finalize Tournament</h4>
          <button type="button" className="close-button" onClick={onClose}>&times;</button>
        </div>

        {/* Scrollable Body for Laptop Scaling */}
        <div className="modal-body">
          <p className="intro-text">
            You are initiating the final administrative closing sequence for <strong>{tournamentName}</strong>.
          </p>

          {/* Compliance & Rules Box */}
          <div className="rules-box">
            <span className="box-title">Administrative Consequences</span>
            <ul className="rules-list">
              <li>Tournament ledger status transitions directly to FINISHED.</li>
              <li>Unplayed matches automatically evaluate to balanced 0-0 scores.</li>
              <li>All player and team performance analytics lock down against further modifications.</li>
              <li>Prize and standings distribution vectors will be archived as final.</li>
            </ul>
          </div>

          {/* Legal/Gaming Rules Compliance Checkbox */}
          <div className="checkbox-container">
            <input
              className="checkbox-input"
              type="checkbox"
              id="complianceCheck"
              checked={complianceChecked}
              onChange={(e) => setComplianceChecked(e.target.checked)}
            />
            <label className="checkbox-label" htmlFor="complianceCheck">
              I certify that this tournament was managed under proper administrative standards and conforms in full to all active competitive gaming regulations and fair-play policies <span style={{ color: "#0056b3", fontWeight: "700" }}>as per Skyla™ policies</span>.
            </label>
          </div>

          {/* TextInput Confirmation */}
          <div className="input-group">
            <label className="input-label">
              To proceed, type exactly: <span className="highlight-text">{requiredConfirmationText}</span>
            </label>
            <input
              type="text"
              className="text-input"
              placeholder="Type confirmation here"
              value={typedConfirmation}
              onChange={(e) => setTypedConfirmation(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className={`btn-submit ${isConfirmed ? "btn-active" : "btn-disabled"}`}
            onClick={handleEndTournament}
            disabled={loading || !isConfirmed}
          >
            {loading ? "Processing..." : "Apply & Close Tournament"}
          </button>
        </div>
      </div>

      {/* Styled Responsive CSS */}
      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 15px;
        }
        
        .modal-container {
          background: #000000;
          border: 2px solid #0056b3;
          border-radius: 8px;
          color: #ffffff;
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 5px 25px rgba(0, 86, 179, 0.3);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          border-bottom: 1px solid #333333;
        }

        .modal-title {
          font-weight: 700;
          color: #ffffff;
          margin: 0;
          font-size: 1.25rem;
        }

        .close-button {
          background: none;
          border: none;
          color: #ffffff;
          font-size: 1.5rem;
          cursor: pointer;
          line-height: 1;
        }

        .modal-body {
          padding: 20px;
          overflow-y: auto;
          max-height: 60vh;
        }

        .intro-text {
          font-size: 0.95rem;
          color: #ffffff;
          margin-bottom: 15px;
          line-height: 1.4;
        }

        .rules-box {
          background: #111111;
          border-left: 4px solid #0056b3;
          padding: 12px 15px;
          margin-bottom: 20px;
        }

        .box-title {
          display: block;
          font-weight: 700;
          color: #0056b3;
          font-size: 0.9rem;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .rules-list {
          margin: 0;
          padding-left: 15px;
          font-size: 0.85rem;
          color: #cccccc;
        }

        .rules-list li {
          margin-bottom: 6px;
        }

        .checkbox-container {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: #111111;
          padding: 12px;
          border: 1px solid #333333;
          border-radius: 4px;
          margin-bottom: 20px;
        }

        .checkbox-input {
          margin-top: 3px;
          cursor: pointer;
        }

        .checkbox-label {
          font-size: 0.85rem;
          color: #ffffff;
          line-height: 1.4;
          cursor: pointer;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #cccccc;
        }

        .highlight-text {
          color: #0056b3;
          font-weight: 700;
          word-break: break-all;
        }

        .text-input {
          background: #000000;
          color: #ffffff;
          border: 1px solid #0056b3;
          border-radius: 4px;
          padding: 10px;
          font-size: 0.9rem;
          width: 100%;
          outline: none;
        }

        .text-input:focus {
          border-color: #ffffff;
          box-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
        }

        .text-input::placeholder {
          color: #555555;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 15px 20px;
          border-top: 1px solid #333333;
          background: #111111;
        }

        .btn-cancel {
          background: none;
          border: 1px solid #ffffff;
          color: #ffffff;
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 0.9rem;
          cursor: pointer;
        }

        .btn-cancel:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .btn-submit {
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: background 0.2s ease;
        }

        .btn-active {
          background: #0056b3;
          color: #ffffff;
        }

        .btn-active:hover {
          background: #004085;
        }

        .btn-disabled {
          background: #333333;
          color: #777777;
          cursor: not-allowed;
        }

        /* Responsiveness adjustment for tight displays */
        @media (max-height: 650px) {
          .modal-body {
            max-height: 50vh;
          }
          .rules-box {
            margin-bottom: 10px;
          }
          .checkbox-container {
            margin-bottom: 10px;
          }
        }
      `}</style>
    </div>
  );
}