"use client";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";

const CreateRegistration = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [type, setType] = useState("single_elimination");
  const [players, setPlayers] = useState<number | "">("");
  const [amount, setAmount] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  // Power of 2 check
  const isPowerOfTwo = (n: number) => n > 1 && (n & (n - 1)) === 0;

  // Amount validation
  const isAmountValid = () => {
    return amount !== "" && amount >= 100;
  };

  const validatePlayers = () => {
    if (!players || players < 2) return "Minimum 2 players required";

    if (
      type === "single_elimination" ||
      type === "double_elimination"
    ) {
      if (!isPowerOfTwo(players)) {
        return "Must be power of 2";
      }
    }

    return null;
  };

  // Upload to bucket
  const uploadAvatar = async () => {
    if (!avatarFile) return null;

    const filePath = `registrations/${Date.now()}-${avatarFile.name}`;

    const { error } = await supabase.storage
      .from("registrationsavatars")
      .upload(filePath, avatarFile);

    if (error) throw error;

    const { data } = supabase.storage
      .from("registrationsavatars")
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  // Modernized success experience injection
  const triggerSuccessModal = () => {
    return new Promise<void>((resolve) => {
      const modal = document.createElement('div');
      modal.id = 'skyla-success-modal';
      modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(10, 10, 12, 0.85); backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center; z-index: 99999;
        font-family: 'Inter', system-ui, -apple-system, sans-serif; opacity: 0;
        transition: opacity 0.3s ease;
      `;

      modal.innerHTML = `
        <div style="
          background: linear-gradient(145deg, #1e293b, #0f172a);
          border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 20px;
          padding: 40px; width: 90%; max-width: 460px; text-align: center;
          box-shadow: 0 20px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1);
          transform: translateY(20px); transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        ">
          <div style="
            width: 72px; height: 72px; background: rgba(16, 185, 129, 0.1); 
            border: 2px solid #10b981; border-radius: 50%; display: flex; 
            align-items: center; justify-content: center; margin: 0 auto 24px;
            color: #10b981; font-size: 32px; font-weight: bold;
            box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
          ">✓</div>
          
          <h2 style="color: #fff; margin: 0 0 12px; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
            Registration Live!
          </h2>
          
          <p style="color: #94a3b8; font-size: 15px; line-height: 1.6; margin: 0 0 28px;">
            Your registration setup has been created successfully! Check your email inbox right away for administrative details.
          </p>

          <button id="close-skyla-modal" style="
            background: #3b82f6; color: #fff; border: none; padding: 14px 28px;
            font-size: 15px; font-weight: 600; border-radius: 12px; cursor: pointer;
            width: 100%; transition: all 0.2s ease; box-shadow: 0 4px 12px rgba(59,130,246,0.3);
          }">
            Check My Email
          </button>
          
          <div style="margin-top: 20px; font-size: 11px; color: #64748b; letter-spacing: 0.5px;">
            Skyla™ Smart Gaming Ecosystem
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      setTimeout(() => {
        modal.style.opacity = '1';
        if (modal.children[0] instanceof HTMLElement) {
          modal.children[0].style.transform = 'translateY(0)';
        }
      }, 10);

      const closeButton = modal.querySelector('#close-skyla-modal');
      closeButton?.addEventListener('mouseover', () => {
        if (closeButton instanceof HTMLElement) {
          closeButton.style.transform = 'scale(1.02)';
          closeButton.style.backgroundColor = '#2563eb';
        }
      });
      closeButton?.addEventListener('mouseout', () => {
        if (closeButton instanceof HTMLElement) {
          closeButton.style.transform = 'scale(1)';
          closeButton.style.backgroundColor = '#3b82f6';
        }
      });

      closeButton?.addEventListener('click', () => {
        modal.style.opacity = '0';
        if (modal.children[0] instanceof HTMLElement) {
          modal.children[0].style.transform = 'translateY(20px)';
        }
        setTimeout(() => {
          modal.remove();
          resolve();
        }, 300);
      });
    });
  };

  const handleSubmit = async () => {
    const errorMsg = validatePlayers();
    if (errorMsg) return alert(errorMsg);
    if (!name.trim()) return alert("Enter name");
    if (!isAmountValid()) return alert("Amount must be at least 100");

    setLoading(true);

    try {
      const avatarUrl = await uploadAvatar();

      const { error } = await supabase.from("registrations").insert({
        name,
        tournament_type: type,
        max_players: players,
        registration_amount: amount,
        avatar_url: avatarUrl,
      });

      if (error) throw error;

      // Custom styled notice trigger replaces standard alert dialog block
      await triggerSuccessModal();
      
      // Navigate to admin page after successful creation and modal closure
      navigate("/admin");
      
      // Note: No need to reset form since we're leaving the page
    } catch (err) {
      console.error(err);
      alert("Failed to create registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />

      <div
        className="min-vh-100 d-flex justify-content-center align-items-start pt-5"
        style={{ background: "#020617", color: "#fff" }}
      >
        <div
          className="p-5 w-100"
          style={{
            width: "100%",
            background: "#0f172a",
            borderRadius: "20px",
            boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
          }}
        >
          <h4 className="fw-bold mb-5 text-center" style={{ fontSize: "2rem" }}>
            Create Registration
          </h4>

          <div className="row g-5">
            {/* Left Column - Avatar Large Space */}
            <div className="col-12 col-md-6">
              <div className="mb-4">
                <label className="d-block mb-3" style={{ fontSize: "0.9rem", color: "#94a3b8" }}>
                  Tournament Avatar / Logo
                </label>

                <div
                  style={{
                    width: "100%",
                    height: "300px",
                    border: "2px solid #334155",
                    background: "#020617",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    overflow: "hidden",
                  }}
                  onClick={() => document.getElementById("avatarInput")?.click()}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = "#3b82f6"}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = "#334155"}
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="preview"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <span style={{ color: "#64748b", fontSize: "0.9rem" }}>
                      Click to upload image
                    </span>
                  )}
                </div>

                <input
                  id="avatarInput"
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setAvatarFile(file);
                      setAvatarPreview(URL.createObjectURL(file));
                    }
                  }}
                />
                <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "8px" }}>
                  Recommended: Square image, 500x500px
                </div>
              </div>
            </div>

            {/* Right Column - Form Fields */}
            <div className="col-12 col-md-6">
              {/* Name */}
              <div className="mb-4">
                <label className="form-label fw-semibold" style={{ color: "#e2e8f0" }}>Tournament Name</label>
                <input
                  type="text"
                  className="form-control form-control-lg"
                  style={{ background: "#1e293b", border: "1px solid #334155", color: "#fff" }}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Type */}
              <div className="mb-4">
                <label className="form-label fw-semibold" style={{ color: "#e2e8f0" }}>Choose Tournament Type</label>
                <select
                  className="form-select form-select-lg"
                  style={{ background: "#1e293b", border: "1px solid #334155", color: "#fff" }}
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="single_elimination">Single Elimination</option>
                  <option value="round_robin_single">Round Robin (Single)</option>
                  <option value="round_robin_double">Round Robin (Double)</option>
                  <option value="double_elimination">Double Elimination</option>
                </select>
              </div>

              {/* Amount with Info Button */}
              <div className="mb-4">
                <label className="form-label fw-semibold d-flex align-items-center gap-2" style={{ color: "#e2e8f0" }}>
                  Registration Fee (KES)
                  <button
                    type="button"
                    className="btn btn-link p-0 m-0"
                    style={{ fontSize: "1rem", textDecoration: "none", color: "#60a5fa" }}
                    onClick={() => setShowInstructions(!showInstructions)}
                  >
                    Info
                  </button>
                </label>
                
                {showInstructions && (
                  <div className="alert mb-3" style={{ background: "#1e3a8a", border: "1px solid #3b82f6", color: "#fff", fontSize: "0.875rem" }}>
                    <strong>Instructions:</strong><br />
                    - Minimum registration fee is KES 100<br />
                    - Higher fees attract more serious competitors<br />
                    - This amount will be displayed to all participants
                  </div>
                )}
                
                <input
                  type="number"
                  className="form-control form-control-lg"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  style={{
                    background: "#1e293b",
                    border: `2px solid ${amount !== "" && amount < 100 ? "#ef4444" : "#334155"}`,
                    color: "#fff",
                    transition: "all 0.2s ease"
                  }}
                />
                {amount !== "" && amount < 100 && (
                  <div style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: "4px" }}>
                    Amount must be at least KES 100
                  </div>
                )}
                {amount !== "" && amount >= 100 && (
                  <div style={{ fontSize: "0.75rem", color: "#22c55e", marginTop: "4px" }}>
                    Valid amount
                  </div>
                )}
              </div>

              {/* Players */}
              <div className="mb-4">
                <label className="form-label fw-semibold" style={{ color: "#e2e8f0" }}>Number of Players / Teams</label>
                <input
                  type="number"
                  className="form-control form-control-lg"
                  style={{ background: "#1e293b", border: "1px solid #334155", color: "#fff" }}
                  value={players}
                  onChange={(e) => setPlayers(e.target.value === "" ? "" : Number(e.target.value))}
                />
                {(type === "single_elimination" || type === "double_elimination") && players && !isPowerOfTwo(Number(players)) && Number(players) > 1 && (
                  <div style={{ fontSize: "0.75rem", color: "#f59e0b", marginTop: "4px" }}>
                    For {type === "single_elimination" ? "Single" : "Double"} Elimination, player count must be a power of 2 (2, 4, 8, 16, 32, etc.)
                  </div>
                )}
                <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "4px" }}>
                  {type === "single_elimination" || type === "double_elimination" 
                    ? "Must be power of 2 (2, 4, 8, 16, 32...)" 
                    : "Any number of 2 or more"}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-5">
            <button
              onClick={handleSubmit}
              disabled={loading || !isAmountValid()}
              className="btn w-100 fw-bold btn-lg"
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                color: "#fff",
                border: "none",
                padding: "0.9rem",
                opacity: loading || !isAmountValid() ? 0.6 : 1,
                cursor: loading || !isAmountValid() ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Creating Tournament..." : "Create Tournament Registration"}
            </button>
            {!isAmountValid() && amount !== "" && (
              <div style={{ fontSize: "0.75rem", color: "#ef4444", textAlign: "center", marginTop: "8px" }}>
                Please enter a valid amount (minimum KES 100) to continue
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .form-control:focus, .form-select:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 0.2rem rgba(59, 130, 246, 0.25);
          background-color: #1e293b;
        }
        
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          opacity: 0.5;
        }
        
        @media (max-width: 768px) {
          .p-5 {
            padding: 1.5rem !important;
          }
        }
      `}</style>
    </>
  );
};

export default CreateRegistration;