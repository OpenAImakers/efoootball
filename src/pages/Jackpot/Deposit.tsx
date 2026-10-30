import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PaystackPop from "@paystack/inline-js";
import { supabase } from "../../supabase";
import Navbar from "../../components/ExternalHeader";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL ?? "";
const MIN_DEPOSIT = 50;
const MIN_WITHDRAWAL = 50;
const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

type Tab = "deposit" | "withdraw";
type AlertType = "success" | "danger" | "warning" | "info";
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

const formatKenyanPhone = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) cleaned = "254" + cleaned.slice(1);
  else if (cleaned.startsWith("7") || cleaned.startsWith("1")) cleaned = "254" + cleaned;
  return cleaned;
};

const WITHDRAW_ERRORS: Record<string, string> = {
  minimum_withdrawal_is_50: `Minimum withdrawal is KES ${MIN_WITHDRAWAL}.`,
  minimum_withdrawal_is_500: `Minimum withdrawal is KES ${MIN_WITHDRAWAL}.`,
  insufficient_balance: "You do not have enough balance for that amount.",
  invalid_phone: "Enter a valid Kenyan phone number.",
  invalid_amount: "Enter a valid amount.",
  wallet_not_found: "Wallet not found.",
  not_authenticated: "Please sign in again.",
};

const fmtMoney = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const STATUS_COLORS: Record<Slip["status"], string> = {
  pending: "#38bdf8",
  won: "#4ade80",
  lost: "#f87171",
  void: "#94a3b8",
};

// ---- tiny style helpers ----
const card: React.CSSProperties = {
  background: "rgba(15,23,42,0.7)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 14,
  padding: 18,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  background: "rgba(0,0,0,0.35)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 9,
  color: "#fff",
  fontSize: 14,
  outline: "none",
  marginTop: 6,
  marginBottom: 12,
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: 0.5,
};

