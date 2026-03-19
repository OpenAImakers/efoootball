import { useEffect, useState } from "react";
import { Link } from "react-router-dom"; // Swapped from next/link
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";
import RoundRobinLayout from "../TournamentView/RobinRound";
import SingleEliminationLayout from "../TournamentView/SingleElimination";
import DoubleEliminationLayout from "../TournamentView/DoubleElimination";

export interface Tournament {
  id: number;
  name: string;
  tournament_type: string;
}

export interface Team {
  rank: number;
  id: number;
  name: string;
  group_id: number | null;
  w: number;
  d: number;
  l: number;
  points: number;
  gf: number;
  ga: number;
  gd: number;
}

export default function Teams() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchFollowedTournaments = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setTournaments([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("tournament_followers")
        .select(`
          tournament_id,
          tournaments (
            id,
            name,
            tournament_type
          )
        `)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching followed tournaments:", error);
      } else if (data) {
        const followedList: Tournament[] = data
          .map((item: any) => item.tournaments)
          .filter(Boolean);

        setTournaments(followedList);
        if (followedList.length > 0) {
          setSelectedTournament(followedList[0]);
        }
      }
      setLoading(false);
    };

    fetchFollowedTournaments();
  }, []);

  useEffect(() => {
    if (!selectedTournament) return;

    const fetchStandings = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_standings", {
        t_id: selectedTournament.id,
      });

      if (!error && data) {
        setTeams(data);
      } else {
        console.error("Error fetching standings:", error);
        setTeams([]);
      }
      setLoading(false);
    };

    fetchStandings();
  }, [selectedTournament]);

  const filteredTournaments = tournaments.filter((t) =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderLayout = () => {
    if (!selectedTournament) return (
      <div className="text-center py-5">
        <p className="text-white opacity-75">You are not following any tournaments yet.</p>
      </div>
    );
    const props = { tournament: selectedTournament, teams: teams };

    switch (selectedTournament.tournament_type) {
      case "round_robin_single":
      case "round_robin_double":
        return <RoundRobinLayout {...props} />;
      case "single_elimination":
        return <SingleEliminationLayout {...props} />;
      case "double_elimination":
        return <DoubleEliminationLayout {...props} />;
      default:
        return (
          <div className="text-center py-5">
            <p className="text-white opacity-75">Unsupported tournament type: {selectedTournament.tournament_type}</p>
          </div>
        );
    }
  };

  return (
    <main className="mt-5 bg-black text-white min-vh-100">
      <Navbar />
      <div className="container-fluid py-5">
        
        {/* Header with React Router Link */}
        <div className="d-flex justify-content-between align-items-center mb-4 px-3">
           
           <Link to="/dashboard" className="btn btn-outline-info btn-sm fw-bold neon-border">
              FOLLOW TOURNAMENTS
           </Link>
        </div>

        <div className="mb-5 px-3">
          <div className="mx-auto" style={{ maxWidth: "600px" }}>
            <input
              type="text"
              className="form-control search-input mb-4"
              placeholder="SEARCH FOLLOWED TOURNAMENTS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="tournament-scroll-container d-flex gap-3 pb-3">
            {filteredTournaments.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTournament(t)}
                className={`tournament-card ${selectedTournament?.id === t.id ? "active" : ""}`}
              >
                <div className="type-badge">{t.tournament_type.replace(/_/g, " ")}</div>
                <div className="tournament-name text-white">{t.name.replace(/_/g, " ").toUpperCase()}</div>
              </div>
            ))}
            {!loading && filteredTournaments.length === 0 && (
              <p className="text-white opacity-50 mx-auto">No tournaments found.</p>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-info shadow-glow"></div>
          </div>
        ) : (
          renderLayout()
        )}
      </div>

      <style>{`
        .search-input { 
          border: 2px solid #333; 
          color: #fff !important; 
          font-weight: 700; 
          letter-spacing: 1px; 
          padding: 12px 20px; 
          border-radius: 8px; 
          background: #111; 
        }
        .search-input::placeholder { color: #888; }
        .search-input:focus { 
          background: #151515; 
          border-color: #0dcaf0; 
          color: #ffffff !important; 
          box-shadow: 0 0 15px rgba(13, 202, 240, 0.3); 
          outline: none;
        }
        .tournament-scroll-container { overflow-x: auto; white-space: nowrap; padding: 10px 0; scrollbar-width: none; }
        .tournament-scroll-container::-webkit-scrollbar { display: none; }
        .tournament-card { min-width: 220px; background: #111; border: 1px solid #333; padding: 20px; border-radius: 12px; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flex-direction: column; gap: 10px; }
        .tournament-card:hover { border-color: #555; transform: translateY(-5px); }
        .tournament-card.active { border-color: #0dcaf0; background: linear-gradient(145deg, #001a33 0%, #000 100%); box-shadow: 0 0 20px rgba(13, 202, 240, 0.2); }
        .tournament-name { font-weight: 900; font-size: 0.9rem; white-space: normal; line-height: 1.2; color: #fff !important; }
        .type-badge { font-size: 0.65rem; font-weight: 800; color: #0dcaf0; text-transform: uppercase; letter-spacing: 1.5px; }
        .shadow-glow { filter: drop-shadow(0 0 5px #0dcaf0); }
        .neon-border { border-color: #0dcaf0; color: #0dcaf0; }
        .neon-border:hover { background: #0dcaf0; color: #000; box-shadow: 0 0 10px #0dcaf0; }
      `}</style>
    </main>
  );
}