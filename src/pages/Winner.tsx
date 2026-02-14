import React, { useState } from 'react';
import {
  SingleEliminationBracket,
  MATCH_STATES,
} from '@g-loot/react-tournament-brackets';

const initialMatches = [
  // Round 1
  {
    id: 1,
    name: 'ROUND 1',
    nextMatchId: 5,
    participants: [
      { id: 'p1', name: 'Isack 🇰🇪', resultText: '', isWinner: false, status: null },
      { id: 'p2', name: 'Nairobi Pro', resultText: '', isWinner: false, status: null },
    ],
  },
  {
    id: 2,
    name: 'ROUND 1',
    nextMatchId: 5,
    participants: [
      { id: 'p3', name: 'SquadGod', resultText: '', isWinner: false, status: null },
      { id: 'p4', name: 'GPKing', resultText: '', isWinner: false, status: null },
    ],
  },
  {
    id: 3,
    name: 'ROUND 1',
    nextMatchId: 6,
    participants: [
      { id: 'p5', name: 'eFootLegend', resultText: '', isWinner: false, status: null },
      { id: 'p6', name: 'MobileMaster', resultText: '', isWinner: false, status: null },
    ],
  },
  {
    id: 4,
    name: 'ROUND 1',
    nextMatchId: 6,
    participants: [
      { id: 'p7', name: 'KenyaKing', resultText: '', isWinner: false, status: null },
      { id: 'p8', name: 'Underdog KE', resultText: '', isWinner: false, status: null },
    ],
  },
  // Quarterfinals
  {
    id: 5,
    name: 'QUARTERFINAL',
    nextMatchId: 7,
    participants: [
      { id: 'qf1', name: 'TBD', resultText: '', isWinner: false, status: null },
      { id: 'qf2', name: 'TBD', resultText: '', isWinner: false, status: null },
    ],
  },
  {
    id: 6,
    name: 'QUARTERFINAL',
    nextMatchId: 7,
    participants: [
      { id: 'qf3', name: 'TBD', resultText: '', isWinner: false, status: null },
      { id: 'qf4', name: 'TBD', resultText: '', isWinner: false, status: null },
    ],
  },
  // Semifinal
  {
    id: 7,
    name: 'FINAL',
    nextMatchId: null,
    participants: [
      { id: 'sf1', name: 'TBD', resultText: '', isWinner: false, status: null },
      { id: 'sf2', name: 'TBD', resultText: '', isWinner: false, status: null },
    ],
  },
];

function WinnerCard({ teamName, goalsScored, matchesWon, totalPoints }: any) {
  return (
    <div className="bg-gradient-to-br from-blue-900 to-black border-2 border-blue-500 p-6 rounded-2xl text-white shadow-2xl max-w-sm mx-auto my-8">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl text-yellow-400">🏆</span>
        <h2 className="text-2xl font-black uppercase tracking-tighter italic">CHAMPION</h2>
      </div>
      <div className="space-y-2 font-bold uppercase text-sm tracking-widest">
        <div className="flex justify-between border-b border-blue-800 pb-1">
          <span className="text-blue-400">TEAM</span>
          <span>{teamName}</span>
        </div>
        <div className="flex justify-between border-b border-blue-800 pb-1">
          <span className="text-blue-400">GOALS</span>
          <span>{goalsScored}</span>
        </div>
        <div className="flex justify-between border-b border-blue-800 pb-1">
          <span className="text-blue-400">WINS</span>
          <span>{matchesWon}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-blue-400">POINTS</span>
          <span className="text-yellow-400">{totalPoints}</span>
        </div>
      </div>
    </div>
  );
}

