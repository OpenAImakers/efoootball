import React from 'react';

interface UpgradeToAdminProps {
  role?: string | null;
}

const UpgradeToAdmin: React.FC<UpgradeToAdminProps> = ({ role }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      textAlign: 'center',
      maxWidth: '500px',
      margin: '80px auto',
      borderRadius: '16px',
      backgroundColor: '#f9fafb',
      border: '1px dashed #d1d5db'
    }}>
      {/* Hand-coded SVG so you don't need to install any icon libraries */}
      <div style={{ 
        backgroundColor: '#eff6ff', 
        padding: '20px', 
        borderRadius: '50%', 
        marginBottom: '20px' 
      }}>
        <svg 
          width="48" 
          height="48" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="#3b82f6" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="16"></line>
          <line x1="8" y1="12" x2="16" y2="12"></line>
        </svg>
      </div>

      <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '12px' }}>
        No Tournaments Running
      </h2>
      
<p style={{ fontSize: '16px', color: '#4b5563', lineHeight: '1.5', marginBottom: '24px' }}>
  {role === "admin" ? (
    <>
      Hey admin! Log into a tournament to start managing your stats. 
    </>
  ) : (
    <>
      Hey! It looks like you haven't started any tournaments yet. 
    </>
  )}
</p>


<div style={{ display: 'flex', gap: '10px' }}>
  <button 
    onClick={() => window.location.href = '/create-tournament'} 
    style={{ backgroundColor: '#3b82f6', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer' }}
  >
    Create Tournament
  </button>
    <button 
    onClick={() => window.location.href = '/leaderboard-admin'} 
    style={{ backgroundColor: '#fff', color: '#374151', padding: '12px 24px', borderRadius: '8px', border: '1px solid #d1d5db', fontWeight: '600', cursor: 'pointer' }}
  >
  Create leaderboard
  </button>
  <button 
    onClick={() => window.location.href = '/tournament-list'} 
    style={{ backgroundColor: '#fff', color: '#374151', padding: '12px 24px', borderRadius: '8px', border: '1px solid #d1d5db', fontWeight: '600', cursor: 'pointer' }}
  >
    Join with Passkey
  </button>
</div>

      <p style={{ marginTop: '20px', fontSize: '13px', color: '#9ca3af' }}>
        Logged in as: {role || "Guest"}
      </p>
    </div>
  );
};

export default UpgradeToAdmin;