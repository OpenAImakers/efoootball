// ProtectedRoute.tsx
import { useEffect, useState, ReactNode } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";
import React from "react";
import Navbar from "./Navbar";

interface ProtectedRouteProps {
  children: ReactNode | ((props: { user: any; role: string | null }) => ReactNode);
  requiredRole?: string | null;          // for now single role – we can change to array later
}

export default function ProtectedRoute({
  children,
  requiredRole = null,
}: ProtectedRouteProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const getSessionAndRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        if (mounted) navigate("/", { replace: true });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (mounted) {
        setUser(session.user);
        setRole(profile?.role || "member");
        setLoading(false);
      }
    };

    getSessionAndRole();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/", { replace: true });
      }
    });

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, [navigate]);

if (loading) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#1a1a1a",
        position: "relative",
        overflow: "hidden",
      }}
    >
  

      {/* Circular Orbit Container */}
      <div
        style={{
          position: "relative",
          width: "420px",
          height: "420px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Central Logo */}
        <img
          src="/konaminewlogo.png"
          alt="Stadium"
          style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            boxShadow: "0 0 40px rgba(255, 204, 51, 0.9)",
            zIndex: 5,
            animation: "pulseCenter 2s ease-in-out infinite",
          }}
        />

        {/* Orbiting Logos */}
        {Array.from({ length: 8 }).map((_, i) => (
          <img
            key={i}
            src="/konaminewlogo.png"
            alt={`Orbit ${i}`}
            style={{
              position: "absolute",
              width: "65px",
              height: "65px",
              borderRadius: "50%",
              boxShadow: "0 0 25px rgba(255, 204, 51, 0.6)",
              animation: `orbitRotate 12s linear infinite`,
              animationDelay: `-${i * 1.5}s`,
              transformOrigin: "210px 210px", // half of container size
            }}
          />
        ))}

        {/* Decorative Circular Lines */}
        <div
          style={{
            position: "absolute",
            width: "380px",
            height: "380px",
            border: "2px solid rgba(255, 204, 51, 0.15)",
            borderRadius: "50%",
            animation: "spinSlow 25s linear infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: "320px",
            height: "320px",
            border: "1.5px solid rgba(255, 204, 51, 0.12)",
            borderRadius: "50%",
            animation: "spinSlow 18s linear infinite reverse",
          }}
        />
      </div>

      {/* Animations */}
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        @keyframes pulseCenter {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 0 40px rgba(255, 204, 51, 0.9);
          }
          50% {
            transform: scale(1.08);
            box-shadow: 0 0 70px rgba(255, 204, 51, 1);
          }
        }

        @keyframes orbitRotate {
          from { transform: rotate(0deg) translateX(170px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(170px) rotate(-360deg); }
        }

        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

  // Access check
  if (requiredRole && role !== requiredRole) {
    return (
      <>
        <Navbar />
        <div style={{ padding: "40px", textAlign: "center", marginTop: "40px" }}>
          <h2>Access Denied</h2>
          <p>This area requires the <strong>{requiredRole}</strong> role.</p>
        </div>
      </>
    );
  }

  // ────────────────────────────────────────────────
  // Render children – supports both normal JSX and render prop
  // ────────────────────────────────────────────────
  if (typeof children === "function") {
    return <>{children({ user, role })}</>;
  }

  // Normal case: clone element and pass user/role props
  return (
    <>
      {React.cloneElement(children as React.ReactElement<any>, { user, role })}
    </>
  );
}