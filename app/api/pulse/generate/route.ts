import { NextRequest } from "next/server";
import db from "@/lib/db";
import OpenAI from "openai";

function removeEmDashes(text: string): string {
  return text.replace(/\u2014/g, ",").replace(/--/g, ",");
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { gp_id, referral_event_id, patient_name } = body;

  if (!gp_id) {
    return Response.json({ success: false, error: "gp_id required" }, { status: 400 });
  }

  const gp = db.prepare("SELECT * FROM gp_profiles WHERE id = ?").get(Number(gp_id)) as {
    name: string; practice_name: string;
  } | undefined;
  if (!gp) {
    return Response.json({ success: false, error: "GP not found" }, { status: 404 });
  }

  type ReferralRow = { procedure_type: string; tooth_number: string; outcome: string };
  let referral: ReferralRow | null = null;
  if (referral_event_id) {
    referral = db.prepare("SELECT * FROM referral_events WHERE id = ?").get(Number(referral_event_id)) as ReferralRow | null;
  } else {
    referral = db.prepare(
      "SELECT * FROM referral_events WHERE gp_id = ? ORDER BY date_of_service DESC LIMIT 1"
    ).get(Number(gp_id)) as ReferralRow | null;
  }

  const procedure = referral?.procedure_type ?? "Root Canal Therapy";
  const tooth = referral?.tooth_number ?? "unknown";
  const outcome = referral?.outcome ?? "Successful treatment completed";

  // Patient name: first name + last initial (e.g. "Sarah M.")
  // Passed from the UI, or use a placeholder
  const patientRef = patient_name ? String(patient_name).trim() : "";

  if (!process.env.OPENAI_API_KEY) {
    const firstName = gp.name.replace("Dr. ", "").split(" ")[0];
    const p = patientRef || "your patient";
    const stubs = [
      `Hey ${firstName}, just wanted to say thank you. Took great care of ${p}, ${procedure} on number ${tooth} went great. You should expect a detailed report sent over very soon. Really appreciate you.`,
      `${firstName}, quick thank you. Finished up with ${p}, ${procedure} on ${tooth}, ${outcome.toLowerCase()}. I'll have a detailed report over to you shortly. Grateful for the referral.`,
      `Hey ${firstName}, thank you for sending ${p} over. ${procedure}, tooth ${tooth}, went smooth. Detailed report heading your way soon. Always a pleasure. I owe you one.`,
      `${firstName}! Todd here. Just finished with ${p}, ${procedure} on number ${tooth}, everything went well. You should expect a detailed report very soon. Thank you, seriously.`,
      `Hey ${firstName}, grateful for the referral. ${p} was great, ${procedure} on ${tooth} went well. Full report coming your way shortly. Let's grab coffee soon.`,
      `${firstName}, quick one. Thank you for sending ${p}. Number ${tooth}, ${procedure}, ${outcome.toLowerCase()}. Detailed report will be over to you very soon. Appreciate you.`,
      `Hey ${firstName}, thank you. Just wrapped up with ${p}, number ${tooth}. ${outcome}. I'll get a detailed report sent over to you shortly. Talk soon.`,
      `${firstName}! Thank you for thinking of us for ${p}. ${procedure} on ${tooth} went really well. Expect a detailed report very soon. Send the next one over whenever.`,
    ];
    const stub = removeEmDashes(stubs[Math.floor(Math.random() * stubs.length)]);
    return Response.json({ success: true, data: { script: stub, stub: true } });
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const firstName = gp.name.replace("Dr. ", "").split(" ")[0];

  const styles = [
    "grateful-quick", "grateful-personal", "grateful-funny",
    "grateful-clinical", "grateful-warm", "grateful-direct"
  ];
  const style = styles[Math.floor(Math.random() * styles.length)];

  const systemPrompt = `You write VERY SHORT, genuinely grateful video scripts for Dr. Todd Geisler (endodontist, United Endodontics) to thank referring GPs. Rules:

GRATEFUL ABOVE ALL. Todd is sincerely thankful. The GP trusted him with their patient. That means everything. Express real gratitude, not performative.

LENGTH: 15-20 seconds. 40-55 words MAX. Shorter is better. These are quick personal thank-yous, not speeches.

FIRST NAME only. Never "Dr. Last Name."

NEVER use: "I wanted to reach out", "partnership", "valued", "trust you place in our practice", "looking forward to continuing", "leverage", "synergy"

Style for this script: ${style}
- grateful-quick: 3-4 sentences max. Thank them, mention the case briefly, done.
- grateful-personal: mention something human, like "hope the family is doing well" or "we need to catch up"
- grateful-funny: light humor. "You keep sending me the easy ones, I appreciate that" or "I owe you lunch at this point"
- grateful-clinical: briefly compliment their diagnosis or catch. "Great call on that one, the crack was exactly where you said"
- grateful-warm: pure warmth. "Seriously, thank you. Means a lot."
- grateful-direct: ultra short. Thank you, case went great, talk soon. 3 sentences.

Sound like Todd talking to a friend after a good day. Not a script. Not corporate. Real.
${patientRef ? `- Mention the patient by first name and last initial (e.g. "${patientRef}"). This makes it personal and specific.` : "- No patient name available, just say 'your patient'."}
- ALWAYS mention that a detailed report is coming: work in something like "you should expect a detailed report sent over very soon" or "I'll have a full report over to you shortly" or "detailed report heading your way soon". This is non-negotiable, include it every time.`;

  const userPrompt = `${style} script. Todd thanking ${firstName} for referring ${patientRef || "a patient"}. Case: ${procedure}, tooth #${tooth}. Outcome: ${outcome}. 40-55 words MAX. Be genuinely grateful.${patientRef ? ` Mention ${patientRef} by name.` : ""}`;

  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    max_tokens: 300,
  });

  const script = removeEmDashes(completion.choices[0].message.content ?? "");
  return Response.json({ success: true, data: { script, stub: false } });
}
