"use client";

import { useEffect, useState } from "react";
import { supabase } from "../supabase"; 
import Navbar from "../components/Navbar"; 

export default function ProfilePage() {
  const [profile, setProfile] = useState<{ username: string | null; display_name: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          setError("Please log in to view your profile.");
          return;
        }

        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("username, display_name")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;

        setProfile(data);
        setUsername(data?.username || "");
        setDisplayName(data?.display_name || "");
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
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({
        username: username.trim() || null,
        display_name: displayName.trim() || null,
      }).eq("id", user.id);

      if (error) throw error;
      setProfile((prev) => ({ ...prev, username: username.trim(), display_name: displayName.trim() }));
      alert("Changes Saved.");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mt-5 bg-light min-vh-100">
      <Navbar />

      <div className="container py-5">
        <h1 className="mb-4 fw-black text-uppercase italic" style={{ letterSpacing: '-1px' }}>Profile Terminal</h1>

        {loading ? (
          <div className="text-center my-5 p-5 bg-white border rounded shadow-sm">
            <div className="spinner-grow text-primary mb-3" role="status"></div>
            <p className="text-muted fw-bold small">INITIALIZING INTERFACE...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger border-0 shadow-sm">{error}</div>
        ) : (
          <>
            {/* --- PRO DASHBOARD COMPONENT --- */}
            <div className="w-100 bg-white border rounded shadow-sm overflow-hidden mb-5">
              
              {/* Dark Header */}
              <div className="p-4 bg-dark text-white d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-uppercase small fw-bold text-primary mb-1" style={{ letterSpacing: '2px' }}>Collective Strength</div>
                  <h2 className="display-5 fw-bold mb-0">-- <span className="fs-6 opacity-25">PTS</span></h2>
                </div>
                <div className="text-end">
                  <div className="dropdown">
                    <button className="btn btn-sm btn-outline-light dropdown-toggle border-secondary fw-bold" type="button" data-bs-toggle="dropdown">
                      GLOBAL REGION
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end">
                      <li><button className="dropdown-item small disabled">COMING SOON</button></li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Navigation Pills */}
              <div className="bg-white border-bottom px-3 py-2">
                <ul className="nav nav-pills nav-fill gap-2">
                  {['overview', 'matches', 'achievements'].map((tab) => (
                    <li className="nav-item" key={tab}>
                      <button 
                        className={`nav-link py-2 fw-bold text-uppercase border ${activeTab === tab ? 'active border-primary' : 'bg-light border-transparent'}`}
                        onClick={() => setActiveTab(tab)}
                        style={{ fontSize: '0.7rem', letterSpacing: '1px' }}
                      >
                        {tab}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Interactive Content Grid */}
              <div className="bg-white">
                {activeTab === 'overview' ? (
                  <div className="row g-0 h-100">
                    <div className="col-6 col-md-3 border-end border-bottom p-4">
                      <label className="d-block text-muted small fw-bold text-uppercase mb-2">Rank</label>
                      <div className="h4 fw-bold mb-1">--</div>
                      <span className="badge bg-light text-muted border fw-normal">COMING SOON</span>
                    </div>
                    <div className="col-6 col-md-3 border-end border-bottom p-4">
                      <label className="d-block text-muted small fw-bold text-uppercase mb-2">Roles</label>
                      <div className="h4 fw-bold mb-1">--</div>
                      <span className="badge bg-light text-muted border fw-normal">COMING SOON</span>
                    </div>
                    <div className="col-6 col-md-3 border-end border-bottom p-4">
                      <label className="d-block text-muted small fw-bold text-uppercase mb-2">Cups</label>
                      <div className="h4 fw-bold mb-1">--</div>
                      <span className="badge bg-light text-muted border fw-normal">COMING SOON</span>
                    </div>
                    <div className="col-6 col-md-3 border-bottom p-4">
                      <label className="d-block text-muted small fw-bold text-uppercase mb-2">Net Worth</label>
                      <div className="h4 fw-bold mb-1">--</div>
                      <span className="badge bg-light text-muted border fw-normal">COMING SOON</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 text-center bg-light">
                    <div className="py-4">
                      <h5 className="fw-bold text-muted mb-1 text-uppercase">Module Locked</h5>
                      <p className="small text-muted mb-0">Statistical data for <strong>{activeTab}</strong> is coming soon.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Footer */}
              <div className="p-3 px-4 bg-light d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-primary rounded-circle" style={{ width: '10px', height: '10px' }}></div>
                  <span className="small fw-bold text-uppercase">Account: {profile?.display_name || "LINKED"}</span>
                </div>
                <button className="btn btn-dark btn-sm px-4 fw-bold" onClick={() => alert("History Module: Coming Soon")}>HISTORY</button>
              </div>
            </div>

            {/* --- SETTINGS CARD --- */}
            <div className="card p-4 border-0 shadow-sm rounded-3">
              <h5 className="fw-bold mb-4 text-uppercase">Identity Settings</h5>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted text-uppercase">Display Name</label>
                  <input
                    className="form-control border-light bg-light p-2 px-3"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Set Display Name"
                    disabled={saving}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small fw-bold text-muted text-uppercase">Username</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-light text-muted">@</span>
                    <input
                      className="form-control border-light bg-light p-2 px-3"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="username"
                      disabled={saving}
                    />
                  </div>
                </div>
                <div className="col-12 mt-4">
                  <button
                    className="btn btn-primary px-5 py-2 fw-bold text-uppercase"
                    style={{ fontSize: '0.8rem', letterSpacing: '1px' }}
                    onClick={handleSaveProfile}
                    disabled={saving}
                  >
                    {saving ? "Updating..." : "Push Changes"}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}