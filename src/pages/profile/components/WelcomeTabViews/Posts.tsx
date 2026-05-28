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
  user_id: string;
  profiles?: {
    username: string;
    display_name: string;
    profile_pic: string;
  } | null;
}

interface ExpandedState {
  [key: number]: boolean;
}

const CACHE_DURATION = 5 * 60 * 1000;
const CACHE_KEY = "newspaper_posts_cache";
const MAX_PREVIEW_LENGTH = 300;

const SkeletonLoader = () => (
  <div className="d-flex flex-column gap-3 pb-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="card shadow-sm border-0">
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <div className="rounded-circle bg-secondary d-flex align-items-center justify-content-center me-3" 
                 style={{ width: "48px", height: "48px" }}>
              <div className="placeholder rounded-circle w-100 h-100"></div>
            </div>
            <div className="flex-grow-1">
              <div className="placeholder-glow">
                <span className="placeholder col-6"></span>
              </div>
              <small className="placeholder-glow">
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
  const [expandedPosts, setExpandedPosts] = useState<ExpandedState>({});

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
        .select(`
          id, 
          title, 
          summary, 
          image_url, 
          views, 
          likes, 
          created_at,
          user_id,
          profiles (
            username,
            display_name,
            profile_pic
          )
        `)
        .order('id', { ascending: false });

      if (error) throw error;
      
      const postsData = (data as unknown as NewsItem[]) || [];
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
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    return postDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: postDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  // Extract all URLs from text
  const extractAllUrls = (text: string): string[] => {
    if (!text) return [];
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex);
    return matches || [];
  };

  // Get the primary embed URL (first social media embed found)
  const getPrimaryEmbedUrl = (summary: string, imageUrl?: string): string | null => {
    if (imageUrl?.trim()) return imageUrl;
    
    const urls = extractAllUrls(summary);
    for (const url of urls) {
      const { type } = getSocialEmbedInfo(url);
      if (type !== 'link') return url;
    }
    return null;
  };

  // Convert URLs to clickable links
  const convertUrlsToLinks = (text: string): React.ReactNode => {
    if (!text) return null;
    
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (part && part.match(urlRegex)) {
        // Don't render social media embeds as links if they're the primary embed
        const { type } = getSocialEmbedInfo(part);
        if (type !== 'link') {
          return null; // Skip rendering social media URLs as links
        }
        
        // Truncate long URLs for display
        let displayUrl = part;
        if (part.length > 50) {
          try {
            const urlObj = new URL(part);
            displayUrl = `${urlObj.hostname}${urlObj.pathname.substring(0, 30)}...`;
          } catch (e) {
            displayUrl = part.substring(0, 47) + '...';
          }
        }
        
        return (
          <a 
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary text-decoration-none hover-underline"
            style={{ wordBreak: 'break-all' }}
            title={part}
          >
            {displayUrl}
            <i className="bi bi-box-arrow-up-right ms-1" style={{ fontSize: '0.75em' }}></i>
          </a>
        );
      }
      return part;
    });
  };

  // Format text with mentions, hashtags, line breaks, and links
  const formatText = (text: string): React.ReactNode => {
    if (!text) return null;
    
    // First, escape HTML entities
    const escapeHtml = (str: string) => {
      return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
      });
    };
    
    const escapedText = escapeHtml(text);
    
    // Process line by line
    const lines = escapedText.split('\n');
    
    return lines.map((line, lineIndex) => {
      // Process each line: handle mentions, hashtags, then URLs
      let processedLine: React.ReactNode[] = [];
      
      // Split by word boundaries while preserving spaces
      const words = line.split(/(\s+)/);
      
      words.forEach((word, wordIndex) => {
        // Handle @mentions
        if (word.match(/^@[\w]+$/)) {
          processedLine.push(
            <a 
              key={`mention-${lineIndex}-${wordIndex}`}
              href={`/profile/${word.slice(1)}`}
              className="text-primary text-decoration-none fw-semibold hover-underline"
              onClick={(e) => e.preventDefault()} // Remove if you have routing
            >
              {word}
            </a>
          );
        }
        // Handle #hashtags
        else if (word.match(/^#[\w]+$/)) {
          processedLine.push(
            <a 
              key={`hashtag-${lineIndex}-${wordIndex}`}
              href={`/hashtag/${word.slice(1)}`}
              className="text-primary text-decoration-none fw-semibold hover-underline"
              onClick={(e) => e.preventDefault()} // Remove if you have routing
            >
              {word}
            </a>
          );
        }
        // Handle URLs (will be processed separately to avoid duplication)
        else if (word.match(/https?:\/\//)) {
          const urlLinks = convertUrlsToLinks(word);
          if (urlLinks) {
            processedLine.push(urlLinks);
          } else {
            processedLine.push(word);
          }
        }
        // Regular text
        else {
          processedLine.push(word);
        }
      });
      
      return (
        <React.Fragment key={`line-${lineIndex}`}>
          {processedLine}
          {lineIndex < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  // Toggle expand/collapse for long posts
  const toggleExpand = (postId: number) => {
    setExpandedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  // Check if text needs expansion
  const needsExpansion = (text: string): boolean => {
    return text && text.length > MAX_PREVIEW_LENGTH;
  };

  // Get display text (expanded or truncated)
  const getDisplayText = (text: string, isExpanded: boolean): string => {
    if (!text) return '';
    if (isExpanded) return text;
    if (text.length <= MAX_PREVIEW_LENGTH) return text;
    return text.substring(0, MAX_PREVIEW_LENGTH).trim() + '...';
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
      <style>{`
        .hover-underline:hover {
          text-decoration: underline !important;
        }
        
        .post-content {
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        
        .post-content a {
          transition: opacity 0.2s ease;
        }
        
        .post-content a:hover {
          opacity: 0.8;
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>

      {posts.length === 0 ? (
        <div className="card shadow-sm border-0">
          <div className="card-body text-center py-5">
            <i className="bi bi-newspaper display-1 text-muted mb-3 d-block"></i>
            <p className="text-muted mb-0">No posts yet. Be the first to share something!</p>
          </div>
        </div>
      ) : (
        posts.map((story) => {
          const targetMediaUrl = getPrimaryEmbedUrl(story.summary, story.image_url);
          const { type } = getSocialEmbedInfo(targetMediaUrl || "");
          
          // Clean summary by removing the primary embed URL from display
          let displaySummary = story.summary;
          if (targetMediaUrl && targetMediaUrl === story.image_url?.trim()) {
            // If image_url is used, keep summary as is
            displaySummary = story.summary;
          } else if (targetMediaUrl && !story.image_url?.trim()) {
            // Remove the primary embed URL from display text
            displaySummary = story.summary.replace(targetMediaUrl, "").trim();
            // Clean up double spaces or empty strings
            displaySummary = displaySummary.replace(/\s+/g, ' ').trim();
          }
          
          const isExpanded = expandedPosts[story.id] || false;
          const needsShowMore = needsExpansion(displaySummary);
          const displayText = getDisplayText(displaySummary, isExpanded);

          return (
            <div 
              key={story.id} 
              className="card shadow-sm border-0 hover-shadow transition"
              style={{ transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 0.5rem 1rem rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)';
              }}
            >
              <div className="card-body">
                {/* User Info Section */}
                <div className="d-flex align-items-center mb-3">
                  <img
                    src={story.profiles?.profile_pic || "https://via.placeholder.com/48?text=User"}
                    alt={story.profiles?.display_name || "User Avatar"}
                    className="rounded-circle me-3 border"
                    style={{ width: "48px", height: "48px", objectFit: "cover" }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://via.placeholder.com/48?text=User";
                    }}
                  />
                  <div className="flex-grow-1">
                    <div className="fw-bold d-flex align-items-center gap-2">
                      {story.profiles?.display_name || "Unknown User"}
                    </div>
                    <small className="text-muted d-flex align-items-center gap-1">
                      <i className="bi bi-clock"></i>
                      {formatTimeAgo(story.created_at)}
                    </small>
                  </div>
                </div>

                {/* Title */}
                {story.title && (
                  <h3 className="fw-bold mb-3" style={{ fontSize: "1.25rem", lineHeight: "1.3" }}>
                    {story.title}
                  </h3>
                )}

                {/* Formatted Summary with rich text */}
                {displaySummary && (
                  <div className="mb-3 post-content">
                    <div className="text-dark" style={{ lineHeight: "1.6" }}>
                      {formatText(displayText)}
                    </div>
                    
                    {/* Show More/Less Button */}
                    {needsShowMore && (
                      <button
                        onClick={() => toggleExpand(story.id)}
                        className="btn btn-link btn-sm p-0 mt-2 text-decoration-none"
                        style={{ fontSize: "0.875rem" }}
                      >
                        {isExpanded ? (
                          <>
                            <i className="bi bi-chevron-up me-1"></i>
                            Show less
                          </>
                        ) : (
                          <>
                            <i className="bi bi-chevron-down me-1"></i>
                            Show more
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}

                {/* Media Embed Section */}
                {targetMediaUrl && (
                  <div className="mb-3">
                    {type === "image" ? (
                      <div className="rounded overflow-hidden bg-light">
                        <img
                          src={targetMediaUrl}
                          alt={story.title || "Post image"}
                          className="w-100"
                          style={{ maxHeight: "400px", objectFit: "cover" }}
                          loading="lazy"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            const parent = (e.target as HTMLImageElement).parentElement;
                            if (parent) {
                              const errorDiv = document.createElement('div');
                              errorDiv.className = 'text-center text-muted py-4';
                              errorDiv.innerHTML = '<i class="bi bi-image"></i> Failed to load image';
                              parent.appendChild(errorDiv);
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <SocialEmbed url={targetMediaUrl} />
                    )}
                  </div>
                )}

                {/* Stats and Actions */}
                <div className="d-flex gap-4 text-muted pt-2 border-top" style={{ marginTop: '0.5rem' }}>
                  <div className="d-flex align-items-center">
                    <i className="bi bi-eye me-2"></i>
                    <span>{story.views?.toLocaleString() || 0}</span>
                  </div>

                  <button
                    onClick={() => handleLike(story.id)}
                    disabled={likingId === story.id}
                    className="d-flex align-items-center border-0 bg-transparent p-0"
                    style={{ 
                      cursor: likingId === story.id ? "not-allowed" : "pointer",
                      color: likingId === story.id ? '#dc3545' : '#6c757d',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (likingId !== story.id) {
                        e.currentTarget.style.color = '#dc3545';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (likingId !== story.id) {
                        e.currentTarget.style.color = '#6c757d';
                      }
                    }}
                  >
                    <i className={`bi ${likingId === story.id ? "bi-heart-fill" : "bi-heart"} me-2`}></i>
                    <span>{story.likes?.toLocaleString() || 0}</span>
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