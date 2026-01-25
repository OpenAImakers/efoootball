import { useEffect, useState} from "react";
import { supabase } from "../supabase";
import { useNavigate } from "react-router-dom";
import React from "react";

export default function ProtectedRoute({ children, requiredRole = null }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    let mounted = true;

    const getSessionAndRole = async () => {
      // 1. Get Session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        if (mounted) navigate("/", { replace: true });
        return;
      }

      // 2. Get Role (Optional enhancement)
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
      listener.subscription.unsubscribe();
    };
  }, [navigate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px' }}>
        <p>Verifying access...</p>
      </div>
    );
  }

  // If a specific role is required (e.g., 'admin')
  if (requiredRole && role !== requiredRole) {
    return <p style={{ padding: 40 }}>Access Denied: You do not have permissions.</p>;
  }

  // Render children and inject user/role context
  return React.cloneElement(children, { user, role });
}