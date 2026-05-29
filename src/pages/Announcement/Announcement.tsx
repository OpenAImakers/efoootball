import React, { useState, useEffect, Fragment } from "react";
import NewspaperMasthead from "./NewspaperMasthead";
import NewsOverlay from "./NewsOverlay";
import { supabase } from "../../supabase";
import Profiles from "./Profiles";
import FeaturedPlayers from "../../fie/components/FeaturedPlayers";

interface NewsItem {
  id: number;
  title: string;
  summary: string;
  image_url?: string;
  views: number;
  created_at: string;
}

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;
const CACHE_KEY = "newspaper_posts_cache";

// Skeleton Loading Component
const SkeletonLoader = () => {
  return (
    <div style={{ minHeight: "100vh", background: "#071426", color: "#ffffff" }}>
      <NewspaperMasthead />
      <div className="container py-5">
        <div className="d-flex flex-column" style={{ maxWidth: "850px", margin: "0 auto" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="d-flex flex-column flex-sm-row gap-4 py-4">
              {/* Skeleton Image */}
              <div 
                className="flex-shrink-0"
                style={{ 
                  width: "100%", 
                  maxWidth: "160px", 
                  height: "110px",
                  background: "linear-gradient(90deg, #1a2a3a 25%, #2a3a4a 50%, #1a2a3a 75%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1.5s infinite",
                  borderRadius: "4px"
                }}
              />
              
              <div className="flex-grow-1 w-100">
                {/* Skeleton Title */}
                <div 
                  style={{ 
                    height: "28px", 
                    width: "80%", 
                    background: "linear-gradient(90deg, #1a2a3a 25%, #2a3a4a 50%, #1a2a3a 75%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.5s infinite",
                    borderRadius: "4px",
                    marginBottom: "12px"
                  }}
                />
                
                {/* Skeleton Summary lines */}
                <div 
                  style={{ 
                    height: "60px", 
                    width: "100%", 
                    background: "linear-gradient(90deg, #1a2a3a 25%, #2a3a4a 50%, #1a2a3a 75%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.5s infinite",
                    borderRadius: "4px",
                    marginBottom: "16px"
                  }}
                />
                
                {/* Skeleton Footer */}
                <div className="d-flex justify-content-between align-items-center pt-2">
                  <div 
                    style={{ 
                      height: "16px", 
                      width: "120px", 
                      background: "linear-gradient(90deg, #1a2a3a 25%, #2a3a4a 50%, #1a2a3a 75%)",
                      backgroundSize: "200% 100%",
                      animation: "shimmer 1.5s infinite",
                      borderRadius: "4px"
                    }}
                  />
                  <div 
                    style={{ 
                      height: "16px", 
                      width: "80px", 
                      background: "linear-gradient(90deg, #1a2a3a 25%, #2a3a4a 50%, #1a2a3a 75%)",
                      backgroundSize: "200% 100%",
                      animation: "shimmer 1.5s infinite",
                      borderRadius: "4px"
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
};

export default function NewspaperNewsPage() {
  const [activeStory, setActiveStory] = useState<NewsItem | null>(null);
  const [posts, setPosts] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadPostsWithCache = async () => {
    try {
      // Check cache first
      const cachedData = localStorage.getItem(CACHE_KEY);
      const cacheTimestamp = localStorage.getItem(`${CACHE_KEY}_timestamp`);
      
      if (cachedData && cacheTimestamp) {
        const isExpired = Date.now() - parseInt(cacheTimestamp) > CACHE_DURATION;
        
        if (!isExpired) {
          // Use cached data
          const parsedData = JSON.parse(cachedData);
          setPosts(parsedData);
          setLoading(false);
          
          // Refresh in background
          fetchPosts(true);
          return;
        }
      }
      
      // No cache or expired, fetch fresh
      await fetchPosts(false);
      
    } catch (err) {
      console.error("Error loading posts from cache:", err);
      await fetchPosts(false);
    }
  };

  loadPostsWithCache();
}, []); // No dependency warning now!

  const fetchPosts = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      
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
      
      const postsData = data || [];
      setPosts(postsData);
      
      // Save to cache
      localStorage.setItem(CACHE_KEY, JSON.stringify(postsData));
      localStorage.setItem(`${CACHE_KEY}_timestamp`, Date.now().toString());
      
    } catch (err: any) {
      console.error("Error fetching posts:", err);
    } finally {
      if (!isBackground) setLoading(false);
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
      
      // Update cache with new view count
      const updatedPosts = posts.map(post =>
        post.id === story.id
          ? { ...post, views: (post.views || 0) + 1 }
          : post
      );
      localStorage.setItem(CACHE_KEY, JSON.stringify(updatedPosts));
      
    } catch (err) {
      console.error("Error incrementing views:", err);
    }
  };

  // Show skeleton while loading
  if (loading && posts.length === 0) {
    return <SkeletonLoader />;
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
       <FeaturedPlayers/>

      <div className="container py-5">
        <div className="d-flex flex-column" style={{  margin: "0 auto" }}>
          {posts.length === 0 ? (
            <div className="text-center py-5">
              <p style={{ color: "#9bb9d4" }}>No posts yet.</p>
            </div>
          ) : (
            posts.map((story, idx) => {
              const ytId = extractFirstYouTubeId(story.summary);
              const hasImage = story.image_url && story.image_url.trim() !== "";

              return (
                <Fragment key={story.id}>
                 
                  {/* Post Content */}
                  <div 
                    className="d-flex flex-column flex-sm-row gap-4 py-4"
                    style={{ 
                      background: "transparent",
                      borderBottom: "1px solid rgba(77, 163, 255, 0.25)",
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
                            WebkitLineClamp: ytId ? 2 : 4,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            textOverflow: "ellipsis"
                          }}
                        >
                          {story.summary.replace(/https?:\/\/\S+/g, "").trim()}
                        </p>

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

                  {/* Profiles Component - Shows After EVERY Post */}
                  <Profiles />
                  
                </Fragment>
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