import React from 'react';

const NoLeaderboardState: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      marginTop: '65px',
      textAlign: 'center',
      border: '2px dashed #e5e7eb',
      borderRadius: '12px',
      backgroundColor: '#f9fafb',
      color: '#6b7280',
      marginLeft: 'auto',
      marginRight: 'auto'
    }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px', opacity: 0.5 }}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
      <p style={{ fontSize: '18px', fontWeight: '500' }}>
        You haven't created any leaderboard yet.
      </p>
      <button 
        onClick={() => window.location.href = '/leaderboard-create'}
        style={{
          marginTop: '15px',
          padding: '8px 16px',
          backgroundColor: '#10b981', // Green for Leaderboards
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: '600'
        }}
      >
        Create Leaderboard
      </button>
            <button 
        onClick={() => window.location.href = '/leaderboard-list'}
        style={{
          marginTop: '15px',
          padding: '8px 16px',
          backgroundColor: '#10b981', // Green for Leaderboards
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: '600'
        }}
      >
        Manage Leaderboard
      </button>
    </div>
  );
};

export default NoLeaderboardState;