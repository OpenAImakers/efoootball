"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../supabase";
import Navbar from "../../components/Navbar";

const WORKER_URL = 'https://posts-api.unscriptedusa.workers.dev';

interface Clan {
  id: string;
  clan_name: string;
  clan_avatar: string;
  created_by: string;
  created_at: string;
}



export default function ClanManager() {
  const [clans, setClans] = useState<Clan[]>([]);
  const [clanName, setClanName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    
    fetchClans();
    
    return () => {
      isMounted.current = false;
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const fetchClans = async () => {
    try {
      setFetching(true);
      const { data, error } = await supabase
        .from('clans')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (isMounted.current) setClans(data || []);
    } catch (error) {
      console.error('Error fetching clans:', error);
      alert('Failed to load clans');
    } finally {
      if (isMounted.current) setFetching(false);
    }
  };

  const uploadImageToWorker = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const uploadRes = await fetch(WORKER_URL, {
      method: 'POST',
      body: formData,
    });
    
    if (!uploadRes.ok) throw new Error('Image upload failed');
    const data = await uploadRes.json();
    return data.image_url;
  };

  const deleteFileFromStorage = async (urlToDelete: string) => {
    if (!urlToDelete) return;
    
    try {
      const response = await fetch(WORKER_URL, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: urlToDelete })
      });
      
      if (!response.ok) {
        console.warn(`Failed to delete image: ${urlToDelete}`);
      }
    } catch (err) {
      console.error('Error deleting image:', err);
    }
  };

  const checkPlayersInClan = async (clanId: string): Promise<number> => {
    const { data, error } = await supabase
      .from('players')
      .select('id')
      .eq('clan_id', clanId);
    
    if (error) throw error;
    return data?.length || 0;
  };

  const handleCreateClan = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clanName.trim()) {
      alert("Please enter a clan name");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("You must be logged in to create a clan");
        return;
      }

      let finalAvatarUrl = "";

      if (imageFile) {
        setUploading(true);
        try {
          finalAvatarUrl = await uploadImageToWorker(imageFile);
        } catch (uploadError) {
          alert("Failed to upload clan avatar. Please try again.");
          setLoading(false);
          setUploading(false);
          return;
        } finally {
          setUploading(false);
        }
      }

      const { error } = await supabase.from("clans").insert([
        {
          clan_name: clanName,
          clan_avatar: finalAvatarUrl,
          created_by: user.id,
        },
      ]);

      if (error) throw error;

      // Reset form
      setClanName("");
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      setImageFile(null);
      setImagePreview(null);
      
      // Refresh the list
      await fetchClans();
      
      alert("Clan created successfully!");
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClan = async (clan: Clan) => {
    // Check for players in clan
    const playerCount = await checkPlayersInClan(clan.id);
    
    const warningMessage = playerCount > 0
      ? `WARNING: This clan has ${playerCount} player${playerCount === 1 ? '' : 's'} linked to it.\n\nDeleting this clan will also delete ALL linked players!\n\nAre you absolutely sure you want to delete "${clan.clan_name}"?`
      : `Are you sure you want to delete "${clan.clan_name}"?`;
    
    if (!window.confirm(warningMessage)) return;
    
    setDeletingId(clan.id);
    
    try {
      // First delete all players in this clan
      if (playerCount > 0) {
        const { error: playersError } = await supabase
          .from('players')
          .delete()
          .eq('clan_id', clan.id);
        
        if (playersError) throw playersError;
        console.log(`Deleted ${playerCount} players from clan`);
      }
      
      // Then delete the clan
      const { error: clanError } = await supabase
        .from('clans')
        .delete()
        .eq('id', clan.id);
      
      if (clanError) throw clanError;
      
      // Delete the avatar image from storage
      if (clan.clan_avatar) {
        await deleteFileFromStorage(clan.clan_avatar);
      }
      
      // Refresh the list
      await fetchClans();
      
      alert(`Clan "${clan.clan_name}" deleted successfully!${playerCount > 0 ? ` Removed ${playerCount} linked player${playerCount === 1 ? '' : 's'}.` : ''}`);
    } catch (error: any) {
      console.error('Error deleting clan:', error);
      alert(error.message || 'Failed to delete clan');
    } finally {
      setDeletingId(null);
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
    }
  };

  const handleRemoveImage = () => {
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
    
    const fileInput = document.getElementById('avatar-input') as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';
  };

  return (
    <>  
      <Navbar />
      <div className="container py-5" style={{ marginTop: "80px" }}>
        
        {/* Create Clan Form */}
        <div className="row justify-content-center mb-5">
          <div className="col-md-8">
            <div className="card shadow border-0 rounded-4 p-4">
              <h3 className="mb-4 text-center fw-bold">
                Create New Clan
              </h3>

              <form onSubmit={handleCreateClan}>
                {/* Clan Name */}
                <div className="mb-3">
                  <label className="form-label fw-bold">Clan Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter clan name"
                    value={clanName}
                    onChange={(e) => setClanName(e.target.value)}
                    required
                  />
                </div>

                {/* Clan Avatar Upload */}
                <div className="mb-3">
                  <label className="form-label fw-bold">Clan Avatar</label>
                  <div 
                    className="border-2 border-dashed rounded-3 p-4 text-center"
                    style={{ borderColor: "#13ff0f40", backgroundColor: "#f8f9fa" }}
                  >
                    {imagePreview ? (
                      <div className="position-relative d-inline-block">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          style={{ 
                            width: "120px", 
                            height: "120px", 
                            objectFit: "cover", 
                            borderRadius: "12px",
                            border: "2px solid #ddd"
                          }} 
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="position-absolute top-0 end-0 translate-middle badge rounded-circle border-0"
                          style={{ backgroundColor: "#dc3545", width: "30px", height: "30px", cursor: "pointer", color: "#fff", fontSize: "20px", lineHeight: "1" }}
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageSelect} 
                          className="d-none" 
                          id="avatar-input" 
                        />
                        <label htmlFor="avatar-input" className="d-block" style={{ cursor: "pointer" }}>
                          <div className="mb-2">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#13ff0f" strokeWidth="1.5">
                              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
                              <circle cx="8.5" cy="8.5" r="1.5"></circle>
                              <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                          </div>
                          <div className="fw-bold mb-1">Click to upload clan avatar</div>
                          <div className="text-muted small">JPG, PNG, GIF up to 5MB</div>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn w-100 py-2 fw-bold"
                  disabled={loading || uploading}
                  style={{
                    background: "linear-gradient(135deg, #fdf91b, #13ff0f)",
                    border: "none",
                    fontWeight: 600,
                  }}
                >
                  {loading ? "Creating Clan..." : uploading ? "Uploading Image..." : "Create Clan"}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Display Clans List */}
        <div className="row">
          <div className="col-12">
            <h3 className="text-center fw-bold mb-4">Your Clans</h3>
            
            {fetching ? (
              <div className="text-center py-5">
                <div className="spinner-border text-success" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading clans...</p>
              </div>
            ) : clans.length === 0 ? (
              <div className="text-center py-5">
                <p className="text-muted">No clans created yet. Create your first clan above!</p>
              </div>
            ) : (
              <div className="row g-4">
                {clans.map((clan) => (
                  <div key={clan.id} className="col-md-4 col-lg-3">
                    <div className="card h-100 shadow-sm border-0 rounded-4">
                      {/* Clan Avatar */}
                      <div className="text-center pt-4">
                        {clan.clan_avatar ? (
                          <img
                            src={clan.clan_avatar}
                            alt={clan.clan_name}
                            style={{
                              width: "100px",
                              height: "100px",
                              objectFit: "cover",
                              borderRadius: "50%",
                              border: "3px solid #13ff0f"
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                              (e.target as HTMLImageElement).nextSibling && ((e.target as HTMLImageElement).nextSibling as HTMLElement).style?.removeProperty('display');
                            }}
                          />
                        ) : null}
                        <div 
                          style={{ 
                            width: "100px", 
                            height: "100px", 
                            borderRadius: "50%", 
                            backgroundColor: "#f0f0f0",
                            margin: "0 auto",
                            display: clan.clan_avatar ? "none" : "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                        >
                          <span style={{ fontSize: "40px" }}>🏰</span>
                        </div>
                      </div>
                      
                      {/* Clan Info */}
                      <div className="card-body text-center">
                        <h5 className="fw-bold mb-2">{clan.clan_name}</h5>
                        <p className="text-muted small mb-3">
                          Created: {new Date(clan.created_at).toLocaleDateString()}
                        </p>
                        
                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteClan(clan)}
                          disabled={deletingId === clan.id}
                          className="btn btn-danger btn-sm px-4"
                          style={{ fontSize: "14px" }}
                        >
                          {deletingId === clan.id ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                              Deleting...
                            </>
                          ) : (
                            "Delete Clan"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}