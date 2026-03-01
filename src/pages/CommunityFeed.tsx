"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase";
import { Link } from "react-router-dom";

// ──────────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────────
const getAvatarColor = (name: string) => {
  const colors = ["#2563eb", "#7c3aed", "#db2777", "#ea580c", "#16a34a", "#0891b2"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

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
        backgroundColor: getAvatarColor(name),
        border: "2px solid #fff"
      }}
    >
      {firstLetter}
    </div>
  );
};

// ──────────────────────────────────────────────
//  Main Component
// ──────────────────────────────────────────────
function CommunityFeed({ user }: { user: any }) {
  const [comments, setComments] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string } | null>(null);

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
        id, content, created_at, user_id, images,
        profiles (username, display_name, profile_pic)
      `)
      .order("created_at", { ascending: false });

    if (error) console.error("Fetch error:", error);
    else setComments(data || []);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    setUploading(true);
    const { error: uploadError } = await supabase.storage.from("images").upload(fileName, file);
    setUploading(false);
    if (uploadError) return null;
    const { data: urlData } = supabase.storage.from("images").getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const postComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (!commentText.trim() && !selectedFile)) return;

    let imageUrl: string | null = null;
    if (selectedFile) imageUrl = await uploadImage(selectedFile);

    const contentToSend = replyingTo
      ? `Replying to @${replyingTo.username}: ${commentText.trim()}`
      : commentText.trim();

    const { error } = await supabase.from("comments").insert({
      user_id: user.id,
      content: contentToSend,
      images: imageUrl,
    });

    if (!error) {
      setCommentText("");
      setSelectedFile(null);
      setPreviewUrl(null);
      setReplyingTo(null);
      fetchComments();
    }
  };

  const handleStart = (e: any, id: string) => {
    startX.current = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
    setActiveId(id);
  };

  const handleMove = (e: any) => {
    if (activeId === null) return;
    const currentX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
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

  if (loading) return <div className="p-5 text-center fw-light text-muted">Updating feed...</div>;

  return (
    <div className="d-flex flex-column vh-100 bg-white position-relative overflow-hidden">
      
      {/* TOP USERS BAR */}
      <div
        className="bg-white border-bottom py-3 px-3 overflow-auto d-flex gap-4"
        style={{ whiteSpace: "nowrap", flexShrink: 0, zIndex: 10 }}
      >
        {profiles.map((p, index) => (
          <Link key={index} to={`/profile/${p.username}`} className="text-center text-decoration-none" style={{ minWidth: "65px" }}>
            <div className="mx-auto mb-2 d-flex justify-content-center">{renderAvatar(p, 58)}</div>
            <small className="d-block text-dark fw-medium text-truncate" style={{ fontSize: "0.72rem" }}>
              {p.display_name || p.username}
            </small>
          </Link>
        ))}
      </div>

      {/* CHAT AREA */}
      <div
        className="flex-grow-1 p-4 overflow-auto d-flex flex-column-reverse feed-container"
        onMouseMove={handleMove}
        onMouseUp={() => handleEnd()}
        onTouchMove={handleMove}
        onTouchEnd={() => handleEnd()}
      >
        {comments.map((c) => {
          const isMe = user?.id === c.user_id;
          const isDragging = activeId === c.id;

          return (
            <div key={c.id} className={`d-flex mb-4 ${isMe ? "justify-content-end" : "justify-content-start"}`}>
              <div
                onMouseDown={(e) => handleStart(e, c.id)}
                onTouchStart={(e) => handleStart(e, c.id)}
                onMouseUp={() => handleEnd(c.id, c.profiles)}
                onTouchEnd={() => handleEnd(c.id, c.profiles)}
                className={`msg-bubble ${isMe ? "msg-me" : "msg-them"}`}
                style={{
                  transform: `translateX(${isDragging ? dragX : 0}px)`,
                }}
              >
                {!isMe && (
                  <div className="fw-bold small text-uppercase mb-1" style={{ fontSize: '0.65rem', letterSpacing: '0.05em', color: getAvatarColor(c.profiles?.username || "") }}>
                    {c.profiles?.display_name || c.profiles?.username}
                  </div>
                )}
                <p className="m-0 lh-sm" style={{ fontSize: "0.92rem", fontWeight: 400 }}>{c.content}</p>
                {c.images && <img src={c.images} alt="attachment" className="mt-3 img-fluid rounded-4 shadow-sm" />}
                <div className={`mt-2 opacity-50 fw-light`} style={{ fontSize: "0.6rem", textAlign: isMe ? "right" : "left" }}>
                  {new Date(c.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FLOATING ACTION BAR */}
      <div className="action-bar-container">
        <div className="container" style={{ maxWidth: "680px" }}>
          
          {replyingTo && (
            <div className="reply-tab animate-slide-up">
              <span className="small text-muted">Replying to <strong>{replyingTo.username}</strong></span>
              <button className="btn-close-custom" onClick={() => setReplyingTo(null)}>CANCEL</button>
            </div>
          )}

          <div className="pill-container shadow-lg">
            {user ? (
              <form onSubmit={postComment} className="w-100">
                {previewUrl && (
                  <div className="preview-strip">
                    <img src={previewUrl} alt="preview" />
                    <button type="button" onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}>REMOVE</button>
                  </div>
                )}

                <div className="d-flex align-items-center p-2">
                  <label className="attach-label">
                    <input type="file" accept="image/*" onChange={handleFileChange} className="d-none" disabled={uploading} />
                    ATTACH 📷
                  </label>
                  
                  <input
                    type="text"
                    className="main-input"
                    placeholder="Message"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    disabled={uploading}
                  />

                  <button
                    className="action-btn"
                    type="submit"
                    disabled={uploading || (!commentText.trim() && !selectedFile)}
                  >
                    {uploading ? "..." : "SEND"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-3 text-center w-100 text-muted small fw-bold">SIGN IN TO JOIN THE CONVERSATION</div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .feed-container {
          padding-bottom: 120px !important;
          background: #fcfcfc;
        }

        .msg-bubble {
          max-width: 75%;
          padding: 12px 18px;
          border-radius: 24px;
          transition: transform 0.2s ease-out;
          cursor: grab;
          position: relative;
        }

        .msg-me {
          background: #111;
          color: #fff;
          border-bottom-right-radius: 4px;
        }

        .msg-them {
          background: #fff;
          color: #111;
          border: 1px solid #eee;
          border-bottom-left-radius: 4px;
        }

        .action-bar-container {
          position: fixed;
          bottom: 30px;
          left: 0;
          right: 0;
          z-index: 1000;
          padding: 0 20px;
        }

        .pill-container {
          background: #fff;
          border-radius: 100px;
          border: 1px solid #111;
          display: flex;
          align-items: center;
          overflow: hidden;
        }

        .main-input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          padding: 10px 15px;
          font-size: 0.9rem;
          color: #111;
        }

        .attach-label {
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          color: #777;
          cursor: pointer;
          padding: 0 15px;
          border-right: 1px solid #eee;
        }

        .action-btn {
          background: #111;
          color: #fff;
          border: none;
          padding: 8px 20px;
          border-radius: 100px;
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          transition: 0.2s;
        }

        .action-btn:disabled { background: #eee; color: #aaa; }

        .reply-tab {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          width: fit-content;
          margin-bottom: 10px;
          padding: 6px 18px;
          border-radius: 15px;
          border: 1px solid #111;
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .btn-close-custom {
          background: transparent;
          border: none;
          color: #ff0000;
          font-size: 0.6rem;
          font-weight: 900;
          padding: 0;
        }

        .preview-strip {
          padding: 10px 20px;
          background: #f8f8f8;
          display: flex;
          align-items: center;
          gap: 15px;
          border-bottom: 1px solid #eee;
        }
        .preview-strip img { height: 50px; border-radius: 8px; border: 1px solid #ddd; }
        .preview-strip button { 
          background: none; border: none; font-size: 0.6rem; font-weight: 900; color: #ff0000; 
        }

        .animate-slide-up {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default CommunityFeed;