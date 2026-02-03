import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { supabase } from '../supabase'; // ← adjust path to your supabase client

interface Registration {
  id: number;
  team_name: string;
  username: string;
  whatsapp: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'withdrawn';
  created_at: string;
}

const TournamentRegistration = () => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [formData, setFormData] = useState({
    teamName: '',
    username: '',
    whatsapp: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [activeTab, setActiveTab] = useState<'register' | 'teams' | 'rules'>('register');

  const maxSlots = 16;
  const entryFee = 50;
  const totalPot = maxSlots * entryFee;
  const isFull = registrations.length >= maxSlots;

  // Fetch initial data + real-time subscription
  useEffect(() => {
    const fetchRegistrations = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('tournament_registrations')
          .select('id, team_name, username, whatsapp, status, created_at')
          .order('created_at', { ascending: true });

        if (error) throw error;
        setRegistrations(data || []);
      } catch (err: any) {
        console.error('Fetch error:', err);
        setMessage({ text: 'Failed to load registrations', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchRegistrations();

    // Real-time updates
    const channel = supabase
      .channel('tournament-registrations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tournament_registrations' },
        () => fetchRegistrations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.teamName || !formData.username || !formData.whatsapp) return;
    if (isFull) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('tournament_registrations')
        .insert({
          team_name: formData.teamName.trim(),
          username: formData.username.trim(),
          whatsapp: formData.whatsapp.trim(),
          status: 'pending',
          entry_fee: entryFee,
        });

      if (error) throw error;

      setMessage({
        text: 'Registration submitted! Await admin confirmation (send M-Pesa proof via WhatsApp).',
        type: 'success',
      });
      setFormData({ teamName: '', username: '', whatsapp: '' });
    } catch (err: any) {
      console.error('Insert error:', err);
      setMessage({
        text: err.message.includes('unique') 
          ? 'Username or WhatsApp already registered!'
          : 'Registration failed. Try again.',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-warning text-dark',
      confirmed: 'bg-success text-white',
      rejected: 'bg-danger text-white',
      withdrawn: 'bg-secondary text-white',
    };
    return <span className={`badge ${colors[status] || 'bg-info'} px-3 py-2`}>{status.toUpperCase()}</span>;
  };

  return (
    <div
      className="min-vh-100 d-flex flex-column"
      style={{
        background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        color: '#e0e0ff',
      }}
    >
      {/* Header */}
      <div className="bg-dark text-white py-4 shadow">
        <div className="container">
          <div className="text-center mt-2">
            <span className="badge bg-success fs-6 px-4 py-2">
              Slots: {registrations.length} / {maxSlots}
            </span>
          </div>
        </div>
      </div>

      <div className="container my-4 flex-grow-1">
        <div className="row g-4">
          {/* Left - Info & Navigation */}
          <div className="col-lg-4">
            <div className="card bg-dark border-0 shadow-lg text-white h-100">
              <div className="card-body p-4">
                <h4 className="fw-bold text-warning mb-4">Prize Breakdown</h4>
                <ul className="list-group list-group-flush bg-transparent">
                  <li className="list-group-item bg-transparent text-white border-bottom py-3">
                    <strong>Entry:</strong> KSh 50
                  </li>
                  <li className="list-group-item bg-transparent text-white border-bottom py-3">
                    <strong>Total Pot:</strong> KSh {totalPot}
                  </li>
                  <li className="list-group-item bg-transparent text-success py-3">
                    <strong>1st:</strong> ~60–65% • 2nd: ~20–25% • 3rd: ~10–15%
                  </li>
                </ul>

                <hr className="bg-secondary my-4" />

                <div className="list-group list-group-flush">
                  <button
                    onClick={() => setActiveTab('register')}
                    className={`list-group-item list-group-item-action bg-transparent text-start ${activeTab === 'register' ? 'active text-warning fw-bold' : 'text-white'}`}
                  >
                    Register Now
                  </button>
                  <button
                    onClick={() => setActiveTab('teams')}
                    className={`list-group-item list-group-item-action bg-transparent text-start ${activeTab === 'teams' ? 'active text-warning fw-bold' : 'text-white'}`}
                  >
                    Registered Teams ({registrations.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('rules')}
                    className={`list-group-item list-group-item-action bg-transparent text-start ${activeTab === 'rules' ? 'active text-warning fw-bold' : 'text-white'}`}
                  >
                    Rules & Info
                  </button>
                </div>

                <div className="text-center mt-5 opacity-75">
                  <div style={{ fontSize: '120px' }}>🏆</div>
                  <small>Who's taking it?</small>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Main Content */}
          <div className="col-lg-8">
            <div className="card bg-dark-subtle border-0 shadow-lg text-white">
              <div className="card-body p-4 p-md-5">
                {message && (
                  <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'} mb-4`}>
                    {message.text}
                  </div>
                )}

                {activeTab === 'register' && (
                  <>
                    <h3 className="fw-bold text-warning mb-4">Join the Tournament</h3>
                    {isFull ? (
                      <div className="alert alert-warning text-center fs-5">
                        Tournament Full! Wait for next one 🔥
                      </div>
                    ) : loading ? (
                      <div className="text-center py-4">
                        <div className="spinner-border text-warning" role="status" />
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                          <label className="form-label fw-bold">Team Name</label>
                          <input
                            type="text"
                            name="teamName"
                            value={formData.teamName}
                            onChange={handleChange}
                            className="form-control bg-dark text-white border-secondary"
                            placeholder="e.g. Nairobi Strikers"
                            required
                            minLength={3}
                          />
                        </div>

                        <div className="mb-4">
                          <label className="form-label fw-bold">Username (Konami)</label>
                          <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="form-control bg-dark text-white border-secondary"
                            placeholder="e.g. isack_254"
                            required
                            minLength={3}
                          />
                        </div>

                        <div className="mb-4">
                          <label className="form-label fw-bold">WhatsApp Number(+254712345678)</label>
                          <input
                            type="tel"
                            name="whatsapp"
                            value={formData.whatsapp}
                            onChange={handleChange}
                            className="form-control bg-dark text-white border-secondary"
                            placeholder="e.g. +254712345678"
                            required
                            pattern="\+254[0-9]{9}"
                          />
                        </div>

                        <button
                          type="submit"
                          className="btn btn-warning btn-lg w-100 fw-bold shadow"
                          disabled={submitting || isFull}
                        >
                          {submitting ? 'Submitting...' : 'REGISTER'}
                        </button>
                        <small className="d-block text-center mt-3 text-muted">
                          Send M-Pesa payment after submitting → then wait for confirmation
                        </small>
                      </form>
                    )}
                  </>
                )}

                {activeTab === 'teams' && (
                  <>
                    <h3 className="fw-bold text-warning mb-4">Registered Teams</h3>
                    {loading ? (
                      <div className="text-center py-5">
                        <div className="spinner-border text-warning" role="status" />
                      </div>
                    ) : registrations.length === 0 ? (
                      <p className="text-center text-muted py-5">No teams yet — be the first!</p>
                    ) : (
                      <div className="row g-3">
                        {registrations.map((reg) => (
                          <div key={reg.id} className="col-md-6">
                            <div className="p-3 border border-secondary rounded bg-dark">
                              <div className="d-flex justify-content-between align-items-start">
                                <h5 className="mb-1 text-warning">{reg.team_name}</h5>
                                {getStatusBadge(reg.status)}
                              </div>
                              <small className="d-block text-info">@{reg.username}</small>
                              <small className="text-muted">WA: {reg.whatsapp}</small>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'rules' && (
                  <>
                    <h3 className="fw-bold text-warning mb-4">Tournament Rules</h3>
                    <ul className="list-group list-group-flush bg-transparent">
                      <li className="list-group-item bg-transparent text-white border-0 py-3">
                        • 16 players max — single elimination or group + knockout
                      </li>
                      <li className="list-group-item bg-transparent text-white border-0 py-3">
                        • Entry fee KSh 50 — paid via M-Pesa after registration
                      </li>
                      <li className="list-group-item bg-transparent text-white border-0 py-3">
                        • Only top 3 get prize money (admin fee deducted)
                      </li>
                      <li className="list-group-item bg-transparent text-white border-0 py-3">
                        • Fair play — no cheating, lag switching, etc.
                      </li>
                      <li className="list-group-item bg-transparent text-white border-0 py-3">
                        • Matches on agreed platform/time — contact via WhatsApp
                      </li>
                      <li className="list-group-item bg-transparent text-white border-0 py-3">
                        • Disputes? Final decision by admin
                      </li>
                    </ul>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentRegistration;