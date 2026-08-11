import React, { useState } from "react";
import { Link } from "react-router-dom";

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "Can I host my own eFootball tournament?",
    answer: "Yes. You can host your own eFootball tournament through Rankings and manage players, fixtures, results, standings, and knockout stages."
  },
  {
    question: "Are there prizes for tournaments?",
    answer: "Yes. Tournament organizers can offer prizes to winners and top-performing players. Prize details are set by the organizer and displayed with the tournament information."
  },
  {
    question: "How do I join a tournament?",
    answer: "Find an available tournament, check its requirements and registration details, then register to participate."
  },
  {
    question: "How much does it cost to join a tournament?",
    answer: "It depends on the tournament. Some competitions may be free, while others may have a registration or entry fee."
  },
  {
    question: "Who can participate?",
    answer: "Each tournament can have its own eligibility requirements, such as location, player level, platform, or other rules set by the organizer."
  },
  {
    question: "How are fixtures created?",
    answer: "Fixtures are organized according to the tournament format. Competitions can use group stages, leagues, home-and-away matches, or knockout rounds."
  },
  {
    question: "How are match results recorded?",
    answer: "Results are recorded for each fixture and used to update standings, statistics, and player performance."
  },
  {
    question: "What happens if a player doesn't show up?",
    answer: "Tournament organizers can apply their competition rules, including awarding a walkover where appropriate."
  },
  {
    question: "Can I see the tournament standings?",
    answer: "Yes. Players can follow points, wins, losses, goal difference, and qualification positions throughout the tournament."
  },
  {
    question: "Can I see who has been eliminated?",
    answer: "Yes. Tournament progress can show which players have qualified, advanced, or been knocked out."
  },
  {
    question: "Can I track my eFootball performance?",
    answer: "Yes. Rankings is designed to help players build a competitive record through their matches, results, statistics, and rankings."
  },
  {
    question: "Can I play for recognition, not just prizes?",
    answer: "Absolutely. Rankings is about building a competitive identity. Consistent performance can help you establish yourself among the best eFootball players."
  },
  {
    question: "How do I know the tournament is legitimate?",
    answer: "Check the organizer, tournament rules, entry requirements, fixtures, standings, and prize information before participating. Organizers are responsible for clearly communicating their tournament conditions."
  },
  {
    question: "Can I organize a tournament without prizes?",
    answer: "Yes. A tournament can be organized for competition, rankings, community recognition, practice, or simply to find out who is the best."
  }
];

