import { useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

export default function Auth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function login() {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    if (error) return setError(error.message);

    navigate("/dashboard");
  }

  async function signup() {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);
    if (error) return setError(error.message);

    alert("Signup successful. Check your email for confirmation.");
  }

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center p-4 position-relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #001233 0%, #0f1e3f 50%, #001233 100%)",
        color: "#ffffff",
      }}
    >
      {/* Subtle geometric overlay for colorful mosaic feel */}
      <div className="position-absolute top-0 start-0 w-100 h-100 opacity-25 pointer-events-none">
        <div
          className="position-absolute rounded-circle"
          style={{
            width: "60%",
            height: "60%",
            top: "-20%",
            left: "-20%",
            background: "radial-gradient(circle at 30% 30%, #ff6b35, #00d4ff)",
            filter: "blur(120px)",
          }}
        />
        <div
          className="position-absolute rounded-circle"
          style={{
            width: "70%",
            height: "70%",
            bottom: "-25%",
            right: "-25%",
            background: "radial-gradient(circle at 70% 70%, #40c4ff, #ff8c42)",
            filter: "blur(140px)",
          }}
        />
      </div>

      {/* Optional subtle savanna wave at bottom */}
      <div
        className="position-absolute bottom-0 start-0 end-0"
        style={{
          height: "180px",
          opacity: 0.3,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%23001133' fill-opacity='1' d='M0,224L48,197.3C96,171,192,117,288,117.3C384,117,480,171,576,181.3C672,192,768,160,864,154.7C960,149,1056,171,1152,176C1248,181,1344,171,1392,165.3L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E\")",
          backgroundSize: "cover",
          backgroundPosition: "bottom",
        }}
      />

      {/* Main Bootstrap Card */}
      <div
        className="card bg-dark bg-opacity-75 border border-info-subtle shadow-lg text-white"
        style={{
          maxWidth: "420px",
          backdropFilter: "blur(12px)",
          borderRadius: "1.25rem",
          overflow: "hidden",
        }}
      >
        <div className="card-body p-5">
          <h2
            className="text-center mb-5 fw-bold"
            style={{
              background: "linear-gradient(90deg, #ff8c42, #00d4ff, #40c4ff)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            eFootball
          </h2>

          <form>
            <div className="mb-4">
              <input
                type="email"
                className="form-control form-control-lg bg-dark text-white border-info-subtle"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
              />
            </div>

            <div className="mb-4">
              <input
                type="password"
                className="form-control form-control-lg bg-dark text-white border-info-subtle"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
              />
            </div>

            {error && (
              <div className="alert alert-danger text-center mb-4" role="alert">
                {error}
              </div>
            )}

            <div className="d-grid gap-3">
              <button
                type="button"
                className="btn btn-lg fw-bold text-white"
                onClick={login}
                disabled={loading}
                style={{
                  background: "linear-gradient(90deg, #ff6b35, #ff8c42)",
                  border: "none",
                  boxShadow: "0 6px 20px rgba(255,107,53,0.35)",
                }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                    Loading...
                  </>
                ) : (
                  "Log In"
                )}
              </button>

              <button
                type="button"
                className="btn btn-lg fw-bold text-white"
                onClick={signup}
                disabled={loading}
                style={{
                  background: "linear-gradient(90deg, #00d4ff, #40c4ff)",
                  border: "none",
                  boxShadow: "0 6px 20px rgba(64,196,255,0.35)",
                }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                    Loading...
                  </>
                ) : (
                  "Sign Up"
                )}
              </button>
            </div>
          </form>

          <p className="text-center text-secondary mt-4 small">
            Powered by Skyla® smart ecosystem
          </p>
        </div>
      </div>
    </div>
  );
}