import React, { useState, useRef } from "react";
import { supabase } from "../../../../supabase";

const WORKER_URL = 'https://posts-api.unscriptedusa.workers.dev';

interface AddPostsProps {
  onPostAdded?: () => void;
}

export default function AddPosts({ onPostAdded }: AddPostsProps) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !summary.trim()) {
      setError("Title and summary are required");
      return;
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
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
          user_id: user.id,
          views: 0,
          likes: 0
        }]);

      if (supabaseError) throw supabaseError;

      setTitle("");
      setSummary("");
      handleRemoveImage();
      setSuccess(true);
      
      if (onPostAdded) onPostAdded();
      
      setTimeout(() => setSuccess(false), 3000);
      
    } catch (err: any) {
      console.error("Error creating post:", err);
      setError(err.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
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
              rows={5}
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
  );
}