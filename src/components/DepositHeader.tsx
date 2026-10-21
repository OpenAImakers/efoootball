import React from "react";

interface PageHeaderProps {
  title?: string;
  highlight?: string;
  subtitle?: string;
}

export default function PageHeader({
  title = "Rankings",
  highlight = "eFootball",
  subtitle = "Top up your wallet and cash out, all in one place.",
}: PageHeaderProps) {
  return (
    <div className="ph-wrap">
      <h1 className="ph-title">
        <span className="ph-title-main">{title}</span>{" "}
        <span className="ph-title-accent">{highlight}</span>
      </h1>

      <p className="ph-subtitle">{subtitle}</p>

      <style>{`
        .ph-wrap {
          text-align: center;
          margin-bottom: 1.75rem;
          padding: 0 12px;
        }

        .ph-title {
          margin: 0;
          font-size: 2.1rem;
          font-weight: 900;
          letter-spacing: -0.8px;
          line-height: 1.1;
          display: flex;
          justify-content: center;
          align-items: baseline;
          gap: 0.4rem;
          flex-wrap: wrap;
        }

        /* Matches FootballTab heroTitle gradient */
        .ph-title-main {
          background: linear-gradient(135deg, #ffffff 30%, #60a5fa 70%, #fd7e14 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* Tier 5 sky-blue -> Tier 7 pink, echoing the tier palette */
        .ph-title-accent {
          background: linear-gradient(135deg, #0EA5E9 0%, #10B981 50%, #EC4899 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .ph-subtitle {
          margin: 0.65rem 0 0;
          font-size: 0.9rem;
          color: rgba(255,255,255,0.55);
          font-weight: 400;
        }

        @media (max-width: 576px) {
          .ph-title { font-size: 1.65rem; }
        }
      `}</style>
    </div>
  );
}