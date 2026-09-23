import { apiError, requireSiteAdmin } from "@/lib/serverAuth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { admin } = await requireSiteAdmin(request);
    const orders: Array<{
      id: string;
      order_no: string;
      customer_name: string;
      phone: string;
      shipping_provider: string;
      store_name: string;
      items: unknown;
      total_amount: number;
      payment_method: string;
      status: string;
      created_at: string;
      paid_at: string | null;
    }> = [];

    // Supabase caps a single response; page through every row for exact totals.
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await admin
        .from("merchandise_orders")
        .select("id, order_no, customer_name, phone, shipping_provider, store_name, items, total_amount, payment_method, status, created_at, paid_at")
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(offset, offset + 999);
      if (error) throw error;
      orders.push(...(data || []));
      if (!data || data.length < 1000) break;
    }

    return Response.json({
      summary: {
        total: orders.length,
        pending: orders.filter((order) => order.status === "pending").length,
        paid: orders.filter((order) => order.status === "paid").length,
        failed: orders.filter((order) => order.status === "failed").length,
        refunded: orders.filter((order) => order.status === "refunded").length,
        paidAmount: orders
          .filter((order) => order.status === "paid")
          .reduce((sum, order) => sum + Number(order.total_amount || 0), 0),
      },
      orders: orders.slice(0, 200),
    });
  } catch (error) {
    return apiError(error);
  }
}
