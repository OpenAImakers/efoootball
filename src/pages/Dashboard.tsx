import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase";
import Navbar from "../components/Navbar";
import Matches from "./Matches";  

function Home() {
  const [user, setUser] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [loading, setLoading] = useState(true);

  // Mention / tagging state
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [cursorPosition, setCursorPosition] = useState(0);

  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);

  // Fetch initial data
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      await fetchComments();
      setLoading(false);
    };
    init();
  }, []);

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("comments")
      .select(`
        id,
        content,
        created_at,
        profiles (
          username,
          display_name
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching:", error.message);
    } else {
      setComments(data || []);
    }
  };

  // Search users for @mention when typing after @
  const searchUsers = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 1) {
      setMentionSuggestions([]);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("username, display_name")
      .ilike("username", `%${searchTerm}%`)
      .limit(6);

    if (!error && data) {
      setMentionSuggestions(data);
    }
  };

  // Handle textarea change + detect @mention trigger
  const handleCommentChange = (e) => {
    const value = e.target.value;
    setCommentText(value);

    const pos = e.target.selectionStart;
    setCursorPosition(pos);

    const textBeforeCursor = value.substring(0, pos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const searchText = textBeforeCursor.substring(lastAtIndex + 1);
      // Only trigger if we're right after @ or @ + letters
      if (!searchText.includes(" ") && !searchText.includes("\n")) {
        setMentionSearch(searchText);
        setShowMentionDropdown(true);
        searchUsers(searchText);
        return;
      }
    }

    setShowMentionDropdown(false);
    setMentionSuggestions([]);
  };

  // Insert selected @username into textarea
  const handleSelectMention = (username) => {
    const before = commentText.substring(0, cursorPosition - mentionSearch.length - 1); // -1 for the @
    const after = commentText.substring(cursorPosition);

    const newText = `${before}@${username} ${after}`;
    setCommentText(newText);

    // Move cursor after the inserted mention
    const newPos = before.length + username.length + 2; // +1 for @ +1 for space
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);

    setShowMentionDropdown(false);
    setMentionSuggestions([]);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowMentionDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const postComment = async (e) => {
    e.preventDefault();
    if (!user || !commentText.trim()) return;

    const { error } = await supabase
      .from("comments")
      .insert({
        user_id: user.id,
        content: commentText.trim(),
      });

    if (error) {
      alert(error.message);
    } else {
      setCommentText("");
      setShowMentionDropdown(false);
      fetchComments();
    }
  };

  if (loading) return <p>Loading e-football portal...</p>;

  return (
    <>
      <Navbar />
      <div className="mt-5" style={{ padding: "20px", fontFamily: "sans-serif" }}>
        <h1>e football</h1>
        <hr />
        <Matches />



        {/* Post Comment Section with @mentions */}
        {user ? (
          <form onSubmit={postComment} style={{ marginBottom: "20px", position: "relative" }}>
            <div style={{ position: "relative" }}>
              <textarea
                ref={textareaRef}
                style={{
                  width: "100%",
                  height: "80px",
                  display: "block",
                  marginBottom: "10px",
                  padding: "8px",
                  resize: "vertical",
                }}
                placeholder="Add a comment... Use @ to mention someone"
                value={commentText}
                onChange={handleCommentChange}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setShowMentionDropdown(false);
                }}
              />

              {/* Mention Dropdown */}
              {showMentionDropdown && mentionSuggestions.length > 0 && (
                <ul
                  ref={dropdownRef}
                  style={{
                    position: "absolute",
                    bottom: "100%",
                    left: 0,
                    width: "100%",
                    maxHeight: "200px",
                    overflowY: "auto",
                    background: "white",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    listStyle: "none",
                    margin: 0,
                    padding: 0,
                    zIndex: 10,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}
                >
                  {mentionSuggestions.map((profile) => (
                    <li
                      key={profile.username}
                      onClick={() => handleSelectMention(profile.username)}
                      style={{
                        padding: "8px 12px",
                        cursor: "pointer",
                        borderBottom: "1px solid #eee",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f0f0")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                    >
                      <strong>@{profile.username}</strong>
                      {profile.display_name && (
                        <span style={{ color: "#666", marginLeft: "8px" }}>
                          {profile.display_name}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="submit"
              style={{
                padding: "8px 16px",
                cursor: "pointer",
                background: "#0070f3",
                color: "white",
                border: "none",
                borderRadius: "4px",
              }}
            >
              Post Comment
            </button>
          </form>
        ) : (
          <p><i>Please log in to post comments.</i></p>
        )}

        {/* Display Comments */}
        <div className="comments-list">
          <h3>Community Feed</h3>
          {comments.length === 0 && <p>No comments yet. Be the first!</p>}
          {comments.map((c) => (
            <div
              key={c.id}
              style={{
                borderBottom: "1px solid #eee",
                padding: "12px 0",
                lineHeight: "1.5",
              }}
            >
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <strong>{c.profiles?.display_name || "Unknown User"}</strong>
                <span style={{ color: "#666", fontSize: "0.9rem" }}>
                  @{c.profiles?.username || "user"}
                </span>
                <span style={{ color: "#aaa", fontSize: "0.8rem" }}>
                  • {new Date(c.created_at).toLocaleString()}
                </span>
              </div>
              <p style={{ margin: "6px 0 0", whiteSpace: "pre-wrap" }}>
                {c.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default Home;