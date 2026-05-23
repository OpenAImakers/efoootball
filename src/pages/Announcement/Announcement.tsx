// NewspaperNewsPage.tsx
import React, { useState } from "react";
import NewspaperMasthead from "./NewspaperMasthead";
import NewsOverlay from "./NewsOverlay";

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  category: "NATIONAL SQUAD" | "TRANSFERS" | "TOURNAMENTS" | "CAMPUS LEAGUE" | "ANNOUNCEMENTS";
  source: string;
  timeAgo: string;
  location: string;
  imageUrl: string;
}

const KENYAN_EFOOTBALL_NEWS: NewsItem[] = [
  {
    "id": "news-rule-breakdown",
    "title": "Seasonal Rankings schedule",
    "summary": "The efootball rankings - the official tournament system, will be operating across two high-intensity seasons per year, competitive ranking points will be accumulated through local tournaments. At the end of every seasonal date, the Top 10 leaderboard players will earn direct placement to the Regional Championship Finals, a week long battle featuring premium prize pools, live match broadcasts, and official titles.",
    "category": "ANNOUNCEMENTS",
    "source": "kefR",
    "timeAgo": "Today",
    "location": "All",
    "imageUrl": "/teamlogo.png"
  }
];

export default function NewspaperNewsPage() {
  const [activeStory, setActiveStory] = useState<NewsItem | null>(null);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#071426", 
        color: "#ffffff",
        fontFamily: "'Times New Roman', Times, serif",
      }}
    >
      {/* SEPARATED STICKY MASTHEAD COMPONENT */}
      <NewspaperMasthead />

      {/* NEWSPAPER ROW STREAM */}
      <div className="container py-5">
        <div className="d-flex flex-column" style={{ maxWidth: "850px", margin: "0 auto" }}>
          {KENYAN_EFOOTBALL_NEWS.map((story, idx) => (
            <div 
              key={story.id}
              className="d-flex flex-column flex-sm-row gap-4 py-4"
              style={{ 
                background: "transparent",
                borderBottom: idx !== KENYAN_EFOOTBALL_NEWS.length - 1 ? "1px solid rgba(77, 163, 255, 0.2)" : "none",
              }}
            >
              {/* Image Frame Box */}
              <div 
                className="overflow-hidden bg-dark"
                style={{ 
                  width: "100%", 
                  maxWidth: "160px", 
                  height: "110px", 
                  flexShrink: 0,
                  border: "1px solid rgba(77, 163, 255, 0.25)",
                }}
              >
                <img 
                  src={story.imageUrl} 
                  alt="News wire item representation" 
                  className="w-100 h-100"
                  style={{ objectFit: "cover", filter: "grayscale(20%) contrast(110%)" }}
                />
              </div>

              {/* Newspaper Content Column */}
              <div className="d-flex flex-column justify-content-between flex-grow-1">
                <div>
                  <div className="mb-1" style={{ fontFamily: "system-ui, sans-serif" }}>
                    <span className="fw-bold text-uppercase tracking-wider" style={{ color: "#4da3ff", fontSize: "10px" }}>
                       〔 {story.category} 〕
                    </span>
                  </div>

                  {/* Intercept anchor to trigger side-panel state */}
                  <a 
                    href={`#story-${story.id}`} 
                    className="text-decoration-none"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveStory(story);
                    }}
                  >
                    <h3 
                      className="fw-bold mb-2" 
                      style={{ 
                        color: "#ffffff", 
                        fontSize: "1.35rem", 
                        lineHeight: "1.25", 
                        transition: "color 0.1s" 
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#4da3ff")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#ffffff")}
                    >
                      {story.title}
                    </h3>
                  </a>

                  <p 
                    className="mb-3 font-normal" 
                    style={{ 
                      color: "#cfe6ff", 
                      fontSize: "14.5px", 
                      lineHeight: "1.5",
                      textAlign: "justify",
                      opacity: 0.85
                    }}
                  >
                    <span className="fw-bold me-1" style={{ fontFamily: "system-ui, sans-serif", fontSize: "12px", color: "#4da3ff" }}>
                      {story.location.toUpperCase()} —
                    </span>
                    {story.summary}
                  </p>
                </div>

                {/* Newspaper Meta Footer Row split between source details and the 'Read More' link */}
                <div 
                  className="d-flex justify-content-between align-items-center pt-1 border-top" 
                  style={{ 
                    fontFamily: "system-ui, sans-serif",
                    borderColor: "rgba(77, 163, 255, 0.08)"
                  }}
                >
                  {/* Left Side: Source Tracking */}
                  <div className="d-flex align-items-center gap-2" style={{ color: "#9bb9d4", fontSize: "11px" }}>
                    <span className="fw-bold text-white uppercase">{story.source}</span>
                    <span style={{ color: "rgba(77, 163, 255, 0.3)" }}>•</span>
                    <span className="font-monospace text-uppercase">{story.timeAgo}</span>
                  </div>

                  {/* Right Side: Read More Link Anchor mapped to side-panel state */}
                  <a 
                    href={`#story-${story.id}`} 
                    className="text-decoration-none fw-bold"
                    style={{ 
                      fontSize: "11px", 
                      color: "#4da3ff", 
                      letterSpacing: "0.5px",
                      transition: "opacity 0.15s"
                    }}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveStory(story);
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    READ MORE ➔
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RENDER THE OVERLAY PANEL DRIVEN BY SELECTION */}
      <NewsOverlay 
        story={activeStory} 
        onClose={() => setActiveStory(null)} 
      />
    </div>
  );
}