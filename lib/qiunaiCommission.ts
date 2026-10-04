import type { SupabaseClient } from "@supabase/supabase-js";

const COMPLETED_STATUSES = ["未入帳", "未發薪", "已入帳", "已發薪", "已完成", "completed"];

export async function getQiunaiReviewCommission(
  admin: SupabaseClient,
  staff: Record<string, unknown>,
  endedAt: string,
  isTip: boolean,
) {
  const at = new Date(endedAt);
  if (!Number.isFinite(at.getTime())) throw new Error("訂單完成日期不正確");
  const tier = String(staff.commission_tier || "");
  const manual = { rate_80: 80, rate_85: 85, rate_90: 90, manager_95: 95 }[tier as "rate_80"];
  let rate = manual || 80;
  if (!manual) {
    if (at < new Date("2026-09-01T00:00:00+08:00")) rate = 90;
    else {
      const taipei = new Date(at.getTime() + 8 * 3600000);
      const year = taipei.getUTCFullYear();
      const month = taipei.getUTCMonth();
      const boundary = (y: number, m: number) => new Date(Date.UTC(y, m, 1) - 8 * 3600000).toISOString();
      const sum = async (column: string, start: string, end: string) => {
        let total = 0;
        for (let from = 0; ; from += 1000) {
          const { data, error } = await admin.from("qiunai_salary_orders")
            .select(column).eq("discord_id", String(staff.discord_id))
            .or("is_deleted.eq.false,is_deleted.is.null")
            .in("status", COMPLETED_STATUSES)
            .gte("order_finished_at", start).lt("order_finished_at", end)
            .order("id", { ascending: true }).range(from, from + 999);
          if (error) throw error;
          total += (data || []).reduce((acc, row) => acc + Number((row as unknown as Record<string, unknown>)[column] || 0), 0);
          if ((data || []).length < 1000) return total;
        }
      };
      const lastYearSalary = await sum("staff_salary", boundary(year - 1, 0), boundary(year, 0));
      if (lastYearSalary >= 100000) rate = 90;
      else if (await sum("order_amount", boundary(year, month - 1), boundary(year, month)) >= 10000) rate = 85;
    }
  }
  const { data: activity, error } = await admin.from("salary_activity_commission_settings")
    .select("activity_rate").eq("app_key", "qiunai")
    .lte("starts_at", at.toISOString()).gt("ends_at", at.toISOString()).maybeSingle();
  if (error) throw error;
  rate = Math.max(rate, Number(activity?.activity_rate || 0));
  return isTip && rate !== 95 ? 90 : rate;
}
