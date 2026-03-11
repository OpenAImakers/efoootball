import React from "react";
import { useNavigate } from "react-router-dom";

export default function Leagues() {
  const navigate = useNavigate();

  // 20 Kenyan-themed eFootball League Data
  const leagueData = [
    { id: 1, name: "Nairobi Premier League", participants: 124, cups: "Kanairo Cup", organizer: "City Stars Gaming" },
    { id: 2, name: "Mombasa Elite Pro", participants: 89, cups: "Coastal Shield", organizer: "001 E-Sports" },
    { id: 3, name: "Kisumu Dala Series", participants: 64, cups: "Lakeside Trophy", organizer: "Victoria Gaming" },
    { id: 4, name: "Rift Valley Masters", participants: 77, cups: "Highland Cup", organizer: "Eldoret Hub" },
    { id: 5, name: "Nakuru Street League", participants: 42, cups: "Flamingo Open", organizer: "Nax E-Sports" },
    { id: 6, name: "Mount Kenya Classic", participants: 55, cups: "Peak Masters", organizer: "Central Gaming" },
    { id: 7, name: "Thika Road Circuit", participants: 110, cups: "TRM Invitational", organizer: "Highway Kings" },
    { id: 8, name: "Machakos Pro Series", participants: 31, cups: "Masaku Cup", organizer: "Mks Gaming" },
    { id: 9, name: "Western Kenya Clash", participants: 45, cups: "Ingo Masters", organizer: "Kakamega Esports" },
    { id: 10, name: "Eastlands Underground", participants: 200, cups: "Mtaa Cup", organizer: "Isack Skyla" },
    { id: 11, name: "Kajiado Rift Series", participants: 19, cups: "Maa Trophy", organizer: "Rift Play" },
    { id: 12, name: "Uasin Gishu Open", participants: 33, cups: "Champ Cup", organizer: "North Rift Gaming" },
    { id: 13, name: "Kilifi Coastal Pro", participants: 28, cups: "Oceanic Shield", organizer: "Watamu Gamers" },
    { id: 14, name: "Kiambu Elite League", participants: 88, cups: "Coffee Masters", organizer: "Thika Gaming" },
    { id: 15, name: "Garissa Desert Cup", participants: 16, cups: "Border Shield", organizer: "North East Play" },
    { id: 16, name: "Langata Pro League", participants: 50, cups: "Bypass Trophy", organizer: "Karen E-Sports" },
    { id: 17, name: "Kisii Highlands Cup", participants: 44, cups: "Soapstone Open", organizer: "Gusi Play" },
    { id: 18, name: "Embu Master Series", participants: 25, cups: "Mountain Open", organizer: "Eastern Gaming" },
    { id: 19, name: "Malindi Beach Pro", participants: 38, cups: "Swahili Cup", organizer: "Coastal Hub" },
    { id: 20, name: "National Cyber Cup", participants: 512, cups: "Presidential Trophy", organizer: "Kenya Gaming Fed" },
  ];

  return (
    <div className="min-vh-100 w-100 bg-black text-white d-flex flex-column">
      {/* Beta Header */}
      <div className="w-100 py-1 bg-primary text-center shadow-sm" style={{ fontSize: '0.7rem', letterSpacing: '4px' }}>
        <span className="fw-black text-white">UNDER CONSTRUCTION </span>
      </div>

      {/* Top Bar */}
      <div className="p-4 d-flex align-items-center">
        <button onClick={() => navigate("/dashboard")} className="btn text-white p-0 border-0">
          <i className="bi bi-arrow-left" style={{ fontSize: "2.2rem" }}></i>
        </button>
        <h2 className="ms-3 mb-0 fw-black text-uppercase italic-style">Leagues</h2>
      </div>

      {/* Main Table Container with Margins and Blue Border */}
      <div className="flex-grow-1 px-4 mb-5">
        <div className="h-100 rounded-4 border border-primary border-4 shadow-lg overflow-hidden bg-white">
          <div className="table-responsive h-100">
            <table className="table table-hover mb-0 align-middle">
              {/* THEAD - Solid Black Background */}
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr style={{ backgroundColor: "#000000" }}>
                  <th className="py-4 ps-4 text-white text-uppercase small fw-black border-0">League Name</th>
                  <th className="py-4 text-white text-uppercase small fw-black text-center border-0">Participants</th>
                  <th className="py-4 text-white text-uppercase small fw-black border-0">Cups</th>
                  <th className="py-4 pe-4 text-end text-white text-uppercase small fw-black border-0">Details</th>
                </tr>
              </thead>
              <tbody>
                {leagueData.map((league) => (
                  <tr key={league.id} className="border-bottom border-light">
                    <td className="py-3 ps-4">
                      <div className="d-flex flex-column">
                        <span className="fw-bold text-dark fs-6">{league.name}</span>
                        <span className="text-muted" style={{ fontSize: '0.65rem' }}>{league.organizer}</span>
                      </div>
                    </td>
                    <td className="text-center">
                      <span className="badge bg-primary rounded-pill px-3 py-2 fw-black">
                        {league.participants}
                      </span>
                    </td>
                    <td>
                      <div className="text-primary fw-bold small">
                        <i className="bi bi-trophy-fill me-2"></i>
                        {league.cups}
                      </div>
                    </td>
                    <td className="pe-4 text-end">
                      <button className="btn btn-dark btn-sm rounded-pill px-4 fw-black text-uppercase" style={{ fontSize: '0.65rem' }}>
                        Join
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>{`
        .fw-black { font-weight: 900; }
        .italic-style { font-style: italic; letter-spacing: -1px; }
        
        /* White table hover state */
        .table-hover tbody tr:hover { 
          background-color: #f0f7ff !important;
          transition: background 0.2s ease;
        }

        /* App Scrollbars */
        .table-responsive::-webkit-scrollbar { width: 8px; }
        .table-responsive::-webkit-scrollbar-track { background: #f8f9fa; }
        .table-responsive::-webkit-scrollbar-thumb { background: #0d6efd; border-radius: 10px; }

        /* Ensure heading stays black and visible */
        .table thead th {
           background-color: #000 !important;
           color: white !important;
        }
      `}</style>
    </div>
  );
}