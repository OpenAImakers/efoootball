import React, { useState } from "react";
import Posts from "./WelcomeTabViews/Posts";
import AddPosts from "./WelcomeTabViews/AddPosts";

interface WelcomeTabProps {
  profile: {
    username: string | null;
    display_name: string | null;
    profile_pic: string | null;
  } | null;
}

export default function WelcomeTab({ profile }: WelcomeTabProps) {
  const [activeTab, setActiveTab] = useState<"posts" | "add">("posts");
  const [ ,setRefreshKey] = useState(0);

  const handlePostAdded = () => {
    // Switch to posts tab and refresh the list
    setActiveTab("posts");
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="d-flex flex-grow-1 flex-column">
      {/* Header */}
      <div>
        <h4 className="fw-bold text-primary mb-2">
          Welcome, {profile?.display_name || profile?.username || "Player"}!
        </h4>

        <p className="text-muted mb-3">
          Share updates, connect with players, and stay active in the community.
        </p>

        {/* Tabs */}
        <div className="card shadow-sm border-0 mb-3">
          <div className="card-body p-2">
            <div className="d-flex gap-2">
              <button
                className={`btn flex-fill ${
                  activeTab === "posts" ? "btn-primary" : "btn-outline-primary"
                }`}
                onClick={() => setActiveTab("posts")}
              >
                <i className="bi bi-journal-text me-2"></i>
                Posts
              </button>

              <button
                className={`btn flex-fill ${
                  activeTab === "add" ? "btn-primary" : "btn-outline-primary"
                }`}
                onClick={() => setActiveTab("add")}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Add Post
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Switch */}
      <div className="flex-grow-1 overflow-auto">
        {activeTab === "posts" && <Posts  />}
        {activeTab === "add" && <AddPosts onPostAdded={handlePostAdded} />}
      </div>
    </div>
  );
}