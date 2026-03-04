import { useState } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";

export default function Auth() {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSignedUp, setIsSignedUp] = useState(false);
  
  // 🌍 Language State: 'en' or 'fr'
  const [lang, setLang] = useState("en");

  const [showIntro, setShowIntro] = useState(true);

  // Dictionary for clean text management
  const t = {
    en: {
      ecosystem: "smart ecosystem",
      welcome: "Welcome Back",
      create: "Create Account",
      reset: "Reset Password",
      email: "Email Address",
      pass: "Password",
      loginBtn: "LOG IN",
      signupBtn: "SIGN UP",
      sendReset: "SEND RESET LINK",
      forgot: "Forgot Password?",
      newHere: "New here? Create account",
      haveAcc: "Already have an account? Log in",
      checkInbox: "Check your inbox",
      sentLink: "We sent a verification link to",
      back: "Back to Login",
      alreadyReg: "Account already exists. Try logging in!",
      resetSent: "Password reset link sent to your email!"
    },
    fr: {
      ecosystem: "écosystème intelligent",
      welcome: "Bon retour",
      create: "Créer un compte",
      reset: "Réinitialiser",
      email: "Adresse e-mail",
      pass: "Mot de passe",
      loginBtn: "CONNEXION",
      signupBtn: "S'INSCRIRE",
      sendReset: "ENVOYER LE LIEN",
      forgot: "Mot de passe oublié ?",
      newHere: "Nouveau ? Créer un compte",
      haveAcc: "Déjà inscrit ? Connexion",
      checkInbox: "Vérifiez vos e-mails",
      sentLink: "Lien de vérification envoyé à",
      back: "Retour",
      alreadyReg: "Compte déjà existant. Connectez-vous !",
      resetSent: "Lien de réinitialisation envoyé par e-mail !"
    }
  };

  const switchMode = (mode) => {
    setAuthMode(mode);
    setError(null);
    setMessage(null);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (authMode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        navigate("/dashboard");
      }
    } else if (authMode === "signup") {
      const { error, data } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) {
        setError(error.message.includes("User already registered") ? t[lang].alreadyReg : error.message);
      } else if (data.user && data.session === null) {
        setIsSignedUp(true);
      } else {
        navigate("/dashboard");
      }
    } else if (authMode === "reset") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      setLoading(false);
      if (error) {
        setError(error.message);
      } else {
        setMessage(t[lang].resetSent);
      }
    }
  }

  return (
    <>
      {showIntro && (
        <video autoPlay muted playsInline onEnded={() => setShowIntro(false)} style={styles.introVideo}>
          <source src="/intro.mp4" type="video/mp4" />
        </video>
      )}

      {!showIntro && (
        <div style={styles.viewport}>
          <div style={styles.bgOrange}></div>
          <div style={styles.bgTeal}></div>
          <div style={styles.bgNavy}></div>

          <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
            <div className="card shadow-lg border-0 text-white" style={styles.authCard}>
              
              {/* 🌐 Language Switcher Tab */}
              <div style={styles.langTabContainer}>
                <button 
                  onClick={() => setLang("en")} 
                  style={{...styles.langBtn, color: lang === 'en' ? '#00b5ad' : '#fff'}}
                >EN</button>
                <span style={{opacity: 0.3}}>|</span>
                <button 
                  onClick={() => setLang("fr")} 
                  style={{...styles.langBtn, color: lang === 'fr' ? '#00b5ad' : '#fff'}}
                >FR</button>
              </div>

              <div className="card-body p-5 text-center">
                <div className="mb-5">
                  <h1 className="display-5 fw-bold mb-0">efootball</h1>
                  <div className="d-flex align-items-center justify-content-center mt-1" style={{ fontSize: "0.85rem", opacity: 0.9 }}>
                    <span className="fw-bold me-2">Skyla ®</span>
                    <div style={styles.divider}></div>
                    <span className="ms-2 fw-light text-lowercase">{t[lang].ecosystem}</span>
                  </div>
                </div>

                {isSignedUp ? (
                  <div>
                    <div className="mb-4" style={{ fontSize: "3rem" }}>✉️</div>
                    <h4>{t[lang].checkInbox}</h4>
                    <p className="small opacity-75">{t[lang].sentLink} {email}</p>
                    <button className="btn btn-sm btn-outline-light mt-3" onClick={() => setIsSignedUp(false)}>
                      {t[lang].back}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <h3 className="h5 mb-4 opacity-75">
                      {authMode === "login" ? t[lang].welcome : authMode === "signup" ? t[lang].create : t[lang].reset}
                    </h3>

                    <div className="mb-3">
                      <input
                        type="email"
                        required
                        className="form-control form-control-lg bg-white bg-opacity-10 text-white border-secondary shadow-none"
                        placeholder={t[lang].email}
                        style={styles.inputField}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    {authMode !== "reset" && (
                      <div className="mb-4">
                        <input
                          type="password"
                          required
                          className="form-control form-control-lg bg-white bg-opacity-10 text-white border-secondary shadow-none"
                          placeholder={t[lang].pass}
                          style={styles.inputField}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                    )}

                    {error && <div className="alert alert-danger py-2 small bg-danger bg-opacity-25 border-0 text-white mb-4">{error}</div>}
                    {message && <div className="alert alert-success py-2 small bg-success bg-opacity-25 border-0 text-white mb-4">{message}</div>}

                    <div className="d-grid gap-3">
                      <button type="submit" className="btn btn-lg fw-bold text-white border-0 shadow-sm" style={{ backgroundColor: "#00b5ad" }} disabled={loading}>
                        {loading ? <span className="spinner-border spinner-border-sm me-2"></span> : 
                         authMode === "login" ? t[lang].loginBtn : authMode === "signup" ? t[lang].signupBtn : t[lang].sendReset}
                      </button>

                      <div className="d-flex flex-column gap-2 mt-2">
                        {authMode === "login" && (
                          <button type="button" style={styles.linkBtn} onClick={() => switchMode("reset")}>
                            {t[lang].forgot}
                          </button>
                        )}
                        <button type="button" style={styles.linkBtn} onClick={() => switchMode(authMode === "login" ? "signup" : "login")}>
                          {authMode === "login" ? t[lang].newHere : t[lang].haveAcc}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
              <div style={styles.bottomBorder}></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  // ... existing styles ...
  viewport: { backgroundColor: "#eef2f3", height: "100vh", width: "100vw", overflow: "hidden", position: "relative" },
  introVideo: { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", objectFit: "cover", zIndex: 9999 },
  bgOrange: { position: "absolute", width: "80%", height: "80%", top: "-10%", left: "-10%", backgroundColor: "#f7931e", clipPath: "polygon(25% 0%, 100% 0%, 75% 100%, 0% 100%)", opacity: 0.6, zIndex: 1 },
  bgTeal: { position: "absolute", width: "70%", height: "90%", bottom: "-10%", right: "-10%", backgroundColor: "#00b5ad", clipPath: "polygon(0% 15%, 85% 0%, 100% 85%, 15% 100%)", mixBlendMode: "multiply", opacity: 0.7, zIndex: 2 },
  bgNavy: { position: "absolute", width: "100%", height: "100%", backgroundColor: "rgba(10, 26, 68, 0.2)", zIndex: 3 },
  authCard: { position: "relative", zIndex: 10, width: "100%", maxWidth: "420px", backgroundColor: "#0a1a44", borderRadius: "0", overflow: "hidden", boxShadow: "0 30px 60px rgba(0,0,0,0.5)" },
  
  // New Styles
  langTabContainer: { position: "absolute", top: "15px", right: "20px", display: "flex", gap: "10px", alignItems: "center", zIndex: 11 },
  langBtn: { background: "none", border: "none", fontSize: "0.75rem", fontWeight: "bold", cursor: "pointer", transition: "0.3s" },
  divider: { width: "1px", height: "14px", background: "white", opacity: 0.5 },
  
  inputField: { border: "1px solid rgba(255,255,255,0.2)", borderRadius: "0", fontSize: "0.9rem", color: "white" },
  linkBtn: { background: "none", border: "none", color: "white", fontSize: "0.85rem", opacity: 0.75, cursor: "pointer", textDecoration: "none" },
  bottomBorder: { height: "6px", width: "100%", background: "linear-gradient(90deg, #f7931e 0%, #00b5ad 50%, #f7931e 100%)" },
};