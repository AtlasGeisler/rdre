import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("video") as File | null;
    const pulseId = formData.get("pulseId") as string | null;
    const gpName = formData.get("gpName") as string | null;

    if (!file) {
      return Response.json({ success: false, error: "No video file provided" }, { status: 400 });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const safeName = (gpName ?? "unknown").toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30);
    const filename = `pulse-${safeName}-${timestamp}.webm`;

    const videosDir = path.join(process.cwd(), "public", "videos");
    await mkdir(videosDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(videosDir, filename);
    await writeFile(filePath, buffer);

    const videoUrl = `/videos/${filename}`;

    // Update pulse event with video URL if pulseId provided
    if (pulseId) {
      const db = (await import("@/lib/db")).default;
      db.prepare("UPDATE pulse_events SET video_url = ? WHERE id = ?").run(videoUrl, Number(pulseId));
    }

    return Response.json({
      success: true,
      data: {
        url: videoUrl,
        filename,
        size: buffer.length,
      },
    });
  } catch (err) {
    console.error("[video upload]", err);
    return Response.json({ success: false, error: "Upload failed" }, { status: 500 });
  }
}
