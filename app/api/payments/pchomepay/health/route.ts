import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getPchomePayToken } from "@/lib/pchomepay";

type CheckResult = {
  name: string;
  ok: boolean;
  message: string;
};

function hasInvalidEnvValue(value: string | undefined) {
  if (!value) return true;

  return (
    value.includes("你的") ||
    value.includes("請填") ||
    value.includes("貼在這裡") ||
    value.includes("真正的")
  );
}

function checkEnv(name: string, value: string | undefined): CheckResult {
  if (!value) {
    return {
      name,
      ok: false,
      message: `${name} 尚未設定`,
    };
  }

  if (hasInvalidEnvValue(value)) {
    return {
      name,
      ok: false,
      message: `${name} 還是範例文字，請換成真正的值`,
    };
  }

  return {
    name,
    ok: true,
    message: `${name} 已設定`,
  };
}

export async function GET() {
  const checks: CheckResult[] = [];

  checks.push(
    checkEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL)
  );

  checks.push(
    checkEnv("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY)
  );

  checks.push(checkEnv("PCHOMEPAY_APP_ID", process.env.PCHOMEPAY_APP_ID));

  checks.push(checkEnv("PCHOMEPAY_SECRET", process.env.PCHOMEPAY_SECRET));

  checks.push(checkEnv("PCHOMEPAY_API_URL", process.env.PCHOMEPAY_API_URL));

  checks.push(
    checkEnv("NEXT_PUBLIC_SITE_URL", process.env.NEXT_PUBLIC_SITE_URL)
  );

  try {
    const supabase = getSupabaseAdmin();

    const { error: paymentTableError } = await supabase
      .from("platform_payments")
      .select("id", { count: "exact", head: true });

    checks.push({
      name: "platform_payments",
      ok: !paymentTableError,
      message: paymentTableError
        ? `platform_payments 表讀取失敗：${paymentTableError.message}`
        : "platform_payments 表正常",
    });

    const { error: walletTableError } = await supabase
      .from("platform_wallets")
      .select("user_id", { count: "exact", head: true });

    checks.push({
      name: "platform_wallets",
      ok: !walletTableError,
      message: walletTableError
        ? `platform_wallets 表讀取失敗：${walletTableError.message}`
        : "platform_wallets 表正常",
    });

    const { error: txTableError } = await supabase
      .from("platform_wallet_transactions")
      .select("id", { count: "exact", head: true });

    checks.push({
      name: "platform_wallet_transactions",
      ok: !txTableError,
      message: txTableError
        ? `platform_wallet_transactions 表讀取失敗：${txTableError.message}`
        : "platform_wallet_transactions 表正常",
    });
  } catch (error) {
    checks.push({
      name: "supabase_admin",
      ok: false,
      message:
        error instanceof Error
          ? `Supabase Admin 初始化失敗：${error.message}`
          : "Supabase Admin 初始化失敗",
    });
  }

  try {
    const tokenResult = await getPchomePayToken();

    checks.push({
      name: "pchomepay_token",
      ok: Boolean(tokenResult.token),
      message: tokenResult.token
        ? `PChomePay token 取得成功，有效秒數：${tokenResult.expired_in}`
        : "PChomePay token 沒有回傳",
    });
  } catch (error) {
    checks.push({
      name: "pchomepay_token",
      ok: false,
      message:
        error instanceof Error
          ? `PChomePay token 取得失敗：${error.message}`
          : "PChomePay token 取得失敗",
    });
  }

  const ok = checks.every((check) => check.ok);

  return NextResponse.json(
    {
      ok,
      environment: process.env.PCHOMEPAY_API_URL?.includes("sandbox")
        ? "sandbox"
        : "production",
      site_url: process.env.NEXT_PUBLIC_SITE_URL || null,
      checks,
    },
    {
      status: ok ? 200 : 500,
    }
  );
}