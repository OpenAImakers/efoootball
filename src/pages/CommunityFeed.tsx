import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase";
import { Link } from "react-router-dom";

// HELPER: Generates a consistent background color based on a string (username)
const getAvatarColor = (name: string) => {
  const colors = ["#007bff", "#6610f2", "#6f42c1", "#e83e8c", "#dc3545", "#fd7e14", "#ffc107", "#28a745", "#20c997", "#17a2b8"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// HELPER: Renders either the profile pic or the first letter
const renderAvatar = (profile: any, size: number) => {
  const name = profile?.display_name || profile?.username || "?";
  const firstLetter = name.charAt(0).toUpperCase();

  if (profile?.profile_pic) {
    return (
      <img
        src={profile.profile_pic}
        alt={name}
        className="rounded-circle border"
        style={{ width: `${size}px`, height: `${size}px`, objectFit: "cover" }}
      />
    );
  }

  return (
    <div
      className="rounded-circle d-flex align-items-center justify-content-center border text-white fw-bold shadow-sm"
      style={{ 
        width: `${size}px`, 
        height: `${size}px`, 
        fontSize: `${size / 2.2}px`,
        backgroundColor: getAvatarColor(name)
      }}
    >
      {firstLetter}
    </div>
  );
};

function CommunityFeed({ user }: { user: any }) {
  const [comments, setComments] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [replyingTo, setReplyingTo] = useState<{id: string, username: string} | null>(null);
  const [dragX, setDragX] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const startX = useRef(0);

  useEffect(() => {
    fetchComments();
    fetchProfiles();
  }, []);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("comments")
      .select(`
        id, 
        content, 
        created_at, 
        user_id, 
        profiles (username, display_name, profile_pic)
      `)
      .order("created_at", { ascending: false });

    if (!error) setComments(data || []);
    setLoading(false);
  };

  const fetchProfiles = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("username, display_name, profile_pic")
      .not("username", "is", null)
      .order("created_at", { ascending: false });

    if (data) setProfiles(data);
  };

  const postComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentText.trim()) return;

    const contentToSend = replyingTo 
      ? `Replying to @${replyingTo.username}: ${commentText.trim()}`
      : commentText.trim();

    const { error } = await supabase
      .from("comments")
      .insert({ user_id: user.id, content: contentToSend });

    if (!error) {
      setCommentText("");
      setReplyingTo(null);
      fetchComments();
    }
  };

  const handleStart = (e: any, id: string) => {
    startX.current = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    setActiveId(id);
  };

  const handleMove = (e: any) => {
    if (activeId === null) return;
    const currentX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const diff = currentX - startX.current;
    if (diff > 0 && diff < 100) setDragX(diff);
  };

  const handleEnd = (id?: string, profile?: any) => {
    if (dragX > 60 && id && profile) {
      setReplyingTo({ id, username: profile.username });
    }
    setDragX(0);
    setActiveId(null);
  };

  if (loading) return <div className="p-4 text-center">Loading...</div>;

  return (
    <div className="d-flex flex-column vh-100 overflow-hidden bg-light">

      {/* --- TOP SCROLLABLE PROFILES --- */}
      <div className="bg-white border-bottom py-2 px-2 overflow-auto d-flex gap-3 shadow-sm"
           style={{ whiteSpace: "nowrap", flexShrink: 0 }}>
        {profiles.map((p, index) => (
          <Link
            key={index}
            to={`/profile/${p.username}`}
            className="text-center text-decoration-none text-dark"
            style={{ minWidth: "70px" }}
          >
            <div className="mx-auto mb-1 d-flex justify-content-center">
              {renderAvatar(p, 55)}
            </div>
            <small className="d-block text-truncate" style={{ fontSize: "0.7rem" }}>
              {p.display_name || p.username}
            </small>
          </Link>
        ))}
      </div>

      {/* --- MESSAGE LIST --- */}
      <div 
        className="flex-grow-1 p-3 overflow-auto d-flex flex-column-reverse"
        onMouseMove={handleMove}
        onMouseUp={() => handleEnd()}
        onTouchMove={handleMove}
        onTouchEnd={() => handleEnd()}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {comments.map((c) => {
          const isMe = user?.id === c.user_id;
          const isDragging = activeId === c.id;

          return (
            <div key={c.id} className={`d-flex mb-3 ${isMe ? 'justify-content-end' : 'justify-content-start'}`}>
              <div 
                onMouseDown={(e) => handleStart(e, c.id)}
                onTouchStart={(e) => handleStart(e, c.id)}
                onMouseUp={() => handleEnd(c.id, c.profiles)}
                onTouchEnd={() => handleEnd(c.id, c.profiles)}
                className="border p-2 rounded shadow-sm"
                style={{ 
                  maxWidth: "85%",
                  transform: `translateX(${isDragging ? dragX : 0}px)`,
                  transition: isDragging ? 'none' : 'transform 0.2s',
                  backgroundColor: isMe ? '#DCF8C6' : '#ffffff',
                  cursor: 'grab'
                }}
              >
                {!isMe && (
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <Link to={`/profile/${c.profiles?.username}`}>
                      {renderAvatar(c.profiles, 28)}
                    </Link>
                    <Link to={`/profile/${c.profiles?.username}`} className="fw-bold small text-decoration-none text-primary">
                      {c.profiles?.display_name || c.profiles?.username}
                    </Link>
                  </div>
                )}
                <p className="m-0 px-1" style={{ fontSize: '0.95rem', wordBreak: 'break-word' }}>
                  {c.content}
                </p>
                <small className="text-muted d-block text-end mt-1" style={{ fontSize: '0.65rem' }}>
                  {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </small>
              </div>
            </div>
          );
        })}
      </div>

      {/* --- INPUT AREA --- */}
      <div className="p-3 bg-white border-top pb-safe"> 
        {replyingTo && (
          <div className="alert alert-secondary py-1 px-2 d-flex justify-content-between align-items-center mb-2">
            <small className="text-truncate">Replying to <strong>@{replyingTo.username}</strong></small>
            <button className="btn-close" style={{ width: '0.5em', height: '0.5em' }} onClick={() => setReplyingTo(null)}></button>
          </div>
        )}
        
        {user ? (
          <form onSubmit={postComment} className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Type a message..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              style={{ borderRadius: '20px 0 0 20px' }}
            />
            <button className="btn btn-primary px-4" type="submit" style={{ borderRadius: '0 20px 20px 0' }}>
              Send
            </button>
          </form>
        ) : (
          <div className="text-center py-2">
            <p className="text-muted small m-0">Please log in to participate.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CommunityFeed;