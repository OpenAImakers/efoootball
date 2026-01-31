import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase";
import { Link } from "react-router-dom";

function CommunityFeed({ user }: { user: any }) {
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [replyingTo, setReplyingTo] = useState<{id: string, username: string} | null>(null);
  const [dragX, setDragX] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
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

  if (loading) return <div>Loading...</div>;

  return (
    /* h-100 combined with overflow-hidden ensures the screen doesn't scroll, only the feed */
    <div className="d-flex flex-column vh-100 overflow-hidden bg-light">

      {/* Message List: flex-grow-1 takes all available space, overflow-auto makes only this part scroll */}
      <div 
        className="flex-grow-1 p-3 overflow-auto d-flex flex-column-reverse"
        onMouseMove={handleMove}
        onMouseUp={() => handleEnd()}
        onTouchMove={handleMove}
        onTouchEnd={() => handleEnd()}
        style={{ WebkitOverflowScrolling: 'touch' }} // Smooth scroll for iOS
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
                  backgroundColor: isMe ? '#DCF8C6' : '#ffffff', // Classic chat colors
                  cursor: 'grab'
                }}
              >
                {!isMe && (
                  <Link to={`/profile/${c.profiles?.username}`} className="d-block fw-bold small mb-1 text-decoration-none">
                    {c.profiles?.display_name || c.profiles?.username}
                  </Link>
                )}
                <p className="m-0" style={{ fontSize: '0.95rem', wordBreak: 'break-word' }}>{c.content}</p>
                <small className="text-muted d-block text-end mt-1" style={{ fontSize: '0.65rem' }}>
                  {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </small>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Area: Fixed at bottom */}
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
            <button 
              className="btn btn-primary px-4" 
              type="submit"
              style={{ borderRadius: '0 20px 20px 0' }}
            >
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