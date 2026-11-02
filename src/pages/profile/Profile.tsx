import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabase";
import Navbar from "../../components/ExternalHeader";
import DepositCard, { card, labelStyle } from "./Depositcard";

type BetTab = "ALL" | "PENDING" | "WON" | "LOST" | "VOID";

interface SlipSelection {
  id: string;
  event_id: number;
  selection: "HOME" | "DRAW" | "AWAY";
  odds_at_pick: number | null;
}

interface Slip {
  id: string;
  stake: number;
  potential_win: number | null;
  status: "pending" | "won" | "lost" | "void";
  created_at: string;
  settled_at: string | null;
  slip_selections: SlipSelection[];
}

interface ProfileRow {
  username: string;
  display_name: string;
  profile_pic: string | null;
  phone: string | null;
  county: string | null;
}

const STATUS_COLORS: Record<Slip["status"], string> = {
  pending: "#38bdf8",
  won: "#4ade80",
  lost: "#f87171",
  void: "#94a3b8",
};

export default function Profile() {
  const navigate = useNavigate();

  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [picFailed, setPicFailed] = useState(false);

  // ---- session ----
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (!session) {
        navigate("/auth", { replace: true });
        return;
      }
      setUserId(session.user.id);
      setEmail(session.user.email ?? "");
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate("/auth", { replace: true });
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  // ---- profile ----
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("username, display_name, profile_pic, phone, county")
          .eq("id", userId)
          .maybeSingle();
        if (!cancelled && data) setProfile(data as ProfileRow);
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
    } finally {
      navigate("/auth", { replace: true });
    }
  };

  // ---- bets ----
  const [slips, setSlips] = useState<Slip[]>([]);
  const [betTab, setBetTab] = useState<BetTab>("ALL");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const fetchSlips = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("slips")
      .select(
        `id, stake, potential_win, status, created_at, settled_at,
         slip_selections ( id, event_id, selection, odds_at_pick )`
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (!error) setSlips((data ?? []) as Slip[]);
  }, [userId]);

  useEffect(() => {
    fetchSlips();
  }, [fetchSlips]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const totalOdds = (s: Slip) =>
    s.slip_selections.reduce((acc, sel) => acc * (sel.odds_at_pick ?? 1), 1);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#030a1a", color: "#fff", paddingTop: 120 }}>
        <Navbar />
        <div style={{ textAlign: "center", padding: 40 }}>
          <div className="spinner-border text-primary" role="status" />
        </div>
      </div>
    );
  }

  const filtered = slips.filter((s) => betTab === "ALL" || s.status === betTab.toLowerCase());
  const counts: Record<BetTab, number> = {
    ALL: slips.length,
    PENDING: slips.filter((s) => s.status === "pending").length,
    WON: slips.filter((s) => s.status === "won").length,
    LOST: slips.filter((s) => s.status === "lost").length,
    VOID: slips.filter((s) => s.status === "void").length,
  };

  const filterBtn = (active: boolean): React.CSSProperties => ({
    padding: "6px 12px",
    borderRadius: 8,
    border: "1px solid " + (active ? "#38bdf8" : "rgba(255,255,255,0.1)"),
    background: active ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.03)",
    color: active ? "#38bdf8" : "#94a3b8",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer",
    whiteSpace: "nowrap",
  });

  const displayName = profile?.display_name || profile?.username || email.split("@")[0] || "Player";
  const initial = displayName.charAt(0).toUpperCase();
  const showPic = !!profile?.profile_pic && !picFailed;

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 15% 0%, rgba(13,110,253,0.15), transparent 45%), #030a1a",
        color: "#fff",
        paddingTop: 110,
        paddingBottom: 48,
      }}
    >
      <Navbar />

      <div style={{ maxWidth: 1150, margin: "0 auto", padding: "0 16px" }}>
        {/* Profile header (top left) */}
        <div
          style={{
            ...card,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
            {showPic ? (
              <img
                src={profile!.profile_pic!}
                alt={displayName}
                onError={() => setPicFailed(true)}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid rgba(56,189,248,0.5)",
                  flexShrink: 0,
                }}
              />
            ) : (
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  background: "rgba(56,189,248,0.18)",
                  border: "2px solid rgba(56,189,248,0.5)",
                  color: "#38bdf8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  fontWeight: 900,
                  flexShrink: 0,
                }}
              >
                {initial}
              </div>
            )}

            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.3px" }}>
                {displayName}
              </div>
              {profile?.username && (
                <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
                  @{profile.username}
                  {profile.county ? ` · ${profile.county}` : ""}
                </div>
              )}
              <div style={{ fontSize: 13, color: "#cbd5e1", marginTop: 6, wordBreak: "break-all" }}>
                ✉️ {email || "No email"}
              </div>
              <div style={{ fontSize: 13, color: "#cbd5e1", marginTop: 2 }}>
                📞 {profile?.phone || "No phone number added"}
              </div>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            disabled={signingOut}
            style={{
              padding: "9px 18px",
              borderRadius: 9,
              border: "1px solid rgba(239,68,68,0.5)",
              background: "rgba(239,68,68,0.15)",
              color: "#f87171",
              fontWeight: 800,
              fontSize: 13,
              cursor: signingOut ? "not-allowed" : "pointer",
              opacity: signingOut ? 0.5 : 1,
            }}
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>

        {/* Responsive 2-column grid */}
        <div className="wallet-grid">
          {/* LEFT: bets */}
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>My Bets</h2>
              <button
                onClick={fetchSlips}
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#94a3b8",
                  borderRadius: 7,
                  padding: "6px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Refresh
              </button>
            </div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              {(Object.keys(counts) as BetTab[]).map((key) => (
                <button key={key} onClick={() => setBetTab(key)} style={filterBtn(betTab === key)}>
                  {key.charAt(0) + key.slice(1).toLowerCase()} ({counts[key]})
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div
                style={{
                  ...card,
                  textAlign: "center",
                  padding: 40,
                  color: "#94a3b8",
                  fontSize: 13,
                }}
              >
                {slips.length === 0
                  ? "You haven't placed any bets yet."
                  : `No ${betTab.toLowerCase()} bets.`}
              </div>
            ) : (
              filtered.map((slip) => {
                const isOpen = expanded.has(slip.id);
                const odds = totalOdds(slip);
                return (
                  <div key={slip.id} style={{ ...card, padding: 0, overflow: "hidden", marginBottom: 10 }}>
                    <button
                      onClick={() => toggleExpand(slip.id)}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                        padding: "12px 16px",
                        background: "rgba(255,255,255,0.03)",
                        border: "none",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        color: "#fff",
                        cursor: "pointer",
                        textAlign: "left",
                        fontSize: 13,
                        fontWeight: 700,
                        gap: 10,
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: 12,
                            fontSize: 10,
                            fontWeight: 800,
                            color: STATUS_COLORS[slip.status],
                            background: `${STATUS_COLORS[slip.status]}22`,
                          }}
                        >
                          {slip.status.toUpperCase()}
                        </span>
                        <span style={{ color: "#64748b", fontWeight: 600, fontSize: 12 }}>
                          {formatDate(slip.created_at)}
                        </span>
                      </span>
                      <span style={{ color: "#94a3b8", fontSize: 12, whiteSpace: "nowrap" }}>
                        {slip.slip_selections.length} pick
                        {slip.slip_selections.length === 1 ? "" : "s"} {isOpen ? "▲" : "▼"}
                      </span>
                    </button>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: 12,
                        padding: "14px 16px",
                      }}
                    >
                      <div>
                        <div style={labelStyle}>Stake</div>
                        <div style={{ fontSize: 14, fontWeight: 800, marginTop: 2 }}>
                          KSh {Number(slip.stake).toFixed(0)}
                        </div>
                      </div>
                      <div>
                        <div style={labelStyle}>Odds</div>
                        <div style={{ fontSize: 14, fontWeight: 800, marginTop: 2 }}>
                          {odds.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <div style={labelStyle}>{slip.status === "won" ? "Payout" : "Potential"}</div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 800,
                            marginTop: 2,
                            color: slip.status === "won" ? "#4ade80" : "#38bdf8",
                          }}
                        >
                          KSh {Number(slip.potential_win ?? 0).toFixed(0)}
                        </div>
                      </div>
                    </div>

                    {isOpen && (
                      <div
                        style={{
                          borderTop: "1px solid rgba(255,255,255,0.06)",
                          padding: "12px 16px",
                          background: "rgba(0,0,0,0.2)",
                        }}
                      >
                        {slip.slip_selections.map((sel) => (
                          <div
                            key={sel.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "7px 12px",
                              background: "rgba(255,255,255,0.03)",
                              borderRadius: 7,
                              marginBottom: 5,
                              fontSize: 12,
                            }}
                          >
                            <span style={{ color: "#cbd5e1", fontWeight: 600 }}>
                              Event #{sel.event_id}
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span
                                style={{
                                  width: 22,
                                  height: 22,
                                  borderRadius: 5,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: 10,
                                  fontWeight: 900,
                                  background:
                                    sel.selection === "HOME"
                                      ? "rgba(34,197,94,0.15)"
                                      : sel.selection === "DRAW"
                                      ? "rgba(245,158,11,0.15)"
                                      : "rgba(239,68,68,0.15)",
                                  color:
                                    sel.selection === "HOME"
                                      ? "#4ade80"
                                      : sel.selection === "DRAW"
                                      ? "#fbbf24"
                                      : "#f87171",
                                }}
                              >
                                {sel.selection === "HOME" ? "1" : sel.selection === "DRAW" ? "X" : "2"}
                              </span>
                              <span
                                style={{
                                  color: "#38bdf8",
                                  fontWeight: 800,
                                  minWidth: 40,
                                  textAlign: "right",
                                }}
                              >
                                {sel.odds_at_pick ? sel.odds_at_pick.toFixed(2) : "-"}
                              </span>
                            </span>
                          </div>
                        ))}
                        {slip.settled_at && (
                          <div
                            style={{
                              fontSize: 10,
                              color: "#64748b",
                              textAlign: "right",
                              marginTop: 6,
                            }}
                          >
                            Settled {formatDate(slip.settled_at)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* RIGHT: wallet / deposit / withdraw */}
          <div style={{ minWidth: 0 }}>
            <DepositCard userId={userId} email={email} defaultPhone={profile?.phone} />
          </div>
        </div>
      </div>

      <style>{`
        .wallet-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        @media (min-width: 900px) {
          .wallet-grid {
            grid-template-columns: 1fr 380px;
            align-items: start;
          }
        }
        @media (max-width: 900px) {
          .wallet-grid {
            display: flex;
            flex-direction: column-reverse;
          }
        }
      `}</style>
    </div>
  );
}