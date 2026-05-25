"use client";
import { useState, useEffect } from 'react';

// Smart Credit System - profitable at every tier
const VIDEO_OPTIONS = [
  { seconds: 5,  credits: 3,  label: "5 Seconds  — 3 Credits" },
  { seconds: 10, credits: 5,  label: "10 Seconds — 5 Credits" },
  { seconds: 15, credits: 8,  label: "15 Seconds — 8 Credits" },
  { seconds: 20, credits: 11, label: "20 Seconds — 11 Credits" },
  { seconds: 30, credits: 16, label: "30 Seconds — 16 Credits" },
  { seconds: 45, credits: 22, label: "45 Seconds — 22 Credits" },
  { seconds: 59, credits: 28, label: "59 Seconds — 28 Credits" },
];

export default function Dashboard() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [selectedOption, setSelectedOption] = useState(VIDEO_OPTIONS[0]);
  const [credits, setCredits] = useState(15); // Default free credits

  // Fetch actual credits from database on mount
  useEffect(() => {
    async function fetchCredits() {
      try {
        const res = await fetch('/api/user');
        if (res.ok) {
          const data = await res.json();
          setCredits(data.credits);
        }
      } catch (e) {
        console.error('Error fetching credits:', e);
      }
    }
    fetchCredits();
  }, []);

  const handleGenerate = async () => {
    if (credits < selectedOption.credits) {
      alert(`You need ${selectedOption.credits} credits for a ${selectedOption.seconds}s video. You only have ${credits} credits left. Please upgrade your plan!`);
      return;
    }

    setIsGenerating(true);
    // Optimistic local update
    setCredits(prev => prev - selectedOption.credits);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, duration: selectedOption.seconds }),
      });
      const data = await res.json();
      if (data.videoUrl) {
        setVideoUrl(data.videoUrl);
      } else {
        // Fallback demo video
        setVideoUrl("https://media.w3.org/2010/05/sintel/trailer.mp4");
      }

      // Re-fetch user details to make sure database credits are in sync
      const userRes = await fetch('/api/user');
      if (userRes.ok) {
        const userData = await userRes.json();
        setCredits(userData.credits);
      }
    } catch (e) {
      setVideoUrl("https://media.w3.org/2010/05/sintel/trailer.mp4");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div style={{ flex: 1, marginTop: "4rem" }}>
          <p style={{ color: "var(--text-secondary)", textTransform: "uppercase", fontSize: "0.7rem", marginBottom: "1rem" }}>History</p>
          <div className="sidebar-item" style={{ marginBottom: "1rem", height: "40px", background: "rgba(255,255,255,0.05)", padding: "10px", borderRadius: "8px", color: "var(--text-secondary)", fontSize: "0.8rem", display: "flex", alignItems: "center" }}>Cyberpunk City...</div>
        </div>

        {/* Credit Info */}
        <div style={{ marginBottom: "1rem" }}>
          <div className="credit-badge" style={{ marginBottom: "0.5rem" }}>
            ⚡ {credits} Credits Left
          </div>
          <div style={{ color: "var(--text-secondary)", fontSize: "0.72rem", textAlign: "center" }}>
            Next video: {selectedOption.credits} credits ({selectedOption.seconds}s)
          </div>
        </div>
        <a href="/#pricing" style={{ marginTop: "0.5rem", textDecoration: "none", textAlign: "center", fontSize: "0.8rem", display: "block", padding: "0.5rem", borderRadius: "8px", background: "rgba(99,102,241,0.15)", color: "var(--accent-2)", border: "1px solid var(--accent-1)" }}>
          🔋 Buy More Credits
        </a>
      </aside>

      {/* Main Panel */}
      <main className="main-content">
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
          <h2>Create <span style={{ color: "var(--accent-1)" }}>Video</span></h2>
          <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
            🎬 AI Model: Wan 2.1 (High Quality)
          </div>
        </header>

        <div className="prompt-area">
          <textarea
            placeholder="Describe the video you want to generate in detail... e.g. 'A cinematic shot of a futuristic city at sunset with flying cars'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          ></textarea>

          {/* Video Length Selector */}
          <div style={{ marginTop: "1.25rem", display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ color: "var(--text-secondary)", fontSize: "0.9rem", whiteSpace: "nowrap" }}>⏱ Video Length:</label>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {VIDEO_OPTIONS.map((opt) => (
                <button
                  key={opt.seconds}
                  onClick={() => setSelectedOption(opt)}
                  style={{
                    padding: "0.4rem 0.75rem",
                    borderRadius: "8px",
                    border: selectedOption.seconds === opt.seconds
                      ? "1px solid var(--accent-1)"
                      : "1px solid var(--border-color)",
                    background: selectedOption.seconds === opt.seconds
                      ? "rgba(99,102,241,0.2)"
                      : "transparent",
                    color: selectedOption.seconds === opt.seconds ? "white" : "var(--text-secondary)",
                    cursor: "pointer",
                    fontSize: "0.8rem",
                    transition: "all 0.2s",
                  }}
                >
                  {opt.seconds}s
                </button>
              ))}
            </div>
            <span style={{ color: "var(--accent-2)", fontSize: "0.85rem", fontWeight: 600 }}>
              = {selectedOption.credits} Credits
            </span>
          </div>

          <div className="controls">
            <div style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>
              {credits >= selectedOption.credits
                ? `✅ You have enough credits`
                : `❌ Need ${selectedOption.credits - credits} more credits`}
            </div>
            <button
              className="btn-primary"
              onClick={handleGenerate}
              disabled={isGenerating || prompt.trim() === "" || credits < selectedOption.credits}
              style={{ opacity: (isGenerating || prompt.trim() === "" || credits < selectedOption.credits) ? 0.5 : 1 }}
            >
              {isGenerating ? "⏳ Generating..." : `Generate ${selectedOption.seconds}s Video (${selectedOption.credits} Credits)`}
            </button>
          </div>
        </div>

        <div className="video-player-container">
          {isGenerating ? (
            <div style={{ textAlign: "center" }}>
              <span className="loader"></span>
              <p style={{ marginTop: "1rem", color: "var(--text-secondary)" }}>
                AI is crafting your {selectedOption.seconds}s video...
              </p>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginTop: "0.5rem" }}>
                This may take 30-90 seconds
              </p>
            </div>
          ) : videoUrl ? (
            <video controls width="100%" style={{ borderRadius: "12px", height: "100%", width: "100%", objectFit: "cover" }} autoPlay>
              <source src={videoUrl} type="video/mp4" />
            </video>
          ) : (
            <div style={{ textAlign: "center", color: "var(--text-secondary)" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎬</div>
              <p>Your masterpiece will appear here.</p>
              <p style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>Select a duration and enter your prompt above</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