export default function AboutPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="about-container">
      {/* Hero Section */}
      <section className="about-hero text-center py-5">
        <div className="container px-4">
          <div className="hero-badge mx-auto mb-3">
            <i className="bi bi-shield-check me-2"></i> Official FIE Platform
          </div>
          <h1 className="hero-title fw-black mb-3">
            Building the Future of <span className="text-gradient">eFootball Competition</span>
          </h1>
          <p className="hero-subtitle mx-auto mb-4 text-white-50">
            Rankings is the premier tournament engine and global ranking system for competitive eFootball players, organizers, and federations worldwide.
          </p>
          <div className="d-flex justify-content-center gap-3">
            <Link to="/activetournaments" className="btn-primary-glass">
              <i className="bi bi-controller me-2"></i> Explore Tournaments
            </Link>
            <Link to="/register" className="btn-secondary-glass">
              <i className="bi bi-trophy me-2"></i> Host Competition
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="container py-4">
        <div className="row g-4">
          <div className="col-md-4">
            <div className="feature-card">
              <div className="feature-icon mb-3">
                <i className="bi bi-diagram-3-fill"></i>
              </div>
              <h5 className="fw-bold text-white mb-2">Automated Management</h5>
              <p className="text-white-50 fs-7 mb-0">
                Effortlessly manage fixtures, brackets, league tables, walkovers, and live score updates.
              </p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="feature-card">
              <div className="feature-icon mb-3">
                <i className="bi bi-graph-up-arrow"></i>
              </div>
              <h5 className="fw-bold text-white mb-2">Real-time Rankings</h5>
              <p className="text-white-50 fs-7 mb-0">
                Track win-loss ratios, goal differentials, and global standings as you compete.
              </p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="feature-card">
              <div className="feature-icon mb-3">
                <i className="bi bi-award-fill"></i>
              </div>
              <h5 className="fw-bold text-white mb-2">Prize & Honor</h5>
              <p className="text-white-50 fs-7 mb-0">
                Compete for cash rewards or battle for community prestige and official rankings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container py-5">
        <div className="text-center mb-5">
          <h2 className="section-title fw-extrabold text-white">Frequently Asked Questions</h2>
          <p className="text-white-50">Everything you need to know about competing and hosting on Rankings.</p>
        </div>

        <div className="faq-accordion mx-auto">
          {faqData.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`faq-item mb-3 ${isOpen ? "faq-item-open" : ""}`}
              >
                <button
                  className="faq-question w-100 text-start d-flex justify-content-between align-items-center"
                  onClick={() => toggleAccordion(index)}
                  aria-expanded={isOpen}
                >
                  <span className="fw-bold text-white pe-3">{faq.question}</span>
                  <div className="faq-chevron-icon">
                    <i className={`bi ${isOpen ? "bi-chevron-up" : "bi-chevron-down"}`}></i>
                  </div>
                </button>
                <div className={`faq-answer ${isOpen ? "show" : ""}`}>
                  <p className="text-white-50 pt-2 mb-0 fs-6 lh-base">{faq.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Style block */}
      <style>{`
        .about-container {
          min-height: 100vh;
          background: #030a1a;
          color: #ffffff;
          padding-top: 105px;
          padding-bottom: 80px;
        }

        .about-hero {
          position: relative;
          background: radial-gradient(circle at 50% 0%, rgba(13, 110, 253, 0.2) 0%, transparent 70%);
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.4rem 1rem;
          background: rgba(13, 110, 253, 0.15);
          border: 1px solid rgba(56, 189, 248, 0.3);
          border-radius: 30px;
          color: #38bdf8;
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .hero-title {
          font-size: 2.5rem;
          letter-spacing: -1px;
        }

        .text-gradient {
          background: linear-gradient(135deg, #60a5fa 30%, #fd7e14 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
          max-width: 650px;
          font-size: 1.05rem;
          line-height: 1.6;
        }

        .btn-primary-glass {
          display: inline-flex;
          align-items: center;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, rgba(13, 110, 253, 0.8), rgba(13, 110, 253, 0.4));
          border: 1px solid rgba(56, 189, 248, 0.4);
          border-radius: 12px;
          color: #fff;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.25s ease;
          box-shadow: 0 4px 20px rgba(13, 110, 253, 0.3);
        }

        .btn-primary-glass:hover {
          color: #fff;
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(13, 110, 253, 0.5);
        }

        .btn-secondary-glass {
          display: inline-flex;
          align-items: center;
          padding: 0.75rem 1.5rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          color: #fff;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.25s ease;
        }

        .btn-secondary-glass:hover {
          color: #fff;
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }

        .feature-card {
          padding: 1.75rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          backdrop-filter: blur(10px);
          height: 100%;
          transition: transform 0.25s ease, border-color 0.25s ease;
        }

        .feature-card:hover {
          transform: translateY(-4px);
          border-color: rgba(56, 189, 248, 0.3);
        }

        .feature-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: rgba(56, 189, 248, 0.1);
          color: #38bdf8;
          font-size: 1.5rem;
        }

        .faq-accordion {
          max-width: 800px;
        }

        .faq-item {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 1.2rem 1.5rem;
          transition: all 0.25s ease;
          overflow: hidden;
        }

        .faq-item:hover {
          border-color: rgba(255, 255, 255, 0.18);
          background: rgba(255, 255, 255, 0.05);
        }

        .faq-item-open {
          background: rgba(13, 110, 253, 0.08);
          border-color: rgba(56, 189, 248, 0.3);
        }

        .faq-question {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
        }

        .faq-chevron-icon {
          color: #38bdf8;
          font-size: 1.1rem;
        }

        .faq-answer {
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          transition: max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
        }

        .faq-answer.show {
          max-height: 300px;
          opacity: 1;
        }

        .fs-7 { font-size: 0.875rem; }

        @media (max-width: 768px) {
          .hero-title { font-size: 1.8rem; }
          .hero-subtitle { font-size: 0.95rem; }
          .feature-card { padding: 1.25rem; }
        }
      `}</style>
    </div>
  );
}