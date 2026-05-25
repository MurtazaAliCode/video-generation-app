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
              <a href="/" className="logo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-1px' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 12V6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V12Z" fill="url(#paint0_linear)" fillOpacity="0.1" stroke="url(#paint1_linear)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9.5 9.5L15.5 12L9.5 14.5V9.5Z" fill="url(#paint2_linear)" />
                  <defs>
                    <linearGradient id="paint0_linear" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#6366F1"/>
                      <stop offset="1" stopColor="#8B5CF6"/>
                    </linearGradient>
                    <linearGradient id="paint1_linear" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#6366F1"/>
                      <stop offset="1" stopColor="#E879F9"/>
                    </linearGradient>
                    <linearGradient id="paint2_linear" x1="9.5" y1="9.5" x2="15.5" y2="14.5" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#ffffff"/>
                      <stop offset="1" stopColor="#E2E8F0"/>
                    </linearGradient>
                  </defs>
                </svg>
                VidFlow
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
