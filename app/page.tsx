import Link from "next/link";

export default function HomePage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "#1A1A1A",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
    }}>
      <div style={{
        background: "#1E3328",
        border: "1px solid #2A4A38",
        borderRadius: "12px",
        padding: "60px 48px",
        maxWidth: "600px",
        width: "100%",
        textAlign: "center",
      }}>
        <div style={{
          fontSize: "12px",
          letterSpacing: "3px",
          color: "#C9A84C",
          textTransform: "uppercase",
          marginBottom: "16px",
          fontWeight: 600,
        }}>
          United Endodontics
        </div>
        <h1 style={{
          fontSize: "56px",
          fontWeight: 800,
          color: "#F5F0E8",
          letterSpacing: "-1px",
          marginBottom: "8px",
        }}>
          RDRE
        </h1>
        <div style={{
          fontSize: "18px",
          color: "#7CB68A",
          marginBottom: "32px",
          fontWeight: 500,
        }}>
          Referring Doctor Relationship Engine
        </div>
        <p style={{
          color: "#A8A08C",
          fontSize: "15px",
          lineHeight: "1.7",
          marginBottom: "48px",
        }}>
          Manage and strengthen your GP referral network. Track relationships, log cases, and deliver personalized Pulse videos that keep referring doctors engaged.
        </p>
        <Link
          href="/login"
          style={{
            display: "inline-block",
            background: "#3A7D44",
            color: "#F5F0E8",
            padding: "14px 40px",
            borderRadius: "6px",
            fontSize: "16px",
            fontWeight: 600,
            textDecoration: "none",
            transition: "background 0.2s",
          }}
        >
          Sign In
        </Link>
      </div>
      <div style={{
        marginTop: "40px",
        display: "flex",
        gap: "32px",
        color: "#A8A08C",
        fontSize: "13px",
      }}>
        <div>GP Profiles</div>
        <div style={{ color: "#2A4A38" }}>|</div>
        <div>Referral Tracking</div>
        <div style={{ color: "#2A4A38" }}>|</div>
        <div>Pulse Video Scripts</div>
        <div style={{ color: "#2A4A38" }}>|</div>
        <div>Relationship Scoring</div>
      </div>
    </div>
  );
}
