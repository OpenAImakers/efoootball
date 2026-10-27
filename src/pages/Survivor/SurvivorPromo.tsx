import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Self-contained promo banner for the Survivor game.
 * Rendered on the Jackpot page between the hero and the contest panel.
 * Fully removable by deleting the import + <SurvivorPromo /> in Jackpot.tsx.
 */
const SurvivorPromo: React.FC = () => (
  <Link to="/survivor" style={{ textDecoration: 'none', display: 'block' }}>
    <div style={styles.banner}>
      <div style={styles.iconCircle}>
        <i className="bi bi-lightning-charge-fill" style={{ color: '#38bdf8', fontSize: 22 }} />
      </div>
      <div style={styles.copy}>
        <div style={styles.titleRow}>
          <span style={styles.newBadge}>NEW GAME</span>
          <span style={styles.title}>Survivor — Last Man Standing</span>
        </div>
        <span style={styles.subtitle}>
          One pick a week · Lose once and you're out · Last one standing takes the whole pot
        </span>
      </div>
      <i className="bi bi-chevron-right" style={{ color: '#38bdf8', fontSize: 18, flexShrink: 0 }} />
    </div>
  </Link>
);

const styles: { [key: string]: React.CSSProperties } = {
  banner: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    maxWidth: 860,
    margin: '0 auto 14px',
    padding: '14px 16px',
    background: 'linear-gradient(90deg, rgba(14,165,233,0.16) 0%, rgba(2,6,23,0.85) 55%)',
    border: '1px solid rgba(56,189,248,0.45)',
    borderRadius: 14,
    color: '#e2e8f0',
    cursor: 'pointer',
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: '50%',
    background: 'rgba(56,189,248,0.15)',
    border: '1px solid rgba(56,189,248,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  copy: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  newBadge: {
    fontSize: '0.6rem',
    fontWeight: 900,
    letterSpacing: 1,
    color: '#04121f',
    background: '#38bdf8',
    borderRadius: 999,
    padding: '2px 8px',
  },
  title: {
    fontWeight: 900,
    fontSize: '0.98rem',
  },
  subtitle: {
    fontSize: '0.76rem',
    color: '#94a3b8',
  },
};

export default SurvivorPromo;
