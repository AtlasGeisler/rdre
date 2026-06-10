import Link from "next/link";
import db from "@/lib/db";

const TIER_COLORS: Record<string, string> = {
  champion: "#C9A84C",
  consistent: "#3A7D44",
  occasional: "#7CB68A",
  new: "#4A90D9",
  dormant: "#888888",
  prospect: "#A8A08C",
};

const STAT_CONFIG = [
  { label: "Total GPs", icon: "🏥", borderColor: "#3A7D44" },
  { label: "Referrals This Month", icon: "📅", borderColor: "#C9A84C" },
  { label: "Referrals This Quarter", icon: "📊", borderColor: "#4A90D9" },
  { label: "Referrals This Year", icon: "📈", borderColor: "#7CB68A" },
];

interface RecentReferral {
  id: number;
  date_of_service: string;
  gp_name: string;
  gp_id: number;
  practice_name: string;
  procedure_type: string;
  outcome: string;
}

interface TopGp {
  id: number;
  name: string;
  practice_name: string;
  tier: string;
  referral_count: number;
}

interface TierRow {
  tier: string;
  count: number;
}

const cardBase = {
  background: "#1E3328",
  border: "1px solid #2A4A38",
  borderRadius: "12px",
  padding: "24px",
};

export default function DashboardPage() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).toISOString().split("T")[0];
  const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];

  const totalGps = (db.prepare("SELECT COUNT(*) as count FROM gp_profiles").get() as { count: number }).count;
  const thisMonth = (db.prepare("SELECT COUNT(*) as count FROM referral_events WHERE date_of_service >= ?").get(startOfMonth) as { count: number }).count;
  const thisQuarter = (db.prepare("SELECT COUNT(*) as count FROM referral_events WHERE date_of_service >= ?").get(startOfQuarter) as { count: number }).count;
  const thisYear = (db.prepare("SELECT COUNT(*) as count FROM referral_events WHERE date_of_service >= ?").get(startOfYear) as { count: number }).count;

  const statValues = [totalGps, thisMonth, thisQuarter, thisYear];

  const tierRows = db.prepare("SELECT tier, COUNT(*) as count FROM gp_profiles GROUP BY tier").all() as TierRow[];
  const tierDistribution: Record<string, number> = {};
  for (const row of tierRows) {
    tierDistribution[row.tier] = row.count;
  }

  const recentReferrals = db.prepare(`
    SELECT r.id, r.date_of_service, r.procedure_type, r.outcome,
           g.id as gp_id, g.name as gp_name, g.practice_name
    FROM referral_events r
    JOIN gp_profiles g ON r.gp_id = g.id
    ORDER BY r.date_of_service DESC
    LIMIT 10
  `).all() as RecentReferral[];

  const topGps = db.prepare(`
    SELECT id, name, practice_name, tier, referral_count
    FROM gp_profiles
    ORDER BY referral_count DESC
    LIMIT 5
  `).all() as TopGp[];

  const tiers = ["champion", "consistent", "occasional", "new", "dormant", "prospect"];
  const totalForChart = Object.values(tierDistribution).reduce((a, b) => a + b, 0) || 1;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#F5F0E8", letterSpacing: "-0.5px" }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: "#A8A08C", marginTop: 4 }}>United Endodontics referral overview</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        {STAT_CONFIG.map((stat, i) => (
          <div key={stat.label} style={{
            ...cardBase,
            borderLeft: `4px solid ${stat.borderColor}`,
            padding: "20px 24px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 22 }}>{stat.icon}</span>
              <span style={{ fontSize: 12, color: "#A8A08C", fontWeight: 500, letterSpacing: "0.3px" }}>{stat.label.toUpperCase()}</span>
            </div>
            <div style={{ fontSize: 42, fontWeight: 800, color: "#F5F0E8", lineHeight: 1, letterSpacing: "-1px" }}>
              {statValues[i]}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        {/* Tier distribution */}
        <div style={cardBase}>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 20, color: "#F5F0E8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            GP Tier Distribution
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {tiers.map(tier => {
              const count = tierDistribution[tier] ?? 0;
              const pct = Math.round((count / totalForChart) * 100);
              return (
                <div key={tier}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 13, color: TIER_COLORS[tier], textTransform: "capitalize", fontWeight: 600 }}>{tier}</span>
                    <span style={{ fontSize: 13, color: "#A8A08C" }}>
                      <span style={{ fontWeight: 600, color: "#F5F0E8" }}>{count}</span>
                      <span style={{ fontSize: 11, marginLeft: 4 }}>({pct}%)</span>
                    </span>
                  </div>
                  <div style={{ height: 8, background: "#2A4A38", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: TIER_COLORS[tier],
                      borderRadius: 4,
                      transition: "width 0.4s ease",
                      minWidth: count > 0 ? 4 : 0,
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 5 GPs */}
        <div style={cardBase}>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: "#F5F0E8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Top 5 GPs by Referrals
          </h2>
          {topGps.length === 0 ? (
            <p style={{ color: "#A8A08C", fontSize: 14 }}>No GP data yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {topGps.map((gp, i) => (
                <div key={gp.id} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 0",
                  borderBottom: i < topGps.length - 1 ? "1px solid #2A4A38" : "none",
                }}>
                  <div style={{
                    width: 26, height: 26,
                    background: i === 0 ? "#C9A84C22" : "#2A4A38",
                    color: i === 0 ? "#C9A84C" : "#A8A08C",
                    borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700, flexShrink: 0,
                  }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link href={`/dashboard/gps/${gp.id}`} style={{
                      fontSize: 14, fontWeight: 600, color: "#F5F0E8",
                      display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {gp.name}
                    </Link>
                    <div style={{ fontSize: 11, color: "#A8A08C", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {gp.practice_name}
                    </div>
                  </div>
                  <span style={{
                    background: TIER_COLORS[gp.tier] + "22",
                    color: TIER_COLORS[gp.tier],
                    border: `1px solid ${TIER_COLORS[gp.tier]}44`,
                    borderRadius: 4,
                    padding: "2px 8px",
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "capitalize",
                    flexShrink: 0,
                  }}>{gp.tier}</span>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#F5F0E8", flexShrink: 0, minWidth: 28, textAlign: "right" }}>
                    {gp.referral_count}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Referrals */}
      <div style={cardBase}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: "#F5F0E8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Recent Referrals
          </h2>
          <Link href="/dashboard/referrals" style={{ fontSize: 13, color: "#7CB68A" }}>View all</Link>
        </div>
        {recentReferrals.length === 0 ? (
          <p style={{ color: "#A8A08C", fontSize: 14, padding: "20px 0" }}>No referrals on record yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  {["Date", "GP Name", "Procedure", "Outcome"].map(h => (
                    <th key={h} style={{
                      textAlign: "left",
                      padding: "0 12px 10px 0",
                      color: "#A8A08C",
                      fontWeight: 500,
                      fontSize: 12,
                      borderBottom: "1px solid #2A4A38",
                      textTransform: "uppercase",
                      letterSpacing: "0.3px",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentReferrals.map((r, idx) => (
                  <tr key={r.id} style={{ background: idx % 2 === 0 ? "transparent" : "rgba(42,74,56,0.15)" }}>
                    <td style={{ padding: "10px 12px 10px 0", color: "#A8A08C", whiteSpace: "nowrap" }}>{r.date_of_service}</td>
                    <td style={{ padding: "10px 12px 10px 0" }}>
                      <Link href={`/dashboard/gps/${r.gp_id}`} style={{ color: "#7CB68A", fontWeight: 500 }}>
                        {r.gp_name}
                      </Link>
                    </td>
                    <td style={{ padding: "10px 12px 10px 0", color: "#F5F0E8" }}>{r.procedure_type}</td>
                    <td style={{ padding: "10px 0", color: "#A8A08C" }}>
                      <span style={{
                        background: r.outcome === "completed" ? "#3A7D4422" : "#88888822",
                        color: r.outcome === "completed" ? "#7CB68A" : "#A8A08C",
                        borderRadius: 4,
                        padding: "2px 8px",
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "capitalize",
                      }}>{r.outcome}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
