import { NextRequest } from "next/server";
import db from "@/lib/db";
import crypto from "crypto";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get("image") as File | null;

    if (!image) {
      return Response.json({ success: false, error: "No image provided" }, { status: 400 });
    }

    // Convert image to base64
    const buffer = Buffer.from(await image.arrayBuffer());
    const base64 = buffer.toString("base64");
    const mimeType = image.type || "image/png";

    // Get all GP names for matching
    const gps = db.prepare("SELECT id, name, practice_name FROM gp_profiles").all() as {
      id: number; name: string; practice_name: string;
    }[];
    const gpNames = gps.map(g => `${g.name} (ID: ${g.id})`).join(", ");

    if (!process.env.OPENAI_API_KEY) {
      return Response.json({
        success: false,
        error: "OPENAI_API_KEY required for schedule extraction. Set it in your .env file.",
      }, { status: 503 });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are extracting dental appointment data from a schedule screenshot for an endodontic practice. Extract EVERY patient appointment visible in the image.

For each appointment, extract:
- patient_initials: First and last initial only (e.g. "J.S."), NEVER the full name
- referring_doctor: The referring GP's name if visible, or "Unknown" if not shown
- procedure_type: The dental procedure (e.g. "Root Canal Therapy", "Apicoectomy", "Re-treatment", "Emergency Pulpectomy", "Consultation", "Pulp Capping")
- tooth_number: The tooth number if visible (e.g. "14", "19", "30"), or "TBD" if not shown
- date_of_service: The date in YYYY-MM-DD format
- time: The appointment time if visible
- notes: Any additional notes visible (e.g. "emergency", "re-treat", "consult")

Known referring GPs in our system: ${gpNames}

If you can match a referring doctor name to one in our system, use the exact name and include the ID.

Return ONLY valid JSON in this exact format, no other text:
{
  "appointments": [
    {
      "patient_initials": "J.S.",
      "referring_doctor": "Dr. Michael Andersen",
      "referring_doctor_id": 1,
      "procedure_type": "Root Canal Therapy",
      "tooth_number": "14",
      "date_of_service": "2026-03-28",
      "time": "9:00 AM",
      "notes": ""
    }
  ],
  "schedule_date": "2026-03-28",
  "total_patients": 8
}`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all patient appointments from this dental schedule screenshot. Return JSON only."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64}`,
                detail: "high",
              }
            }
          ]
        }
      ],
      max_tokens: 2000,
    });

    const raw = response.choices[0].message.content ?? "";

    // Parse JSON from response (handle markdown fences)
    let cleaned = raw.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.split("\n").slice(1).join("\n");
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.slice(0, cleaned.lastIndexOf("```")).trim();
    }

    let extracted;
    try {
      extracted = JSON.parse(cleaned);
    } catch {
      return Response.json({
        success: false,
        error: "Could not parse schedule data. Try a clearer screenshot.",
        raw,
      }, { status: 422 });
    }

    return Response.json({
      success: true,
      data: extracted,
    });
  } catch (err) {
    console.error("[schedule/extract]", err);
    return Response.json({ success: false, error: "Extraction failed" }, { status: 500 });
  }
}
