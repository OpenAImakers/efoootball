import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

interface WinnerTournamentDisplayProps {
  teamName: string;
  goalsScored: number;
  matchesWon: number;
  totalPoints: number;
}

const WinnerTournamentDisplay: React.FC<WinnerTournamentDisplayProps> = ({
  teamName,
  goalsScored,
  matchesWon,
  totalPoints,
}) => {
  return (
    <div
      className="d-flex justify-content-center align-items-center vh-100"
      style={{
        backgroundImage: 'url(/cup.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
      }}
    >
      {/* Optional semi-transparent overlay to improve text readability */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(10, 15, 35, 0.75)', // dark blue overlay matching Skyla vibe
          zIndex: 1,
        }}
      />

      <div
        className="card text-center border-0 shadow-lg position-relative"
        style={{
          backgroundColor: 'rgba(26, 42, 68, 0.92)', // semi-transparent card
          color: '#FFFFFF',
          maxWidth: '520px',
          backdropFilter: 'blur(6px)', // glassmorphism effect (modern & premium)
          WebkitBackdropFilter: 'blur(6px)',
          border: '1px solid rgba(255, 140, 0, 0.25)',
          zIndex: 2,
          animation: 'popIn 1.2s ease-out',
        }}
      >
        <div className="card-body p-5 p-md-5">
          <h1 className="mb-4 fw-bold" style={{ color: '#FF8C00', letterSpacing: '1px' }}>
            VICTORY!
          </h1>

          <div className="d-flex justify-content-center mb-4">
            {/* You can keep Font Awesome or replace with your own cup.png as img */}
            <img
              src="/cup.png"
              alt="Championship Cup"
              style={{
                width: '180px',
                height: 'auto',
                filter: 'drop-shadow(0 0 25px #FFD700)',
                animation: 'float 6s ease-in-out infinite',
              }}
            />
          </div>

          <h2 className="mb-4 fw-bold" style={{ color: '#00E5FF' }}>
            Champion: {teamName}
          </h2>

          <div className="list-group list-group-flush mb-4">
            <div className="list-group-item bg-transparent text-white border-0 py-2">
              <strong>Goals Scored:</strong> {goalsScored}
            </div>
            <div className="list-group-item bg-transparent text-white border-0 py-2">
              <strong>Matches Won:</strong> {matchesWon}
            </div>
            <div className="list-group-item bg-transparent text-white border-0 py-2">
              <strong>Total Points:</strong> {totalPoints}
            </div>
          </div>

          <p className="mt-3 fs-5" style={{ color: '#FFD700', fontStyle: 'italic' }}>
            Absolute Domination on the Field!
          </p>
        </div>
      </div>

      {/* You can add this to index.css or a style tag */}
      <style>{`
        @keyframes popIn {
          0% { transform: scale(0.7); opacity: 0; }
          60% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
      `}</style>
    </div>
  );
};

export default WinnerTournamentDisplay;