import { createHmac, timingSafeEqual } from 'node:crypto';
import { getEcpayConfig } from '@/lib/ecpay';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { inquireEcpayService } from '@/lib/ecpayInquiry';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  const headers = { 'Cache-Control': 'no-store' };
  try {
    if (Number(request.headers.get('content-length') || 0) > 2048) return Response.json({ error: '請求過大' }, { status: 413, headers });
    const raw = await request.text();
    if (raw.length > 2048) return Response.json({ error: '請求過大' }, { status: 413, headers });
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const signature = request.headers.get('x-ecpay-bot-signature') || '';
    if (!secret || !/^[a-f0-9]{64}$/.test(signature) || !timingSafeEqual(Buffer.from(signature, 'hex'), createHmac('sha256', secret).update(raw).digest()))
      return Response.json({ error: '未授權' }, { status: 401, headers });
    const input = JSON.parse(raw);
    if (!Number.isInteger(input.timestamp) || Math.abs(Date.now() / 1000 - input.timestamp) > 300 || !['manual', 'scheduled'].includes(input.source))
      return Response.json({ error: '請求無效或已過期' }, { status: 400, headers });
    const result = await inquireEcpayService(getSupabaseAdmin(), getEcpayConfig(), input);
    return Response.json(result, { headers });
  } catch {
    return Response.json({ error: '無法完成查單，請稍後重試或聯繫客服，勿重複付款' }, { status: 400, headers });
  }
}
