"use client";

import { useEffect, useState } from "react";
import { supabase } from "../supabase"; // adjust path if needed
import Navbar from "../components/Navbar"; // adjust path

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);



  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          setError("Please log in to view your profile.");
          return;
        }

        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("username, display_name")
          .eq("id", user.id)
          .single();

        if (profileError) {
          console.error(profileError);
          setError("Failed to load profile.");
          return;
        }

        setProfile(data);
      } catch (err) {
        console.error(err);
        setError("Something went wrong.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return (
    <main className="mt-5">
      <Navbar />

      <div className="container py-5">
        <h1 className="mb-4">Your Profile</h1>

        {loading ? (
          <div className="text-center my-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Loading your profile...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : !profile ? (
          <div className="alert alert-info">
            No profile information found yet.
          </div>
        ) : (
          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="card-title">
                {profile.display_name || "Hello!"}
              </h2>
              <p className="card-text fs-5">
                <strong>Username:</strong>{" "}
                {profile.username ? `@${profile.username}` : "not set"}
              </p>
            </div>
          </div>
        )}

      
      </div>
    </main>
  );
}