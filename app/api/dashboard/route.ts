import db from "@/lib/db";

export async function GET() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).toISOString().split("T")[0];
  const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0];

  const totalGps = (db.prepare("SELECT COUNT(*) as count FROM gp_profiles").get() as { count: number }).count;
  const thisMonth = (db.prepare("SELECT COUNT(*) as count FROM referral_events WHERE date_of_service >= ?").get(startOfMonth) as { count: number }).count;
  const thisQuarter = (db.prepare("SELECT COUNT(*) as count FROM referral_events WHERE date_of_service >= ?").get(startOfQuarter) as { count: number }).count;
  const thisYear = (db.prepare("SELECT COUNT(*) as count FROM referral_events WHERE date_of_service >= ?").get(startOfYear) as { count: number }).count;

  const tierRows = db.prepare("SELECT tier, COUNT(*) as count FROM gp_profiles GROUP BY tier").all() as { tier: string; count: number }[];
  const tierDistribution: Record<string, number> = {};
  for (const row of tierRows) {
    tierDistribution[row.tier] = row.count;
  }

  const recentReferrals = db.prepare(`
    SELECT r.*, g.name as gp_name, g.practice_name
    FROM referral_events r
    JOIN gp_profiles g ON r.gp_id = g.id
    ORDER BY r.date_of_service DESC
    LIMIT 10
  `).all();

  const topGps = db.prepare(`
    SELECT * FROM gp_profiles ORDER BY referral_count DESC LIMIT 5
  `).all();

  return Response.json({
    success: true,
    data: {
      total_gps: totalGps,
      referrals_this_month: thisMonth,
      referrals_this_quarter: thisQuarter,
      referrals_this_year: thisYear,
      tier_distribution: tierDistribution,
      recent_referrals: recentReferrals,
      top_gps: topGps,
    },
  });
}
