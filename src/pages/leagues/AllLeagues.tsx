import React from "react";
import { useNavigate } from "react-router-dom";
import LeaguesNavbar from "./Leaguenav";

export default function Leagues() {

  const navigate = useNavigate();

  const leagueData = [
    { id: 1, name: "Nairobi Premier League", position: 3, participants: 124, organizer: "City Stars Gaming" },
    { id: 2, name: "Mombasa Elite Pro", position: 6, participants: 89, organizer: "001 E-Sports" },
    { id: 3, name: "Kisumu Dala Series", position: 8, participants: 64, organizer: "Victoria Gaming" },
    { id: 4, name: "Rift Valley Masters", position: 5, participants: 77, organizer: "Eldoret Hub" },
    { id: 5, name: "Nakuru Street League", position: 11, participants: 42, organizer: "Nax E-Sports" },
    { id: 6, name: "Mount Kenya Classic", position: 9, participants: 55, organizer: "Central Gaming" },
    { id: 7, name: "Thika Road Circuit", position: 4, participants: 110, organizer: "Highway Kings" },
    { id: 8, name: "Machakos Pro Series", position: 15, participants: 31, organizer: "Mks Gaming" },
    { id: 9, name: "Western Kenya Clash", position: 10, participants: 45, organizer: "Kakamega Esports" },
    { id: 10, name: "Eastlands Underground", position: 2, participants: 200, organizer: "Isack Skyla" },
    { id: 11, name: "Kajiado Rift Series", position: 19, participants: 19, organizer: "Rift Play" },
    { id: 12, name: "Uasin Gishu Open", position: 14, participants: 33, organizer: "North Rift Gaming" },
    { id: 13, name: "Kilifi Coastal Pro", position: 18, participants: 28, organizer: "Watamu Gamers" },
    { id: 14, name: "Kiambu Elite League", position: 7, participants: 88, organizer: "Thika Gaming" },
    { id: 15, name: "Garissa Desert Cup", position: 20, participants: 16, organizer: "North East Play" },
    { id: 16, name: "Langata Pro League", position: 12, participants: 50, organizer: "Karen E-Sports" },
    { id: 17, name: "Kisii Highlands Cup", position: 13, participants: 44, organizer: "Gusi Play" },
    { id: 18, name: "Embu Master Series", position: 16, participants: 25, organizer: "Eastern Gaming" },
    { id: 19, name: "Malindi Beach Pro", position: 17, participants: 38, organizer: "Coastal Hub" },
    { id: 20, name: "National Cyber Cup", position: 1, participants: 512, organizer: "Kenya Gaming Fed" }
  ];

  return (

    <div className="min-vh-100 bg-white">

      {/* Header */}
      <div className="w-100 bg-dark text-white py-2 text-center small fw-bold">
        ALL LEAGUES
      </div>

      <LeaguesNavbar />

      {/* Table */}
      <div className="container-fluid px-4 mt-3">

        <div className="table-responsive">

          <table className="table table-bordered table-hover align-middle">

            <thead className="table-dark">
              <tr>

                <th style={{width:"50%"}}>
                  League
                </th>

                <th className="text-center" style={{width:"10%"}}>
                  Position
                </th>

                <th className="text-center" style={{width:"20%"}}>
                  Participants
                </th>

                <th style={{width:"20%"}}>
                  Organizer
                </th>

              </tr>
            </thead>

            <tbody>

              {leagueData.map((league) => (

                <tr
                  key={league.id}
                  onClick={() => navigate("/specificleague")}
                  style={{cursor:"pointer"}}
                >

                  <td className="fw-bold">
                    {league.name}
                  </td>

                  <td className="text-center fw-bold">
                    {league.position}
                  </td>

                  <td className="text-center fw-bold text-primary">
                    {league.participants}
                  </td>

                  <td className="text-muted">
                    {league.organizer}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

      <style>{`

        table{
          font-size:0.95rem;
        }

        tbody tr:hover{
          background:#f5f9ff;
        }

        th{
          font-weight:700;
          letter-spacing:0.5px;
        }

        td{
          vertical-align:middle;
        }

      `}</style>

    </div>
  );
}