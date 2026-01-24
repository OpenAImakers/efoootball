import { Link } from "react-router-dom";
import { supabase } from "../supabase";

export default function Navbar() {
  return (
    <nav style={styles.nav}>
      <div style={styles.brand}>
    <button onClick={() => supabase.auth.signOut().then(() => window.location.href = "/")}>
              Log out
            </button>
      </div>

      <div style={styles.links}>
        <Link to="/dashboard" style={styles.link}>Home</Link>
        <Link to="/teams" style={styles.link}>Teams</Link>
        <Link to="/admin" style={styles.link}>Admin</Link>

      </div>
    </nav>
  );
}

const styles = {
  nav: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    height: "60px",
    background: "#0d6efd",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
    zIndex: 1000,
  },
  brand: {
    fontWeight: "bold",
    fontSize: "18px",
  },
  links: {
    display: "flex",
    gap: "15px",
  },
  link: {
    color: "#fff",
    textDecoration: "none",
    fontWeight: "500",
  },
};
