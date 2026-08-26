import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function Auth() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const redirectTo = searchParams.get("redirect_to");

    const [authMode, setAuthMode] = useState("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [agreed, setAgreed] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isSignedUp, setIsSignedUp] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);

    const [readyToRedirect, setReadyToRedirect] = useState(false);
    const pendingUrlRef = useRef(null);
    const redirectedRef = useRef(false);

    const handleAuthSuccess = async (session) => {
        if (redirectedRef.current) return;

        if (redirectTo && session) {
            redirectedRef.current = true;

            let activeSession = session;
            const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
            const isExpired = Date.now() >= expiresAt - 60000;

            if (isExpired) {
                const { data, error: refreshErr } = await supabase.auth.refreshSession();
                if (!refreshErr && data.session) {
                    activeSession = data.session;
                }
            }

            const appRedirectUrl = `${redirectTo}?access_token=${encodeURIComponent(
                activeSession.access_token
            )}&refresh_token=${encodeURIComponent(activeSession.refresh_token)}`;

            pendingUrlRef.current = appRedirectUrl;
            setCheckingAuth(false);
            setReadyToRedirect(true);
        } else {
            navigate("/admin", { replace: true });
        }
    };

    // Auto-redirect to the mobile app when ready
    useEffect(() => {
        if (readyToRedirect && pendingUrlRef.current) {
            window.location.href = pendingUrlRef.current;
        }
    }, [readyToRedirect]);

    useEffect(() => {
        const initAuth = async () => {
            if (redirectTo) {
                await supabase.auth.signOut();
                setCheckingAuth(false);
            } else {
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

    const switchMode = (mode) => {
        setAuthMode(mode);
        setError(null);
        setMessage(null);
        setAgreed(false);
    };

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (authMode === "signup" && !agreed) {
            setError("Please accept the Terms and Conditions");
            setLoading(false);
            return;
        }

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
                setError(
                    error.message.includes("User already registered")
                        ? "Account already exists. Try logging in!"
                        : error.message
                );
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
                setMessage("Password reset link sent to your email!");
            }
        }
    }

    if (checkingAuth) {
        return (
            <div style={styles.viewport}>
                <div className="spinner-border text-light" role="status" style={{ width: "2.5rem", height: "2.5rem" }} />
            </div>
        );
    }

    // Brief signed-in state while auto-redirect fires
    if (readyToRedirect) {
        return (
            <div style={styles.viewport}>
                <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "2.5rem" }}>✅</div>
                    <h4 style={{ color: "#fff", marginTop: 12 }}>You're signed in</h4>
                    <p style={{ color: "#888", fontSize: "0.9rem", marginTop: 8 }}>Redirecting…</p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.viewport}>
            <div style={styles.container}>
                {/* Top bar */}
                <div style={styles.topBar}>
          <span style={styles.topTitle}>
            {authMode === "login" ? "Login" : authMode === "signup" ? "Register" : "Reset Password"}
          </span>
                </div>

                {/* Logo */}
                <div style={styles.logoWrap}>
                    <span style={styles.logo}>rankings</span>
                </div>

                {isSignedUp ? (
                    <div style={{ textAlign: "center", marginTop: 40 }}>
                        <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>✉️</div>
                        <h3 style={{ color: "#fff", margin: "0 0 8px", fontSize: "1.2rem" }}>Check your inbox</h3>
                        <p style={{ color: "#888", fontSize: "0.9rem", marginBottom: 24 }}>
                            We sent a verification link to {email}
                        </p>
                        <button type="button" style={styles.linkBtn} onClick={() => setIsSignedUp(false)}>
                            Back to Login
                        </button>
                    </div>
                ) : (
                    <>
                        <p style={styles.instruction}>
                            {authMode === "login"
                                ? "Enter your email and password below to log in to your existing account. Otherwise click on Register to create a new account."
                                : authMode === "signup"
                                    ? "Enter your email and password below to create a new account. Otherwise click on Login if you already have one."
                                    : "Enter your email address and we'll send you a link to reset your password."}
                        </p>

                        <form onSubmit={handleSubmit}>
                            {/* Email */}
                            <div style={styles.field}>
                                <label style={styles.label}>Email Address</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="e.g. you@example.com"
                                    style={styles.input}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                                <span style={styles.helper}>Enter your email address</span>
                            </div>

                            {/* Password (not on reset) */}
                            {authMode !== "reset" && (
                                <div style={styles.field}>
                                    <label style={styles.label}>Password</label>
                                    <input
                                        type="password"
                                        required
                                        placeholder=""
                                        style={styles.input}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                    <span style={styles.helper}>Enter your password</span>
                                </div>
                            )}

                            {/* Terms checkbox (signup only) */}
                            {authMode === "signup" && (
                                <div style={styles.checkboxRow}>
                                    <input
                                        type="checkbox"
                                        id="terms"
                                        checked={agreed}
                                        onChange={(e) => setAgreed(e.target.checked)}
                                        style={styles.checkbox}
                                    />
                                    <label htmlFor="terms" style={styles.checkboxLabel}>
                                        By clicking Register you confirm to have read in detail, understood and agreed to the{" "}
                                        <span style={styles.highlight}>Terms and Conditions</span>, the{" "}
                                        <span style={styles.highlight}>Privacy policy</span> and also that you are over 18 years of age.
                                    </label>
                                </div>
                            )}

                            {error && <div style={styles.error}>{error}</div>}
                            {message && <div style={styles.success}>{message}</div>}

                            <button type="submit" style={styles.primaryBtn} disabled={loading}>
                                {loading ? (
                                    <span className="spinner-border spinner-border-sm" />
                                ) : authMode === "login" ? (
                                    "Login"
                                ) : authMode === "signup" ? (
                                    "Register"
                                ) : (
                                    "Send Reset Link"
                                )}
                            </button>
                        </form>

                        <div style={styles.bottomLinks}>
                            {authMode === "login" && (
                                <button type="button" style={styles.linkBtn} onClick={() => switchMode("reset")}>
                                    Forgot Password?
                                </button>
                            )}
                            <button
                                type="button"
                                style={styles.linkBtn}
                                onClick={() => switchMode(authMode === "login" ? "signup" : "login")}
                            >
                                {authMode === "login"
                                    ? "New here? Create account"
                                    : "Already have an account? Log in"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

const styles = {
    viewport: {
        minHeight: "100vh",
        width: "100%",
        backgroundColor: "#0a0a0a",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "0",
        boxSizing: "border-box",
    },
    container: {
        width: "100%",
        maxWidth: "420px",
        padding: "16px 20px 40px",
        boxSizing: "border-box",
    },
    topBar: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "12px 0 8px",
        marginBottom: "8px",
    },
    topTitle: {
        color: "#fff",
        fontSize: "1.05rem",
        fontWeight: 500,
    },
    logoWrap: {
        margin: "12px 0 28px",
    },
    logo: {
        fontSize: "1.6rem",
        fontWeight: 700,
        color: "#f0c14b",
        letterSpacing: "0.5px",
    },
    instruction: {
        color: "#9a9a9a",
        fontSize: "0.88rem",
        lineHeight: 1.5,
        marginBottom: "28px",
    },
    field: {
        marginBottom: "22px",
    },
    label: {
        display: "block",
        color: "#fff",
        fontSize: "0.95rem",
        fontWeight: 500,
        marginBottom: "8px",
    },
    input: {
        width: "100%",
        padding: "14px 14px",
        fontSize: "1rem",
        color: "#fff",
        backgroundColor: "#1a1a1a",
        border: "1px solid #2a2a2a",
        borderRadius: "6px",
        outline: "none",
        boxSizing: "border-box",
    },
    helper: {
        display: "block",
        color: "#666",
        fontSize: "0.8rem",
        marginTop: "6px",
    },
    checkboxRow: {
        display: "flex",
        gap: "10px",
        alignItems: "flex-start",
        marginBottom: "24px",
    },
    checkbox: {
        marginTop: "3px",
        flexShrink: 0,
        width: "16px",
        height: "16px",
        accentColor: "#f0c14b",
    },
    checkboxLabel: {
        color: "#9a9a9a",
        fontSize: "0.82rem",
        lineHeight: 1.45,
    },
    highlight: {
        color: "#f0c14b",
    },
    primaryBtn: {
        width: "100%",
        padding: "14px 16px",
        fontSize: "1rem",
        fontWeight: 600,
        color: "#fff",
        backgroundColor: "#1e3a5f",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer",
        marginTop: "4px",
    },
    bottomLinks: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "14px",
        marginTop: "28px",
    },
    linkBtn: {
        background: "none",
        border: "none",
        color: "#aaa",
        fontSize: "0.9rem",
        cursor: "pointer",
        padding: "4px",
    },
    error: {
        backgroundColor: "rgba(185, 28, 28, 0.2)",
        color: "#f87171",
        padding: "10px 12px",
        borderRadius: "6px",
        fontSize: "0.875rem",
        marginBottom: "14px",
    },
    success: {
        backgroundColor: "rgba(22, 101, 52, 0.25)",
        color: "#86efac",
        padding: "10px 12px",
        borderRadius: "6px",
        fontSize: "0.875rem",
        marginBottom: "14px",
    },
};