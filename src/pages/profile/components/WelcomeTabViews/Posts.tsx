import React, { useState, useEffect } from "react";
import { supabase } from "../../../../supabase";
import SocialEmbed, { getSocialEmbedInfo } from "../SocialEmbed";

interface NewsItem {
  id: number;
  title: string;
  summary: string;
  image_url?: string;
  views: number;
  likes: number;
  created_at: string;
}

const CACHE_DURATION = 5 * 60 * 1000;
const CACHE_KEY = "newspaper_posts_cache";

const SkeletonLoader = () => (
  <div className="d-flex flex-column gap-3 pb-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="card shadow-sm border-0">
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold me-3" 
                 style={{ width: "48px", height: "48px", fontSize: "18px" }}>
              N
            </div>
            <div className="flex-grow-1">
              <div className="fw-bold placeholder-glow">
                <span className="placeholder col-6"></span>
              </div>
              <small className="text-muted placeholder-glow">
                <span className="placeholder col-8"></span>
              </small>
            </div>
          </div>
          <div className="placeholder-glow">
            <span className="placeholder col-12 mb-2" style={{ height: "20px" }}></span>
            <span className="placeholder col-10" style={{ height: "20px" }}></span>
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default function NewspaperPosts() {
  const [posts, setPosts] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [likingId, setLikingId] = useState<number | null>(null);

  useEffect(() => {
    const loadPostsWithCache = async () => {
      try {
        const cachedData = localStorage.getItem(CACHE_KEY);
        const cacheTimestamp = localStorage.getItem(`${CACHE_KEY}_timestamp`);
        
        if (cachedData && cacheTimestamp) {
          const isExpired = Date.now() - parseInt(cacheTimestamp) > CACHE_DURATION;
          if (!isExpired) {
            setPosts(JSON.parse(cachedData));
            setLoading(false);
            fetchPosts(true);
            return;
          }
        }
        await fetchPosts(false);
      } catch (err) {
        console.error("Error checking cache:", err);
        await fetchPosts(false);
      }
    };
    loadPostsWithCache();
  }, []);

  const fetchPosts = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      
      const { data, error } = await supabase
        .from('posts')
        .select('id, title, summary, image_url, views, likes, created_at')
        .order('id', { ascending: false });

      if (error) throw error;
      
      const postsData = data || [];
      setPosts(postsData);
      
      localStorage.setItem(CACHE_KEY, JSON.stringify(postsData));
      localStorage.setItem(`${CACHE_KEY}_timestamp`, Date.now().toString());
    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const handleLike = async (postId: number) => {
    if (likingId === postId) return;
    setLikingId(postId);

    try {
      const updatedPosts = posts.map((post) =>
        post.id === postId ? { ...post, likes: (post.likes || 0) + 1 } : post
      );
      setPosts(updatedPosts);

      const { error } = await supabase.rpc("increment_post_likes", { post_id: postId });
      if (error) throw error;

      localStorage.setItem(CACHE_KEY, JSON.stringify(updatedPosts));
    } catch (err) {
      console.error("Error increasing likes:", err);
      await fetchPosts(true);
    } finally {
      setLikingId(null);
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffMs = now.getTime() - postDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} mins ago`;
    return `${Math.floor(diffMins / 60)} hours ago`;
  };

  const extractFirstUrl = (text: string): string | null => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex);
    return matches && matches.length > 0 ? matches[0] : null;
  };

  if (loading && posts.length === 0) {
    return <SkeletonLoader />;
  }

  return (
<div
  className="d-flex flex-column gap-3 px-2" // Added slight horizontal padding for scrollbar clearance
  style={{
    height: "calc(100vh - 60px)", // Subtract your header height here
    overflowY: "auto",
    paddingBottom: "50rem",        // Creates perfect breathing room for the last post
  }}
>
      {posts.length === 0 ? (
        <div className="card shadow-sm border-0">
          <div className="card-body text-center py-5">
            <p className="text-muted">No posts yet.</p>
          </div>
        </div>
      ) : (
        posts.map((story) => {
          const targetMediaUrl = story.image_url?.trim() || extractFirstUrl(story.summary);
          const { type } = getSocialEmbedInfo(targetMediaUrl || "");

          let displaySummary = story.summary;
          if (targetMediaUrl && !story.image_url?.trim()) {
            displaySummary = displaySummary.replace(targetMediaUrl, "").trim();
          }

          return (
            <div key={story.id} className="card shadow-sm border-0">
              <div className="card-body">
                {/* Top - Source Info */}
                <div className="d-flex align-items-center mb-3">
             
                  <div className="flex-grow-1">
                    <div className="fw-bold">My Feed</div>
                    <small className="text-muted">
                      All Posts • {formatTimeAgo(story.created_at)}
                    </small>
                  </div>
                </div>

                {/* Title */}
                <h3 className="fw-bold mb-3" style={{ fontSize: "1.25rem", lineHeight: "1.3" }}>
                  {story.title}
                </h3>

                {/* Summary */}
                {displaySummary && (
                  <p className="mb-3 text-muted" style={{ lineHeight: "1.55" }}>
                    {displaySummary}
                  </p>
                )}

                {/* Image */}
                {story.image_url && type === "image" && (
                  <div className="mb-3 rounded overflow-hidden">
                    <img
                      src={story.image_url}
                      alt={story.title}
                      className="w-100"
                      style={{ maxHeight: "380px", objectFit: "cover" }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Social Embed */}
                {targetMediaUrl && type !== "image" && (
                  <div className="mb-3">
                    <SocialEmbed url={targetMediaUrl} />
                  </div>
                )}

                {/* Actions */}
                <div className="d-flex gap-4 text-muted pt-2">
                  <div className="d-flex align-items-center">
                    <i className="bi bi-eye me-2"></i>
                    {story.views || 0}
                  </div>

                  <button
                    onClick={() => handleLike(story.id)}
                    disabled={likingId === story.id}
                    className="d-flex align-items-center border-0 bg-transparent p-0 text-muted"
                    style={{ cursor: likingId === story.id ? "not-allowed" : "pointer" }}
                  >
                    <i className={`bi ${likingId === story.id ? "bi-heart-fill" : "bi-heart"} me-2`}></i>
                    {story.likes || 0}
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}