import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 🔗 Get redirect_to parameter passed by the Expo Mobile App
  const redirectTo = searchParams.get("redirect_to");

  const [authMode, setAuthMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSignedUp, setIsSignedUp] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Deep Link Gate
  const [readyToRedirect, setReadyToRedirect] = useState(false);
  const pendingUrlRef = useRef(null);

  // 🌍 Language State: 'en' or 'fr'
  const [lang, setLang] = useState("en");

  // Prevents handleAuthSuccess from re-arming more than once
  const redirectedRef = useRef(false);

  // Helper function to handle redirection back to Mobile App or Website Navigation
  const handleAuthSuccess = async (session) => {
    if (redirectedRef.current) return;

    if (redirectTo && session) {
      redirectedRef.current = true;

      let activeSession = session;

      // Force refresh session to guarantee non-expired tokens for mobile app
      const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
      const isExpired = Date.now() >= expiresAt - 60000; // 1 min buffer

      if (isExpired) {
        const { data, error: refreshErr } = await supabase.auth.refreshSession();
        if (!refreshErr && data.session) {
          activeSession = data.session;
        }
      }

      // Send access_token and refresh_token back to Expo App
      const appRedirectUrl = `${redirectTo}?access_token=${encodeURIComponent(
        activeSession.access_token
      )}&refresh_token=${encodeURIComponent(activeSession.refresh_token)}`;

      pendingUrlRef.current = appRedirectUrl;
      setCheckingAuth(false);
      setReadyToRedirect(true);
    } else {
      navigate("/teams", { replace: true });
    }
  };

  const handleContinueTap = () => {
    if (pendingUrlRef.current) {
      window.location.href = pendingUrlRef.current;
    }
  };

  // ✅ Force sign out if coming from app link, or check existing session for standard web
  useEffect(() => {
    const initAuth = async () => {
      if (redirectTo) {
        // FORCE RE-AUTHENTICATION: Sign out existing web session
        await supabase.auth.signOut();
        setCheckingAuth(false);
      } else {
        // Standard Web Flow
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          handleAuthSuccess(session);
        } else {
          setCheckingAuth(false);
        }
      }
    };

    initAuth();
  }, [redirectTo]);

  // Dictionary for clean text management
  const t = {
    en: {
      slogan: "Everything you need to run tournaments in one place",
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
      resetSent: "Password reset link sent to your email!",
      signedIn: "You're signed in",
      continueBtn: "Continue to App"
    },
    fr: {
      slogan: "Tout ce dont vous avez besoin pour gérer vos tournois en un seul endroit",
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
      resetSent: "Lien de réinitialisation envoyé par e-mail !",
      signedIn: "Vous êtes connecté",
      continueBtn: "Continuer vers l'app"
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
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
      } else if (data?.session) {
        handleAuthSuccess(data.session);
      }
    } else if (authMode === "signup") {
      const { error, data } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) {
        setError(error.message.includes("User already registered") ? t[lang].alreadyReg : error.message);
      } else if (data.user && data.session === null) {
        setIsSignedUp(true);
      } else if (data?.session) {
        handleAuthSuccess(data.session);
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

  // Show spinner while checking session
  if (checkingAuth) {
    return (
      <div style={styles.centerContainer}>
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    );
  }

  // Deep Link Return Screen
  if (readyToRedirect) {
    return (
      <div style={styles.centerContainer}>
        <div style={{ fontSize: "3rem" }}>✅</div>
        <h4>{t[lang].signedIn}</h4>
        <button
          onClick={handleContinueTap}
          className="btn btn-success btn-lg mt-3"
        >
          {t[lang].continueBtn}
        </button>
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      <div className="card shadow-sm p-4" style={{ maxWidth: "420px", width: "100%" }}>
        {/* Language Switcher */}
        <div className="d-flex justify-content-end gap-2 mb-3">
          <button
            onClick={() => setLang("en")}
            className={`btn btn-sm ${lang === "en" ? "btn-primary" : "btn-outline-secondary"}`}
          >
            EN
          </button>
          <button
            onClick={() => setLang("fr")}
            className={`btn btn-sm ${lang === "fr" ? "btn-primary" : "btn-outline-secondary"}`}
          >
            FR
          </button>
        </div>

        <div className="text-center mb-4">
          <h2 className="fw-bold">efootball</h2>
          <p className="text-muted small">{t[lang].slogan}</p>
        </div>

        {isSignedUp ? (
          <div className="text-center">
            <div style={{ fontSize: "2.5rem" }}>✉️</div>
            <h4>{t[lang].checkInbox}</h4>
            <p className="text-muted small">{t[lang].sentLink} {email}</p>
            <button className="btn btn-sm btn-outline-secondary mt-3" onClick={() => setIsSignedUp(false)}>
              {t[lang].back}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h5 className="mb-3 text-center">
              {authMode === "login" ? t[lang].welcome : authMode === "signup" ? t[lang].create : t[lang].reset}
            </h5>

            <div className="mb-3">
              <input
                type="email"
                required
                className="form-control"
                placeholder={t[lang].email}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {authMode !== "reset" && (
              <div className="mb-3">
                <input
                  type="password"
                  required
                  className="form-control"
                  placeholder={t[lang].pass}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            )}

            {error && <div className="alert alert-danger py-2 small">{error}</div>}
            {message && <div className="alert alert-success py-2 small">{message}</div>}

            <button type="submit" className="btn btn-primary w-100 fw-bold" disabled={loading}>
              {loading ? (
                <span className="spinner-border spinner-border-sm"></span>
              ) : authMode === "login" ? (
                t[lang].loginBtn
              ) : authMode === "signup" ? (
                t[lang].signupBtn
              ) : (
                t[lang].sendReset
              )}
            </button>

            <div className="text-center mt-3 d-flex flex-column gap-1">
              {authMode === "login" && (
                <button type="button" className="btn btn-link btn-sm text-decoration-none" onClick={() => switchMode("reset")}>
                  {t[lang].forgot}
                </button>
              )}
              <button type="button" className="btn btn-link btn-sm text-decoration-none" onClick={() => switchMode(authMode === "login" ? "signup" : "login")}>
                {authMode === "login" ? t[lang].newHere : t[lang].haveAcc}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const styles = {
  pageContainer: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: "1rem"
  },
  centerContainer: {
    height: "100vh",
    width: "100vw",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    gap: "10px"
  }
};
