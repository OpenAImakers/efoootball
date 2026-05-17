import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";

interface Registration {
  id: number;
  team_name: string;
  username: string;
  whatsapp: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'withdrawn';
  created_at: string;
  registration_id: number;
}

interface ParentRegistration {
  id: number;
  name: string;
  tournament_type: string | null;
  max_players: number | null;
  registration_amount: number;
}

const AdminRegistrations = () => {
  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<'signups' | 'edit_event'>('signups');

  // Core Data States
  const [playerRegistrations, setPlayerRegistrations] = useState<Registration[]>([]);
  const [parentRegistrations, setParentRegistrations] = useState<ParentRegistration[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [userId, setUserId] = useState<string | null>(null);

  // Form States for Editing the Selected Event
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("single_elimination");
  const [editMaxPlayers, setEditMaxPlayers] = useState<number>(0);
  const [editAmount, setEditAmount] = useState<number>(100);
  const [savingSettings, setSavingSettings] = useState(false);

  // Sync Form States whenever selected event changes
  useEffect(() => {
    if (selectedParentId !== 'all') {
      const currentEvent = parentRegistrations.find(p => p.id === selectedParentId);
      if (currentEvent) {
        setEditName(currentEvent.name);
        setEditType(currentEvent.tournament_type || "single_elimination");
        setEditMaxPlayers(currentEvent.max_players || 0);
        setEditAmount(currentEvent.registration_amount);
      }
    } else {
      setActiveTab('signups'); // Fallback safety
    }
  }, [selectedParentId, parentRegistrations]);

  const fetchMyParentRegistrations = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from("registrations")
      .select("id, name, tournament_type, max_players, registration_amount")
      .eq("created_by", uid);
    if (data) setParentRegistrations(data);
  }, []);

  const initSession = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      fetchMyParentRegistrations(user.id);
    }
  }, [fetchMyParentRegistrations]);

  const fetchPlayerRegistrations = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("tournament_registrations")
      .select(`
        *,
        registrations!fk_registration (created_by)
      `)
      .order("created_at", { ascending: false });

    query = query.eq('registrations.created_by', userId);

    if (selectedParentId !== 'all') {
      query = query.eq('registration_id', selectedParentId);
    }

    const { data, error } = await query;
    if (!error) {
      setPlayerRegistrations(data?.filter(r => r.registrations !== null) || []);
    }
    setLoading(false);
  }, [userId, selectedParentId]);

  useEffect(() => {
    initSession();
  }, [initSession]);

  useEffect(() => {
    if (userId) {
      fetchPlayerRegistrations();
    }
  }, [userId, selectedParentId, fetchPlayerRegistrations]);

  const updateStatus = async (id: number, teamName: string, newStatus: string) => {
    const confirmed = window.confirm(`Change status for "${teamName}" to ${newStatus.toUpperCase()}?`);
    if (!confirmed) return;

    const { error } = await supabase
      .from("tournament_registrations")
      .update({ status: newStatus, updated_at: new Date() })
      .eq("id", id);

    if (!error) {
      setPlayerRegistrations(prev => prev.map(r => r.id === id ? { ...r, status: newStatus as any } : r));
    }
  };

  // Action: Update Parent Registration Attributes
  const handleUpdateEventSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedParentId === 'all') return;

    setSavingSettings(true);
    const { error } = await supabase
      .from("registrations")
      .update({
        name: editName,
        tournament_type: editType || null,
        max_players: editMaxPlayers || null,
        registration_amount: editAmount
      })
      .eq("id", selectedParentId);

    setSavingSettings(false);

    if (error) {
      alert("Error updating settings: " + error.message);
    } else {
      alert("Registration parameters updated successfully.");
      if (userId) fetchMyParentRegistrations(userId); // Refresh options metadata
    }
  };

  // Action: Destroy the Whole Event Context Completely
  const handleDeleteEntireRegistration = async () => {
    if (selectedParentId === 'all') return;
    const targetEvent = parentRegistrations.find(p => p.id === selectedParentId);
    if (!targetEvent) return;

    const confirmed = window.confirm(
      `⚠️ CRITICAL DANGER ZONE ⚠️\n\nAre you completely sure you want to delete "${targetEvent.name.toUpperCase()}"?\n\nThis option wipes out the event configuration and permanently deletes ALL connected player registrations.`
    );
    if (!confirmed) return;

    // Purge child nodes to block foreign keys crashing the operation
    await supabase.from("tournament_registrations").delete().eq("registration_id", selectedParentId);
    
    // Purge the entity context row
    const { error } = await supabase.from("registrations").delete().eq("id", selectedParentId);

    if (error) {
      alert("Failed to execute deletion cascade: " + error.message);
    } else {
      alert("Registration target configuration and nested sign-ups completely erased.");
      setParentRegistrations(prev => prev.filter(p => p.id !== selectedParentId));
      setSelectedParentId('all');
      setActiveTab('signups');
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'confirmed': return 'check-circle-fill';
      case 'pending': return 'hourglass-split';
      case 'rejected': return 'x-circle-fill';
      case 'withdrawn': return 'arrow-return-left';
      default: return 'question-circle';
    }
  };

  const filteredData = filter === 'all' 
    ? playerRegistrations 
    : playerRegistrations.filter(r => r.status === filter);

  return (
    <div className="min-vh-100 w-100" style={{ backgroundColor: "#f0f2f5" }}>
      <Navbar/>
      
      {/* High-Top Level Tabs Control Bar */}
      <div className="w-100 bg-dark text-white px-3" style={{ marginTop: "60px" }}>
        <div className="d-flex align-items-center">
          <button 
            className={`btn rounded-0 py-3 px-4 fw-bold text-uppercase border-0 ${activeTab === 'signups' ? 'bg-white text-dark' : 'text-white'}`}
            onClick={() => setActiveTab('signups')}
            style={{ fontSize: '0.85rem', letterSpacing: '0.5px' }}
          >
            <i className="bi bi-people-fill me-2"></i> Sign-ups Ledgers
          </button>
          
          {selectedParentId !== 'all' && (
            <button 
              className={`btn rounded-0 py-3 px-4 fw-bold text-uppercase border-0 ${activeTab === 'edit_event' ? 'bg-white text-dark' : 'text-white'}`}
              onClick={() => setActiveTab('edit_event')}
              style={{ fontSize: '0.85rem', letterSpacing: '0.5px' }}
            >
              <i className="bi bi-sliders me-2"></i> Edit Event Settings
            </button>
          )}
        </div>
      </div>

      {/* Control Configuration Bar */}
      <div className="w-100 bg-white border-bottom shadow-sm px-3 py-4">
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-6">
            <label className="small fw-bold text-uppercase text-muted mb-2 d-block">
              <i className="bi bi-calendar-event me-2"></i>
              Active Scope Context
            </label>
            <select 
              className="form-select form-select-lg rounded-0 border-dark" 
              value={selectedParentId}
              onChange={(e) => setSelectedParentId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            >
              <option value="all">
                All Event Registrations
              </option>
              {parentRegistrations.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="col-12 col-md-6">
            {activeTab === 'signups' ? (
              <div className="btn-group w-100 border">
                {['pending', 'confirmed', 'rejected', 'all'].map((s) => (
                  <button 
                    key={s}
                    className={`btn py-2 fw-bold text-uppercase rounded-0 ${filter === s ? 'btn-dark' : 'btn-light'}`}
                    onClick={() => setFilter(s)}
                    style={{ fontSize: '0.8rem' }}
                  >
                    <i className={`bi ${
                      s === 'pending' ? 'bi-hourglass-split' :
                      s === 'confirmed' ? 'bi-check-circle' :
                      s === 'rejected' ? 'bi-x-circle' :
                      'bi-grid-3x3-gap-fill'
                    } me-2`}></i>
                    {s}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-md-end text-start">
                <span className="badge bg-secondary rounded-0 py-2 px-3 fw-bold text-uppercase">
                  Configuring Event ID: #{selectedParentId}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Injection Context Container */}
      <div className="container-fluid px-3 py-4">
        
        {/* VIEW 1: SIGN-UPS MANAGEMENT GRID */}
        {activeTab === 'signups' && (
          loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-dark" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Loading registrations...</p>
            </div>
          ) : (
            <div className="row g-3">
              {filteredData.length === 0 ? (
                <div className="col-12 text-center py-5 bg-white border">
                  <i className="bi bi-inbox fs-1 text-muted"></i>
                  <p className="text-muted fw-bold mb-0 text-uppercase mt-2">No records found matching your selection</p>
                </div>
              ) : (
                filteredData.map((reg) => (
                  <div className="col-12 col-md-6 col-lg-4 col-xl-3" key={reg.id}>
                    <div className="card h-100 border-0 shadow-sm rounded-0 border-top border-4 border-dark">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <span className={`px-2 py-1 fw-bold small border rounded-0 text-uppercase d-inline-flex align-items-center gap-1 ${
                            reg.status === 'confirmed' ? 'bg-success text-white border-success' : 
                            reg.status === 'pending' ? 'bg-warning text-dark border-warning' : 
                            reg.status === 'withdrawn' ? 'bg-secondary text-white border-secondary' :
                            'bg-danger text-white border-danger'
                          }`}>
                            <i className={`bi bi-${getStatusIcon(reg.status)}`}></i>
                            {reg.status}
                          </span>
                          <small className="text-muted font-monospace">
                            <i className="bi bi-hash"></i> {reg.id}
                          </small>
                        </div>
                        
                        <h5 className="fw-bold mb-1 text-uppercase text-truncate">
                          <i className="bi bi-people-fill me-2 text-primary"></i>
                          {reg.team_name}
                        </h5>
                        <p className="text-primary small mb-3 fw-semibold">
                          <i className="bi bi-at me-1"></i>@{reg.username}
                        </p>
                        
                        <div className="bg-light p-2 mb-4 border">
                          <small className="d-block text-muted text-uppercase fw-bold mb-1" style={{ fontSize: '9px' }}>
                            <i className="bi bi-whatsapp me-1"></i>
                            WhatsApp Contact
                          </small>
                          <div 
                            className="d-flex align-items-center gap-2 cursor-pointer" 
                            onClick={() => {
                              navigator.clipboard.writeText(reg.whatsapp);
                              alert(`WhatsApp number ${reg.whatsapp} copied to clipboard!`);
                            }}
                          >
                            <i className="bi bi-whatsapp text-success fs-5"></i>
                            <span className="text-dark fw-bold">{reg.whatsapp}</span>
                            <i className="bi bi-clipboard ms-auto text-muted"></i>
                          </div>
                        </div>

                        <div className="d-flex flex-column gap-2">
                          {reg.status !== 'confirmed' && (
                            <button 
                              className="btn btn-success btn-sm fw-bold rounded-0 py-2 d-flex align-items-center justify-content-center gap-2"
                              onClick={() => updateStatus(reg.id, reg.team_name, 'confirmed')}
                            >
                              <i className="bi bi-check-circle"></i>
                              APPROVE PLAYER
                            </button>
                          )}
                          <div className="d-flex gap-2">
                            {reg.status !== 'rejected' && reg.status !== 'confirmed' && (
                              <button 
                                className="btn btn-danger btn-sm flex-fill fw-bold rounded-0 py-2 d-flex align-items-center justify-content-center gap-2"
                                onClick={() => updateStatus(reg.id, reg.team_name, 'rejected')}
                              >
                                <i className="bi bi-x-circle"></i>
                                REJECT
                              </button>
                            )}
                            {reg.status !== 'pending' && (
                              <button 
                                className="btn btn-outline-secondary btn-sm flex-fill fw-bold rounded-0 py-2 d-flex align-items-center justify-content-center gap-2"
                                onClick={() => updateStatus(reg.id, reg.team_name, 'pending')}
                              >
                                <i className="bi bi-arrow-repeat"></i>
                                RESET
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="card-footer bg-white border-top-0 small text-muted text-end">
                        <i className="bi bi-calendar3 me-1"></i>
                        Joined: {new Date(reg.created_at).toLocaleDateString('en-GB')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )
        )}

        {/* VIEW 2: SMART SCHEMA ATTRIBUTES CONFIG EDITOR TAB */}
        {activeTab === 'edit_event' && selectedParentId !== 'all' && (
          <div className="bg-white border p-4 shadow-sm mx-auto" style={{ maxWidth: "800px" }}>
            <h4 className="fw-bold text-uppercase border-bottom pb-3 mb-4">
              <i className="bi bi-gear-fill text-dark me-2"></i> Event Management Panel
            </h4>
            
            <form onSubmit={handleUpdateEventSettings}>
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-bold text-uppercase text-muted">Event Target Name</label>
                  <input 
                    type="text" 
                    className="form-control rounded-0 border-dark" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required 
                  />
                </div>
                
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-bold text-uppercase text-muted">Tournament Type</label>
                  <select 
                    className="form-select rounded-0 border-dark"
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                  >
                    <option value="single_elimination">Single Elimination</option>
                    <option value="round_robin_single">Round Robin (Single)</option>
                    <option value="round_robin_double">Round Robin (Double)</option>
                    <option value="double_elimination">Double Elimination</option>
                  </select>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small fw-bold text-uppercase text-muted">Max Capacity (Players/Teams)</label>
                  <input 
                    type="number" 
                    className="form-control rounded-0 border-dark" 
                    value={editMaxPlayers}
                    onChange={(e) => setEditMaxPlayers(Number(e.target.value))}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small fw-bold text-uppercase text-muted">Entry Fee (Min 100)</label>
                  <input 
                    type="number" 
                    className="form-control rounded-0 border-dark" 
                    min="100"
                    value={editAmount}
                    onChange={(e) => setEditAmount(Number(e.target.value))}
                    required 
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-top d-flex justify-content-between align-items-center flex-wrap gap-2">
                <button 
                  type="button" 
                  className="btn btn-danger rounded-0 fw-bold py-2 px-4 text-uppercase"
                  onClick={handleDeleteEntireRegistration}
                >
                  <i className="bi bi-trash3-fill me-2"></i> Delete Whole Event
                </button>

                <button 
                  type="submit" 
                  className="btn btn-dark rounded-0 fw-bold py-2 px-5 text-uppercase"
                  disabled={savingSettings}
                >
                  {savingSettings ? "Saving..." : "Save Details"}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>

      <style>{`
        .btn { transition: all 0.2s ease; }
        .card { transition: transform 0.15s ease-in-out; }
        .card:hover { transform: translateY(-3px); }
        .form-select:focus, .form-control:focus { border-color: #000; box-shadow: none; }
        .cursor-pointer { cursor: pointer; }
        .bi { vertical-align: middle; }
      `}</style>
    </div>
  );
};

export default AdminRegistrations;