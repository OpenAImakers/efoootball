// ProtectedRoute.tsx
import { useEffect, useState, ReactNode } from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";
import React from "react";
import Navbar from "./Navbar";

interface ProtectedRouteProps {
  children: ReactNode | ((props: { user: any; role: string | null }) => ReactNode);
  requiredRole?: string | string[] | null;   // Supports single role or multiple roles
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
        setRole(profile?.role || null);
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
        }}
      >
        {/* Animated Verifying Text */}
        <p
          style={{
            fontSize: "24px",
            fontWeight: "bold",
            color: "#ff9900",
            marginBottom: "40px",
            animation: "bounce 1.5s infinite",
          }}
        >
          Verifying access...
        </p>

        {/* Stadium Image */}
        <img
          src="/stadium.png"
          alt="Stadium"
          style={{
            width: "60%",
            maxWidth: "700px",
            borderRadius: "15px",
            boxShadow: "0 0 40px rgba(255, 204, 51, 0.8)",
            animation: "riseGlow 3s ease-in-out infinite alternate",
          }}
        />

        {/* Animations */}
        <style>{`
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }

          @keyframes riseGlow {
            0% {
              transform: translateY(0) scale(1);
              box-shadow: 0 0 20px rgba(255, 204, 51, 0.5);
            }
            50% {
              transform: translateY(-30px) scale(1.05);
              box-shadow: 0 0 60px rgba(255, 204, 51, 1);
            }
            100% {
              transform: translateY(0) scale(1);
              box-shadow: 0 0 20px rgba(255, 204, 51, 0.5);
            }
          }
        `}</style>
      </div>
    );
  }

  // Role check
  const hasAccess = () => {
    if (!requiredRole) return true;
    if (typeof requiredRole === "string") {
      return role === requiredRole;
    }
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(role || "");
    }
    return false;
  };

if (!hasAccess()) {
  return (
    <>
      <Navbar />
      <div style={{ padding: "40px", textAlign: "center", marginTop: "40px" }}>
        <h2>Access Denied</h2>
        <p>This area requires the <strong>admin</strong> role.</p>
        <p>Your current role: <strong>{role || "None"}</strong></p>
        
        <div style={{ marginTop: "30px" }}>
          <p style={{ marginBottom: "20px", fontSize: "18px" }}>
            Here are some places you can go instead:
          </p>
          
          <div style={{ padding: "40px", textAlign: "center", marginTop: "40px" }}>
  <h2>Access Denied</h2>
  <p>This area requires the <strong>FEI Clan Admin</strong> role.</p>
  
  <div style={{ marginTop: "30px" }}>
    <p style={{ marginBottom: "20px", fontSize: "18px" }}>
      Here are some places you can go instead:
    </p>
    
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "300px", margin: "0 auto" }}>
      <a
        href="/dashboard"
        style={{
          padding: "12px 24px",
          backgroundColor: "#ff9900",
          color: "black",
          textDecoration: "none",
          borderRadius: "8px",
          fontWeight: "bold",
        }}
      >
        View Tournaments
      </a>
      
      <a
        href="/teams"
        style={{
          padding: "12px 24px",
          backgroundColor: "#ff9900",
          color: "black",
          textDecoration: "none",
          borderRadius: "8px",
          fontWeight: "bold",
        }}
      >
        Go to Fixtures
      </a>
      
      <a
        href="/account"
        style={{
          padding: "12px 24px",
          backgroundColor: "#ff9900",
          color: "black",
          textDecoration: "none",
          borderRadius: "8px",
          fontWeight: "bold",
        }}
      >
        Update Profile
      </a>
    </div>
  </div>
</div>
        </div>
      </div>
    </>
  );
}

  // Render children
  if (typeof children === "function") {
    return <>{children({ user, role })}</>;
  }

  return (
    <>
      {React.cloneElement(children as React.ReactElement<any>, { user, role })}
    </>
  );
}