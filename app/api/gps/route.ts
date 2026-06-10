import { NextRequest } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const gps = db.prepare("SELECT * FROM gp_profiles ORDER BY referral_count DESC").all();
  return Response.json({ success: true, data: gps });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, practice_name, email, phone, address, city, state, zip, specialty } = body;

  if (!name || !practice_name) {
    return Response.json({ success: false, error: "Name and practice name are required" }, { status: 400 });
  }

  const result = db.prepare(`
    INSERT INTO gp_profiles (name, practice_name, email, phone, address, city, state, zip, specialty)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, practice_name, email, phone, address, city, state, zip, specialty ?? "General Dentistry") as { lastInsertRowid: number };

  const gp = db.prepare("SELECT * FROM gp_profiles WHERE id = ?").get(result.lastInsertRowid);
  return Response.json({ success: true, data: gp }, { status: 201 });
}
