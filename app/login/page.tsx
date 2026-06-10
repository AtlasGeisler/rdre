"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      router.push("/dashboard");
    } else {
      setError("Invalid credentials");
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#1A1A1A",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
    }}>
      <div style={{
        background: "#1E3328",
        border: "1px solid #2A4A38",
        borderRadius: "12px",
        padding: "48px 40px",
        width: "100%",
        maxWidth: "400px",
      }}>
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            fontSize: "11px",
            letterSpacing: "3px",
            color: "#C9A84C",
            textTransform: "uppercase",
            marginBottom: "8px",
            fontWeight: 600,
          }}>
            United Endodontics
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#F5F0E8" }}>RDRE</h1>
          <p style={{ color: "#A8A08C", fontSize: "14px", marginTop: "4px" }}>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", color: "#A8A08C", marginBottom: "6px" }}>
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={{ width: "100%", background: "#1A1A1A", color: "#F5F0E8", border: "1px solid #2A4A38", borderRadius: "4px", padding: "10px 12px", fontSize: "14px" }}
              required
            />
          </div>
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "13px", color: "#A8A08C", marginBottom: "6px" }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: "100%", background: "#1A1A1A", color: "#F5F0E8", border: "1px solid #2A4A38", borderRadius: "4px", padding: "10px 12px", fontSize: "14px" }}
              required
            />
          </div>

          {error && (
            <div style={{
              background: "rgba(192, 57, 43, 0.15)",
              border: "1px solid #C0392B",
              borderRadius: "4px",
              padding: "10px 12px",
              color: "#C0392B",
              fontSize: "14px",
              marginBottom: "16px",
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: loading ? "#2A4A38" : "#3A7D44",
              color: "#F5F0E8",
              border: "none",
              borderRadius: "6px",
              padding: "12px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
