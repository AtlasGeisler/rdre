import { NextRequest } from "next/server";
import db from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { gp_id, note_type, content, author } = body;

  if (!gp_id || !content) {
    return Response.json({ success: false, error: "gp_id and content required" }, { status: 400 });
  }

  const result = db.prepare(`
    INSERT INTO relationship_notes (gp_id, note_type, content, author)
    VALUES (?, ?, ?, ?)
  `).run(gp_id, note_type ?? "personal", content, author ?? "Dr. Geisler") as { lastInsertRowid: number };

  const note = db.prepare("SELECT * FROM relationship_notes WHERE id = ?").get(result.lastInsertRowid);
  return Response.json({ success: true, data: note }, { status: 201 });
}
