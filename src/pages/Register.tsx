"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";
import "bootstrap/dist/css/bootstrap.min.css";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    team_name: "",
    username: "",
    whatsapp: "+254",
  });
  const [userReg, setUserReg] = useState<any>(null);
  const [allTeams, setAllTeams] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "danger";
    text: string;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("tournament_registrations")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (data) setUserReg(data);
      }

      const { data: teams } = await supabase
        .from("tournament_registrations")
        .select("team_name, username, status")
        .order("created_at", { ascending: false });

      if (teams) setAllTeams(teams);
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("tournament_registrations")
        .insert([
          {
            ...formData,
            user_id: user?.id || null,
            status: "pending",
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setMessage({ type: "success", text: "Registration Successful!" });
      setUserReg(data);
      setAllTeams([data, ...allTeams]);
    } catch (err: any) {
      setMessage({ type: "danger", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-vh-100" style={{ backgroundColor: "#f8f9fa" , marginTop: '68px'}}>
      <Navbar />

{/* ROUNDED MOVING IMAGE */}
<div
  className="container-fluid text-center mt-4"
  style={{
    position: "relative",
    padding: "60px 0",
    // Kenyan flag colors stacked
    background: `linear-gradient(
      to bottom,
      #000 0%,    /* Black */
      #000 20%,
      #fff 20%,   /* White stripe */
      #fff 25%,
      #d21034 25%, /* Red */
      #d21034 50%,
      #fff 50%,   /* White stripe */
      #fff 55%,
      #007847 55%, /* Green */
      #007847 80%,
      #000 80%    /* Optional bottom fade */
    )`,
  }}
>
  <div className="moving-image-wrapper" style={{ position: "relative" }}>
    <img
      src="/kicc.jpeg"
      alt="Tournament"
      className="img-fluid rounded-4 shadow-lg moving-image"
      style={{
        maxHeight: "260px",
        objectFit: "cover",
      }}
    />
  </div>
</div>

      {/* FULL WIDTH CONTENT */}
      <div className="container-fluid py-5 px-4">
        <div className="row g-4">
          {/* FORM */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm p-4 h-100 rounded-4">
              <h4 className="fw-bold text-primary mb-4">
                Tournament Entry
              </h4>

              {message && (
                <div className={`alert alert-${message.type} fw-bold small`}>
                  {message.text}
                </div>
              )}

              {userReg ? (
                <div className="text-center py-5">
                  <h5 className="fw-bold">Registration Verified</h5>
                  <p className="text-muted small">
                    {userReg.team_name} • @{userReg.username}
                  </p>
                  <span className="badge bg-success">
                    STATUS: {userReg.status.toUpperCase()}
                  </span>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">
                      TEAM NAME
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.team_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          team_name: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-bold text-secondary">
                      USERNAME
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          username: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label small fw-bold text-secondary">
                      WHATSAPP CONTACT
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.whatsapp}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          whatsapp: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 fw-bold py-2"
                    disabled={submitting}
                  >
                    {submitting ? "Processing..." : "Register Now"}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* TEAMS TABLE */}
          <div className="col-12 col-lg-6">
            <div className="card border-0 shadow-sm p-4 rounded-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-bold text-primary mb-0">
                  Enlisted Teams
                </h4>
                <span className="badge bg-primary rounded-pill px-3">
                  {allTeams.length} Total
                </span>
              </div>

              <div className="table-responsive">
                <table className="table table-hover table-bordered border-primary align-middle">
                  <thead>
                    <tr className="table-primary">
                      <th className="text-center" style={{ width: "60px" }}>
                        #
                      </th>
                      <th>Team Name</th>
                      <th>Username</th>
                      <th className="text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allTeams.length > 0 ? (
                      allTeams.map((team, index) => (
                        <tr key={index}>
                          <td className="text-center fw-bold text-primary">
                            {index + 1}
                          </td>
                          <td>{team.team_name}</td>
                          <td className="text-muted small">
                            @{team.username}
                          </td>
                          <td className="text-center">
                            <span
                              className={`badge ${
                                team.status === "confirmed"
                                  ? "bg-success"
                                  : "bg-warning text-dark"
                              }`}
                            >
                              {team.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-center text-muted py-5">
                          No teams registered yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .moving-image-wrapper {
          overflow: hidden;
        }

        .moving-image {
          animation: slideSide 6s ease-in-out infinite alternate;
        }

        @keyframes slideSide {
          from {
            transform: translateX(-20px);
          }
          to {
            transform: translateX(20px);
          }
        }

        .form-control:focus {
          box-shadow: 0 0 0 0.2rem rgba(13,110,253,0.15);
          border-color: #0d6efd;
        }
      `}</style>
    </main>
  );
}