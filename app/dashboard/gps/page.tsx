"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const TIER_COLORS: Record<string, string> = {
  champion: "#C9A84C",
  consistent: "#3A7D44",
  occasional: "#7CB68A",
  new: "#4A90D9",
  dormant: "#888888",
  prospect: "#A8A08C",
};

type SortKey = "name" | "referral_count" | "last_referral_date" | "relationship_score";

interface GP {
  id: number;
  name: string;
  practice_name: string;
  tier: string;
  referral_count: number;
  last_referral_date: string | null;
  relationship_score: number;
  city: string;
  state: string;
}

const cardBase = {
  background: "#1E3328",
  border: "1px solid #2A4A38",
  borderRadius: "12px",
};

export default function GpsPage() {
  const router = useRouter();
  const [gps, setGps] = useState<GP[]>([]);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("referral_count");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/gps")
      .then(r => r.json())
      .then(j => { setGps(j.data ?? []); setLoading(false); });
  }, []);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const filtered = gps
    .filter(gp => {
      const q = search.toLowerCase();
      return (
        (gp.name.toLowerCase().includes(q) || gp.practice_name.toLowerCase().includes(q)) &&
        (tierFilter === "all" || gp.tier === tierFilter)
      );
    })
    .sort((a, b) => {
      let av: string | number = a[sortKey] ?? "";
      let bv: string | number = b[sortKey] ?? "";
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });

  const sortArrow = (key: SortKey) => {
    if (sortKey !== key) return <span style={{ color: "#2A4A38", marginLeft: 4 }}>↕</span>;
    return <span style={{ color: "#7CB68A", marginLeft: 4 }}>{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#F5F0E8", letterSpacing: "-0.5px" }}>GP Network</h1>
          <p style={{ fontSize: 13, color: "#A8A08C", marginTop: 4 }}>
            {loading ? "Loading..." : `${filtered.length} of ${gps.length} doctors`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ ...cardBase, padding: "16px 20px", marginBottom: 20, display: "flex", gap: 12, flexWrap: "wrap" }}>
        <input
          placeholder="Search by name or practice..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200 }}
        />
        <select
          value={tierFilter}
          onChange={e => setTierFilter(e.target.value)}
          style={{ minWidth: 140 }}
        >
          <option value="all">All Tiers</option>
          <option value="champion">Champion</option>
          <option value="consistent">Consistent</option>
          <option value="occasional">Occasional</option>
          <option value="new">New</option>
          <option value="dormant">Dormant</option>
          <option value="prospect">Prospect</option>
        </select>
        <select
          value={`${sortKey}:${sortDir}`}
          onChange={e => {
            const [k, d] = e.target.value.split(":") as [SortKey, "asc" | "desc"];
            setSortKey(k);
            setSortDir(d);
          }}
          style={{ minWidth: 180 }}
        >
          <option value="referral_count:desc">Referrals (high to low)</option>
          <option value="referral_count:asc">Referrals (low to high)</option>
          <option value="name:asc">Name (A-Z)</option>
          <option value="name:desc">Name (Z-A)</option>
          <option value="last_referral_date:desc">Last Referral (newest)</option>
          <option value="last_referral_date:asc">Last Referral (oldest)</option>
          <option value="relationship_score:desc">Score (high to low)</option>
          <option value="relationship_score:asc">Score (low to high)</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ ...cardBase, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "60px", textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>🏥</div>
            <div style={{ color: "#A8A08C", fontSize: 14 }}>Loading GP network...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>🔍</div>
            <div style={{ color: "#F5F0E8", fontSize: 15, fontWeight: 600, marginBottom: 6 }}>No doctors found</div>
            <div style={{ color: "#A8A08C", fontSize: 13 }}>
              {search || tierFilter !== "all" ? "Try adjusting your filters" : "No GPs in the system yet"}
            </div>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #2A4A38" }}>
                {([
                  ["Name", "name"],
                  ["Practice", null],
                  ["Tier", null],
                  ["Referrals", "referral_count"],
                  ["Last Referral", "last_referral_date"],
                  ["Score", "relationship_score"],
                ] as [string, SortKey | null][]).map(([h, key]) => (
                  <th
                    key={h}
                    onClick={() => key && toggleSort(key)}
                    style={{
                      textAlign: "left",
                      padding: "13px 16px",
                      color: "#A8A08C",
                      fontWeight: 600,
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      cursor: key ? "pointer" : "default",
                      userSelect: "none",
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={e => { if (key) (e.currentTarget as HTMLElement).style.color = "#F5F0E8"; }}
                    onMouseLeave={e => { if (key) (e.currentTarget as HTMLElement).style.color = "#A8A08C"; }}
                  >
                    {h}
                    {key && sortArrow(key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((gp, idx) => (
                <tr
                  key={gp.id}
                  onClick={() => router.push(`/dashboard/gps/${gp.id}`)}
                  onMouseEnter={() => setHoveredRow(gp.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{
                    borderBottom: "1px solid #2A4A38",
                    cursor: "pointer",
                    background: hoveredRow === gp.id
                      ? "rgba(58,125,68,0.12)"
                      : idx % 2 === 1 ? "rgba(42,74,56,0.1)" : "transparent",
                    transition: "background 0.12s",
                  }}
                >
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ color: "#F5F0E8", fontWeight: 600, fontSize: 14 }}>{gp.name}</div>
                    <div style={{ fontSize: 11, color: "#A8A08C", marginTop: 2 }}>{gp.city}, {gp.state}</div>
                  </td>
                  <td style={{ padding: "13px 16px", color: "#A8A08C", fontSize: 13 }}>{gp.practice_name}</td>
                  <td style={{ padding: "13px 16px" }}>
                    <span style={{
                      background: TIER_COLORS[gp.tier] + "22",
                      color: TIER_COLORS[gp.tier],
                      border: `1px solid ${TIER_COLORS[gp.tier]}44`,
                      borderRadius: 20,
                      padding: "3px 10px",
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "capitalize",
                    }}>{gp.tier}</span>
                  </td>
                  <td style={{ padding: "13px 16px", fontWeight: 700, color: "#F5F0E8", fontSize: 15 }}>
                    {gp.referral_count}
                  </td>
                  <td style={{ padding: "13px 16px", color: "#A8A08C", fontSize: 13, whiteSpace: "nowrap" }}>
                    {gp.last_referral_date ?? "Never"}
                  </td>
                  <td style={{ padding: "13px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 5, background: "#2A4A38", borderRadius: 3, minWidth: 60, maxWidth: 80 }}>
                        <div style={{
                          height: "100%",
                          width: `${gp.relationship_score}%`,
                          background: gp.relationship_score >= 70 ? "#3A7D44" : gp.relationship_score >= 40 ? "#C9A84C" : "#888",
                          borderRadius: 3,
                        }} />
                      </div>
                      <span style={{ color: "#F5F0E8", fontWeight: 600, fontSize: 13, minWidth: 28 }}>
                        {gp.relationship_score}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
