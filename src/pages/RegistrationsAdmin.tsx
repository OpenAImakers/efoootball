import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";

interface Registration {
  id: number;
  team_name: string;
  username: string;
  whatsapp: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'withdrawn';
  created_at: string;
}

const AdminRegistrations = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("tournament_registrations")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setRegistrations(data || []);
    setLoading(false);
  };

  const updateStatus = async (id: number, teamName: string, newStatus: string) => {
    // Confirmation Dialog
    const confirmed = window.confirm(
      `Are you sure you want to change the status of "${teamName}" to ${newStatus.toUpperCase()}?`
    );
    
    if (!confirmed) return;

    const { error } = await supabase
      .from("tournament_registrations")
      .update({ status: newStatus, updated_at: new Date() })
      .eq("id", id);

    if (!error) {
      setRegistrations(prev => prev.map(r => r.id === id ? { ...r, status: newStatus as any } : r));
    } else {
      alert("Error updating status: " + error.message);
    }
  };

  const filteredData = filter === 'all' 
    ? registrations 
    : registrations.filter(r => r.status === filter);

  return (
    <div className="min-vh-100" style={{ backgroundColor: "#f8f9fa" }}>
      <Navbar />
      {/* Container-fluid used for 100% width of parent */}
      <div className="container-fluid py-4" style={{ marginTop: "60px" }}>
        
        {/* Header Section */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap bg-white p-3 border shadow-sm">
          <div>
            <h2 className="fw-bold text-primary mb-0" style={{ letterSpacing: '-0.5px' }}>
             MANAGE REGISTRATIONS
            </h2>
         </div>
          
          {/* Square Filters */}
          <div className="d-flex border">
            {['pending', 'confirmed', 'rejected', 'all'].map((s) => (
              <button 
                key={s}
                className={`btn btn-sm fw-bold text-uppercase rounded-0 px-4 transition-all ${
                  filter === s ? 'btn-primary' : 'btn-white text-muted border-start'
                }`}
                onClick={() => setFilter(s)}
                style={{ fontSize: '0.75rem', height: '40px' }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Card - Removed Rounded Corners */}
        <div className="card border shadow-sm rounded-0 overflow-hidden">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-2 text-muted small text-uppercase fw-bold">Syncing Records...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light border-bottom">
                  <tr className="small text-uppercase fw-bold text-secondary">
                    <th className="ps-4 py-3 border-end">Team Details</th>
                    <th className="py-3 border-end">Contact</th>
                    <th className="py-3 text-center border-end">Entry Date</th>
                    <th className="py-3 text-center border-end">Status</th>
                    <th className="pe-4 py-3 text-end">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-5 text-muted fw-bold text-uppercase small">
                        No {filter} records found in the database.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((reg) => (
                      <tr key={reg.id} className="border-bottom">
                        <td className="ps-4 py-3 border-end">
                          <div className="fw-bold text-dark">{reg.team_name}</div>
                          <div className="text-primary small fw-semibold">ID: {reg.username}</div>
                        </td>
                        <td className="py-3 border-end">
                          <span className="font-monospace small bg-light p-1 border">
                            {reg.whatsapp}
                          </span>
                        </td>
                        <td className="py-3 text-center text-muted small border-end">
                          {new Date(reg.created_at).toLocaleDateString('en-GB', { 
                            day: '2-digit', month: '2-digit', year: 'numeric' 
                          })}
                        </td>
                        <td className="py-3 text-center border-end">
                          {/* Square Badges */}
                          <span className={`px-3 py-1 fw-bold small border rounded-0 d-inline-block w-75 ${
                            reg.status === 'confirmed' ? 'bg-success text-white border-success' :
                            reg.status === 'pending' ? 'bg-warning text-dark border-warning' :
                            'bg-danger text-white border-danger'
                          }`}>
                            {reg.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="pe-4 py-3 text-end">
                          <div className="d-flex gap-1 justify-content-end">
                            {reg.status !== 'confirmed' && (
                              <button 
                                className="btn btn-sm btn-success rounded-0 px-3 fw-bold text-uppercase"
                                style={{ fontSize: '0.7rem' }}
                                onClick={() => updateStatus(reg.id, reg.team_name, 'confirmed')}
                              >
                                Approve
                              </button>
                            )}
                            {reg.status !== 'rejected' && (
                              <button 
                                className="btn btn-sm btn-danger rounded-0 px-3 fw-bold text-uppercase"
                                style={{ fontSize: '0.7rem' }}
                                onClick={() => updateStatus(reg.id, reg.team_name, 'rejected')}
                              >
                                Reject
                              </button>
                            )}
                            {reg.status !== 'pending' && (
                              <button 
                                className="btn btn-sm btn-outline-secondary rounded-0 px-3 fw-bold text-uppercase"
                                style={{ fontSize: '0.7rem' }}
                                onClick={() => updateStatus(reg.id, reg.team_name, 'pending')}
                              >
                                Reset
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .transition-all { transition: all 0.15s ease-in-out; }
        .table thead th { letter-spacing: 1px; font-size: 0.75rem; }
        .table tbody tr:hover { background-color: #f1f5f9; }
        .btn { border-radius: 0 !important; }
        .card { border-radius: 0 !important; }
        .badge { border-radius: 0 !important; }
      `}</style>
    </div>
  );
};

export default AdminRegistrations;