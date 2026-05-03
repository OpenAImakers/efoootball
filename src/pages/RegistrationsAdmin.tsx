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
}

const AdminRegistrations = () => {
  const [playerRegistrations, setPlayerRegistrations] = useState<Registration[]>([]);
  const [parentRegistrations, setParentRegistrations] = useState<ParentRegistration[]>([]);
  const [selectedParentId, setSelectedParentId] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [userId, setUserId] = useState<string | null>(null);

  // Wrap fetchMyParentRegistrations in useCallback
  const fetchMyParentRegistrations = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from("registrations")
      .select("id, name")
      .eq("created_by", uid);
    if (data) setParentRegistrations(data);
  }, []);

  // Wrap initSession in useCallback
  const initSession = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      fetchMyParentRegistrations(user.id);
    }
  }, [fetchMyParentRegistrations]);

  // Wrap fetchPlayerRegistrations in useCallback
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

  // First useEffect - now includes initSession dependency
  useEffect(() => {
    initSession();
  }, [initSession]);

  // Second useEffect - now includes fetchPlayerRegistrations dependency
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
      
      <div className="w-100 bg-white border-bottom shadow-sm px-3 py-4" style={{ marginTop: "60px" }}>
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-6">
            <label className="small fw-bold text-uppercase text-muted mb-2 d-block">
              <i className="bi bi-calendar-event me-2"></i>
              Registration Events
            </label>
            <select 
              className="form-select form-select-lg rounded-0 border-dark" 
              value={selectedParentId}
              onChange={(e) => setSelectedParentId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            >
              <option value="all">
                <i className="bi bi-grid-3x3-gap-fill me-2"></i>
                All My Registrations
              </option>
              {parentRegistrations.map(p => (
                <option key={p.id} value={p.id}>
                  <i className="bi bi-trophy-fill me-2"></i>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-6">
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
          </div>
        </div>
      </div>

      <div className="container-fluid px-3 py-4">
        {loading ? (
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
                          style={{ cursor: 'pointer' }}
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
        )}
      </div>

      <style>{`
        .btn { transition: all 0.2s ease; }
        .card { transition: transform 0.15s ease-in-out; }
        .card:hover { transform: translateY(-3px); }
        .form-select:focus { border-color: #000; box-shadow: none; }
        .cursor-pointer { cursor: pointer; }
        .bi { vertical-align: middle; }
      `}</style>
    </div>
  );
};

export default AdminRegistrations;