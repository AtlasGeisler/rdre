"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  draft: "#888888",
  ready: "#3A7D44",
  sent: "#4A90D9",
  opened: "#C9A84C",
};

const STATUS_LABELS = ["all", "draft", "ready", "sent", "opened"] as const;

interface PulseEvent {
  id: number;
  gp_name: string;
  practice_name: string;
  script_text: string;
  status: string;
  created_at: string;
}

const cardBase = {
  background: "#1E3328",
  border: "1px solid #2A4A38",
  borderRadius: "12px",
};

export default function PulsePage() {
  const router = useRouter();
  const [events, setEvents] = useState<PulseEvent[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/pulse")
      .then(r => r.json())
      .then(j => { setEvents(j.data ?? []); setLoading(false); });
  }, []);

  const filtered = filter === "all" ? events : events.filter(e => e.status === filter);

  const countByStatus = (s: string) =>
    s === "all" ? events.length : events.filter(e => e.status === s).length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#F5F0E8", letterSpacing: "-0.5px" }}>Pulse Center</h1>
          <p style={{ fontSize: 13, color: "#A8A08C", marginTop: 4 }}>Personalized video scripts for referring GPs</p>
        </div>
        <Link
          href="/dashboard/gps"
          style={{
            background: "#C9A84C",
            color: "#1A1A1A",
            borderRadius: 8,
            padding: "10px 20px",
            fontSize: 14,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>+</span> New Pulse
        </Link>
      </div>

      {/* Status filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {STATUS_LABELS.map(s => {
          const count = countByStatus(s);
          const active = filter === s;
          return (
            <button
              key={s}
              onClick={() => setFilter(s)}
              style={{
                background: active ? "#3A7D44" : "#1E3328",
                color: active ? "#F5F0E8" : "#A8A08C",
                border: `1px solid ${active ? "#3A7D44" : "#2A4A38"}`,
                borderRadius: 8,
                padding: "8px 18px",
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                textTransform: "capitalize",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget.style.color = "#F5F0E8"); }}
              onMouseLeave={e => { if (!active) (e.currentTarget.style.color = "#A8A08C"); }}
            >
              {s}
              <span style={{
                background: active ? "rgba(255,255,255,0.2)" : "#2A4A38",
                color: active ? "#F5F0E8" : "#A8A08C",
                borderRadius: 20,
                padding: "1px 7px",
                fontSize: 11,
                fontWeight: 700,
                minWidth: 20,
                textAlign: "center",
              }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div style={{ ...cardBase, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "60px", textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>🎬</div>
            <div style={{ color: "#A8A08C", fontSize: 14 }}>Loading pulse scripts...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🎬</div>
            <div style={{ color: "#F5F0E8", fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
              {filter === "all" ? "No pulse scripts yet" : `No ${filter} scripts`}
            </div>
            <div style={{ color: "#A8A08C", fontSize: 13, marginBottom: 20 }}>
              {filter === "all"
                ? "Go to a GP profile and generate your first Pulse script."
                : `No scripts have status "${filter}" yet.`}
            </div>
            {filter === "all" && (
              <Link href="/dashboard/gps" style={{
                background: "#C9A84C",
                color: "#1A1A1A",
                borderRadius: 8,
                padding: "10px 20px",
                fontSize: 14,
                fontWeight: 700,
              }}>
                Go to GP Network
              </Link>
            )}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #2A4A38" }}>
                {["GP Name", "Script Preview", "Status", "Created"].map(h => (
                  <th key={h} style={{
                    textAlign: "left",
                    padding: "13px 16px",
                    color: "#A8A08C",
                    fontWeight: 600,
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, idx) => (
                <tr
                  key={e.id}
                  onClick={() => router.push(`/dashboard/pulse/${e.id}`)}
                  onMouseEnter={() => setHoveredRow(e.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{
                    borderBottom: "1px solid #2A4A38",
                    cursor: "pointer",
                    background: hoveredRow === e.id
                      ? "rgba(58,125,68,0.12)"
                      : idx % 2 === 1 ? "rgba(42,74,56,0.1)" : "transparent",
                    transition: "background 0.12s",
                  }}
                >
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ color: "#F5F0E8", fontWeight: 600, fontSize: 14 }}>{e.gp_name}</div>
                    <div style={{ fontSize: 11, color: "#A8A08C", marginTop: 2 }}>{e.practice_name}</div>
                  </td>
                  <td style={{ padding: "14px 16px", color: "#A8A08C", maxWidth: 300 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {e.script_text ? e.script_text.slice(0, 100) + "..." : "No script yet"}
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span style={{
                      background: STATUS_COLORS[e.status] + "22",
                      color: STATUS_COLORS[e.status],
                      border: `1px solid ${STATUS_COLORS[e.status]}44`,
                      borderRadius: 20,
                      padding: "3px 10px",
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "capitalize",
                    }}>{e.status}</span>
                  </td>
                  <td style={{ padding: "14px 16px", color: "#A8A08C", fontSize: 13, whiteSpace: "nowrap" }}>
                    {e.created_at.split("T")[0]}
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
