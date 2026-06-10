import { NextRequest } from "next/server";
import db from "@/lib/db";
import crypto from "crypto";

// Generate a secure, time-limited viewing token for a pulse video
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { pulse_id } = body;

  if (!pulse_id) {
    return Response.json({ success: false, error: "pulse_id required" }, { status: 400 });
  }

  const pulse = db.prepare(`
    SELECT pe.*, gp.name as gp_name, gp.email as gp_email, gp.practice_name
    FROM pulse_events pe
    JOIN gp_profiles gp ON pe.gp_id = gp.id
    WHERE pe.id = ?
  `).get(Number(pulse_id)) as { id: number; gp_id: number; gp_name: string; gp_email: string; video_url: string } | undefined;

  if (!pulse) {
    return Response.json({ success: false, error: "Pulse not found" }, { status: 404 });
  }

  // Generate a unique token
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

  // Store the token
  db.prepare(`
    INSERT INTO video_tokens (token, pulse_id, gp_email, expires_at, created_at)
    VALUES (?, ?, ?, ?, datetime('now'))
  `).run(token, pulse.id, pulse.gp_email, expiresAt);

  const viewUrl = `/watch/${token}`;

  return Response.json({
    success: true,
    data: {
      token,
      viewUrl,
      expiresAt,
    },
  });
}
