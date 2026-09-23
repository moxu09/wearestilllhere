import { handleEcpayPaymentInfo } from "@/lib/ecpayPaymentInfoRoute";

export async function POST(request: Request) {
  return handleEcpayPaymentInfo(request, "service", true);
}
