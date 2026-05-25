import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../supabase";
import { User } from "@supabase/supabase-js";

const WORKER_URL = 'https://posts-api.unscriptedusa.workers.dev';

interface Post {
  id: number;
  title: string;
  summary: string;
  image_url: string;
  user_id: string;
}

export default function JournalistDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState('');

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    
    const cleanupImagePreview = () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
    
    const fetchUserAndPosts = async () => {
      try {
        const { data: { user: sbUser }, error } = await supabase.auth.getUser();
        if (error) throw error;
        
        if (isMounted.current) {
          setUser(sbUser);
          if (sbUser) {
            await fetchPosts(sbUser.id);
          }
        }
      } catch (error) {
        console.error('Error fetching user metadata:', error);
      } finally {
        if (isMounted.current) setInitialLoading(false);
      }
    };

    fetchUserAndPosts();

    return () => {
      isMounted.current = false;
      cleanupImagePreview();
    };
  }, [imagePreview]);

  const fetchPosts = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('id', { ascending: false });
      
      if (error) throw error;
      if (isMounted.current) setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const deleteFileFromStorage = async (urlToDelete: string) => {
    if (!urlToDelete || urlToDelete === '/teamlogo.png' || urlToDelete.startsWith('blob:')) {
      return;
    }
    try {
      const response = await fetch(WORKER_URL, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: urlToDelete })
      });
      
      if (!response.ok) {
        console.warn(`Storage cleanup alert: Failed to delete remote file: ${urlToDelete}`);
      }
    } catch (err) {
      console.error('Network failure trying to clean up storage asset:', err);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setExistingImageUrl('');
    }
  };

  const handleRemoveImage = () => {
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl('');
    
    const fileInput = document.getElementById('image-input') as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!title.trim() || !summary.trim()) {
      alert('Please fill in both the title and summary.');
      return;
    }

    if (!user) {
      alert('Session expired. Please log back in.');
      return;
    }

    setLoading(true);

    try {
      let finalImageUrl = existingImageUrl;
      let previousActiveUrlToClean = '';

      if (editingPost && imageFile && editingPost.image_url) {
        previousActiveUrlToClean = editingPost.image_url;
      }

      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
        
        const uploadRes = await fetch(WORKER_URL, {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadRes.ok) throw new Error('Worker Cloud Image upload failed');
        const data = await uploadRes.json();
        finalImageUrl = data.image_url;
      } 
      else if (!imagePreview) {
        // If the preview was explicitly cleared, flag the old remote image for removal
        if (editingPost && editingPost.image_url) {
          previousActiveUrlToClean = editingPost.image_url;
        }
        // Instead of falling back to '/teamlogo.png', save an empty string
        finalImageUrl = '';
      }

      if (editingPost) {
        const { error } = await supabase
          .from('posts')
          .update({
            title: title.trim(),
            summary: summary.trim(),
            image_url: finalImageUrl,
          })
          .eq('id', editingPost.id);
        
        if (error) throw error;

        if (previousActiveUrlToClean) {
          await deleteFileFromStorage(previousActiveUrlToClean);
        }

        alert('Post updated successfully!');
      } else {
        const { error } = await supabase
          .from('posts')
          .insert([{
            title: title.trim(),
            summary: summary.trim(),
            image_url: finalImageUrl,
            user_id: user.id,
          }]);
        
        if (error) throw error;
        alert('Post created successfully!');
      }
      
      if (isMounted.current) {
        resetForm();
        await fetchPosts(user.id);
      }
      
    } catch (error: any) {
      console.error('Submission failed operation:', error);
      alert(error.message || 'Something went wrong processing your request');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const handleEdit = (post: Post) => {
    setEditingPost(post);
    setTitle(post.title);
    setSummary(post.summary);
    setExistingImageUrl(post.image_url);
    setImagePreview(post.image_url || null); // Avoid passing empty strings directly to preview state
    setImageFile(null);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (post: Post) => {
    if (!window.confirm(`Are you sure you want to delete "${post.title}"?`)) return;
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);
      
      if (error) throw error;
      
      if (post.image_url) {
        await deleteFileFromStorage(post.image_url);
      }

      alert('Post deleted successfully!');
      
      if (isMounted.current) {
        await fetchPosts(user.id);
        if (editingPost?.id === post.id) {
          resetForm();
        }
      }
    } catch (error: any) {
      console.error('Error deleting post:', error);
      alert(error.message || 'Failed to delete post target safely');
    }
  };

  const resetForm = () => {
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setEditingPost(null);
    setTitle('');
    setSummary('');
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl('');
    const fileInput = document.getElementById('image-input') as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';
  };

  if (initialLoading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: "#020617" }}>
        <div className="text-center text-white">
          <div className="spinner-border text-warning" role="status"></div>
          <p className="mt-2">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: "#020617" }}>
        <div className="text-center">
          <h2 className="text-white mb-3">Please log in to access the dashboard</h2>
          <a href="/login" className="btn" style={{ backgroundColor: "#F38D1F", color: "#fff" }}>
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100" style={{ backgroundColor: "#020617" }}>
      <div className="container py-5">
        <div className="row g-4">
          {/* Left Column: Form */}
          <div className="col-lg-5">
            <div className="card border-0 shadow-lg" style={{ backgroundColor: "#1A2251", position: "sticky", top: "20px" }}>
              <div className="card-body p-4">
                <h2 className="text-white mb-4" style={{ fontWeight: "700" }}>
                  {editingPost ? 'Edit Article' : 'Write Article'}
                </h2>
                
                <form onSubmit={handleSubmit}>
                  {/* Image Upload */}
                  <div className="mb-4">
                    <label className="form-label text-white fw-bold mb-2">Featured Image</label>
                    <div 
                      className="border-2 border-dashed rounded-3 p-4 text-center"
                      style={{ borderColor: "#F38D1F40", backgroundColor: "#02061740", transition: "all 0.2s" }}
                    >
                      {imagePreview ? (
                        <div className="position-relative d-inline-block">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="rounded-3" 
                            style={{ maxHeight: "200px", maxWidth: "100%", objectFit: "cover" }} 
                          />
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="position-absolute top-0 end-0 translate-middle badge rounded-circle border-0 d-flex align-items-center justify-content-center"
                            style={{ backgroundColor: "#F38D1F", width: "30px", height: "30px", cursor: "pointer", color: "#fff", fontWeight: "bold" }}
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <div>
                          <input type="file" accept="image/*" onChange={handleImageSelect} className="d-none" id="image-input" />
                          <label htmlFor="image-input" className="d-block" style={{ cursor: "pointer" }}>
                            <div className="mb-2">
                              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#F38D1F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <polyline points="21 15 16 10 5 21"></polyline>
                              </svg>
                            </div>
                            <div className="text-white fw-bold mb-1">Click to upload image</div>
                            <div className="text-white-50 small">JPG, PNG, GIF up to 5MB</div>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <div className="mb-4">
                    <label className="form-label text-white fw-bold mb-2">Title</label>
                    <input
                      type="text"
                      className="form-control bg-dark text-white border-0 rounded-3"
                      style={{ backgroundColor: "#020617", border: "1px solid #F38D1F20" }}
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter article title"
                      disabled={loading}
                    />
                  </div>

                  {/* Summary */}
                  <div className="mb-4">
                    <label className="form-label text-white fw-bold mb-2">Summary</label>
                    <textarea
                      className="form-control bg-dark text-white border-0 rounded-3"
                      style={{ backgroundColor: "#020617", border: "1px solid #F38D1F20" }}
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      placeholder="Write your article summary..."
                      rows={6}
                      disabled={loading}
                    />
                  </div>

                  {/* Form Buttons */}
                  <div className="d-flex gap-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn flex-grow-1 fw-bold py-2 rounded-3 border-0"
                      style={{ backgroundColor: "#F38D1F", color: "#fff", transition: "opacity 0.2s", opacity: loading ? 0.7 : 1 }}
                    >
                      {loading ? 'Saving...' : (editingPost ? 'Update Article' : 'Publish Article')}
                    </button>
                    
                    {editingPost && (
                      <button
                        type="button"
                        onClick={resetForm}
                        disabled={loading}
                        className="btn flex-grow-1 fw-bold py-2 rounded-3 border-0"
                        style={{ backgroundColor: "#495057", color: "#fff", transition: "opacity 0.2s", opacity: loading ? 0.7 : 1 }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Right Column: Posts List */}
          <div className="col-lg-7">
            <div className="mb-4">
              <h2 className="text-white mb-1" style={{ fontWeight: "700" }}>Your Articles</h2>
              <p className="text-white-50">{posts.length} total {posts.length === 1 ? 'article' : 'articles'}</p>
            </div>

            {posts.length === 0 ? (
              <div className="text-center py-5 rounded-3" style={{ backgroundColor: "#1A2251" }}>
                <p className="text-white-50 mb-0">No articles yet. Create your first article!</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {posts.map((post) => (
                  <div key={post.id} className="card border-0" style={{ backgroundColor: "#1A2251" }}>
                    <div className="card-body p-3">
                      <div className="d-flex gap-3 align-items-start">
                        {/* Thumbnail Container */}
                        <div style={{ width: "80px", height: "80px", backgroundColor: "#02061750" }} className="rounded-3 d-flex align-items-center justify-content-center overflow-hidden flex-shrink-0">
                          {post.image_url ? (
                            <img 
                              src={post.image_url} 
                              alt={post.title} 
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                            />
                          ) : (
                            /* Placeholder icon or text if there is genuinely no image */
                            <span className="text-white-50 xs">No Image</span>
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-grow-1">
                          <h5 className="text-white mb-2" style={{ fontWeight: "600" }}>{post.title}</h5>
                          <p className="text-white-50 small mb-2">
                            {post.summary.length > 100 ? `${post.summary.substring(0, 100)}...` : post.summary}
                          </p>
                          <small className="text-white-50" style={{ opacity: 0.6 }}>ID: {post.id}</small>
                        </div>
                        
                        {/* Actions */}
                        <div className="d-flex gap-2">
                          <button
                            onClick={() => handleEdit(post)}
                            className="btn btn-sm px-3 py-1 fw-bold rounded-3 border-0"
                            style={{ backgroundColor: "#4da3ff", color: "#fff" }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(post)}
                            className="btn btn-sm px-3 py-1 fw-bold rounded-3 border-0"
                            style={{ backgroundColor: "#dc3545", color: "#fff" }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}