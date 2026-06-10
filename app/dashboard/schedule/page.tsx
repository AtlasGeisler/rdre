"use client";

import { useState, useRef } from "react";
import Link from "next/link";

interface Appointment {
  patient_initials: string;
  referring_doctor: string;
  referring_doctor_id?: number;
  procedure_type: string;
  tooth_number: string;
  date_of_service: string;
  time?: string;
  notes?: string;
  selected: boolean;
}

const C = {
  bg: "#1A1A1A",
  card: "#1E3328",
  border: "#2A4A38",
  green: "#3A7D44",
  accent: "#7CB68A",
  gold: "#C9A84C",
  text: "#F5F0E8",
  muted: "#A8A08C",
  red: "#D04234",
} as const;

export default function SchedulePage() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setImage(file);
    setPreview(URL.createObjectURL(file));
    setAppointments([]);
    setImportResult(null);
    setError("");
  }

  async function extract() {
    if (!image) return;
    setExtracting(true);
    setError("");

    try {
      const fd = new FormData();
      fd.append("image", image);
      const res = await fetch("/api/schedule/extract", { method: "POST", body: fd });
      const j = await res.json();

      if (j.success && j.data?.appointments) {
        setAppointments(j.data.appointments.map((a: Omit<Appointment, "selected">) => ({ ...a, selected: true })));
      } else {
        setError(j.error || "Could not extract appointments. Try a clearer image.");
      }
    } catch {
      setError("Extraction failed. Please try again.");
    }
    setExtracting(false);
  }

  async function importSelected() {
    const selected = appointments.filter(a => a.selected);
    if (!selected.length) return;
    setImporting(true);

    try {
      const res = await fetch("/api/schedule/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointments: selected }),
      });
      const j = await res.json();
      if (j.success) {
        setImportResult(j.data);
      }
    } catch {
      setError("Import failed.");
    }
    setImporting(false);
  }

  const cardStyle: React.CSSProperties = {
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" as const, color: C.gold, marginBottom: 8 }}>
          SCHEDULE IMPORT
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 4 }}>
          📸 Snap Your Schedule
        </h1>
        <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>
          Take a photo or screenshot of today&apos;s schedule. AI extracts the patients, procedures, tooth numbers, and referring doctors automatically. No manual data entry.
        </p>
      </div>

      {/* Step 1: Upload */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 16 }}>
          Step 1: Upload Schedule
        </h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <button
            onClick={() => cameraRef.current?.click()}
            style={{
              background: C.green,
              color: C.text,
              border: "none",
              borderRadius: 8,
              padding: "14px 24px",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            📷 Take Photo
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              background: C.card,
              color: C.muted,
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: "14px 24px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            📁 Upload Screenshot
          </button>
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            style={{ display: "none" }}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
            style={{ display: "none" }}
          />
        </div>

        {preview && (
          <div style={{ marginBottom: 16 }}>
            <img
              src={preview}
              alt="Schedule preview"
              style={{
                maxWidth: "100%",
                maxHeight: 300,
                borderRadius: 8,
                border: `1px solid ${C.border}`,
              }}
            />
          </div>
        )}

        {image && !appointments.length && !extracting && (
          <button
            onClick={extract}
            style={{
              background: C.gold,
              color: C.bg,
              border: "none",
              borderRadius: 8,
              padding: "14px 28px",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            🔍 Extract Appointments
          </button>
        )}

        {extracting && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: C.gold, fontSize: 14, fontWeight: 600 }}>
            <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⚙️</span>
            Reading your schedule... This takes about 10 seconds.
          </div>
        )}

        {error && (
          <div style={{
            background: "rgba(208,66,52,0.1)",
            border: "1px solid rgba(208,66,52,0.3)",
            borderRadius: 8,
            padding: "12px 16px",
            fontSize: 13,
            color: "#E85A4A",
            marginTop: 12,
          }}>
            {error}
          </div>
        )}
      </div>

      {/* Step 2: Review extracted appointments */}
      {appointments.length > 0 && !importResult && (
        <div style={cardStyle}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>
            Step 2: Review & Confirm
          </h2>
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>
            {appointments.length} appointments found. Uncheck any you want to skip. Then import.
          </p>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                  <th style={{ padding: "8px 6px", textAlign: "left", color: C.muted, fontWeight: 600 }}>✓</th>
                  <th style={{ padding: "8px 6px", textAlign: "left", color: C.muted, fontWeight: 600 }}>Time</th>
                  <th style={{ padding: "8px 6px", textAlign: "left", color: C.muted, fontWeight: 600 }}>Patient</th>
                  <th style={{ padding: "8px 6px", textAlign: "left", color: C.muted, fontWeight: 600 }}>Procedure</th>
                  <th style={{ padding: "8px 6px", textAlign: "left", color: C.muted, fontWeight: 600 }}>Tooth</th>
                  <th style={{ padding: "8px 6px", textAlign: "left", color: C.muted, fontWeight: 600 }}>Referring GP</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: `1px solid ${C.border}`,
                      opacity: apt.selected ? 1 : 0.4,
                      background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
                    }}
                  >
                    <td style={{ padding: "10px 6px" }}>
                      <input
                        type="checkbox"
                        checked={apt.selected}
                        onChange={() => {
                          const updated = [...appointments];
                          updated[i] = { ...updated[i], selected: !updated[i].selected };
                          setAppointments(updated);
                        }}
                        style={{ width: 16, height: 16, cursor: "pointer" }}
                      />
                    </td>
                    <td style={{ padding: "10px 6px", color: C.muted }}>{apt.time || "--"}</td>
                    <td style={{ padding: "10px 6px", color: C.text, fontWeight: 600 }}>{apt.patient_initials}</td>
                    <td style={{ padding: "10px 6px", color: C.text }}>{apt.procedure_type}</td>
                    <td style={{ padding: "10px 6px", color: C.gold, fontWeight: 600 }}>#{apt.tooth_number}</td>
                    <td style={{ padding: "10px 6px" }}>
                      <span style={{
                        color: apt.referring_doctor_id ? C.accent : C.red,
                        fontWeight: apt.referring_doctor_id ? 600 : 400,
                      }}>
                        {apt.referring_doctor}
                        {!apt.referring_doctor_id && apt.referring_doctor !== "Unknown" && (
                          <span style={{ fontSize: 11, color: C.muted, marginLeft: 4 }}>(not in system)</span>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 16, display: "flex", gap: 12, alignItems: "center" }}>
            <button
              onClick={importSelected}
              disabled={importing || !appointments.some(a => a.selected)}
              style={{
                background: C.green,
                color: C.text,
                border: "none",
                borderRadius: 8,
                padding: "14px 28px",
                fontSize: 14,
                fontWeight: 700,
                cursor: importing ? "not-allowed" : "pointer",
                opacity: importing ? 0.7 : 1,
              }}
            >
              {importing ? "Importing..." : `Import ${appointments.filter(a => a.selected).length} Appointments`}
            </button>
            <button
              onClick={() => { setAppointments([]); setImage(null); setPreview(null); }}
              style={{
                background: "transparent",
                color: C.muted,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: "14px 20px",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Start Over
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Import results */}
      {importResult && (
        <div style={cardStyle}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: C.accent, marginBottom: 12 }}>
            ✅ Import Complete
          </h2>
          <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 28, fontWeight: 800, color: C.accent }}>{importResult.imported}</div>
              <div style={{ fontSize: 12, color: C.muted }}>Imported</div>
            </div>
            {importResult.skipped > 0 && (
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: C.gold }}>{importResult.skipped}</div>
                <div style={{ fontSize: 12, color: C.muted }}>Skipped (no GP match)</div>
              </div>
            )}
          </div>

          {importResult.errors.length > 0 && (
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>
              {importResult.errors.map((e, i) => <div key={i}>• {e}</div>)}
            </div>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            <Link
              href="/dashboard/referrals"
              style={{
                background: C.green,
                color: C.text,
                textDecoration: "none",
                borderRadius: 8,
                padding: "12px 20px",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              View Referral Log →
            </Link>
            <button
              onClick={() => { setAppointments([]); setImage(null); setPreview(null); setImportResult(null); }}
              style={{
                background: "transparent",
                color: C.muted,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: "12px 20px",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Import Another Schedule
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
