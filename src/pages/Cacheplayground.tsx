"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";

const CACHE_KEY = "hello_world_cache";
const REFRESH_INTERVAL = 10 * 1000; // 10 seconds for learning

export default function CachePlayground() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [cacheStatus, setCacheStatus] = useState("No cache yet");
  const refreshTimer = useRef(null);

  // Simulate API call
  const simulateAPICall = async () => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Random data to show when data changes
    const randomNumber = Math.floor(Math.random() * 1000);
    const timestamp = new Date().toLocaleTimeString();
    
    return { 
      message: `Hello World! (Random: ${randomNumber})`,
      timestamp: timestamp,
      randomValue: randomNumber
    };
  };

  // Load from cache
  const loadFromCache = () => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      setData(parsed.data);
      setLastUpdated(parsed.timestamp);
      setCacheStatus(`✅ Loaded from cache (cached at: ${new Date(parsed.timestamp).toLocaleTimeString()})`);
      console.log("📦 Loaded from cache:", parsed);
      return true;
    }
    setCacheStatus("❌ No cache found");
    return false;
  };

  // Save to cache
  const saveToCache = (newData) => {
    const cacheObject = {
      data: newData,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheObject));
    setCacheStatus(`💾 Saved to cache at ${new Date().toLocaleTimeString()}`);
    console.log("💾 Saved to cache:", cacheObject);
  };

  // Fetch fresh data
  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    
    try {
      console.log("🌐 Fetching fresh data...");
      const freshData = await simulateAPICall();
      
      setData(freshData);
      setLastUpdated(Date.now());
      saveToCache(freshData);
      
      console.log("🌐 Fresh data received:", freshData);
    } catch (err) {
      console.error("Fetch error:", err);
      setCacheStatus("❌ Error fetching data");
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  // Clear cache
  const clearCache = () => {
    localStorage.removeItem(CACHE_KEY);
    setData(null);
    setLastUpdated(null);
    setCacheStatus("🗑️ Cache cleared");
    console.log("🗑️ Cache cleared");
  };

  // Check cache age
  const checkCacheAge = () => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      const ageInSeconds = (Date.now() - parsed.timestamp) / 1000;
      setCacheStatus(`📊 Cache age: ${ageInSeconds.toFixed(1)} seconds`);
    } else {
      setCacheStatus("❌ No cache to check");
    }
  };

  // Initial load: try cache first, then fetch
  useEffect(() => {
    
    // Always fetch fresh data in background
    fetchData(true);
    
    // Set up auto-refresh
    refreshTimer.current = setInterval(() => {
      console.log("🔄 Auto-refresh triggered");
      fetchData(true);
    }, REFRESH_INTERVAL);
    
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, [fetchData]);

  return (
    <div style={{ padding: "20px", fontFamily: "monospace", maxWidth: "800px", margin: "0 auto" }}>
      <h1>🗄️ Cache Playground</h1>
      <p>Study how caching works with localStorage</p>
      
      {/* Control Panel */}
      <div style={{ 
        background: "#f0f0f0", 
        padding: "15px", 
        borderRadius: "8px",
        marginBottom: "20px"
      }}>
        <h3>Controls</h3>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button 
            onClick={() => fetchData(false)}
            style={{ padding: "8px 16px", cursor: "pointer" }}
          >
            🔄 Force Refresh
          </button>
          <button 
            onClick={loadFromCache}
            style={{ padding: "8px 16px", cursor: "pointer" }}
          >
            📦 Load from Cache
          </button>
          <button 
            onClick={clearCache}
            style={{ padding: "8px 16px", cursor: "pointer", background: "#ff4444", color: "white" }}
          >
            🗑️ Clear Cache
          </button>
          <button 
            onClick={checkCacheAge}
            style={{ padding: "8px 16px", cursor: "pointer" }}
          >
            📊 Check Cache Age
          </button>
        </div>
      </div>

      {/* Cache Status */}
      <div style={{ 
        background: "#e3f2fd", 
        padding: "15px", 
        borderRadius: "8px",
        marginBottom: "20px",
        borderLeft: "4px solid #2196f3"
      }}>
        <strong>Cache Status:</strong> {cacheStatus}
        <br />
        <strong>Auto-refresh interval:</strong> {REFRESH_INTERVAL / 1000} seconds
        <br />
        <strong>Cache Key:</strong> {CACHE_KEY}
      </div>

      {/* Data Display */}
      <div style={{ 
        background: "#fff", 
        padding: "20px", 
        borderRadius: "8px",
        border: "2px solid #ddd",
        marginBottom: "20px"
      }}>
        <h3>📊 Current Data</h3>
        {loading ? (
          <div>Loading...</div>
        ) : data ? (
          <div>
            <div style={{ fontSize: "24px", marginBottom: "10px" }}>
              {data.message}
            </div>
            <div style={{ color: "#666" }}>
              <div>🕐 Fetched at: {data.timestamp}</div>
              <div>🔢 Random value: {data.randomValue}</div>
              {lastUpdated && (
                <div>💾 Cached at: {new Date(lastUpdated).toLocaleTimeString()}</div>
              )}
            </div>
          </div>
        ) : (
          <div>No data yet. Click "Force Refresh" to load.</div>
        )}
      </div>

      {/* Raw Cache Display */}
      <details style={{ marginTop: "20px" }}>
        <summary style={{ cursor: "pointer", fontWeight: "bold" }}>
          🔍 View Raw Cache Data
        </summary>
        <pre style={{ 
          background: "#f5f5f5", 
          padding: "10px", 
          borderRadius: "4px",
          overflow: "auto",
          marginTop: "10px"
        }}>
          {localStorage.getItem(CACHE_KEY) || "No cache data"}
        </pre>
      </details>

      {/* Explanation Section */}
      <div style={{ 
        marginTop: "30px", 
        padding: "15px", 
        background: "#fff3e0", 
        borderRadius: "8px",
        borderLeft: "4px solid #ff9800"
      }}>
        <h3>📚 How This Cache Works:</h3>
        <ol>
          <li><strong>Initial Load:</strong> Tries to load from cache first (instant display)</li>
          <li><strong>Background Refresh:</strong> Always fetches fresh data in background</li>
          <li><strong>Auto-Refresh:</strong> Fetches new data every {REFRESH_INTERVAL / 1000} seconds</li>
          <li><strong>Cache Storage:</strong> Uses localStorage with key "{CACHE_KEY}"</li>
          <li><strong>Cache Contains:</strong> The data + timestamp when it was cached</li>
        </ol>
        <p style={{ marginTop: "10px", fontSize: "14px" }}>
          💡 <strong>Try this:</strong> Refresh the page - you'll see cached data instantly, 
          then the auto-refresh will update it. Check the console (F12) to see the logs!
        </p>
      </div>

      {/* Console Logger */}
      <div style={{ 
        marginTop: "20px", 
        padding: "10px", 
        background: "#263238", 
        color: "#fff",
        borderRadius: "4px",
        fontSize: "12px"
      }}>
        📡 Open browser console (F12) to see detailed logs:
        <br />
        • "📦 Loaded from cache" - when data comes from localStorage
        <br />
        • "🌐 Fetching fresh data..." - when API is called
        • "💾 Saved to cache" - when data is stored
        • "🔄 Auto-refresh triggered" - every {REFRESH_INTERVAL / 1000} seconds
      </div>
    </div>
  );
}