export default function Deposit() {
  const navigate = useNavigate();

  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState("KES");

  const [tab, setTab] = useState<Tab>("deposit");
  const [depositAmount, setDepositAmount] = useState("");
  const [submittingDeposit, setSubmittingDeposit] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPhone, setWithdrawPhone] = useState("");
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  const [alertState, setAlertState] = useState<{ show: boolean; message: string; type: AlertType }>({
    show: false,
    message: "",
    type: "success",
  });
  const alertTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showAlert = useCallback((message: string, type: AlertType = "success") => {
    if (alertTimer.current) clearTimeout(alertTimer.current);
    setAlertState({ show: true, message, type });
    alertTimer.current = setTimeout(
      () => setAlertState({ show: false, message: "", type: "success" }),
      5000
    );
  }, []);

  useEffect(() => {
    return () => {
      if (alertTimer.current) clearTimeout(alertTimer.current);
    };
  }, []);

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

  const fetchWallet = useCallback(async (uid: string): Promise<number | null> => {
    const { data } = await supabase
      .from("wallets")
      .select("balance, currency")
      .eq("user_id", uid)
      .maybeSingle();
    if (data) {
      const b = Number(data.balance) || 0;
      setBalance(b);
      setCurrency(data.currency || "KES");
      return b;
    }
    return null;
  }, []);

  const fetchSavedPhone = useCallback(async (uid: string) => {
    const { data } = await supabase.from("profiles").select("phone").eq("id", uid).maybeSingle();
    if (data?.phone) setWithdrawPhone((prev) => prev || String(data.phone));
  }, []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        await Promise.all([fetchWallet(userId), fetchSavedPhone(userId)]);
      } catch (err) {
        console.error("Error fetching wallet data:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    const channel = supabase
      .channel(`wallet_changes_${userId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "wallets", filter: `user_id=eq.${userId}` },
        (payload: any) => {
          const next = Number(payload?.new?.balance);
          if (!isNaN(next)) setBalance(next);
        }
      )
      .subscribe();
    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId, fetchWallet, fetchSavedPhone]);

  const waitForCredit = useCallback(
    async (startBalance: number) => {
      setVerifying(true);
      for (let i = 0; i < 6; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        const now = await fetchWallet(userId);
        if (now !== null && now > startBalance) {
          showAlert(`Deposit received! +${currency} ${fmtMoney(now - startBalance)}`, "success");
          setVerifying(false);
          return;
        }
      }
      setVerifying(false);
      showAlert(
        "Payment is still processing. Your balance will update automatically once it lands.",
        "info"
      );
    },
    [userId, fetchWallet, showAlert, currency]
  );

  const handleDeposit = async () => {
    const numAmount = parseFloat(depositAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showAlert("Enter a valid deposit amount greater than 0.", "danger");
      return;
    }
    if (numAmount < MIN_DEPOSIT) {
      showAlert(`Minimum deposit is ${currency} ${MIN_DEPOSIT}.`, "danger");
      return;
    }
    if (!email) {
      showAlert("Your account needs an email address to make a deposit.", "danger");
      return;
    }
    try {
      setSubmittingDeposit(true);
      const response = await fetch(`${API_BASE_URL}/api/paystack/initialize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ email, amount: numAmount, userId }),
      });
      const data = await response.json();
      const authorizationUrl: string | undefined =
        data?.authorization_url || data?.data?.authorization_url;
      const accessCode: string | undefined =
        data?.access_code ||
        data?.data?.access_code ||
        authorizationUrl?.split("/").filter(Boolean).pop();
      if (!response.ok || !accessCode) {
        showAlert(data?.message || data?.error || "Could not start payment.", "danger");
        return;
      }
      const startBalance = balance;
      const popup = new PaystackPop();
      popup.resumeTransaction(accessCode, {
        onSuccess: () => {
          setDepositAmount("");
          waitForCredit(startBalance);
        },
        onCancel: () => showAlert("Payment cancelled.", "warning"),
        onError: (error: { message?: string }) => {
          showAlert(error?.message || "Payment failed. Please try again.", "danger");
        },
      });
    } catch (err: any) {
      showAlert(err?.message || "Network error occurred while processing request.", "danger");
    } finally {
      setSubmittingDeposit(false);
    }
  };

  const handleWithdraw = async () => {
    const numAmount = parseFloat(withdrawAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showAlert("Enter a valid withdrawal amount.", "danger");
      return;
    }
    if (numAmount < MIN_WITHDRAWAL) {
      showAlert(`Minimum withdrawal is ${currency} ${MIN_WITHDRAWAL}.`, "danger");
      return;
    }
    if (numAmount > balance) {
      showAlert(`You can withdraw up to ${currency} ${fmtMoney(balance)}.`, "danger");
      return;
    }
    const formattedPhone = formatKenyanPhone(withdrawPhone.trim());
    if (!/^254[17][0-9]{8}$/.test(formattedPhone)) {
      showAlert("Enter a valid Kenyan phone number (e.g., 0712345678).", "danger");
      return;
    }
    try {
      setSubmittingWithdraw(true);
      const { error } = await supabase.rpc("request_withdrawal", {
        p_amount: numAmount,
        p_payout_phone: formattedPhone,
      });
      if (error) {
        showAlert(WITHDRAW_ERRORS[error.message] ?? error.message, "danger");
        fetchWallet(userId);
        return;
      }
      setWithdrawAmount("");
      fetchWallet(userId);
      showAlert(
        `Withdrawal of ${currency} ${numAmount.toFixed(2)} requested. It will be paid out to ${formattedPhone} shortly.`,
        "success"
      );
    } catch (err: any) {
      showAlert(err?.message || "Network error occurred while processing request.", "danger");
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  // ---- bets ----
  const [slips, setSlips] = useState<Slip[]>([]);
  const [betTab, setBetTab] = useState<BetTab>("ALL");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const fetchSlips = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("slips")
      .select(
        `id, stake, potential_win, status, created_at, settled_at,
         slip_selections ( id, event_id, selection, odds_at_pick )`
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error) setSlips((data ?? []) as Slip[]);
  }, []);

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

  const depositNum = parseFloat(depositAmount);
  const depositValid = !isNaN(depositNum) && depositNum >= MIN_DEPOSIT;
  const filtered = slips.filter((s) => betTab === "ALL" || s.status === betTab.toLowerCase());
  const counts: Record<BetTab, number> = {
    ALL: slips.length,
    PENDING: slips.filter((s) => s.status === "pending").length,
    WON: slips.filter((s) => s.status === "won").length,
    LOST: slips.filter((s) => s.status === "lost").length,
    VOID: slips.filter((s) => s.status === "void").length,
  };

  const tabBtn = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "9px 10px",
    borderRadius: 8,
    border: "1px solid " + (active ? "#38bdf8" : "rgba(255,255,255,0.12)"),
    background: active ? "rgba(56,189,248,0.15)" : "transparent",
    color: active ? "#38bdf8" : "#94a3b8",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  });

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

  const primaryBtn = (color: "green" | "blue", disabled: boolean): React.CSSProperties => ({
    width: "100%",
    padding: 12,
    borderRadius: 9,
    border: "1px solid " + (color === "green" ? "rgba(34,197,94,0.6)" : "rgba(56,189,248,0.5)"),
    background: color === "green" ? "rgba(34,197,94,0.2)" : "rgba(56,189,248,0.2)",
    color: "#fff",
    fontWeight: 800,
    fontSize: 14,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
  });

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

      {alertState.show && (
        <div
          style={{
            position: "fixed",
            top: 90,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 999,
            padding: "11px 20px",
            borderRadius: 9,
            fontSize: 13,
            fontWeight: 600,
            background:
              alertState.type === "success"
                ? "rgba(34,197,94,0.95)"
                : alertState.type === "danger"
                ? "rgba(239,68,68,0.95)"
                : alertState.type === "warning"
                ? "rgba(245,158,11,0.95)"
                : "rgba(56,189,248,0.95)",
            color: "#fff",
            maxWidth: "90vw",
            boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
          }}
        >
          {alertState.message}
        </div>
      )}

      <div style={{ maxWidth: 1150, margin: "0 auto", padding: "0 16px" }}>
        {/* Page title */}
        <h1 style={{ fontSize: 26, fontWeight: 900, margin: "0 0 20px", letterSpacing: "-0.5px" }}>
          Wallet
        </h1>

        {/* Responsive 2-column grid */}
        <div className="wallet-grid">
          {/* LEFT: bets (main content) */}
          <div style={{ minWidth: 0 }}>
            {/* Bets header */}
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

            {/* Filter tabs */}
            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                marginBottom: 14,
              }}
            >
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
                        <div style={labelStyle}>
                          {slip.status === "won" ? "Payout" : "Potential"}
                        </div>
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

          {/* RIGHT: sticky deposit/withdraw card */}
          <div style={{ minWidth: 0 }}>
            <div style={{ ...card, position: "sticky", top: 100 }}>
              {/* Balance */}
              <div style={labelStyle}>Wallet Balance</div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 8,
                  marginTop: 4,
                  marginBottom: 18,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 700, color: "#94a3b8" }}>{currency}</span>
                <span style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.5px" }}>
                  {fmtMoney(balance)}
                </span>
                {verifying && (
                  <span style={{ fontSize: 11, color: "#38bdf8", display: "flex", alignItems: "center", gap: 4 }}>
                    <span className="spinner-border spinner-border-sm" role="status" />
                    Verifying…
                  </span>
                )}
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                <button style={tabBtn(tab === "deposit")} onClick={() => setTab("deposit")}>
                  Deposit
                </button>
                <button style={tabBtn(tab === "withdraw")} onClick={() => setTab("withdraw")}>
                  Withdraw
                </button>
              </div>

              {tab === "deposit" ? (
                <>
                  <div style={labelStyle}>Amount (KES)</div>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={MIN_DEPOSIT}
                    placeholder={`Min ${MIN_DEPOSIT}`}
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    style={inputStyle}
                  />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                    {QUICK_AMOUNTS.map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setDepositAmount(String(amt))}
                        style={{
                          padding: "5px 12px",
                          fontSize: 12,
                          fontWeight: 700,
                          borderRadius: 20,
                          border:
                            "1px solid " +
                            (depositNum === amt ? "rgba(34,197,94,0.6)" : "rgba(255,255,255,0.15)"),
                          background:
                            depositNum === amt ? "rgba(34,197,94,0.15)" : "transparent",
                          color: depositNum === amt ? "#4ade80" : "#cbd5e1",
                          cursor: "pointer",
                        }}
                      >
                        {amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleDeposit}
                    disabled={submittingDeposit || verifying || !depositValid}
                    style={primaryBtn("green", submittingDeposit || verifying || !depositValid)}
                  >
                    {submittingDeposit
                      ? "Processing…"
                      : depositValid
                      ? `Deposit ${depositNum.toLocaleString()}`
                      : "Deposit"}
                  </button>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#64748b",
                      textAlign: "center",
                      marginTop: 10,
                    }}
                  >
                    🔒 Secure payment via Paystack
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12 }}>
                    Available: {currency} {fmtMoney(balance)} • Min: {MIN_WITHDRAWAL}
                  </div>
                  <div style={labelStyle}>Amount (KES)</div>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder={`Min ${MIN_WITHDRAWAL}`}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    style={inputStyle}
                  />
                  <div style={labelStyle}>Payout Phone</div>
                  <input
                    type="tel"
                    placeholder="e.g. 0712345678"
                    value={withdrawPhone}
                    onChange={(e) => setWithdrawPhone(e.target.value)}
                    style={inputStyle}
                  />
                  <button
                    onClick={handleWithdraw}
                    disabled={submittingWithdraw}
                    style={primaryBtn("blue", submittingWithdraw)}
                  >
                    {submittingWithdraw ? "Processing…" : "Request Withdrawal"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Responsive grid + mobile fixes */}
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
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}