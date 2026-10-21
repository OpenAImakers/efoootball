import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PaystackPop from "@paystack/inline-js";
import { supabase } from "../../supabase";
import PageHeader from "../../components/DepositHeader";
import Navbar from "../../components/Navbar";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL ?? "";
const MIN_WITHDRAWAL = 500;
const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

type Tab = "deposit" | "withdraw";
type AlertType = "success" | "danger" | "warning" | "info";

// Normalize Kenyan phone numbers to 2547XXXXXXXX / 2541XXXXXXXX
const formatKenyanPhone = (phone: string): string => {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "254" + cleaned.slice(1);
  } else if (cleaned.startsWith("7") || cleaned.startsWith("1")) {
    cleaned = "254" + cleaned;
  }
  return cleaned;
};

const WITHDRAW_ERRORS: Record<string, string> = {
  minimum_withdrawal_is_500: `Minimum withdrawal is KES ${MIN_WITHDRAWAL}.`,
  insufficient_balance: "You do not have enough balance for that amount.",
  invalid_phone: "Enter a valid Kenyan phone number.",
  invalid_amount: "Enter a valid amount.",
  wallet_not_found: "Wallet not found.",
  not_authenticated: "Please sign in again.",
};

const fmtMoney = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Deposit() {
  const navigate = useNavigate();

  // Auth
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");

  // Wallet
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState("KES");

  // UI state
  const [tab, setTab] = useState<Tab>("deposit");
  const [depositAmount, setDepositAmount] = useState("");
  const [submittingDeposit, setSubmittingDeposit] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPhone, setWithdrawPhone] = useState("");
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  // Alerts
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

  // ---------- Auth guard ----------
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

  // ---------- Data fetching ----------
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

  // Prefill payout phone from profile (optional, ignore failures)
  const fetchSavedPhone = useCallback(async (uid: string) => {
    const { data } = await supabase.from("profiles").select("phone").eq("id", uid).maybeSingle();
    if (data?.phone) {
      setWithdrawPhone((prev) => prev || String(data.phone));
    }
  }, []);

  // Initial load + realtime balance updates
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

  // ---------- Wait for the webhook to credit the wallet ----------
  // The popup's onSuccess is only a cue to start polling. The webhook is the
  // source of truth, never treat the popup callback as proof of payment.
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

  // ---------- Deposit ----------
  const handleDeposit = async () => {
    const numAmount = parseFloat(depositAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showAlert("Enter a valid deposit amount greater than 0.", "danger");
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
        body: JSON.stringify({
          email,
          amount: numAmount, // KES, backend converts to subunits (x100)
          userId,
        }),
      });

      const data = await response.json();
      const authorizationUrl: string | undefined =
        data?.authorization_url || data?.data?.authorization_url;

      // Prefer access_code from the backend; fall back to parsing it from
      // the authorization_url (https://checkout.paystack.com/<access_code>)
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
        onCancel: () => {
          showAlert("Payment cancelled.", "warning");
        },
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

  // ---------- Withdraw ----------
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

  // ---------- Render ----------
  if (loading) {
    return (
      <div className="dp-page">
        <div className="container text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  const depositNum = parseFloat(depositAmount);
  const depositValid = !isNaN(depositNum) && depositNum > 0;

  return (
    <div className="dp-page">
      <Navbar />
             <PageHeader />
      <div className="container dp-container">
     
        {/* Alerts */}
        {alertState.show && (
          <div className={`alert alert-${alertState.type} dp-alert`} role="alert">
            {alertState.message}
          </div>
        )}

        {/* Balance card */}
        <div className="dp-card">
          <div className="dp-label">
            <i className="bi bi-wallet2 me-2"></i>Wallet Balance
          </div>
          <div className="dp-amount-row">
            <span className="dp-currency">{currency}</span>
            <span className="dp-balance">{fmtMoney(balance)}</span>
            {verifying && (
              <span className="dp-verifying">
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Verifying payment…
              </span>
            )}
          </div>
        </div>

        {/* Action card */}
        <div className="dp-card">
          <div className="dp-tabs">
            <button
              className={`dp-tab ${tab === "deposit" ? "active" : ""}`}
              onClick={() => setTab("deposit")}
            >
              <i className="bi bi-plus-circle-fill me-2"></i>Deposit
            </button>
            <button
              className={`dp-tab ${tab === "withdraw" ? "active" : ""}`}
              onClick={() => setTab("withdraw")}
            >
              <i className="bi bi-arrow-up-circle-fill me-2"></i>Withdraw
            </button>
          </div>

          {tab === "deposit" ? (
            <div>
              <div className="dp-sponsored">Sponsored by Wonderbakes</div>

              <label className="dp-input-label" htmlFor="depositAmount">
                Amount (KES)
              </label>
              <input
                id="depositAmount"
                className="dp-input"
                type="number"
                inputMode="decimal"
                min="1"
                placeholder="e.g. 100"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
              />

              <div className="dp-chips">
                {QUICK_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    className={`dp-chip ${depositNum === amt ? "active" : ""}`}
                    onClick={() => setDepositAmount(String(amt))}
                  >
                    {amt.toLocaleString()}
                  </button>
                ))}
              </div>

              <button
                className="dp-submit dp-submit-green"
                onClick={handleDeposit}
                disabled={submittingDeposit || verifying || !depositValid}
              >
                {submittingDeposit ? (
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                ) : (
                  <>
                    <i className="bi bi-lock-fill me-2"></i>
                    {depositValid ? `Deposit ${depositNum.toLocaleString()}` : "Deposit"}
                  </>
                )}
              </button>

              <div className="dp-secure">
                <i className="bi bi-shield-check me-1"></i>Secure payment via Paystack
              </div>
            </div>
          ) : (
            <div>
              <div className="dp-helper">
                Available: {currency} {fmtMoney(balance)} &nbsp;•&nbsp; Minimum: {currency}{" "}
                {MIN_WITHDRAWAL}
              </div>

              <label className="dp-input-label" htmlFor="withdrawAmount">
                Amount (KES)
              </label>
              <input
                id="withdrawAmount"
                className="dp-input"
                type="number"
                inputMode="decimal"
                placeholder={`Min ${MIN_WITHDRAWAL}`}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
              />

              <label className="dp-input-label" htmlFor="withdrawPhone">
                Payout Phone Number
              </label>
              <input
                id="withdrawPhone"
                className="dp-input"
                type="tel"
                inputMode="tel"
                placeholder="e.g. 0712345678"
                value={withdrawPhone}
                onChange={(e) => setWithdrawPhone(e.target.value)}
              />

              <button
                className="dp-submit"
                onClick={handleWithdraw}
                disabled={submittingWithdraw}
              >
                {submittingWithdraw ? (
                  <span className="spinner-border spinner-border-sm" role="status"></span>
                ) : (
                  <>
                    <i className="bi bi-phone-fill me-2"></i>Request Withdrawal
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{styles}</style>
    </div>
  );
}

const styles = `
  .dp-page {
    min-height: 100vh;
    padding: 9.5rem 0 3rem; /* clears the fixed navbar + lively feed */
    background:
      radial-gradient(circle at 15% 0%, rgba(13, 110, 253, 0.18) 0%, transparent 45%),
      radial-gradient(circle at 90% 100%, rgba(34, 197, 94, 0.10) 0%, transparent 40%),
      #030a1a;
    color: #ffffff;
  }

  .dp-container { max-width: 520px; }

  .dp-alert { border-radius: 12px; }

  .dp-card {
    background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 20px;
    padding: 1.4rem;
    margin-bottom: 1.25rem;
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.35);
  }

  .dp-label {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: rgba(255,255,255,0.5);
  }

  .dp-amount-row {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.4rem;
  }

  .dp-currency { font-size: 1.1rem; font-weight: 700; color: rgba(255,255,255,0.6); }
  .dp-balance { font-size: 2.2rem; font-weight: 800; letter-spacing: -0.5px; }
  .dp-verifying { font-size: 0.8rem; color: #38bdf8; margin-left: 0.25rem; }

  .dp-tabs {
    display: flex; gap: 0.4rem; padding: 0.3rem; margin-bottom: 1.2rem;
    background: rgba(0,0,0,0.25); border-radius: 14px;
  }

  .dp-tab {
    flex: 1; border: 1px solid transparent; background: transparent;
    color: rgba(255,255,255,0.6); font-weight: 700; font-size: 0.85rem;
    padding: 0.55rem 0.5rem; border-radius: 11px; cursor: pointer;
    transition: all 0.2s ease;
  }
  .dp-tab:hover:not(.active) { color: #fff; background: rgba(255,255,255,0.05); }
  .dp-tab.active {
    color: #38bdf8; background: rgba(56,189,248,0.12);
    border-color: rgba(56,189,248,0.3);
  }

  .dp-sponsored { font-size: 0.75rem; color: rgba(255,255,255,0.45); margin-bottom: 0.8rem; letter-spacing: 0.3px; }
  .dp-helper { font-size: 0.78rem; color: rgba(255,255,255,0.55); margin-bottom: 0.6rem; }

  .dp-input-label {
    display: block; font-size: 0.75rem; font-weight: 600;
    color: rgba(255,255,255,0.6); margin: 0.7rem 0 0.35rem;
  }

  .dp-input {
    width: 100%; padding: 0.7rem 0.9rem; font-size: 1rem; color: #fff;
    background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15);
    border-radius: 12px; outline: none; transition: all 0.2s ease;
  }
  .dp-input::placeholder { color: rgba(255,255,255,0.3); }
  .dp-input:focus { border-color: rgba(56,189,248,0.6); box-shadow: 0 0 0 3px rgba(56,189,248,0.15); }

  .dp-chips { display: flex; flex-wrap: wrap; gap: 0.45rem; margin-top: 0.75rem; }
  .dp-chip {
    padding: 0.35rem 0.85rem; font-size: 0.8rem; font-weight: 700; color: rgba(255,255,255,0.75);
    background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15);
    border-radius: 999px; cursor: pointer; transition: all 0.2s ease;
  }
  .dp-chip:hover { color: #fff; border-color: rgba(56,189,248,0.5); }
  .dp-chip.active { color: #4ade80; background: rgba(34,197,94,0.15); border-color: rgba(34,197,94,0.5); }

  .dp-submit {
    width: 100%; margin-top: 1.3rem; padding: 0.8rem; font-size: 0.95rem; font-weight: 700;
    color: #fff; border: 1px solid rgba(56,189,248,0.5); border-radius: 12px; cursor: pointer;
    background: linear-gradient(135deg, rgba(13,110,253,0.6), rgba(13,110,253,0.3));
    transition: all 0.25s ease;
  }
  .dp-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(13,110,253,0.35); }
  .dp-submit:disabled { opacity: 0.5; cursor: not-allowed; }

  .dp-submit-green {
    border-color: rgba(34,197,94,0.6);
    background: linear-gradient(135deg, rgba(34,197,94,0.65), rgba(34,197,94,0.3));
  }
  .dp-submit-green:hover:not(:disabled) { box-shadow: 0 6px 20px rgba(34,197,94,0.35); }

  .dp-secure { margin-top: 0.8rem; text-align: center; font-size: 0.75rem; color: rgba(255,255,255,0.45); }

  @media (max-width: 576px) {
    .dp-page { padding-top: 8.5rem; }
    .dp-balance { font-size: 1.9rem; }
  }
`;