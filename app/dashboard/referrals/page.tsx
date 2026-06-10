"use client";

import { useEffect, useState } from "react";

interface Referral {
  id: number;
  gp_name: string;
  practice_name: string;
  date_of_service: string;
  procedure_type: string;
  tooth_number: string;
  outcome: string;
  patient_hash: string;
}

const PROCEDURES = ["All Procedures", "Root Canal Therapy", "Apicoectomy", "Pulp Capping", "Re-treatment", "Emergency Pulpectomy"];
const PER_PAGE = 20;

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [search, setSearch] = useState("");
  const [procedure, setProcedure] = useState("All Procedures");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    fetch(`/api/referrals?${params}`)
      .then(r => r.json())
      .then(j => { setReferrals(j.data); setLoading(false); });
  }, [from, to]);

  const filtered = referrals.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.gp_name.toLowerCase().includes(q) || r.practice_name?.toLowerCase().includes(q);
    const matchProc = procedure === "All Procedures" || r.procedure_type === procedure;
    return matchSearch && matchProc;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 700 }}>Referral Log</h1>
        <span style={{ color: "#A8A08C", fontSize: "14px" }}>{filtered.length} referrals</span>
      </div>

      <div style={{ background: "#1E3328", border: "1px solid #2A4A38", borderRadius: "8px", padding: "16px", marginBottom: "20px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <input
          placeholder="Search GP name..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ flex: 1, minWidth: "180px" }}
        />
        <select value={procedure} onChange={e => { setProcedure(e.target.value); setPage(1); }}>
          {PROCEDURES.map(p => <option key={p}>{p}</option>)}
        </select>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontSize: "13px", color: "#A8A08C" }}>From</label>
          <input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1); }} style={{ width: "140px" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontSize: "13px", color: "#A8A08C" }}>To</label>
          <input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1); }} style={{ width: "140px" }} />
        </div>
      </div>

      <div style={{ background: "#1E3328", border: "1px solid #2A4A38", borderRadius: "8px", overflow: "hidden", marginBottom: "16px" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#A8A08C" }}>Loading...</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #2A4A38" }}>
                {["Date", "GP Name", "Procedure", "Tooth #", "Outcome", "Patient"].map(h => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 16px", color: "#A8A08C", fontWeight: 500, fontSize: "12px" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map(r => (
                <tr key={r.id} style={{ borderBottom: "1px solid #2A4A38" }}>
                  <td style={{ padding: "12px 16px", color: "#A8A08C" }}>{r.date_of_service}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ color: "#F5F0E8", fontWeight: 500 }}>{r.gp_name}</div>
                    <div style={{ fontSize: "11px", color: "#A8A08C" }}>{r.practice_name}</div>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#7CB68A" }}>{r.procedure_type}</td>
                  <td style={{ padding: "12px 16px", color: "#F5F0E8" }}>#{r.tooth_number}</td>
                  <td style={{ padding: "12px 16px", color: "#A8A08C" }}>{r.outcome}</td>
                  <td style={{ padding: "12px 16px", color: "#A8A08C", fontSize: "12px", fontFamily: "monospace" }}>{r.patient_hash.slice(0, 8)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent: "center" }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ background: "#1E3328", color: "#A8A08C", border: "1px solid #2A4A38", borderRadius: "4px", padding: "6px 14px", fontSize: "13px" }}
          >
            Prev
          </button>
          <span style={{ color: "#A8A08C", fontSize: "13px" }}>Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{ background: "#1E3328", color: "#A8A08C", border: "1px solid #2A4A38", borderRadius: "4px", padding: "6px 14px", fontSize: "13px" }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
