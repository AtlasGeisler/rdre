"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const TIER_COLORS: Record<string, string> = {
  champion: "#C9A84C",
  consistent: "#3A7D44",
  occasional: "#7CB68A",
  new: "#4A90D9",
  dormant: "#888888",
  prospect: "#A8A08C",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "#888888",
  ready: "#3A7D44",
  sent: "#4A90D9",
  opened: "#C9A84C",
};

interface ReferralEvent {
  id: number;
  date_of_service: string;
  procedure_type: string;
  tooth_number: string;
  outcome: string;
  patient_hash: string;
}

interface PulseEvent {
  id: number;
  status: string;
  script_text: string;
  created_at: string;
}

interface RelNote {
  id: number;
  note_type: string;
  content: string;
  author: string;
  created_at: string;
}

interface GP {
  id: number;
  name: string;
  practice_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  tier: string;
  referral_count: number;
  relationship_score: number;
  notes: RelNote[];
  referrals: ReferralEvent[];
  pulseEvents: PulseEvent[];
  notes_list: RelNote[];
}

const cardBase = {
  background: "#1E3328",
  border: "1px solid #2A4A38",
  borderRadius: "12px",
  padding: "24px",
  marginBottom: "20px",
};

export default function GPDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [gp, setGp] = useState<GP | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPulsePanel, setShowPulsePanel] = useState(false);
  const [selectedReferralId, setSelectedReferralId] = useState<string>("");
  const [patientName, setPatientName] = useState("");
  const [generatedScript, setGeneratedScript] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedPulse, setSavedPulse] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [noteType, setNoteType] = useState("personal");
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    fetch(`/api/gps/${id}`)
      .then(r => r.json())
      .then(j => {
        const d = j.data;
        setGp({ ...d, notes_list: d.notes ?? [] });
        setLoading(false);
      });
  }, [id]);

  async function generateScript() {
    setGenerating(true);
    setGeneratedScript("");
    const res = await fetch("/api/pulse/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gp_id: id, referral_event_id: selectedReferralId || null, patient_name: patientName || null }),
    });
    const j = await res.json();
    setGeneratedScript(j.data?.script ?? "");
    setGenerating(false);
  }

  async function saveDraft() {
    setSaving(true);
    await fetch("/api/pulse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gp_id: id, referral_event_id: selectedReferralId || null, script_text: generatedScript }),
    });
    setSaving(false);
    setSavedPulse(true);
  }

  async function addNote() {
    if (!newNote.trim()) return;
    setAddingNote(true);
    await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gp_id: id, note_type: noteType, content: newNote }),
    });
    setNewNote("");
    setAddingNote(false);
    const res = await fetch(`/api/gps/${id}`);
    const j = await res.json();
    setGp(prev => prev ? { ...prev, notes_list: j.data.notes ?? [] } : prev);
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🏥</div>
          <div style={{ color: "#A8A08C", fontSize: 14 }}>Loading GP profile...</div>
        </div>
      </div>
    );
  }
  if (!gp) {
    return (
      <div style={{ padding: "60px", textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>❌</div>
        <div style={{ color: "#F5F0E8", fontSize: 16, fontWeight: 600, marginBottom: 8 }}>GP not found</div>
        <Link href="/dashboard/gps" style={{ color: "#7CB68A" }}>Back to GP Network</Link>
      </div>
    );
  }

  const scoreColor = gp.relationship_score >= 70 ? "#3A7D44" : gp.relationship_score >= 40 ? "#C9A84C" : "#888";

  return (
    <div>
      {/* Breadcrumb + back */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: "#A8A08C", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <Link href="/dashboard/gps" style={{ color: "#7CB68A", display: "flex", alignItems: "center", gap: 4 }}>
            <span>←</span> GP Network
          </Link>
          <span style={{ color: "#2A4A38" }}>/</span>
          <span style={{ color: "#A8A08C" }}>{gp.name}</span>
        </div>
      </div>

      {/* Profile header */}
      <div style={{
        ...cardBase,
        borderLeft: `4px solid ${TIER_COLORS[gp.tier]}`,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 20,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#F5F0E8", letterSpacing: "-0.5px" }}>{gp.name}</h1>
            <span style={{
              background: TIER_COLORS[gp.tier] + "22",
              color: TIER_COLORS[gp.tier],
              border: `1px solid ${TIER_COLORS[gp.tier]}44`,
              borderRadius: 20,
              padding: "3px 12px",
              fontSize: 12,
              fontWeight: 700,
              textTransform: "capitalize",
            }}>{gp.tier}</span>
          </div>
          <div style={{ fontSize: 15, color: "#7CB68A", fontWeight: 500, marginBottom: 16 }}>{gp.practice_name}</div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "10px 24px" }}>
            {[
              ["📧 Email", gp.email],
              ["📞 Phone", gp.phone],
              ["📍 Address", [gp.address, gp.city, gp.state, gp.zip].filter(Boolean).join(", ")],
              ["📋 Total Referrals", String(gp.referral_count)],
            ].map(([label, val]) => val ? (
              <div key={label}>
                <div style={{ fontSize: 11, color: "#A8A08C", marginBottom: 2, fontWeight: 500 }}>{label}</div>
                <div style={{ fontSize: 13, color: "#F5F0E8" }}>{val}</div>
              </div>
            ) : null)}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12 }}>
          {/* Score meter */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#A8A08C", marginBottom: 6, fontWeight: 500, letterSpacing: "0.3px", textTransform: "uppercase" }}>
              Relationship Score
            </div>
            <div style={{
              width: 80, height: 80,
              borderRadius: "50%",
              background: `conic-gradient(${scoreColor} ${gp.relationship_score * 3.6}deg, #2A4A38 0deg)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative",
            }}>
              <div style={{
                width: 62, height: 62, borderRadius: "50%",
                background: "#1E3328",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexDirection: "column",
              }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>
                  {gp.relationship_score}
                </div>
                <div style={{ fontSize: 9, color: "#A8A08C" }}>/ 100</div>
              </div>
            </div>
          </div>

          {/* Generate Pulse button */}
          <button
            onClick={() => { setShowPulsePanel(!showPulsePanel); setSavedPulse(false); }}
            style={{
              background: showPulsePanel ? "#A8884022" : "#C9A84C",
              color: showPulsePanel ? "#C9A84C" : "#1A1A1A",
              border: showPulsePanel ? "1px solid #C9A84C" : "none",
              borderRadius: 8,
              padding: "11px 22px",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>🎬</span>
            {showPulsePanel ? "Close Generator" : "Generate Pulse Script"}
          </button>
        </div>
      </div>

      {/* Pulse Generator Panel */}
      {showPulsePanel && (
        <div style={{
          ...cardBase,
          borderColor: "#C9A84C44",
          background: "#1A2C1E",
          borderLeft: "4px solid #C9A84C",
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: "#C9A84C", display: "flex", alignItems: "center", gap: 8 }}>
            <span>🎬</span> Pulse Script Generator
          </h3>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, color: "#A8A08C", marginBottom: 6, fontWeight: 500 }}>
              Base on a specific referral (optional)
            </label>
            <select
              value={selectedReferralId}
              onChange={e => setSelectedReferralId(e.target.value)}
              style={{ width: "100%", maxWidth: 480 }}
            >
              <option value="">Most recent referral</option>
              {(gp.referrals ?? []).slice(0, 5).map(r => (
                <option key={r.id} value={r.id}>
                  {r.date_of_service} - {r.procedure_type} (Tooth #{r.tooth_number})
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12, color: "#A8A08C", marginBottom: 6, fontWeight: 500 }}>
              Patient first name + last initial (e.g. &quot;Sarah M.&quot;)
            </label>
            <input
              type="text"
              value={patientName}
              onChange={e => setPatientName(e.target.value)}
              placeholder="Sarah M."
              style={{
                width: "100%",
                maxWidth: 300,
                padding: "10px 14px",
                background: "#1A1A1A",
                border: "1px solid #2A4A38",
                borderRadius: 8,
                color: "#F5F0E8",
                fontSize: 14,
                fontFamily: "inherit",
                outline: "none",
              }}
            />
          </div>
          <button
            onClick={generateScript}
            disabled={generating}
            style={{
              background: generating ? "#2A4A38" : "#C9A84C",
              color: generating ? "#A8A08C" : "#1A1A1A",
              border: "none",
              borderRadius: 8,
              padding: "10px 24px",
              fontSize: 14,
              fontWeight: 700,
              cursor: generating ? "not-allowed" : "pointer",
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>{generating ? "⏳" : "✨"}</span>
            {generating ? "Generating script..." : "Generate Script"}
          </button>
          {generatedScript && (
            <div>
              <label style={{ display: "block", fontSize: 12, color: "#A8A08C", marginBottom: 6, fontWeight: 500 }}>
                Edit script as needed
              </label>
              <textarea
                value={generatedScript}
                onChange={e => setGeneratedScript(e.target.value)}
                rows={8}
                style={{ width: "100%", fontFamily: "inherit", lineHeight: 1.7, fontSize: 14, marginBottom: 12 }}
              />
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <button
                  onClick={saveDraft}
                  disabled={saving || savedPulse}
                  style={{
                    background: savedPulse ? "#2A4A38" : "#3A7D44",
                    color: "#F5F0E8",
                    border: "none",
                    borderRadius: 8,
                    padding: "10px 24px",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: saving || savedPulse ? "not-allowed" : "pointer",
                  }}
                >
                  {saving ? "Saving..." : savedPulse ? "Saved as Draft" : "Save as Draft"}
                </button>
                {savedPulse && (
                  <Link href="/dashboard/pulse" style={{ color: "#7CB68A", fontSize: 14, display: "flex", alignItems: "center", gap: 4 }}>
                    Go to Pulse Center →
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Pulse History */}
        <div style={cardBase}>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: "#F5F0E8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Pulse History
          </h2>
          {(gp.pulseEvents ?? []).length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🎬</div>
              <div style={{ color: "#A8A08C", fontSize: 13 }}>No pulse scripts yet. Generate one above.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {(gp.pulseEvents ?? []).map((p, i) => (
                <div key={p.id} style={{
                  padding: "12px 0",
                  borderBottom: i < (gp.pulseEvents ?? []).length - 1 ? "1px solid #2A4A38" : "none",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
                    <Link href={`/dashboard/pulse/${p.id}`} style={{ color: "#7CB68A", fontSize: 13, flex: 1 }}>
                      {p.script_text ? p.script_text.slice(0, 70) + "..." : "No script"}
                    </Link>
                    <span style={{
                      background: STATUS_COLORS[p.status] + "22",
                      color: STATUS_COLORS[p.status],
                      border: `1px solid ${STATUS_COLORS[p.status]}44`,
                      borderRadius: 4,
                      padding: "2px 8px",
                      fontSize: 11,
                      fontWeight: 700,
                      textTransform: "capitalize",
                      flexShrink: 0,
                    }}>{p.status}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#A8A08C" }}>{p.created_at.split("T")[0]}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contact quick view */}
        <div style={cardBase}>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: "#F5F0E8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Quick Stats
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Total Referrals", value: gp.referral_count, color: "#3A7D44", icon: "📋" },
              { label: "Relationship Score", value: `${gp.relationship_score}/100`, color: scoreColor, icon: "❤️" },
              { label: "Pulse Scripts", value: (gp.pulseEvents ?? []).length, color: "#C9A84C", icon: "🎬" },
              { label: "Notes", value: (gp.notes_list ?? []).length, color: "#4A90D9", icon: "📝" },
            ].map(stat => (
              <div key={stat.label} style={{
                background: "#1A1A1A",
                border: "1px solid #2A4A38",
                borderRadius: 8,
                padding: "16px",
                borderLeft: `3px solid ${stat.color}`,
              }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{stat.icon}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#F5F0E8", lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: "#A8A08C", marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Referral History */}
      <div style={cardBase}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: "#F5F0E8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Referral History
        </h2>
        {(gp.referrals ?? []).length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>📋</div>
            <div style={{ color: "#A8A08C", fontSize: 13 }}>No referrals on record for this GP.</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #2A4A38" }}>
                  {["Date", "Procedure", "Tooth", "Outcome", "Patient"].map(h => (
                    <th key={h} style={{
                      textAlign: "left",
                      padding: "0 12px 10px 0",
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
                {(gp.referrals ?? []).map((r, idx) => (
                  <tr key={r.id} style={{
                    borderBottom: "1px solid #2A4A38",
                    background: idx % 2 === 1 ? "rgba(42,74,56,0.1)" : "transparent",
                  }}>
                    <td style={{ padding: "10px 12px 10px 0", color: "#A8A08C", whiteSpace: "nowrap" }}>{r.date_of_service}</td>
                    <td style={{ padding: "10px 12px 10px 0", color: "#7CB68A" }}>{r.procedure_type}</td>
                    <td style={{ padding: "10px 12px 10px 0", color: "#F5F0E8" }}>#{r.tooth_number}</td>
                    <td style={{ padding: "10px 12px 10px 0" }}>
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
                    <td style={{ padding: "10px 0", color: "#A8A08C", fontSize: 11, fontFamily: "monospace" }}>
                      {r.patient_hash.slice(0, 8)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Relationship Notes */}
      <div style={cardBase}>
        <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: "#F5F0E8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Relationship Notes
        </h2>

        {/* Existing notes */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {(gp.notes_list ?? []).length === 0 && (
            <div style={{ textAlign: "center", padding: "20px 0", borderBottom: "1px solid #2A4A38" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>📝</div>
              <div style={{ color: "#A8A08C", fontSize: 13 }}>No notes yet. Add the first one below.</div>
            </div>
          )}
          {(gp.notes_list ?? []).map((n: RelNote) => (
            <div key={n.id} style={{
              background: "#1A1A1A",
              border: "1px solid #2A4A38",
              borderRadius: 8,
              padding: "14px 16px",
              borderLeft: "3px solid #4A90D9",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, flexWrap: "wrap", gap: 4 }}>
                <span style={{
                  fontSize: 11,
                  color: "#4A90D9",
                  textTransform: "capitalize",
                  fontWeight: 700,
                  background: "#4A90D922",
                  border: "1px solid #4A90D944",
                  borderRadius: 4,
                  padding: "2px 8px",
                }}>{n.note_type}</span>
                <span style={{ fontSize: 11, color: "#A8A08C" }}>
                  {n.created_at.split("T")[0]} by {n.author}
                </span>
              </div>
              <p style={{ fontSize: 14, color: "#F5F0E8", lineHeight: 1.6 }}>{n.content}</p>
            </div>
          ))}
        </div>

        {/* Add note form */}
        <div style={{ borderTop: "1px solid #2A4A38", paddingTop: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#F5F0E8", marginBottom: 12 }}>Add Note</div>
          <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
            <select
              value={noteType}
              onChange={e => setNoteType(e.target.value)}
              style={{ width: 160 }}
            >
              <option value="personal">Personal</option>
              <option value="clinical">Clinical</option>
              <option value="administrative">Administrative</option>
            </select>
          </div>
          <textarea
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            placeholder="Add a relationship note..."
            rows={3}
            style={{ width: "100%", marginBottom: 10 }}
          />
          <button
            onClick={addNote}
            disabled={addingNote || !newNote.trim()}
            style={{
              background: addingNote || !newNote.trim() ? "#2A4A38" : "#3A7D44",
              color: "#F5F0E8",
              border: "none",
              borderRadius: 8,
              padding: "10px 24px",
              fontSize: 14,
              fontWeight: 600,
              cursor: addingNote || !newNote.trim() ? "not-allowed" : "pointer",
            }}
          >
            {addingNote ? "Adding..." : "Add Note"}
          </button>
        </div>
      </div>
    </div>
  );
}
