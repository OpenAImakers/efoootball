import React, { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "../../../../supabase";

const WORKER_URL = 'https://posts-api.unscriptedusa.workers.dev';

interface Post {
  id: number;
  title: string;
  summary: string;
  image_url: string;
  created_at: string;
  views: number;
  likes: number;
  user_id: string;
}

interface AddPostsProps {
  onPostAdded?: () => void;
}

export default function AddPosts({ onPostAdded }: AddPostsProps) {
  // Create Post Form States
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User Post List Management States
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Inline Editing States
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Fetch only posts created by the authenticated user
  const fetchUserPosts = useCallback(async (userId: string) => {
    try {
      setPostsLoading(true);
      const { data, error: fetchError } = await supabase
        .from("posts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setUserPosts(data || []);
    } catch (err: any) {
      console.error("Error fetching user posts:", err);
    } finally {
      setPostsLoading(false);
    }
  }, []);

  // Monitor Authentication State
  useEffect(() => {
    const getUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        fetchUserPosts(user.id);
      } else {
        setPostsLoading(false);
      }
    };
    getUserData();
  }, [fetchUserPosts]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImageToWorker = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) throw new Error('Image upload failed');
    const data = await response.json();
    return data.image_url;
  };

  // Create Post
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !summary.trim()) {
      setError("Title and summary are required");
      return;
    }

    if (!currentUserId) {
      setError("You must be logged in to post");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      let imageUrl = "";
      if (imageFile) {
        imageUrl = await uploadImageToWorker(imageFile);
      }

      const { error: supabaseError } = await supabase
        .from('posts')
        .insert([{
          title: title.trim(),
          summary: summary.trim(),
          image_url: imageUrl,
          user_id: currentUserId,
          views: 0,
          likes: 0
        }]);

      if (supabaseError) throw supabaseError;

      setTitle("");
      setSummary("");
      handleRemoveImage();
      setSuccess(true);
      
      // Refresh listing
      fetchUserPosts(currentUserId);
      if (onPostAdded) onPostAdded();
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error creating post:", err);
      setError(err.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  // Initialize Edit Mode Form
  const startEditing = (post: Post) => {
    setEditingId(post.id);
    setEditTitle(post.title);
    setEditSummary(post.summary);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle("");
    setEditSummary("");
  };

  // Save Inline Edits
  const handleUpdatePost = async (postId: number) => {
    if (!editTitle.trim() || !editSummary.trim()) {
      alert("Fields cannot be empty.");
      return;
    }

    setActionLoadingId(postId);
    try {
      const { error: updateError } = await supabase
        .from("posts")
        .update({
          title: editTitle.trim(),
          summary: editSummary.trim(),
        })
        .eq("id", postId)
        .eq("user_id", currentUserId); // Security check

      if (updateError) throw updateError;

      // Optimistic UI updates
      setUserPosts(userPosts.map(p => p.id === postId ? { ...p, title: editTitle, summary: editSummary } : p));
      cancelEditing();
      if (onPostAdded) onPostAdded(); // Sync feeds
    } catch (err) {
      console.error("Error updating post:", err);
      alert("Failed to update post.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete Post Record
  const handleDeletePost = async (postId: number) => {
    if (!window.confirm("Are you sure you want to permanently delete this post?")) return;

    setActionLoadingId(postId);
    try {
      const { error: deleteError } = await supabase
        .from("posts")
        .delete()
        .eq("id", postId)
        .eq("user_id", currentUserId); // Security check

      if (deleteError) throw deleteError;

      setUserPosts(userPosts.filter(p => p.id !== postId));
      if (onPostAdded) onPostAdded(); // Sync feeds
    } catch (err) {
      console.error("Error deleting post:", err);
      alert("Failed to delete post.");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* 1. CREATE POST CARD */}
      <div className="card shadow-sm" style={{ border: '1px solid #dee2e6' }}>
        <div className="card-body">
          <h5 className="card-title mb-3" style={{ color: '#0d6efd' }}>
            <i className="bi bi-pencil-square me-2"></i>
            Create New Post
          </h5>

          {error && (
            <div className="alert alert-danger alert-dismissible fade show" role="alert">
              {error}
              <button type="button" className="btn-close" onClick={() => setError(null)}></button>
            </div>
          )}

          {success && (
            <div className="alert alert-success alert-dismissible fade show" role="alert">
              Post created successfully!
              <button type="button" className="btn-close" onClick={() => setSuccess(false)}></button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Image Upload */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Image (optional)</label>
              
              {imagePreview ? (
                <div className="position-relative d-inline-block mb-2">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="img-fluid rounded"
                    style={{ maxHeight: '200px' }}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1"
                    style={{ borderRadius: '50%' }}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="mb-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="form-control"
                    onChange={handleImageSelect}
                    disabled={loading}
                  />
                  <small className="text-muted">Upload JPG, PNG, or GIF (max 5MB)</small>
                </div>
              )}
            </div>

            {/* Title */}
            <div className="mb-3">
              <label htmlFor="title" className="form-label fw-semibold">
                Title *
              </label>
              <input
                type="text"
                className="form-control"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter post title"
                maxLength={255}
                required
                disabled={loading}
              />
            </div>

            {/* Summary/Content */}
            <div className="mb-3">
              <label htmlFor="summary" className="form-label fw-semibold">
                Content *
              </label>
              <textarea
                className="form-control"
                id="summary"
                rows={4}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Write your post content here..."
                required
                disabled={loading}
              />
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="btn btn-primary w-100"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Publishing...
                </>
              ) : (
                <>
                  <i className="bi bi-send me-2"></i>
                  Publish Post
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* 2. USER POSTS MANAGEMENT INTERFACE */}
      <div className="user-posts-section">
        <h4 className="mb-3 fw-bold">Your Published Posts</h4>
        
        {postsLoading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-secondary" role="status"></div>
            <p className="text-muted mt-2">Loading your content history...</p>
          </div>
        ) : userPosts.length === 0 ? (
          <div className="card text-center p-5 border-0 shadow-sm bg-light">
            <p className="text-muted mb-0">You haven't written any posts yet.</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {userPosts.map((post) => (
              <div key={post.id} className="card shadow-sm border-0">
                <div className="card-body">
                  {editingId === post.id ? (
                    /* EDITING SUB-TEMPLATE */
                    <div>
                      <div className="mb-2">
                        <label className="form-label small fw-bold text-muted">Edit Title</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label small fw-bold text-muted">Edit Content</label>
                        <textarea
                          className="form-control form-control-sm"
                          rows={3}
                          value={editSummary}
                          onChange={(e) => setEditSummary(e.target.value)}
                        />
                      </div>
                      <div className="d-flex gap-2 justify-content-end">
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={cancelEditing}
                          disabled={actionLoadingId === post.id}
                        >
                          Cancel
                        </button>
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleUpdatePost(post.id)}
                          disabled={actionLoadingId === post.id}
                        >
                          {actionLoadingId === post.id ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* STANDALONE DISPLAY VIEW */
                    <div className="d-flex flex-column flex-sm-row gap-3 align-items-start">
                      {post.image_url && (
                        <img
                          src={post.image_url}
                          alt={post.title}
                          className="rounded"
                          style={{ width: "100px", height: "70px", objectFit: "cover" }}
                        />
                      )}
                      <div className="flex-grow-1">
                        <h6 className="fw-bold mb-1 text-dark">{post.title}</h6>
                        <p className="text-muted small mb-2 text-truncate-2" style={{ maxHeight: "2.6rem", overflow: "hidden" }}>
                          {post.summary}
                        </p>
                        <div className="d-flex align-items-center gap-3 text-muted" style={{ fontSize: "0.8rem" }}>
                          <span>👁️ {post.views || 0} views</span>
                          <span>❤️ {post.likes || 0} likes</span>
                          <span>📅 {new Date(post.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      {/* ACTION TRIGGERS */}
                      <div className="d-flex gap-2 mt-2 mt-sm-0 align-self-sm-center">
                        <button
                          onClick={() => startEditing(post)}
                          className="btn btn-sm btn-outline-primary py-1 px-2"
                          disabled={actionLoadingId !== null}
                          title="Edit Post"
                        >
                          <i className="bi bi-pencil"></i> Edit
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="btn btn-sm btn-outline-danger py-1 px-2"
                          disabled={actionLoadingId !== null}
                          title="Delete Post"
                        >
                          <i className="bi bi-trash"></i> Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}