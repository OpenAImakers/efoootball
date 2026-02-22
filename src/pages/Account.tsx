"use client";

import { useEffect, useState } from "react";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";

export default function ProfilePage() {
  const [, setProfile] = useState<{
    username: string | null;
    display_name: string | null;
    profile_pic: string | null;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [profilePic, setProfilePic] = useState<string | null>(null);

  // Styling Constants (Player Dashboard Theme)
  const colors = {
    darkBlue: "#0B0E14",
    cardBg: "#161B22",
    accentOrange: "#FF8C00",
    textGray: "#8B949E",
    border: "#30363D"
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          setError("Access Denied. Please log in.");
          return;
        }

        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("username, display_name, profile_pic")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;

        setProfile(data);
        setUsername(data?.username || "");
        setDisplayName(data?.display_name || "");
        setProfilePic(data?.profile_pic || null);

      } catch (err: any) {
        setError(err.message || "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from("profiles")
        .update({
          username: username.trim() || null,
          display_name: displayName.trim() || null,
          profile_pic: profilePic
        })
        .eq("id", user.id);

      if (error) throw error;
      alert("Dashboard updated.");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("File too large (Max 2MB)");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      setSaving(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
      const publicUrl = data.publicUrl;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ profile_pic: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;
      setProfilePic(publicUrl);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main style={{ backgroundColor: colors.darkBlue, minHeight: "100vh", color: "white" }}>
      <Navbar />

      <div className="container mt-5 py-5">
        <div className="d-flex align-items-center mb-4">
          <div style={{ width: "4px", height: "30px", backgroundColor: colors.accentOrange, marginRight: "12px" }}></div>
          <h2 className="fw-bold m-0" style={{ letterSpacing: "1px", textTransform: "uppercase" }}>Player Profile</h2>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-warning" role="status"></div>
          </div>
        ) : error ? (
          <div className="alert border-0 shadow" style={{ backgroundColor: "#2d1b1b", color: "#ff8484" }}>{error}</div>
        ) : (
          <div className="row g-4">
            
            {/* LEFT COLUMN: Identity Card */}
            <div className="col-md-4">
              <div className="card border-0 p-4 h-100 shadow" style={{ backgroundColor: colors.cardBg, borderRadius: "15px" }}>
                <div className="text-center">
                  <div className="position-relative d-inline-block">
                    {profilePic ? (
                      <img
                        src={profilePic}
                        alt="Profile"
                        className="rounded-circle border border-3"
                        style={{ width: "150px", height: "150px", objectFit: "cover", borderColor: colors.accentOrange + " !important" }}
                      />
                    ) : (
                      <div className="rounded-circle d-flex align-items-center justify-content-center border border-3 mx-auto shadow"
                           style={{ width: "150px", height: "150px", fontSize: "4rem", backgroundColor: colors.accentOrange, borderColor: "white" }}>
                        {(displayName || username || "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <label className="position-absolute bottom-0 end-0 bg-warning rounded-circle p-2 shadow" style={{ cursor: "pointer" }}>
                      <input type="file" hidden onChange={handleProfilePicUpload} />
                      📸
                    </label>
                  </div>
                  <h4 className="mt-3 fw-bold mb-0 text-white">{displayName || username}</h4>
                  <p style={{ color: colors.textGray }}>@{username}</p>
                </div>
                
                <hr style={{ borderColor: colors.border }} />
                
                <div className="mt-2">
                  <small className="text-uppercase fw-bold" style={{ color: colors.accentOrange, fontSize: "0.75rem" }}>Account Status</small>
                  <div className="d-flex align-items-center mt-1">
                    <span className="p-1 bg-success rounded-circle me-2"></span>
                    <span className="small text-white">--</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Settings Form */}
            <div className="col-md-8">
              <div className="card border-0 p-4 h-100 shadow" style={{ backgroundColor: colors.cardBg, borderRadius: "15px" }}>
                <h5 className="mb-4 text-white">Dashboard Settings</h5>
                
                <div className="mb-3">
                  <label className="small text-uppercase fw-bold mb-2" style={{ color: colors.textGray }}>Display Name</label>
                  <input
                    className="form-control border-0 text-white px-3 py-2"
                    style={{ backgroundColor: colors.darkBlue, borderRadius: "8px" }}
                    value={displayName}
                    placeholder="Enter player name"
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </div>

                <div className="mb-4">
                  <label className="small text-uppercase fw-bold mb-2" style={{ color: colors.textGray }}>System Username</label>
                  <div className="input-group">
                    <span className="input-group-text border-0 text-white" style={{ backgroundColor: colors.border }}>@</span>
                    <input
                      className="form-control border-0 text-white px-3 py-2"
                      style={{ backgroundColor: colors.darkBlue }}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-auto">
                  <button
                    className="btn w-100 fw-bold py-2 shadow-sm"
                    style={{ backgroundColor: colors.accentOrange, color: "black", borderRadius: "8px", transition: "0.3s" }}
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving ? "SYNCING..." : "UPDATE DASHBOARD"}
                  </button>
                  <p className="text-center small mt-3" style={{ color: colors.textGray }}>
                    Your identity is public to other players in the feed.
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}