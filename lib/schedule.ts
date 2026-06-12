// Agent schedules. The scheduler runs in IST mornings: a Vercel cron fires
// daily, and wake-on-visit covers the gap when no service key is configured.
// "Due" means: the schedule matches today (IST) and it hasn't run today yet.

export type Schedule = { freq: "daily" | "weekly"; day?: number };

export const DAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

const IST_OFFSET_MS = 5.5 * 3600 * 1000;
const istDay = (d: Date) => new Date(d.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);

export function isDue(
  schedule: Schedule | null,
  lastScheduledAt: string | null,
  now = new Date(),
): boolean {
  if (!schedule || (schedule.freq !== "daily" && schedule.freq !== "weekly")) return false;
  const istNow = new Date(now.getTime() + IST_OFFSET_MS);
  if (schedule.freq === "weekly" && istNow.getUTCDay() !== (schedule.day ?? 1)) return false;
  if (!lastScheduledAt) return true;
  return istDay(new Date(lastScheduledAt)) < istDay(now);
}

export const describeSchedule = (s: Schedule) =>
  s.freq === "daily"
    ? "every morning"
    : `every ${DAY_NAMES[s.day ?? 1]} morning`;
