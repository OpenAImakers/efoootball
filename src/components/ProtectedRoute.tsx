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
      <div style={{ display: "flex", justifyContent: "center", marginTop: "100px" }}>
        <p>Verifying access...</p>
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