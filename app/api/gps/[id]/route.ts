import { NextRequest } from "next/server";
import db from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const gp = db.prepare("SELECT * FROM gp_profiles WHERE id = ?").get(Number(id));
  if (!gp) {
    return Response.json({ success: false, error: "Not found" }, { status: 404 });
  }
  const referrals = db.prepare("SELECT * FROM referral_events WHERE gp_id = ? ORDER BY date_of_service DESC").all(Number(id));
  const pulseEvents = db.prepare("SELECT * FROM pulse_events WHERE gp_id = ? ORDER BY created_at DESC").all(Number(id));
  const notes = db.prepare("SELECT * FROM relationship_notes WHERE gp_id = ? ORDER BY created_at DESC").all(Number(id));

  return Response.json({ success: true, data: { ...gp as object, referrals, pulseEvents, notes } });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const allowed = ["name", "practice_name", "email", "phone", "address", "city", "state", "zip", "specialty", "tier", "notes", "relationship_score"];
  const updates: string[] = [];
  const values: unknown[] = [];

  for (const key of allowed) {
    if (key in body) {
      updates.push(`${key} = ?`);
      values.push(body[key]);
    }
  }

  if (updates.length === 0) {
    return Response.json({ success: false, error: "No valid fields to update" }, { status: 400 });
  }

  updates.push("updated_at = datetime('now')");
  values.push(Number(id));

  db.prepare(`UPDATE gp_profiles SET ${updates.join(", ")} WHERE id = ?`).run(...values);
  const gp = db.prepare("SELECT * FROM gp_profiles WHERE id = ?").get(Number(id));
  return Response.json({ success: true, data: gp });
}
