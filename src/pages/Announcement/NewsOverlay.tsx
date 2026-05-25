import React, { useEffect } from "react";

interface NewsItem {
  id: number;
  title: string;
  summary: string;
  image_url?: string;
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
    };
  }, [story]);

  if (!story) return null;

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const renderContent = (text: string) => {
    if (!text) return null;

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const paragraphs = text.split(/\n+/);

    return paragraphs.map((paragraph, pIdx) => {
      const parts = paragraph.split(urlRegex);

      return (
        <p key={pIdx} className="mb-4" style={{ textIndent: pIdx > 0 ? "20px" : "0" }}>
          {parts.map((part, i) => {
            if (part.match(urlRegex)) {
              const ytId = getYouTubeId(part);

              if (ytId) {
                return (
                  <span key={i} className="d-block my-3">
                    <a
                      href={part}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#4da3ff", textDecoration: "underline" }}
                    >
                      Watch on YouTube ↗
                    </a>
                    <div
                      className="ratio ratio-16x9 mt-2"
                      style={{
                        borderRadius: "8px",
                        overflow: "hidden",
                        border: "1px solid rgba(77, 163, 255, 0.3)",
                      }}
                    >
                      <iframe
                        src={`https://www.youtube.com/embed/${ytId}`}
                        title="YouTube video player"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                  </span>
                );
              }

              return (
                <a
                  key={i}
                  href={part}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#4da3ff", textDecoration: "underline" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#80bfff")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#4da3ff")}
                >
                  {part}
                </a>
              );
            }
            return part;
          })}
        </p>
      );
    });
  };

  const hasImage = story.image_url && story.image_url.trim() !== "";

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-end"
      style={{
        zIndex: 1050,
        backgroundColor: "rgba(3, 10, 19, 0.85)",
        backdropFilter: "blur(4px)",
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
            borderBottom: "1px solid rgba(77, 163, 255, 0.15)",
          }}
        >
          <button onClick={onClose} className="btn btn-sm text-white-50 border-0">
            CLOSE <span style={{ fontSize: "16px" }}>✕</span>
          </button>
        </div>

        <div
          className="p-4 p-md-5 mx-auto"
          style={{ maxWidth: "800px", width: "100%", fontFamily: "'Times New Roman', Times, serif" }}
        >
          <h1 className="fw-bold mb-4 text-white" style={{ fontSize: "2.5rem", lineHeight: "1.15" }}>
            {story.title}
          </h1>

          {/* Conditional Layout: Hidden entirely if image_url is missing */}
          {hasImage && (
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
                  objectFit: "contain",
                  borderRadius: "4px",
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/teamlogo.png";
                }}
              />
            </div>
          )}

          <div style={{ color: "#cfe6ff", fontSize: "17px", lineHeight: "1.6", textAlign: "justify" }}>
            {renderContent(story.summary)}
          </div>
        </div>
      </div>
    </div>
  );
}