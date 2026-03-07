import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../supabase"; 
import Navbar from "../components/Navbar";

// DASHBOARD THEME
const colors = {
  darkBlue: "#0B0E14",
  cardBg: "#161B22",
  accentOrange: "#FF8C00",
  textGray: "#8B949E",
  border: "#30363D"
};

const playerPool = [
  "Messi", "Batistuta", "Maradona", "Ronaldo R9", "Pele", 
  "Zidane", "Cruyff", "Ronaldinho", "Xavi", "Iniesta", 
  "Busquets", "Puyol", "Pique", "Alves", "Casillas",
  "Maldini", "Nesta", "Pirlo", "Kaka", "Shevchenko"
];

function shuffleArray(array: string[]) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function ProfileView() {
  const { username } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [squad, setSquad] = useState<string[]>([]);
  const cleanUsername = decodeURIComponent(username || "");

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("display_name, username, profile_pic")
        .eq("username", cleanUsername)
        .single();
      
      if (data) {
        setProfile(data);
        setSquad(shuffleArray(playerPool).slice(0, 11));
      }
      setLoading(false);
    };
    fetchProfile();
  }, [cleanUsername]);

  const PlayerNode = ({ name, positionNumber }: { name: string; positionNumber: string }) => (
    <div className="d-flex flex-column align-items-center" style={{ width: '85px', zIndex: 2 }}>
      <div 
        className="rounded-circle d-flex align-items-center justify-content-center shadow-lg"
        style={{ 
          width: "50px", height: "50px", 
          backgroundColor: "#1c2128", 
          border: `2px solid ${colors.accentOrange}`,
          overflow: 'hidden' 
        }}
      >
        <img 
          src="/play.png" 
          alt="" 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            const parent = target.parentNode as HTMLDivElement;
            target.style.display = 'none';
            parent.innerText = positionNumber;
            parent.style.color = 'white';
            parent.style.fontWeight = 'bold';
          }}
        />
      </div>
      <span className="mt-1 small text-white fw-bold text-center text-truncate w-100" style={{ fontSize: '0.65rem' }}>
        {name}
      </span>
    </div>
  );

  return (
    <main className="min-vh-100 pb-5" style={{ backgroundColor: colors.darkBlue, color: "#e0e0e0" }}>
      <Navbar />
      
      <div className="container-fluid mt-5 pt-4 px-md-4">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: colors.accentOrange }}></div>
          </div>
        ) : profile ? (
          <div className="row g-0">
            
            {/* LEFT SIDEBAR */}
            <div className="col-lg-4 col-xl-3 pe-lg-3">
              <div className="card border-0 shadow-lg mb-3" style={{ backgroundColor: colors.cardBg, borderTop: `4px solid ${colors.accentOrange}` }}>
                <div className="card-body p-4">
                  <div className="text-center mb-4">
                    {profile.profile_pic ? (
                      <img 
                        src={profile.profile_pic} 
                        alt={profile.username}
                        className="mb-3 shadow"
                        style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "12px", border: `2px solid ${colors.accentOrange}` }}
                      />
                    ) : (
                      <div className="mx-auto mb-3 d-flex align-items-center justify-content-center fw-bold shadow" 
                           style={{ width: "100px", height: "100px", fontSize: "2.5rem", borderRadius: "12px", background: `linear-gradient(135deg, ${colors.accentOrange} 0%, #ff4500 100%)`, color: "white" }}>
                        {profile.display_name?.[0].toUpperCase() || "U"}
                      </div>
                    )}
                    <h4 className="mb-0 fw-bold text-white text-truncate">{profile.display_name}</h4>
                    <p className="mb-3 small fw-bold" style={{ color: colors.accentOrange }}>@{profile.username}</p>
                  </div>

                  <div className="d-flex flex-column gap-1">
                    {[
                      { label: "Team", val: "Wasafi FC" },
                      { label: "Leaderboard", val: "00" },
                      { label: "Tournaments", val: "1" },
                      { label: "Strength", val: "0000" },
                      { label: "Country", val: "Kenya" },
                      { label: "Fav Team", val: "Chelsea" },
                      { label: "Fav Player", val: "Olunga" },
                      { label: "Language", val: "Kiswahili" }
                    ].map((item, i) => (
                      <div key={i} className="p-2 rounded bg-dark bg-opacity-50 border border-secondary d-flex justify-content-between align-items-center" style={{ borderColor: `${colors.border} !important` }}>
                        <span className="text-warning fw-bold small" style={{ fontSize: '0.7rem' }}>{item.label}</span>
                        <span className="text-uppercase" style={{ fontSize: '0.65rem', color: colors.textGray }}>{item.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT MAIN CONTENT */}
            <div className="col-lg-8 col-xl-9">
              <div className="rounded shadow-sm overflow-hidden h-100 position-relative" style={{ backgroundColor: colors.cardBg, border: `1px solid ${colors.border}` }}>
                
                {/* UNDER DEVELOPMENT OVERLAY HEADER */}
                <div className="w-100 py-1 px-3 d-flex align-items-center justify-content-center" 
                     style={{ backgroundColor: 'rgba(255, 140, 0, 0.1)', borderBottom: `1px solid ${colors.border}` }}>
                  <span className="spinner-grow spinner-grow-sm text-warning me-2" role="status"></span>
                  <small className="fw-bold text-warning" style={{ letterSpacing: '1px', fontSize: '0.7rem' }}>
                    UNDER DEVELOPMENT
                  </small>
                </div>

                <div className="position-relative w-100" 
                     style={{ 
                       background: `linear-gradient(90deg, #161b22 0%, #0b0e14 100%)`, 
                       height: "550px",
                       backgroundImage: `radial-gradient(circle at center, rgba(255,140,0,0.03) 0%, transparent 80%)`,
                     }}>
                  
                  {/* DEVELOPMENT WATERMARK */}
                  <div className="position-absolute top-50 start-50 translate-middle opacity-25" 
                       style={{ transform: 'translate(-50%, -50%) rotate(-30deg)', pointerEvents: 'none', zIndex: 1 }}>
                    <h1 className="display-1 fw-black" style={{ color: colors.border, whiteSpace: 'nowrap' }}>BETA TEST</h1>
                  </div>

                  <div className="position-absolute top-0 bottom-0 start-50 border-start border-secondary opacity-25"></div>
                  <div className="position-absolute top-50 start-50 translate-middle rounded-circle border border-secondary opacity-25" style={{ width: '180px', height: '180px' }}></div>

                  <div className="d-flex flex-row justify-content-between align-items-center h-100 w-100 px-5 position-relative">
                    <div className="d-flex align-items-center">
                      <PlayerNode name={squad[10]} positionNumber="1" />
                    </div>
                    <div className="d-flex flex-column justify-content-around h-100 py-4">
                      <PlayerNode name={squad[6]} positionNumber="3" />
                      <PlayerNode name={squad[7]} positionNumber="4" />
                      <PlayerNode name={squad[8]} positionNumber="5" />
                      <PlayerNode name={squad[9]} positionNumber="2" />
                    </div>
                    <div className="d-flex flex-column justify-content-center gap-5 h-100">
                      <PlayerNode name={squad[3]} positionNumber="8" />
                      <PlayerNode name={squad[4]} positionNumber="6" />
                      <PlayerNode name={squad[5]} positionNumber="10" />
                    </div>
                    <div className="d-flex flex-column justify-content-around h-100 py-5">
                      <PlayerNode name={squad[0]} positionNumber="11" />
                      <PlayerNode name={squad[1]} positionNumber="9" />
                      <PlayerNode name={squad[2]} positionNumber="7" />
                    </div>
                  </div>
                </div>

                {/* FOOTER INFO */}
                <div className="p-2 text-center border-top" style={{ borderColor: colors.border }}>
                  <small className="text-muted" style={{ fontSize: '0.6rem' }}>
                    *Squad customization and real-time positioning sync is currently being calibrated.
                  </small>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="container py-5 text-center">
            <div className="alert d-inline-block px-5 border-0 shadow" style={{ backgroundColor: "#2d1b1b", color: "#ff8484" }}>
              <h4 className="fw-bold mb-0">ERR: USER_NOT_FOUND</h4>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}