"use client";
import { useState } from "react";

function PricingButton({ plan, label, className }: { plan: string; label: string; className: string }) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Something went wrong');
      }
    } catch (e) {
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleCheckout} className={className} disabled={loading}
      style={{ opacity: loading ? 0.6 : 1, cursor: loading ? 'wait' : 'pointer', width: '100%' }}>
      {loading ? 'Redirecting...' : label}
    </button>
  );
}

export default function Home() {
  return (
    <main>
      <header className="hero">
        <h1>Transform Your Prompts into <span>Cinematic Reality</span></h1>
        <p>The next generation of AI video creation. High quality, fast, and simple. Stop dreaming, start generating.</p>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
          <a href="/dashboard" className="btn-primary">Create Video Now</a>
          <a href="#pricing" className="btn-outline">View Plans</a>
        </div>

        {/* Dashboard Preview Mockup */}
        <div className="dashboard-preview" id="dashboard">
          <div className="preview-top">
            <div className="dot"></div><div className="dot"></div><div className="dot"></div>
          </div>
          <div className="preview-body">
            <div className="preview-sidebar">
              <div className="sidebar-item" style={{ width: "100%", height: "20px", background: "var(--accent-1)", opacity: 0.2 }}></div>
              <div className="sidebar-item" style={{ width: "80%" }}></div>
              <div className="sidebar-item" style={{ width: "90%" }}></div>
              <div className="sidebar-item" style={{ width: "70%" }}></div>
              <div style={{ marginTop: "auto" }} className="sidebar-item"></div>
            </div>
            <div className="preview-main">
              <div className="input-mock">
                &quot;A cinematic shot of a futuristic city in Mars with flying vehicles, neon lighting, 8k resolution...&quot;
              </div>
              <div className="video-mock"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Credit Rate Table */}
      <section style={{ padding: "4rem 5%", textAlign: "center", borderTop: "1px solid var(--border-color)" }}>
        <h2 className="section-title" style={{ marginBottom: "2rem" }}>Simple <span style={{ color: "var(--accent-1)" }}>Credit Rates</span></h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "2.5rem", fontSize: "1rem" }}>
          Choose any duration — pay only for what you generate
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", justifyContent: "center", maxWidth: "800px", margin: "0 auto" }}>
          {[
            { s: "5s",  c: 3  },
            { s: "10s", c: 5  },
            { s: "15s", c: 7  },
            { s: "20s", c: 9  },
            { s: "25s", c: 11 },
            { s: "30s", c: 13 },
          ].map((item) => (
            <div key={item.s} style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              padding: "1rem 1.5rem",
              minWidth: "100px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "white" }}>{item.s}</div>
              <div style={{ color: "var(--accent-2)", fontWeight: 600, fontSize: "0.9rem", marginTop: "0.25rem" }}>{item.c} Credits</div>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="pricing">
        <h2 className="section-title">Transparent <span style={{ color: "var(--accent-1)" }}>Pricing</span></h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "3rem", fontSize: "1.1rem" }}>
          Get credits, generate videos — no hidden fees
        </p>
        <div className="pricing-grid">

          {/* Starter Plan */}
          <div className="price-card">
            <h3>Starter Pack</h3>
            <div className="price-value">$4<span>.99</span></div>
            <div className="credits-count">50 Credits (One-Time)</div>
            <ul className="features-list">
              <li>Up to 16 videos (5s each)</li>
              <li>Max 20s per video</li>
              <li>720p Resolution</li>
              <li>Standard Speed</li>
              <li>Email Support</li>
            </ul>
            <PricingButton plan="starter" label="Buy Starter Pack" className="btn-outline" />
          </div>

          {/* Pro Plan */}
          <div className="price-card popular">
            <div className="popular-tag">Best Value</div>
            <h3>Pro Pack</h3>
            <div className="price-value">$14<span>.99</span></div>
            <div className="credits-count">150 Credits (One-Time)</div>
            <ul className="features-list">
              <li>Up to 50 videos (5s each)</li>
              <li>Max 30s per video</li>
              <li>1080p Crystal Clear</li>
              <li>Priority Generation</li>
              <li>Commercial Rights</li>
            </ul>
            <PricingButton plan="pro" label="Buy Pro Pack" className="btn-primary" />
          </div>

          {/* Elite Plan */}
          <div className="price-card">
            <h3>Elite Pack</h3>
            <div className="price-value">$29<span>.99</span></div>
            <div className="credits-count">350 Credits (One-Time)</div>
            <ul className="features-list">
              <li>Up to 116 videos (5s each)</li>
              <li>Max 30s per video</li>
              <li>4K AI Upscaling</li>
              <li>Instant Generation</li>
              <li>Dedicated Support</li>
            </ul>
            <PricingButton plan="elite" label="Buy Elite Pack" className="btn-outline" />
          </div>

        </div>
      </section>
    </main>
  );
}
