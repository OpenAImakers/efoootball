import React from 'react';

interface UpgradeToAdminProps {
  role?: string | null;
}

const UpgradeToAdmin: React.FC<UpgradeToAdminProps> = ({ role }) => {
  return (
    <div className="container-fluid px-0" style={{ marginTop: '60px' }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 20px',
        textAlign: 'center',
        width: '100%',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        minHeight: '60vh'
      }}>
        {/* Professional Square Icon Box */}
        <div style={{ 
          backgroundColor: '#f0f7ff', 
          padding: '24px', 
          border: '1px solid #3b82f6',
          marginBottom: '30px' 
        }}>
          <svg 
            width="48" 
            height="48" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#3b82f6" 
            strokeWidth="1.5" 
            strokeLinecap="square" 
            strokeLinejoin="miter"
          >
            <rect x="3" y="3" width="18" height="18" rx="0" />
            <line x1="12" y1="8" x2="12" y2="16"></line>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
        </div>

        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: '800', 
          color: '#111827', 
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '-0.5px'
        }}>
          Admin <span style={{ color: '#3b82f6' }}>Control Panel</span>
        </h1>
    

        {/* Action Buttons - Grid for professional spacing */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1px', 
          backgroundColor: '#e5e7eb', // Creates thin lines between buttons
          border: '1px solid #e5e7eb',
          width: '100%',
          maxWidth: '900px'
        }}>
          <button 
            onClick={() => window.location.href = '/create-tournament'} 
            style={adminButtonStyle(true)}
          >
            CREATE TOURNAMENT
          </button>
          
          <button 
            onClick={() => window.location.href = '/leaderboard-admin'} 
            style={adminButtonStyle(false)}
          >
            MANAGE LEADERBOARD
          </button>
          
          <button 
            onClick={() => window.location.href = '/registrations-admin'} 
            style={adminButtonStyle(false)}
          >
            VIEW REGISTRATIONS
          </button>

          <button 
            onClick={() => window.location.href = '/tournament-list'} 
            style={adminButtonStyle(false)}
          >
            PASSKEY ENTRY
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper function for consistent square button styling
const adminButtonStyle = (isPrimary: boolean): React.CSSProperties => ({
  backgroundColor: isPrimary ? '#3b82f6' : '#fff',
  color: isPrimary ? '#fff' : '#111827',
  padding: '20px 24px',
  border: 'none',
  fontWeight: '700',
  fontSize: '13px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  textAlign: 'center',
  letterSpacing: '0.5px'
});

export default UpgradeToAdmin;