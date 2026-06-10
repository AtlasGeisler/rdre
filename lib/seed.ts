import Database from "better-sqlite3";
import crypto from "crypto";

function randomHash(): string {
  return crypto.createHash("sha256").update(Math.random().toString()).digest("hex");
}

export function runSeed(db: InstanceType<typeof Database>): void {
  const existing = db.prepare("SELECT COUNT(*) as count FROM gp_profiles").get() as { count: number };
  if (existing.count > 0) return;

  const gps = [
    // Champions (5)
    { name: "Dr. Michael Andersen", practice_name: "Andersen Family Dentistry", email: "mandersen@andersendental.com", phone: "612-555-0101", address: "1201 Hennepin Ave", city: "Minneapolis", state: "MN", zip: "55403" },
    { name: "Dr. Sarah Bjornstad", practice_name: "Lakewood Dental Care", email: "sbjornstad@lakewooddental.com", phone: "651-555-0202", address: "450 White Bear Ave", city: "Saint Paul", state: "MN", zip: "55106" },
    { name: "Dr. James Christopherson", practice_name: "Northside Dental Group", email: "jchristopherson@northsidedental.com", phone: "763-555-0303", address: "8200 Brooklyn Blvd", city: "Brooklyn Park", state: "MN", zip: "55445" },
    { name: "Dr. Patricia Dahl", practice_name: "Dahl Dental Associates", email: "pdahl@dahldental.com", phone: "952-555-0404", address: "6600 France Ave S", city: "Edina", state: "MN", zip: "55435" },
    { name: "Dr. Erik Halvorsen", practice_name: "Lake Minnetonka Dental", email: "ehalvorsen@lmndental.com", phone: "952-555-0505", address: "14415 Wayzata Blvd", city: "Minnetonka", state: "MN", zip: "55305" },
    // Consistent (4)
    { name: "Dr. Laura Johansen", practice_name: "Johansen & Associates Dental", email: "ljohansen@johansendental.com", phone: "612-555-0606", address: "3300 Nicollet Ave", city: "Minneapolis", state: "MN", zip: "55408" },
    { name: "Dr. Robert Karlsson", practice_name: "Riverside Dental Clinic", email: "rkarlsson@riversidedental.com", phone: "651-555-0707", address: "2100 E 7th St", city: "Saint Paul", state: "MN", zip: "55119" },
    { name: "Dr. Amanda Larsen", practice_name: "Southdale Dental Care", email: "alarsen@southdaledental.com", phone: "952-555-0808", address: "7001 York Ave S", city: "Edina", state: "MN", zip: "55435" },
    { name: "Dr. David Magnusson", practice_name: "Magnusson Dental Practice", email: "dmagnusson@magnussondental.com", phone: "763-555-0909", address: "9200 Zane Ave N", city: "Brooklyn Park", state: "MN", zip: "55443" },
    // Occasional (3)
    { name: "Dr. Christine Nelson", practice_name: "Nelson Family Dentistry", email: "cnelson@nelsonfamilydental.com", phone: "651-555-1010", address: "1800 Grand Ave", city: "Saint Paul", state: "MN", zip: "55105" },
    { name: "Dr. Thomas Olson", practice_name: "Olson Dental Group", email: "tolson@olsondental.com", phone: "612-555-1111", address: "4500 Excelsior Blvd", city: "Saint Louis Park", state: "MN", zip: "55416" },
    { name: "Dr. Karen Peterson", practice_name: "White Bear Lake Dental", email: "kpeterson@wbldental.com", phone: "651-555-1212", address: "4685 Highway 61 N", city: "White Bear Lake", state: "MN", zip: "55110" },
    // Dormant (2)
    { name: "Dr. William Sorensen", practice_name: "Sorensen Dental Studio", email: "wsorensen@sorensendentalstudio.com", phone: "763-555-1313", address: "5200 Winnetka Ave N", city: "New Hope", state: "MN", zip: "55428" },
    { name: "Dr. Melissa Thompson", practice_name: "Thompson & Partners Dental", email: "mthompson@thompsonpartners.com", phone: "952-555-1414", address: "100 W Lake St", city: "Wayzata", state: "MN", zip: "55391" },
    // Prospect (1)
    { name: "Dr. Brian Vandenberg", practice_name: "Vandenberg Dental Arts", email: "bvandenberg@vandenbergdental.com", phone: "612-555-1515", address: "2200 Lyndale Ave S", city: "Minneapolis", state: "MN", zip: "55405" },
  ];

  const insertGp = db.prepare(`
    INSERT INTO gp_profiles (name, practice_name, email, phone, address, city, state, zip)
    VALUES (@name, @practice_name, @email, @phone, @address, @city, @state, @zip)
  `);

  const gpIds: number[] = [];
  for (const gp of gps) {
    const result = insertGp.run(gp) as { lastInsertRowid: number };
    gpIds.push(result.lastInsertRowid as number);
  }

  const procedures = ["Root Canal Therapy", "Apicoectomy", "Pulp Capping", "Re-treatment", "Emergency Pulpectomy"];
  const outcomes = [
    "Successful treatment completed",
    "Patient referred back to GP",
    "Additional treatment planned",
    "Excellent prognosis",
    "Requires follow-up",
  ];

  const insertReferral = db.prepare(`
    INSERT INTO referral_events (gp_id, patient_hash, procedure_type, tooth_number, date_of_service, outcome)
    VALUES (@gp_id, @patient_hash, @procedure_type, @tooth_number, @date_of_service, @outcome)
  `);

  // Champions get many recent referrals (indices 0-4)
  // Consistent get moderate recent referrals (indices 5-8)
  // Occasional get a few referrals (indices 9-11)
  // Dormant get old referrals (indices 12-13)
  // Prospect gets none (index 14)

  const referralPlan: { gpIndex: number; daysAgoMin: number; daysAgoMax: number; count: number }[] = [
    // Champions
    { gpIndex: 0, daysAgoMin: 0, daysAgoMax: 90, count: 7 },
    { gpIndex: 0, daysAgoMin: 91, daysAgoMax: 364, count: 6 },
    { gpIndex: 1, daysAgoMin: 0, daysAgoMax: 90, count: 6 },
    { gpIndex: 1, daysAgoMin: 91, daysAgoMax: 364, count: 7 },
    { gpIndex: 2, daysAgoMin: 0, daysAgoMax: 90, count: 5 },
    { gpIndex: 2, daysAgoMin: 91, daysAgoMax: 364, count: 8 },
    { gpIndex: 3, daysAgoMin: 0, daysAgoMax: 90, count: 8 },
    { gpIndex: 3, daysAgoMin: 91, daysAgoMax: 364, count: 5 },
    { gpIndex: 4, daysAgoMin: 0, daysAgoMax: 90, count: 6 },
    { gpIndex: 4, daysAgoMin: 91, daysAgoMax: 364, count: 6 },
    // Consistent
    { gpIndex: 5, daysAgoMin: 0, daysAgoMax: 180, count: 4 },
    { gpIndex: 5, daysAgoMin: 181, daysAgoMax: 364, count: 4 },
    { gpIndex: 6, daysAgoMin: 0, daysAgoMax: 180, count: 5 },
    { gpIndex: 6, daysAgoMin: 181, daysAgoMax: 364, count: 3 },
    { gpIndex: 7, daysAgoMin: 0, daysAgoMax: 180, count: 3 },
    { gpIndex: 7, daysAgoMin: 181, daysAgoMax: 364, count: 4 },
    { gpIndex: 8, daysAgoMin: 0, daysAgoMax: 180, count: 4 },
    { gpIndex: 8, daysAgoMin: 181, daysAgoMax: 364, count: 2 },
    // Occasional
    { gpIndex: 9, daysAgoMin: 0, daysAgoMax: 200, count: 3 },
    { gpIndex: 10, daysAgoMin: 20, daysAgoMax: 300, count: 2 },
    { gpIndex: 11, daysAgoMin: 30, daysAgoMax: 250, count: 3 },
    // Dormant (old referrals, 180+ days ago)
    { gpIndex: 12, daysAgoMin: 200, daysAgoMax: 500, count: 3 },
    { gpIndex: 13, daysAgoMin: 300, daysAgoMax: 600, count: 2 },
  ];

  for (const plan of referralPlan) {
    for (let i = 0; i < plan.count; i++) {
      const range = plan.daysAgoMax - plan.daysAgoMin;
      const offset = Math.floor(Math.random() * range) + plan.daysAgoMin;
      const d = new Date();
      d.setDate(d.getDate() - offset);
      const dateStr = d.toISOString().split("T")[0];
      const tooth = String(Math.floor(Math.random() * 28) + 1);
      insertReferral.run({
        gp_id: gpIds[plan.gpIndex],
        patient_hash: randomHash(),
        procedure_type: procedures[Math.floor(Math.random() * procedures.length)],
        tooth_number: tooth,
        date_of_service: dateStr,
        outcome: outcomes[Math.floor(Math.random() * outcomes.length)],
      });
    }
  }

  // Update tier and referral counts for each GP
  const updateGp = db.prepare(`
    UPDATE gp_profiles SET
      referral_count = @count,
      first_referral_date = @first_date,
      last_referral_date = @last_date,
      tier = @tier,
      relationship_score = @score,
      updated_at = datetime('now')
    WHERE id = @id
  `);

  const today = new Date();
  for (let i = 0; i < gpIds.length; i++) {
    const gpId = gpIds[i];
    const events = db.prepare(
      "SELECT date_of_service FROM referral_events WHERE gp_id = ? ORDER BY date_of_service"
    ).all(gpId) as { date_of_service: string }[];

    const count = events.length;
    if (count === 0) {
      updateGp.run({ id: gpId, count: 0, first_date: null, last_date: null, tier: "prospect", score: 0 });
      continue;
    }

    const firstDate = events[0].date_of_service;
    const lastDate = events[events.length - 1].date_of_service;
    const lastDt = new Date(lastDate);
    const daysSinceLast = Math.floor((today.getTime() - lastDt.getTime()) / (1000 * 60 * 60 * 24));

    // Count referrals in last 365 days
    const cutoff365 = new Date(today);
    cutoff365.setDate(cutoff365.getDate() - 365);
    const recentCount = events.filter(e => new Date(e.date_of_service) >= cutoff365).length;

    let tier: string;
    if (daysSinceLast > 180) {
      tier = "dormant";
    } else if (recentCount >= 12) {
      tier = "champion";
    } else if (recentCount >= 6) {
      tier = "consistent";
    } else if (recentCount >= 2) {
      tier = "occasional";
    } else if (recentCount === 1 && daysSinceLast <= 90) {
      tier = "new";
    } else {
      tier = "occasional";
    }

    const score = Math.min(100, Math.round(recentCount * 5 + (daysSinceLast < 30 ? 20 : daysSinceLast < 90 ? 10 : 0)));

    updateGp.run({ id: gpId, count, first_date: firstDate, last_date: lastDate, tier, score });
  }

  // Add some relationship notes
  const insertNote = db.prepare(`
    INSERT INTO relationship_notes (gp_id, note_type, content, author)
    VALUES (@gp_id, @note_type, @content, @author)
  `);

  insertNote.run({ gp_id: gpIds[0], note_type: "personal", content: "Mike coaches youth hockey. Great conversation starter. Send Xcel Energy news when relevant.", author: "Dr. Geisler" });
  insertNote.run({ gp_id: gpIds[1], note_type: "clinical", content: "Prefers detailed case reports. Fax updates same day as treatment. Very thorough GP.", author: "Dr. Geisler" });
  insertNote.run({ gp_id: gpIds[2], note_type: "administrative", content: "Office manager is Sandra. Always confirm with her before scheduling urgent cases.", author: "Dr. Geisler" });
  insertNote.run({ gp_id: gpIds[3], note_type: "personal", content: "Patricia graduated from U of M same year as me. Great relationship, met at MSDA conference in 2019.", author: "Dr. Geisler" });
}
