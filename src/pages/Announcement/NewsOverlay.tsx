// NewsOverlay.tsx
import React, { useEffect } from "react";

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

interface NewsOverlayProps {
  story: NewsItem | null;
  onClose: () => void;
}

export default function NewsOverlay({ story, onClose }: NewsOverlayProps) {
  // Prevent background scrolling when overlay is active
  useEffect(() => {
    if (story) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    }
  }, [story]);

  if (!story) return null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-end"
      style={{
        zIndex: 1050,
        backgroundColor: "rgba(3, 10, 19, 0.85)",
        backdropFilter: "blur(4px)",
        transition: "all 0.3s ease-in-out",
      }}
      onClick={onClose} // Closes when clicking outside the main panel
    >
      <div
        className="h-100 d-flex flex-column"
        style={{
          width: "100%",
          maxWidth: "75vw", // Exactly 3/4 width of the viewport on large screens
          backgroundColor: "#0b1d36",
          borderLeft: "1px solid rgba(77, 163, 255, 0.25)",
          boxShadow: "-10px 0 30px rgba(0, 0, 0, 0.5)",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()} // Keeps click events inside the panel safe
      >
        {/* Header Action Bar */}
        <div 
          className="d-flex justify-content-between align-items-center p-3 sticky-top"
          style={{ 
            backgroundColor: "#0b1d36", 
            borderBottom: "1px solid rgba(77, 163, 255, 0.15)" 
          }}
        >
          <button 
            onClick={onClose}
            className="btn btn-sm text-white-50 border-0 d-flex align-items-center gap-1"
            style={{ fontFamily: "system-ui, sans-serif", fontSize: "13px" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#4da3ff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
          >
            CLOSE <span style={{ fontSize: "16px" }}>✕</span>
          </button>
        </div>

        {/* Full Story Content */}
        <div className="p-4 p-md-5 mx-auto" style={{ maxWidth: "800px", fontFamily: "'Times New Roman', Times, serif" }}>
          
          {/* Metadata */}
          <div className="mb-3" style={{ fontFamily: "system-ui, sans-serif" }}>
            <span className="fw-bold text-uppercase tracking-wider" style={{ color: "#4da3ff", fontSize: "11px" }}>
              {story.category}
            </span>
            <span className="mx-2" style={{ color: "rgba(77, 163, 255, 0.3)" }}>•</span>
            <span className="text-white-50 font-monospace text-uppercase" style={{ fontSize: "11px" }}>{story.timeAgo}</span>
          </div>

          {/* Headline Title */}
          <h1 className="fw-bold mb-4 text-white" style={{ fontSize: "2.5rem", lineHeight: "1.15" }}>
            {story.title}
          </h1>

          {/* Publisher / Wire Line */}
          <div 
            className="d-flex gap-3 mb-4 py-2 border-top border-bottom text-white-50" 
            style={{ fontFamily: "system-ui, sans-serif", fontSize: "12px", borderColor: "rgba(77, 163, 255, 0.15) !important" }}
          >
            <div>Source: <strong className="text-white">{story.source.toUpperCase()}</strong></div>
            <div>Location: <strong className="text-white">{story.location}</strong></div>
          </div>

          {/* Feature Image Frame */}
          <div 
            className="w-100 mb-4 overflow-hidden bg-dark"
            style={{ 
              maxHeight: "400px", 
              border: "1px solid rgba(77, 163, 255, 0.2)" 
            }}
          >
            <img 
              src={story.imageUrl} 
              alt={story.title} 
              className="w-100 h-100"
              style={{ objectFit: "cover", filter: "grayscale(10%) contrast(105%)" }}
            />
          </div>

          {/* Body Article Blocks */}
          <div 
            style={{ 
              color: "#cfe6ff", 
              fontSize: "17px", 
              lineHeight: "1.6",
              textAlign: "justify"
            }}
          >
            <p>
              <span className="fw-bold me-2" style={{ fontFamily: "system-ui, sans-serif", color: "#4da3ff" }}>
                {story.location.toUpperCase()} —
              </span>
              {story.summary}
            </p>
            
            {/* Added supplementary realistic content fills to simulate a "Full Read" experience */}
            <p className="mt-4 text-white-50" style={{ fontSize: "15px", fontStyle: "italic" }}>
          more information to be uploaded soon!  </p>
          </div>
        </div>
      </div>
    </div>
  );
}