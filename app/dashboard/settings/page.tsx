import db from "@/lib/db";
import { getAuthUser } from "@/lib/withAuth";

interface TableCount {
  count: number;
}

export default async function SettingsPage() {
  const user = await getAuthUser();

  const gpCount = (db.prepare("SELECT COUNT(*) as count FROM gp_profiles").get() as TableCount).count;
  const referralCount = (db.prepare("SELECT COUNT(*) as count FROM referral_events").get() as TableCount).count;
  const pulseCount = (db.prepare("SELECT COUNT(*) as count FROM pulse_events").get() as TableCount).count;
  const noteCount = (db.prepare("SELECT COUNT(*) as count FROM relationship_notes").get() as TableCount).count;

  const hasOpenAI = !!process.env.OPENAI_API_KEY;

  const cardStyle = { background: "#1E3328", border: "1px solid #2A4A38", borderRadius: "8px", padding: "24px", marginBottom: "20px" };

  return (
    <div>
      <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "24px" }}>Settings</h1>

      <div style={cardStyle}>
        <h2 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "16px" }}>Account</h2>
        <div style={{ fontSize: "14px", color: "#A8A08C" }}>Logged in as</div>
        <div style={{ fontSize: "16px", fontWeight: 600, color: "#F5F0E8", marginTop: "4px" }}>{user?.name ?? "Unknown"}</div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "16px" }}>Database</h2>
        <div style={{ fontSize: "13px", color: "#A8A08C", marginBottom: "12px" }}>Path: data/rdre.db</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
          {[
            { label: "GP Profiles", count: gpCount },
            { label: "Referral Events", count: referralCount },
            { label: "Pulse Events", count: pulseCount },
            { label: "Relationship Notes", count: noteCount },
          ].map(t => (
            <div key={t.label} style={{ background: "#1A1A1A", border: "1px solid #2A4A38", borderRadius: "6px", padding: "16px" }}>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#F5F0E8" }}>{t.count}</div>
              <div style={{ fontSize: "12px", color: "#A8A08C", marginTop: "4px" }}>{t.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "16px" }}>Application</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div>
            <div style={{ fontSize: "12px", color: "#A8A08C", marginBottom: "4px" }}>Version</div>
            <div style={{ fontSize: "14px", fontWeight: 600 }}>1.0.0</div>
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "#A8A08C", marginBottom: "4px" }}>Port</div>
            <div style={{ fontSize: "14px", fontWeight: 600 }}>4960</div>
          </div>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "16px" }}>OpenAI Integration</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "8px", height: "8px", borderRadius: "50%",
            background: hasOpenAI ? "#3A7D44" : "#888888",
          }} />
          <span style={{ fontSize: "14px", color: hasOpenAI ? "#7CB68A" : "#A8A08C" }}>
            {hasOpenAI ? "API key configured, script generation enabled" : "API key not configured, using template stubs"}
          </span>
        </div>
      </div>
    </div>
  );
}
