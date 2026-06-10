import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  if (username === "admin" && password === "amsalp") {
    const session = await getSession();
    session.user = { name: "Dr. Geisler" };
    await session.save();
    return Response.json({ success: true });
  }

  return Response.json({ success: false, error: "Invalid credentials" }, { status: 401 });
}
