import { useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true); // Toggle between Login and Signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSignedUp, setIsSignedUp] = useState(false);

  // Unified Handler
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        navigate("/dashboard");
      }
    } else {
      const { error, data } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) {
        setError(error.message);
      } else if (data.user && data.session === null) {
        // Supabase requires email verification by default
        setIsSignedUp(true);
      } else {
        navigate("/dashboard");
      }
    }
  }

  return (
    <div style={styles.viewport}>
      <div style={styles.bgOrange}></div>
      <div style={styles.bgTeal}></div>
      <div style={styles.bgNavy}></div>

      <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
        <div className="card shadow-lg border-0 text-white" style={styles.authCard}>
          <div className="card-body p-5 text-center">
            
            {/* Branding */}
            <div className="mb-5">
              <h1 className="display-5 fw-bold mb-0">efootball</h1>
              <div className="d-flex align-items-center justify-content-center mt-1" style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                <span className="fw-bold me-2">Skyla <sup style={{ fontSize: "1em" }}>®</sup></span>
                <div style={{ width: '1px', height: '14px', background: 'white', opacity: 0.5 }}></div>
                <span className="ms-2 fw-light text-lowercase">smart ecosystem</span>
              </div>
            </div>

            {isSignedUp ? (
              <div className="animate__animated animate__fadeIn">
                <div className="mb-4" style={{ fontSize: "3rem" }}>✉️</div>
                <h4>Check your inbox</h4>
                <p className="small opacity-75">We sent a verification link to {email}</p>
                <button className="btn btn-sm btn-outline-light mt-3" onClick={() => setIsSignedUp(false)}>Back to Login</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h3 className="h5 mb-4 opacity-75">{isLogin ? "Welcome Back" : "Create Account"}</h3>
                
                <div className="mb-3">
                  <input
                    type="email"
                    required
                    className="form-control form-control-lg bg-white bg-opacity-10 text-white border-secondary shadow-none"
                    placeholder="Email Address"
                    style={styles.inputField}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                
                <div className="mb-4">
                  <input
                    type="password"
                    required
                    className="form-control form-control-lg bg-white bg-opacity-10 text-white border-secondary shadow-none"
                    placeholder="Password"
                    style={styles.inputField}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {error && <div className="alert alert-danger py-2 small bg-danger bg-opacity-25 border-0 text-white mb-4">{error}</div>}

                <div className="d-grid gap-3">
                  <button 
                    type="submit"
                    className="btn btn-lg fw-bold text-white border-0 shadow-sm" 
                    style={{ backgroundColor: '#00b5ad', transition: '0.3s' }} 
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="spinner-border spinner-border-sm me-2"></span>
                    ) : (
                      isLogin ? "LOG IN" : "SIGN UP"
                    )}
                  </button>
                  
                  <button 
                    type="button"
                    className="btn btn-link text-white text-decoration-none small opacity-75" 
                    onClick={() => { setIsLogin(!isLogin); setError(null); }}
                  >
                    {isLogin ? "New here ? Create account" : "Already have an account? Log in"}
                  </button>
                </div>
              </form>
            )}
          </div>
          <div style={styles.bottomBorder}></div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  viewport: {
    backgroundColor: "#eef2f3",
    height: "100vh",
    width: "100vw",
    overflow: "hidden",
    position: "relative",
  },
  bgOrange: {
    position: "absolute",
    width: "80%",
    height: "80%",
    top: "-10%",
    left: "-10%",
    backgroundColor: "#f7931e",
    clipPath: "polygon(25% 0%, 100% 0%, 75% 100%, 0% 100%)",
    opacity: 0.6,
    zIndex: 1,
  },
  bgTeal: {
    position: "absolute",
    width: "70%",
    height: "90%",
    bottom: "-10%",
    right: "-10%",
    backgroundColor: "#00b5ad",
    clipPath: "polygon(0% 15%, 85% 0%, 100% 85%, 15% 100%)",
    mixBlendMode: "multiply",
    opacity: 0.7,
    zIndex: 2,
  },
  bgNavy: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(10, 26, 68, 0.2)",
    zIndex: 3,
  },
  authCard: {
    zIndex: 10,
    width: "100%",
    maxWidth: "420px",
    backgroundColor: "#0a1a44",
    borderRadius: "0",
    overflow: "hidden",
    boxShadow: "0 30px 60px rgba(0,0,0,0.5)"
  },
  inputField: {
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "0",
    fontSize: "0.9rem"
  },
  bottomBorder: {
    height: "6px",
    width: "100%",
    background: "linear-gradient(90deg, #f7931e 0%, #00b5ad 50%, #f7931e 100%)",
  }
};