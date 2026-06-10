import { NextRequest } from "next/server";
import db from "@/lib/db";
import crypto from "crypto";

interface Appointment {
  patient_initials: string;
  referring_doctor: string;
  referring_doctor_id?: number;
  procedure_type: string;
  tooth_number: string;
  date_of_service: string;
  time?: string;
  notes?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const appointments: Appointment[] = body.appointments ?? [];

    if (!appointments.length) {
      return Response.json({ success: false, error: "No appointments to import" }, { status: 400 });
    }

    const results: { imported: number; skipped: number; errors: string[] } = {
      imported: 0,
      skipped: 0,
      errors: [],
    };

    const insertRef = db.prepare(`
      INSERT INTO referral_events (gp_id, patient_hash, procedure_type, tooth_number, date_of_service, outcome, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    for (const apt of appointments) {
      try {
        // Find or skip GP
        let gpId = apt.referring_doctor_id;
        if (!gpId && apt.referring_doctor && apt.referring_doctor !== "Unknown") {
          const gp = db.prepare("SELECT id FROM gp_profiles WHERE name LIKE ?").get(`%${apt.referring_doctor.replace("Dr. ", "")}%`) as { id: number } | undefined;
          gpId = gp?.id;
        }

        if (!gpId) {
          results.skipped++;
          results.errors.push(`Skipped ${apt.patient_initials}: no matching GP for "${apt.referring_doctor}"`);
          continue;
        }

        // Generate patient hash from initials + date (de-identified)
        const patientHash = crypto.createHash("sha256")
          .update(`${apt.patient_initials}-${apt.date_of_service}-${apt.tooth_number}-${Date.now()}`)
          .digest("hex");

        insertRef.run(
          gpId,
          patientHash,
          apt.procedure_type || "Consultation",
          apt.tooth_number || "TBD",
          apt.date_of_service,
          "Pending",
          apt.notes || null,
        );

        results.imported++;

        // Update GP referral count and last referral date
        db.prepare(`
          UPDATE gp_profiles
          SET referral_count = (SELECT COUNT(*) FROM referral_events WHERE gp_id = ?),
              last_referral_date = ?,
              updated_at = datetime('now')
          WHERE id = ?
        `).run(gpId, apt.date_of_service, gpId);

      } catch (e) {
        results.errors.push(`Error importing ${apt.patient_initials}: ${String(e)}`);
      }
    }

    return Response.json({ success: true, data: results });
  } catch (err) {
    console.error("[schedule/import]", err);
    return Response.json({ success: false, error: "Import failed" }, { status: 500 });
  }
}
