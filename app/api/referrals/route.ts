import { NextRequest } from "next/server";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const gpId = searchParams.get("gp_id");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let query = `
    SELECT r.*, g.name as gp_name, g.practice_name
    FROM referral_events r
    JOIN gp_profiles g ON r.gp_id = g.id
    WHERE 1=1
  `;
  const vals: unknown[] = [];

  if (gpId) { query += " AND r.gp_id = ?"; vals.push(Number(gpId)); }
  if (from) { query += " AND r.date_of_service >= ?"; vals.push(from); }
  if (to) { query += " AND r.date_of_service <= ?"; vals.push(to); }
  query += " ORDER BY r.date_of_service DESC";

  const referrals = db.prepare(query).all(...vals);
  return Response.json({ success: true, data: referrals });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { gp_id, patient_hash, procedure_type, tooth_number, date_of_service, outcome, notes } = body;

  if (!gp_id || !patient_hash || !procedure_type || !date_of_service) {
    return Response.json({ success: false, error: "Missing required fields" }, { status: 400 });
  }

  const result = db.prepare(`
    INSERT INTO referral_events (gp_id, patient_hash, procedure_type, tooth_number, date_of_service, outcome, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(gp_id, patient_hash, procedure_type, tooth_number, date_of_service, outcome, notes) as { lastInsertRowid: number };

  // Update GP referral count
  db.prepare(`
    UPDATE gp_profiles SET
      referral_count = (SELECT COUNT(*) FROM referral_events WHERE gp_id = ?),
      last_referral_date = (SELECT MAX(date_of_service) FROM referral_events WHERE gp_id = ?),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(gp_id, gp_id, gp_id);

  const referral = db.prepare("SELECT * FROM referral_events WHERE id = ?").get(result.lastInsertRowid);
  return Response.json({ success: true, data: referral }, { status: 201 });
}
