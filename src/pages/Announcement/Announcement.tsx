import React, { useState, useEffect } from "react";
import NewspaperMasthead from "./NewspaperMasthead";
import NewsOverlay from "./NewsOverlay";
import { supabase } from "../../supabase";

interface NewsItem {
  id: number;
  title: string;
  summary: string;
  image_url?: string; // Optional field now
  views: number;
  created_at: string;
}

export default function NewspaperNewsPage() {
  const [activeStory, setActiveStory] = useState<NewsItem | null>(null);
  const [posts, setPosts] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          summary,
          image_url,
          views,
          created_at
        `)
        .order('id', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (err: any) {
      console.error("Error fetching posts:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Helper to find the first YouTube URL inside text
  const extractFirstYouTubeId = (text: string) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex);
    if (matches) {
      for (const url of matches) {
        const id = getYouTubeId(url);
        if (id) return id;
      }
    }
    return null;
  };

  const openStory = async (story: NewsItem) => {
    setActiveStory(story);

    try {
      await supabase.rpc("increment_post_views", {
        post_id: story.id,
      });

      setPosts((current) =>
        current.map((post) =>
          post.id === story.id
            ? {
                ...post,
                views: (post.views || 0) + 1,
              }
            : post
        )
      );
    } catch (err) {
      console.error("Error incrementing views:", err);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#071426", color: "#ffffff" }}>
        <NewspaperMasthead />
        <div className="container py-5 text-center">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
            <div className="spinner-border text-primary mb-3" role="status" style={{ color: "#4da3ff" }}>
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#071426", 
        color: "#ffffff",
        fontFamily: "'Times New Roman', Times, serif",
      }}
    >
      <NewspaperMasthead />

      <div className="container py-5">
        <div className="d-flex flex-column" style={{ maxWidth: "850px", margin: "0 auto" }}>
          {posts.length === 0 ? (
            <div className="text-center py-5">
              <p style={{ color: "#9bb9d4" }}>No posts yet.</p>
            </div>
          ) : (
            posts.map((story, idx) => {
              const ytId = extractFirstYouTubeId(story.summary);
              const hasImage = story.image_url && story.image_url.trim() !== "";

              return (
                <div 
                  key={story.id}
                  className="d-flex flex-column flex-sm-row gap-4 py-4"
                  style={{ 
                    background: "transparent",
                    borderBottom: idx !== posts.length - 1 ? "1px solid rgba(77, 163, 255, 0.25)" : "none",
                  }}
                >
                  {/* Conditional Photo rendering */}
                  {hasImage && (
                    <div 
                      className="overflow-hidden bg-dark flex-shrink-0 align-self-start"
                      style={{ 
                        width: "100%", 
                        maxWidth: "160px", 
                        height: "110px", 
                        border: "1px solid rgba(77, 163, 255, 0.25)",
                      }}
                    >
                      <img 
                        src={story.image_url} 
                        alt="Post Layout" 
                        className="w-100 h-100"
                        style={{ objectFit: "cover", filter: "grayscale(20%) contrast(110%)" }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/teamlogo.png";
                        }}
                      />
                    </div>
                  )}

                  <div className="d-flex flex-column justify-content-between flex-grow-1 w-100">
                    <div>
                      <a 
                        href={`#story-${story.id}`} 
                        className="text-decoration-none"
                        onClick={(e) => {
                          e.preventDefault();
                          openStory(story);
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
                        className="mb-3" 
                        style={{ 
                          color: "#cfe6ff", 
                          fontSize: "14.5px", 
                          lineHeight: "1.5",
                          textAlign: "justify",
                          opacity: 0.85,
                          display: "-webkit-box",
                          WebkitLineClamp: ytId ? 2 : 4, // Make room for inline player if it exists
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}
                      >
                        {story.summary.replace(/https?:\/\/\S+/g, "").trim() /* Remove URLs for summary preview */}
                      </p>

                      {/* Video Player Display in Feed List */}
                      {ytId && (
                        <div 
                          className="ratio ratio-16x9 mb-3" 
                          style={{ 
                            maxWidth: "450px", 
                            borderRadius: "6px", 
                            overflow: "hidden", 
                            border: "1px solid rgba(77, 163, 255, 0.2)" 
                          }}
                        >
                          <iframe
                            src={`https://www.youtube.com/embed/${ytId}`}
                            title="Feed YouTube player"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        </div>
                      )}
                    </div>

                    <div 
                      className="d-flex justify-content-between align-items-center pt-2 border-top"
                      style={{
                        fontFamily: "system-ui, sans-serif",
                        borderColor: "rgba(77, 163, 255, 0.08)",
                      }}
                    >
                      <div
                        className="d-flex align-items-center gap-3"
                        style={{
                          color: "#9bb9d4",
                          fontSize: "11px",
                          letterSpacing: "0.5px",
                        }}
                      >
                        <span>{formatDate(story.created_at)}</span>
                        <span className="d-flex align-items-center gap-1">
                          <i className="bi bi-eye" style={{ fontSize: "13px" }}></i>
                          {story.views || 0}
                        </span>
                      </div>

                      <a
                        href={`#story-${story.id}`}
                        className="text-decoration-none fw-bold"
                        style={{
                          fontSize: "11px",
                          color: "#4da3ff",
                          letterSpacing: "0.5px",
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          openStory(story);
                        }}
                      >
                        READ MORE ➔
                      </a>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <NewsOverlay 
        story={activeStory} 
        onClose={() => setActiveStory(null)} 
      />
    </div>
  );
}