function TournamentBracket() {
  const [matches, setMatches] = useState(initialMatches);

  const reportScore = (matchId: number, winnerId: string, scoreWinner: string, scoreLoser: string) => {
    setMatches((prevMatches) => {
      let newMatches = [...prevMatches];
      const currentIndex = newMatches.findIndex((m) => m.id === matchId);
      if (currentIndex === -1) return prevMatches;

      const currentMatch = newMatches[currentIndex];
      const updatedParticipants = currentMatch.participants.map((p) => {
        if (p.id === winnerId) {
          return { ...p, resultText: scoreWinner, isWinner: true, status: MATCH_STATES.WINNER };
        }
        return { ...p, resultText: scoreLoser, isWinner: false, status: MATCH_STATES.LOSER };
      });

      newMatches[currentIndex] = { ...currentMatch, participants: updatedParticipants };

      if (currentMatch.nextMatchId) {
        const nextIndex = newMatches.findIndex((m) => m.id === currentMatch.nextMatchId);
        if (nextIndex !== -1) {
          const winnerParticipant = updatedParticipants.find((p) => p.isWinner);
          if (winnerParticipant) {
            const nextParticipants = [...newMatches[nextIndex].participants];
            const emptySpotIndex = nextParticipants.findIndex(p => p.name === 'TBD');
            if (emptySpotIndex !== -1) {
              nextParticipants[emptySpotIndex] = { ...nextParticipants[emptySpotIndex], name: winnerParticipant.name };
              newMatches[nextIndex] = { ...newMatches[nextIndex], participants: nextParticipants };
            }
          }
        }
      }
      return newMatches;
    });
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500">
      {/* Header Section */}
      <div className="pt-12 pb-6 px-4 text-center">
        <h1 className="text-5xl font-black uppercase italic tracking-tighter mb-2 bg-gradient-to-r from-blue-400 to-blue-700 bg-clip-text text-transparent">
          eFootball Pro League
        </h1>
        <p className="text-blue-400 font-bold tracking-[0.3em] text-xs">SINGLE ELIMINATION PHASE</p>
      </div>

      <div className="w-full h-[80vh] px-4">
        <SingleEliminationBracket
          matches={matches}
          options={{
            style: {
              roundHeader: { backgroundColor: 'transparent', fontColor: '#60a5fa' },
              connectorColor: '#1e40af',
              match: { borderColor: '#1e40af', backgroundColor: '#000' },
            },
          }}
          svgWrapper={({ children }) => (
            <div className="w-full h-full overflow-auto bg-[radial-gradient(circle_at_center,_#111_0%,_#000_100%)] border border-blue-900/50 rounded-3xl p-8 flex justify-center items-center shadow-inner">
              {children}
            </div>
          )}
          matchComponent={({ match }) => {
            const [top, bottom] = match.participants;
            return (
              <div
                className="group relative w-[240px] bg-gray-900 border border-blue-800/40 rounded-xl overflow-hidden hover:border-blue-400 transition-all cursor-pointer shadow-lg"
                onClick={() => {
                  if (!top?.resultText && top?.name !== 'TBD' && bottom?.name !== 'TBD') {
                    const winTop = window.confirm(`Winner: ${top.name}?`);
                    const winner = winTop ? top : bottom;
                    reportScore(match.id, winner.id, '3', '1');
                  }
                }}
              >
                {/* Round Label */}
                <div className="bg-blue-950 text-[10px] font-black px-3 py-1 text-blue-400 uppercase tracking-widest border-b border-blue-900">
                  {match.name}
                </div>
                
                <div className="p-3 space-y-2">
                  {[top, bottom].map((player, idx) => (
                    <div key={idx} className="flex justify-between items-center gap-2">
                      <span className={`truncate font-bold text-sm ${player?.isWinner ? 'text-blue-400' : 'text-gray-400'}`}>
                        {player?.name || 'TBD'}
                      </span>
                      <span className={`flex items-center justify-center w-8 h-8 rounded-md text-xs font-black ${player?.isWinner ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-500 border border-gray-700'}`}>
                        {player?.resultText || '0'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          }}
        />
      </div>

      <WinnerCard
        teamName="Isack 🇰🇪"
        goalsScored={28}
        matchesWon={5}
        totalPoints={15}
      />
    </div>
  );
}

export default TournamentBracket;