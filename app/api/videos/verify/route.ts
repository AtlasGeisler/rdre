import { NextRequest } from "next/server";
import db from "@/lib/db";

// Verify a GP's identity before granting video access
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { token, email, last_name } = body;

  if (!token || !email || !last_name) {
    return Response.json({ success: false, error: "Token, email, and last name required" }, { status: 400 });
  }

  const record = db.prepare(`
    SELECT vt.*, pe.video_url, pe.script_text, pe.gp_id,
           gp.name as gp_name, gp.practice_name
    FROM video_tokens vt
    JOIN pulse_events pe ON vt.pulse_id = pe.id
    JOIN gp_profiles gp ON pe.gp_id = gp.id
    WHERE vt.token = ? AND vt.revoked = 0
  `).get(token) as {
    id: number; pulse_id: number; gp_email: string; expires_at: string;
    video_url: string; script_text: string; gp_name: string; practice_name: string;
    viewed_at: string | null;
  } | undefined;

  if (!record) {
    return Response.json({ success: false, error: "Invalid or expired link" }, { status: 403 });
  }

  // Check expiry
  if (new Date(record.expires_at) < new Date()) {
    return Response.json({ success: false, error: "This link has expired. Please contact United Endodontics for a new link." }, { status: 403 });
  }

  // Verify email matches (case-insensitive)
  if (record.gp_email.toLowerCase() !== email.toLowerCase()) {
    return Response.json({ success: false, error: "Email does not match our records" }, { status: 403 });
  }

  // Verify last name matches (case-insensitive, check against GP name)
  const gpLastName = record.gp_name.split(" ").pop()?.toLowerCase() ?? "";
  if (last_name.toLowerCase() !== gpLastName) {
    return Response.json({ success: false, error: "Last name does not match our records" }, { status: 403 });
  }

  // Mark as viewed
  if (!record.viewed_at) {
    db.prepare("UPDATE video_tokens SET viewed_at = datetime('now') WHERE token = ?").run(token);
    // Also update pulse event status to opened
    db.prepare("UPDATE pulse_events SET status = 'opened' WHERE id = ? AND status = 'sent'").run(record.pulse_id);
  }

  // Log the view
  db.prepare("UPDATE video_tokens SET view_count = view_count + 1 WHERE token = ?").run(token);

  return Response.json({
    success: true,
    data: {
      videoUrl: record.video_url,
      gpName: record.gp_name,
      practiceName: record.practice_name,
    },
  });
}
