// NewsOverlay.tsx
import React, { useEffect } from "react";

interface NewsItem {
  id: number;
  title: string;
  summary: string;
  image_url: string;
}

interface NewsOverlayProps {
  story: NewsItem | null;
  onClose: () => void;
}

export default function NewsOverlay({ story, onClose }: NewsOverlayProps) {
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
      onClick={onClose}
    >
      <div
        className="h-100 d-flex flex-column"
        style={{
          width: "100%",
          maxWidth: "75vw",
          backgroundColor: "#0b1d36",
          borderLeft: "1px solid rgba(77, 163, 255, 0.25)",
          boxShadow: "-10px 0 30px rgba(0, 0, 0, 0.5)",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="d-flex justify-content-end align-items-center p-3 sticky-top"
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

        <div className="p-4 p-md-5 mx-auto" style={{ maxWidth: "800px", width: "100%", fontFamily: "'Times New Roman', Times, serif" }}>
          
          <h1 className="fw-bold mb-4 text-white" style={{ fontSize: "2.5rem", lineHeight: "1.15" }}>
            {story.title}
          </h1>

          {/* Improved Image Container */}
          <div 
            className="w-100 mb-4 d-flex justify-content-center align-items-center"
            style={{ 
              backgroundColor: "#071426",
              borderRadius: "8px",
              minHeight: "300px",
              maxHeight: "500px",
            }}
          >
            <img 
              src={story.image_url} 
              alt={story.title} 
              style={{ 
                maxWidth: "100%",
                maxHeight: "500px",
                width: "auto",
                height: "auto",
                objectFit: "contain",
                display: "block",
                borderRadius: "4px"
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = "/teamlogo.png";
              }}
            />
          </div>

          <div 
            style={{ 
              color: "#cfe6ff", 
              fontSize: "17px", 
              lineHeight: "1.6",
              textAlign: "justify"
            }}
          >
            <p>{story.summary}</p>
          </div>
        </div>
      </div>
    </div>
  );
}