import React, { useCallback, useEffect, useRef, useState } from "react";
import PaystackPop from "@paystack/inline-js";
import { supabase } from "../../supabase";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL ?? "";
const MIN_DEPOSIT = 50;
const MIN_WITHDRAWAL = 50;
const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

type Tab = "deposit" | "withdraw";
type AlertType = "success" | "danger" | "warning" | "info";

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

// ---- shared style helpers (Profile.tsx imports card + labelStyle) ----
export const card: React.CSSProperties = {
  background: "rgba(15,23,42,0.7)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 14,
  padding: 18,
};

export const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: 0.5,
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

interface DepositCardProps {
  userId: string;
  email: string;
  /** Phone saved on the profile; prefills the withdrawal phone box. */
  defaultPhone?: string | null;
}

export default function DepositCard({ userId, email, defaultPhone }: DepositCardProps) {
  const [walletLoading, setWalletLoading] = useState(true);
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

  // Prefill withdrawal phone from the profile (never overwrite what the user typed)
  useEffect(() => {
    if (defaultPhone) setWithdrawPhone((prev) => prev || defaultPhone);
  }, [defaultPhone]);

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

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      try {
        await fetchWallet(userId);
      } catch (err) {
        console.error("Error fetching wallet data:", err);
      } finally {
        if (!cancelled) setWalletLoading(false);
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
  }, [userId, fetchWallet]);

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

  const depositNum = parseFloat(depositAmount);
  const depositValid = !isNaN(depositNum) && depositNum >= MIN_DEPOSIT;

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
    <>
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
          {walletLoading ? (
            <span className="spinner-border spinner-border-sm text-primary" role="status" />
          ) : (
            <span style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.5px" }}>
              {fmtMoney(balance)}
            </span>
          )}
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
                    background: depositNum === amt ? "rgba(34,197,94,0.15)" : "transparent",
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
            <div style={{ fontSize: 11, color: "#64748b", textAlign: "center", marginTop: 10 }}>
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

      <style>{`
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
    </>
  );
}