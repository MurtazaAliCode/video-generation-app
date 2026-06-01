"use client";
import { useState, useEffect, useRef } from 'react';

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

  // AI Assistant States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'assistant',
      content: 'Welcome to VidFlow! I am your AI Guide. 🌟\n\nAsk me anything about creating beautiful AI videos, crafting prompts, or our credit plans. I can answer in English, Urdu, or Roman Urdu!'
    }
  ]);
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isAssistantTyping]);

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

  const handleSendChatMessage = async (textToSend?: string) => {
    const messageContent = textToSend || chatInput;
    if (!messageContent.trim()) return;

    // Add user message
    const updatedMessages = [...chatMessages, { sender: 'user', content: messageContent }];
    setChatMessages(updatedMessages);
    if (!textToSend) setChatInput("");
    setIsAssistantTyping(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, { sender: 'assistant', content: data.reply }]);
      } else {
        throw new Error('Failed response');
      }
    } catch (e) {
      setChatMessages(prev => [...prev, { 
        sender: 'assistant', 
        content: 'Kuch technical error aya hai response lane me. Please dobara koshish karein!' 
      }]);
    } finally {
      setIsAssistantTyping(false);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sleek Custom Style overrides */}
      <style>{`
        /* Hide global footer when dashboard is active */
        .dashboard-container ~ footer {
          display: none !important;
        }

        /* Disable body scroll when dashboard is active to prevent double scrollbars */
        body:has(.dashboard-container) {
          overflow: hidden !important;
        }

        /* Floating Chat Button */
        .chat-bubble {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-1), var(--accent-2));
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
          z-index: 1000;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          animation: chat-pulse 2.5s infinite;
        }
        .chat-bubble:hover {
          transform: scale(1.1) rotate(5deg);
          box-shadow: 0 12px 32px rgba(99, 102, 241, 0.6);
        }
        @keyframes chat-pulse {
          0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.5); }
          70% { box-shadow: 0 0 0 15px rgba(99, 102, 241, 0); }
          100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
        }

        /* Glassmorphic Chat Drawer */
        .chat-drawer {
          position: fixed;
          top: 0;
          right: 0;
          width: 400px;
          max-width: 90%;
          height: 100%;
          background: rgba(13, 15, 30, 0.75);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-left: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: -10px 0 40px rgba(0, 0, 0, 0.5);
          z-index: 1001;
          display: flex;
          flex-direction: column;
          transform: translateX(100%);
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .chat-drawer.open {
          transform: translateX(0);
        }
        .chat-header {
          padding: 1.25rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255, 255, 255, 0.02);
        }
        .chat-header h3 {
          margin: 0;
          font-size: 1.1rem;
          color: white;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .active-dot {
          width: 8px;
          height: 8px;
          background-color: #10B981;
          border-radius: 50%;
          box-shadow: 0 0 8px #10B981;
        }
        .close-chat {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 1.25rem;
          cursor: pointer;
          transition: color 0.2s;
        }
        .close-chat:hover {
          color: white;
        }

        /* Message Scroll Area */
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .chat-messages::-webkit-scrollbar {
          width: 5px;
        }
        .chat-messages::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        .message-bubble {
          max-width: 85%;
          padding: 0.85rem 1.1rem;
          border-radius: 16px;
          font-size: 0.88rem;
          line-height: 1.45;
          word-break: break-word;
          white-space: pre-line;
        }
        .message-bubble.assistant {
          align-self: flex-start;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: #E2E8F0;
          border-bottom-left-radius: 4px;
        }
        .message-bubble.user {
          align-self: flex-end;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2));
          border: 1px solid rgba(99, 102, 241, 0.3);
          color: white;
          border-bottom-right-radius: 4px;
        }

        /* Chat Quick Action Suggestions */
        .suggestions-container {
          display: flex;
          gap: 0.5rem;
          overflow-x: auto;
          padding: 0.5rem 1.25rem;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
        .suggestions-container::-webkit-scrollbar {
          display: none;
        }
        .suggestion-chip {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          padding: 0.4rem 0.8rem;
          font-size: 0.78rem;
          color: var(--text-secondary);
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.2s;
        }
        .suggestion-chip:hover {
          background: rgba(99, 102, 241, 0.15);
          border-color: rgba(99, 102, 241, 0.4);
          color: white;
        }

        /* Input Form */
        .chat-footer {
          padding: 1rem 1.25rem;
          background: rgba(0, 0, 0, 0.2);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }
        .chat-input {
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 0.75rem 1rem;
          color: white;
          font-size: 0.88rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .chat-input:focus {
          border-color: var(--accent-1);
        }
        .send-chat-btn {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--accent-1), var(--accent-2));
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          transition: opacity 0.2s;
        }
        .send-chat-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Typing Dots Animation */
        .typing-dots {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 0.25rem 0.5rem;
        }
        .typing-dot {
          width: 6px;
          height: 6px;
          background: #A0AEC0;
          border-radius: 50%;
          animation: typing-dot 1.4s infinite;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing-dot {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>

      {/* Floating Chat Trigger */}
      <div 
        className="chat-bubble" 
        onClick={() => setIsChatOpen(!isChatOpen)}
        title="Open VidFlow Assistant"
      >
        💬
      </div>

      {/* Slide-over Assistant Drawer */}
      <div className={`chat-drawer ${isChatOpen ? 'open' : ''}`}>
        <div className="chat-header">
          <h3>
            <span className="active-dot"></span>
            VidFlow AI Guide
          </h3>
          <button className="close-chat" onClick={() => setIsChatOpen(false)}>✕</button>
        </div>

        <div className="chat-messages">
          {chatMessages.map((msg, index) => (
            <div key={index} className={`message-bubble ${msg.sender}`}>
              {msg.content}
            </div>
          ))}
          {isAssistantTyping && (
            <div className="message-bubble assistant">
              <div className="typing-dots">
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
                <span className="typing-dot"></span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Suggestion Chips to engage user easily */}
        <div className="suggestions-container">
          <button 
            className="suggestion-chip"
            onClick={() => handleSendChatMessage("Give me a great prompt example for Wan 2.1")}
          >
            💡 Prompt Idea
          </button>
          <button 
            className="suggestion-chip"
            onClick={() => handleSendChatMessage("Kya main Urdu/Roman Urdu me prompt de sakta hoon?")}
          >
            🇵🇰 Urdu Guide
          </button>
          <button 
            className="suggestion-chip"
            onClick={() => handleSendChatMessage("What are the credit rates and upgrade plans?")}
          >
            🔋 Credits & Price
          </button>
        </div>

        <div className="chat-footer">
          <input
            type="text"
            className="chat-input"
            placeholder="Type your question..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
          />
          <button 
            className="send-chat-btn" 
            onClick={() => handleSendChatMessage()}
            disabled={!chatInput.trim() || isAssistantTyping}
          >
            🚀
          </button>
        </div>
      </div>

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
