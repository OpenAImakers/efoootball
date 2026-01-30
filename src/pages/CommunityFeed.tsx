import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase";
import { Link } from "react-router-dom";

function CommunityFeed({ user }) {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Reply State
  const [replyingTo, setReplyingTo] = useState(null);
  const [dragX, setDragX] = useState(0);
  const [activeId, setActiveId] = useState(null);
  const startX = useRef(0);

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("comments")
      .select(`id, content, created_at, user_id, profiles (username, display_name)`)
      .order("created_at", { ascending: false });

    if (!error) setComments(data || []);
    setLoading(false);
  };

  const postComment = async (e) => {
    e.preventDefault();
    if (!user || !commentText.trim()) return;

    // If replying, we prefix the content (standard simple way)
    const finalContent = replyingTo 
      ? `Replying to @${replyingTo.username}: ${commentText.trim()}`
      : commentText.trim();

    const { error } = await supabase
      .from("comments")
      .insert({ user_id: user.id, content: finalContent });

    if (!error) {
      setCommentText("");
      setReplyingTo(null);
      fetchComments();
    }
  };

  // --- Gesture Logic ---
  const handleStart = (e, id) => {
    startX.current = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    setActiveId(id);
  };

  const handleMove = (e) => {
    if (activeId === null) return;
    const currentX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    const diff = currentX - startX.current;
    if (diff > 0 && diff < 80) setDragX(diff); // Only slide right
  };
// Change the parameters to be optional using the '?'
const handleEnd = (id?: any, profile?: any) => {
  if (dragX > 50 && id && profile) {
    setReplyingTo({ id, username: profile.username });
  }
  setDragX(0);
  setActiveId(null);
};

  if (loading) return <div className="text-center p-5 text-muted">Opening chat...</div>;

  return (
    <div className="d-flex flex-column rounded-4 shadow-lg overflow-hidden" 
         style={{ height: "80vh", backgroundColor: "#efe7de", border: "1px solid #ddd", position: 'relative' }}>
      
      {/* Discussion List */}
      <div 
        className="flex-grow-1 p-3 overflow-auto d-flex flex-column-reverse gap-2" 
        onMouseMove={handleMove}
        onMouseUp={() => handleEnd()}
        onTouchMove={handleMove}
        onTouchEnd={() => handleEnd()}
        style={{ 
          backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')", 
          backgroundSize: "400px" 
        }}
      >
        {comments.map((c) => {
          const isMe = user?.id === c.user_id;
          const isDragging = activeId === c.id;

          return (
            <div key={c.id} className={`d-flex align-items-center ${isMe ? 'justify-content-end' : 'justify-content-start'} position-relative`}>
              
              {/* Reply Icon revealed behind the bubble */}
              {isDragging && dragX > 20 && (
                <div className="position-absolute start-0 ps-2 text-muted">
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M5.921 11.9L1.353 8.62a.719.719 0 0 1 0-1.238L5.921 4.1A.716.716 0 0 1 7 4.719V6c1.5 0 6 0 7 8-2.5-4.5-7-4-7-4v1.281c0 .56-.606.898-1.079.62z"/>
                  </svg>
                </div>
              )}

              <div 
                onMouseDown={(e) => handleStart(e, c.id)}
                onTouchStart={(e) => handleStart(e, c.id)}
                onMouseUp={() => handleEnd(c.id, c.profiles)}
                onTouchEnd={() => handleEnd(c.id, c.profiles)}
                className={`p-2 shadow-sm chat-bubble ${isMe ? 'my-message' : 'other-message'}`}
                style={{ 
                  borderRadius: isMe ? "15px 15px 0 15px" : "0 15px 15px 15px",
                  maxWidth: "80%",
                  backgroundColor: isMe ? "#dcf8c6" : "#ffffff",
                  transform: `translateX(${isDragging ? dragX : 0}px)`,
                  transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                  cursor: 'grab',
                  userSelect: 'none'
                }}
              >
                {!isMe && (
                  <Link to={`/profile/${c.profiles?.username}`} className="text-decoration-none d-block mb-1 border-bottom pb-1" style={{ borderColor: '#f0f0f0' }}>
                    <span className="fw-bold" style={{ fontSize: "0.75rem", color: "#075e54" }}>
                      {c.profiles?.display_name || c.profiles?.username}
                    </span>
                  </Link>
                )}
                <p className="mb-0 text-dark" style={{ whiteSpace: "pre-wrap", fontSize: "0.95rem" }}>{c.content}</p>
                <div className="text-end text-muted" style={{ fontSize: "0.6rem" }}>
                  {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply Preview Bar */}
      {replyingTo && (
        <div className="bg-white border-top border-primary p-2 d-flex justify-content-between align-items-center" style={{ borderLeft: "4px solid #075e54" }}>
          <div className="small">
            <div className="fw-bold text-success">Replying to @{replyingTo.username}</div>
          </div>
          <button className="btn-close small" style={{ fontSize: '0.7rem' }} onClick={() => setReplyingTo(null)}></button>
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 bg-light border-top">
        {user ? (
          <form onSubmit={postComment} className="d-flex gap-2">
            <textarea
              className="form-control border-0 rounded-pill px-4 shadow-sm"
              rows={1}
              style={{ resize: "none" }}
              placeholder="Type a message"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button type="submit" className="btn btn-success rounded-circle shadow-sm" style={{ width: "45px", height: "45px" }}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="white"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
            </button>
          </form>
        ) : (
          <div className="text-center small py-2"><Link to="/login">Login to chat</Link></div>
        )}
      </div>
    </div>
  );
}

export default CommunityFeed;