import { NextRequest } from "next/server";
import db from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { video_url, status, script_text } = body;

  const updates: string[] = [];
  const values: unknown[] = [];

  if (video_url !== undefined) { updates.push("video_url = ?"); values.push(video_url); }
  if (script_text !== undefined) { updates.push("script_text = ?"); values.push(script_text); }
  if (status !== undefined) {
    updates.push("status = ?");
    values.push(status);
    if (status === "sent") {
      updates.push("email_sent_at = datetime('now')");
    }
  }

  if (updates.length === 0) {
    return Response.json({ success: false, error: "No fields to update" }, { status: 400 });
  }

  values.push(Number(id));
  db.prepare(`UPDATE pulse_events SET ${updates.join(", ")} WHERE id = ?`).run(...values);
  const pulse = db.prepare("SELECT * FROM pulse_events WHERE id = ?").get(Number(id));
  return Response.json({ success: true, data: pulse });
}
