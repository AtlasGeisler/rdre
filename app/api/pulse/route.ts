import { NextRequest } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const pulseEvents = db.prepare(`
    SELECT p.*, g.name as gp_name, g.practice_name
    FROM pulse_events p
    JOIN gp_profiles g ON p.gp_id = g.id
    ORDER BY p.created_at DESC
  `).all();
  return Response.json({ success: true, data: pulseEvents });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { gp_id, referral_event_id, script_text } = body;

  if (!gp_id) {
    return Response.json({ success: false, error: "gp_id is required" }, { status: 400 });
  }

  const result = db.prepare(`
    INSERT INTO pulse_events (gp_id, referral_event_id, script_text, status)
    VALUES (?, ?, ?, 'draft')
  `).run(gp_id, referral_event_id ?? null, script_text ?? null) as { lastInsertRowid: number };

  const pulse = db.prepare("SELECT * FROM pulse_events WHERE id = ?").get(result.lastInsertRowid);
  return Response.json({ success: true, data: pulse }, { status: 201 });
}
