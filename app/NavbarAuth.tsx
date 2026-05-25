"use client";
import { SignInButton, UserButton, useAuth } from '@clerk/nextjs';

export default function NavbarAuth() {
  const { isLoaded, userId } = useAuth();

  if (!isLoaded) {
    return <div style={{ width: "120px", height: "38px", background: "rgba(255,255,255,0.05)", borderRadius: "8px" }}></div>;
  }

  if (!userId) {
    return (
      <SignInButton mode="modal">
        <button className="btn-primary" style={{ padding: "0.6rem 1.5rem", fontSize: "0.9rem" }}>Log In / Sign Up</button>
      </SignInButton>
    );
  }

  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <a href="/dashboard" className="btn-outline mobile-hide" style={{ padding: "0.5rem 1rem", fontSize: "0.8rem", border: "1px solid var(--accent-1)", textDecoration: 'none' }}>Go to Dashboard</a>
      <UserButton />
    </div>
  );
}
