"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

const C = {
  bg: "#1A1A1A",
  card: "#1E3328",
  border: "#2A4A38",
  green: "#3A7D44",
  accent: "#7CB68A",
  gold: "#C9A84C",
  text: "#F5F0E8",
  muted: "#A8A08C",
} as const;

export default function WatchPage() {
  const params = useParams();
  const token = params.token as string;

  const [email, setEmail] = useState("");
  const [lastName, setLastName] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [videoData, setVideoData] = useState<{
    videoUrl: string;
    gpName: string;
    practiceName: string;
  } | null>(null);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setVerifying(true);
    setError("");

    try {
      const res = await fetch("/api/videos/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, last_name: lastName }),
      });
      const j = await res.json();

      if (j.success) {
        setVideoData(j.data);
      } else {
        setError(j.error || "Verification failed");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setVerifying(false);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
    }}>
      <div style={{
        maxWidth: 520,
        width: "100%",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 16,
          }}>
            <div style={{
              width: 36,
              height: 36,
              background: C.green,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 800,
              color: C.text,
            }}>UE</div>
            <span style={{ fontSize: 18, fontWeight: 700, color: C.text }}>United Endodontics</span>
          </div>
          <p style={{ fontSize: 13, color: C.muted }}>Secure Video Message Portal</p>
        </div>

        {!videoData ? (
          /* Verification Form */
          <div style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            padding: "40px 32px",
          }}>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎬</div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 8 }}>
                You have a personal video message
              </h1>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>
                Dr. Geisler at United Endodontics recorded a message for you.
                Please verify your identity to view.
              </p>
            </div>

            <form onSubmit={verify} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6, display: "block", letterSpacing: "0.5px" }}>
                  EMAIL ADDRESS
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@practice.com"
                  required
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    background: C.bg,
                    border: `1.5px solid ${C.border}`,
                    borderRadius: 10,
                    color: C.text,
                    fontSize: 15,
                    fontFamily: "inherit",
                    outline: "none",
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, marginBottom: 6, display: "block", letterSpacing: "0.5px" }}>
                  LAST NAME
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Your last name"
                  required
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    background: C.bg,
                    border: `1.5px solid ${C.border}`,
                    borderRadius: 10,
                    color: C.text,
                    fontSize: 15,
                    fontFamily: "inherit",
                    outline: "none",
                  }}
                />
              </div>

              {error && (
                <div style={{
                  background: "rgba(208,66,52,0.1)",
                  border: "1px solid rgba(208,66,52,0.3)",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 13,
                  color: "#E85A4A",
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={verifying}
                style={{
                  background: C.green,
                  color: C.text,
                  border: "none",
                  borderRadius: 10,
                  padding: "16px",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: verifying ? "not-allowed" : "pointer",
                  opacity: verifying ? 0.7 : 1,
                  marginTop: 4,
                  fontFamily: "inherit",
                }}
              >
                {verifying ? "Verifying..." : "Verify & Watch Video"}
              </button>
            </form>

            <div style={{
              marginTop: 24,
              paddingTop: 20,
              borderTop: `1px solid ${C.border}`,
              textAlign: "center",
            }}>
              <p style={{ fontSize: 11, color: C.muted, lineHeight: 1.6 }}>
                🔒 This is a secure, HIPAA-compliant video portal.
                Your information is verified against our records and is not stored.
              </p>
            </div>
          </div>
        ) : (
          /* Video Player */
          <div style={{
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 16,
            overflow: "hidden",
          }}>
            <div style={{ padding: "24px 28px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 13, color: C.gold, fontWeight: 600, letterSpacing: "0.5px", marginBottom: 4 }}>
                PERSONAL MESSAGE
              </div>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: C.text }}>
                A message for {videoData.gpName}
              </h1>
              <p style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
                From Dr. Todd Geisler at United Endodontics
              </p>
            </div>

            <div style={{ background: "#000", width: "100%", aspectRatio: "16/9" }}>
              <video
                src={videoData.videoUrl}
                controls
                autoPlay
                style={{ width: "100%", height: "100%" }}
              />
            </div>

            <div style={{ padding: "20px 28px" }}>
              <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 16 }}>
                Thank you for your continued partnership with United Endodontics.
                We value the trust you place in our practice.
              </p>
              <div style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
              }}>
                <a
                  href="tel:+16125551234"
                  style={{
                    background: C.green,
                    color: C.text,
                    textDecoration: "none",
                    padding: "10px 20px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  📞 Call Our Office
                </a>
                <a
                  href="mailto:info@unitedendo.com"
                  style={{
                    background: "transparent",
                    color: C.muted,
                    textDecoration: "none",
                    padding: "10px 20px",
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    border: `1px solid ${C.border}`,
                  }}
                >
                  ✉️ Send Us a Message
                </a>
              </div>
            </div>

            <div style={{
              padding: "16px 28px",
              borderTop: `1px solid ${C.border}`,
              textAlign: "center",
            }}>
              <p style={{ fontSize: 11, color: C.muted }}>
                🔒 This video is securely hosted by United Endodontics.
                Unauthorized sharing or recording is prohibited.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
