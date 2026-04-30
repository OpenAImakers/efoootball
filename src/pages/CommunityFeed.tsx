import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase";
import { Link } from "react-router-dom";

// ──────────────────────────────────────────────
//  Helpers for avatar
// ──────────────────────────────────────────────
const getAvatarColor = (name: string) => {
  const colors = ["#007bff", "#6610f2", "#6f42c1", "#e83e8c", "#dc3545", "#fd7e14", "#ffc107", "#28a745", "#20c997", "#17a2b8"];
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
        style={{ 
          width: `${size}px`, 
          height: `${size}px`, 
          objectFit: "cover",
          border: "1px solid #dee2e6"
        }}
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
        border: "1px solid #dee2e6"
      }}
    >
      {firstLetter}
    </div>
  );
};

function CommunityFeed({ user }: { user: any }) {
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; username: string; display_name: string } | null>(null);

  // Drag to reply state
  const [dragX, setDragX] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const startX = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchComments();

    const subscription = supabase
      .channel('comments-channel')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'comments' },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("comments")
      .select(`
        id, 
        content, 
        created_at, 
        user_id, 
        images,
        profiles (id, username, display_name, profile_pic)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch comments error:", error);
    } else {
      setComments(data || []);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `comments/${fileName}`;

    setUploading(true);

    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    setUploading(false);

    if (uploadError) {
      console.error("Upload error:", uploadError);
      alert("Failed to upload image: " + uploadError.message);
      return null;
    }

    const { data: urlData } = supabase.storage.from("images").getPublicUrl(filePath);
    return urlData.publicUrl;
  };

  const postComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (!commentText.trim() && !selectedFile)) return;

    let imageUrl: string | null = null;

    if (selectedFile) {
      imageUrl = await uploadImage(selectedFile);
    }

    const contentToSend = replyingTo
      ? `@${replyingTo.username} ${commentText.trim()}`
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
    } else {
      console.error("Post error:", error);
      alert("Failed to post comment");
    }
  };

  const handleReply = (profile: any) => {
    setReplyingTo({ 
      id: profile.id, 
      username: profile.username,
      display_name: profile.display_name 
    });
    // Focus the input field
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Drag-to-reply logic
  const handleDragStart = (e: any, id: string) => {
    startX.current = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
    setActiveId(id);
  };

  const handleDragMove = (e: any) => {
    if (activeId === null) return;
    const currentX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
    const diff = currentX - startX.current;
    if (diff > 0 && diff < 150) setDragX(diff);
  };

  const handleDragEnd = (id?: string, profile?: any) => {
    if (dragX > 60 && id && profile) {
      handleReply(profile);
    }
    setDragX(0);
    setActiveId(null);
  };

  // Insert @mention into input
  const insertMention = (username: string) => {
    const mention = `@${username} `;
    setCommentText(prev => {
      // If there's already text, add space, otherwise just add mention
      return prev ? `${prev} ${mention}` : mention;
    });
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="d-flex flex-column vh-100 overflow-hidden bg-light">
      
      {/* MESSAGE LIST */}
      <div
        className="flex-grow-1 p-3 overflow-auto d-flex flex-column-reverse"
        onMouseMove={handleDragMove}
        onMouseUp={() => handleDragEnd()}
        onTouchMove={handleDragMove}
        onTouchEnd={() => handleDragEnd()}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        {comments.map((c) => {
          const isMe = user?.id === c.user_id;
          const isDragging = activeId === c.id;

          return (
            <div key={c.id} className={`d-flex mb-3 ${isMe ? "justify-content-end" : "justify-content-start"}`}>
              {!isMe && (
                <div className="me-2" style={{ alignSelf: 'flex-end' }}>
                  <Link to={`/profile/${c.profiles?.username}`}>
                    {renderAvatar(c.profiles, 32)}
                  </Link>
                </div>
              )}
              <div
                onMouseDown={(e) => handleDragStart(e, c.id)}
                onTouchStart={(e) => handleDragStart(e, c.id)}
                onMouseUp={() => handleDragEnd(c.id, c.profiles)}
                onTouchEnd={() => handleDragEnd(c.id, c.profiles)}
                className="p-3 rounded shadow-sm"
                style={{
                  maxWidth: "75%",
                  transform: `translateX(${isDragging ? dragX : 0}px)`,
                  transition: isDragging ? "none" : "transform 0.2s",
                  backgroundColor: isMe ? "#DCF8C6" : "#ffffff",
                  cursor: "grab",
                  borderRadius: "18px",
                }}
              >
                {!isMe && (
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Link
                      to={`/profile/${c.profiles?.username}`}
                      className="fw-bold small text-decoration-none text-primary"
                    >
                      {c.profiles?.display_name || c.profiles?.username}
                    </Link>
                    <span className="text-muted" style={{ fontSize: "0.6rem" }}>
                      {new Date(c.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <button
                      onClick={() => insertMention(c.profiles?.username)}
                      className="btn btn-sm btn-link text-muted p-0 ms-1"
                      style={{ fontSize: "0.65rem", textDecoration: "none" }}
                    >
                      Reply
                    </button>
                  </div>
                )}

                <p className="m-0" style={{ fontSize: "0.9rem", wordBreak: "break-word" }}>
                  {c.content}
                </p>

                {c.images && (
                  <div className="mt-2">
                    <img
                      src={c.images}
                      alt="Comment attachment"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "200px",
                        borderRadius: "12px",
                        cursor: "pointer"
                      }}
                      onClick={() => window.open(c.images, '_blank')}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}

                {isMe && (
                  <div className="d-flex justify-content-end mt-1">
                    <small className="text-muted" style={{ fontSize: "0.6rem" }}>
                      {new Date(c.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </small>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {comments.length === 0 && (
          <div className="text-center py-5">
            <div className="mb-3" style={{ fontSize: "3rem" }}>💬</div>
            <p className="text-muted">No messages yet</p>
            <small className="text-muted">Be the first to start a conversation!</small>
          </div>
        )}
      </div>

      {/* INPUT AREA */}
      <div className="p-3 bg-white border-top">
        {replyingTo && (
          <div className="alert alert-secondary py-2 px-3 d-flex justify-content-between align-items-center mb-2 rounded-pill">
            <small className="text-truncate">
              Replying to <strong>@{replyingTo.username}</strong>
            </small>
            <button
              className="btn-close"
              style={{ width: "0.5em", height: "0.5em" }}
              onClick={() => setReplyingTo(null)}
            />
          </div>
        )}

        {user ? (
          <form onSubmit={postComment} className="d-flex flex-column gap-2">
            {previewUrl && (
              <div className="position-relative" style={{ maxWidth: "100px" }}>
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{ maxHeight: "80px", borderRadius: "8px", objectFit: "cover" }}
                />
                <button
                  type="button"
                  className="btn btn-sm btn-danger position-absolute top-0 end-0 rounded-circle"
                  style={{ width: "20px", height: "20px", fontSize: "12px", padding: 0 }}
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                >
                  ×
                </button>
              </div>
            )}

            <div className="input-group">
              <input
                ref={inputRef}
                type="text"
                className="form-control"
                placeholder="Type a message..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                style={{ borderRadius: "25px 0 0 25px" }}
                disabled={uploading}
              />

              <label className="btn btn-outline-secondary px-3 d-flex align-items-center mb-0" style={{ cursor: 'pointer' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  disabled={uploading}
                />
                📷
              </label>

              <button
                className="btn btn-primary px-4"
                type="submit"
                disabled={uploading || (!commentText.trim() && !selectedFile)}
                style={{ borderRadius: "0 25px 25px 0" }}
              >
                {uploading ? "Uploading..." : "Send"}
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-2">
            <p className="text-muted small m-0">Please log in to join the conversation</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CommunityFeed;