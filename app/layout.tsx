import type { Metadata } from "next";
import { ClerkProvider } from '@clerk/nextjs';
import NavbarAuth from "./NavbarAuth";
import "./globals.css";

export const metadata: Metadata = {
  title: "VidFlow | Premium AI Video Creator",
  description: "Transform your prompts into cinematic reality with AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <div className="sparkles-bg">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <nav>
               <a href="/" className="logo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                 <img src="/logo.png?v=6" alt="VidFlow Logo" style={{ height: '49px', width: 'auto', objectFit: 'contain' }} />
               </a>
              <input type="checkbox" id="menu-toggle" style={{ display: 'none' }} />
              <label htmlFor="menu-toggle" className="nav-toggle" style={{ display: 'none', color: 'white' }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </label>
              <div className="nav-links">
                  <a href="/">Home</a>
                  <a href="/dashboard">Dashboard</a>
                  <a href="/#pricing">Pricing</a>
                  <a href="/how-it-works">How it works</a>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <NavbarAuth />
              </div>
          </nav>
          {children}
          <footer style={{ padding: "4rem 10%", borderTop: "1px solid var(--border-color)", textAlign: "center", color: "var(--text-secondary)" }}>
              <p>&copy; 2026 VidFlow. Built for the future of creativity.</p>
              <div style={{ marginTop: "1rem", display: "flex", justifyContent: "center", gap: "2rem", fontSize: "0.9rem" }}>
                <a href="/terms" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Terms and Conditions</a>
                <a href="/privacy" style={{ color: "var(--text-secondary)", textDecoration: "none" }}>Privacy Policy</a>
              </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
