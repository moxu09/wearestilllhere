"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Coins,
  CreditCard,
  Loader2,
  Lock,
  MessageSquareText,
  ReceiptText,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wallet,
  XCircle,
} from "lucide-react";

type Profile = {
  id: string;
  role: string | null;
  display_name: string | null;
};

type TopupRequest = {
  id: string;
  user_id: string;
  amount: number;
  payment_method: "transfer" | "card" | "manual";
  status: "pending" | "approved" | "rejected" | "cancelled";
  payer_name: string | null;
  payment_note: string | null;
  review_note: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

type MemberProfile = {
  id: string;
  display_name: string | null;
  role: string | null;
};

type StatusFilter = "all" | TopupRequest["status"];
type MethodFilter = "all" | TopupRequest["payment_method"];

const paymentMethodLabel: Record<TopupRequest["payment_method"], string> = {
  transfer: "轉帳 / 匯款",
  card: "刷卡",
  manual: "其他付款",
};

const statusLabel: Record<TopupRequest["status"], string> = {
  pending: "待審核",
  approved: "已入帳",
  rejected: "已拒絕",
  cancelled: "已取消",
};

export default function AdminTopupsPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<TopupRequest[]>([]);
  const [members, setMembers] = useState<Record<string, MemberProfile>>({});
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [methodFilter, setMethodFilter] = useState<MethodFilter>("all");
  const [reviewNote, setReviewNote] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isAdmin = profile?.role === "admin" || profile?.role === "staff";

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const member = members[request.user_id];

      const text = [
        request.id,
        request.user_id,
        member?.display_name,
        request.payer_name,
        request.payment_note,
        request.review_note,
        paymentMethodLabel[request.payment_method],
        statusLabel[request.status],
        String(request.amount),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchKeyword = keyword.trim()
        ? text.includes(keyword.trim().toLowerCase())
        : true;

      const matchStatus =
        statusFilter === "all" ? true : request.status === statusFilter;

      const matchMethod =
        methodFilter === "all" ? true : request.payment_method === methodFilter;

      return matchKeyword && matchStatus && matchMethod;
    });
  }, [requests, members, keyword, statusFilter, methodFilter]);

  const pendingCount = requests.filter((request) => request.status === "pending").length;

  const approvedCount = requests.filter((request) => request.status === "approved").length;

  const approvedAmount = requests
    .filter((request) => request.status === "approved")
    .reduce((sum, request) => sum + request.amount, 0);

  const pendingAmount = requests
    .filter((request) => request.status === "pending")
    .reduce((sum, request) => sum + request.amount, 0);

  useEffect(() => {
    loadPage();
  }, []);

  async function loadPage() {
    setLoading(true);
    setError("");
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      setError("讀取登入狀態失敗：" + userError.message);
      setLoading(false);
      return;
    }

    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("platform_profiles")
      .select("id, role, display_name")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      setError("讀取管理員資料失敗：" + profileError.message);
      setLoading(false);
      return;
    }

    setProfile(profileData as Profile | null);

    if (profileData?.role !== "admin" && profileData?.role !== "staff") {
      setLoading(false);
      return;
    }

    const { data: requestData, error: requestError } = await supabase
      .from("platform_topup_requests")
      .select(
        `
        id,
        user_id,
        amount,
        payment_method,
        status,
        payer_name,
        payment_note,
        review_note,
        reviewed_by,
        reviewed_at,
        created_at,
        updated_at
      `
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (requestError) {
      setError("讀取儲值申請失敗：" + requestError.message);
      setLoading(false);
      return;
    }

    const rows = (requestData || []) as TopupRequest[];
    setRequests(rows);

    const userIds = Array.from(new Set(rows.map((request) => request.user_id)));

    if (userIds.length > 0) {
      const { data: memberData } = await supabase
        .from("platform_profiles")
        .select("id, display_name, role")
        .in("id", userIds);

      const memberMap: Record<string, MemberProfile> = {};

      ((memberData || []) as MemberProfile[]).forEach((member) => {
        memberMap[member.id] = member;
      });

      setMembers(memberMap);
    } else {
      setMembers({});
    }

    setLoading(false);
  }

  async function approveTopup(request: TopupRequest) {
    const ok = window.confirm(
      `確定要確認這筆 ${request.amount.toLocaleString()} ASD 儲值入帳嗎？`
    );

    if (!ok) return;

    setBusyId(request.id);
    setError("");
    setMessage("");

    const { error } = await supabase.rpc("platform_admin_approve_topup", {
      p_request_id: request.id,
      p_review_note: reviewNote[request.id] || "儲值已確認入帳",
    });

    if (error) {
      setError("確認儲值失敗：" + error.message);
      setBusyId(null);
      return;
    }

    setMessage(`已確認 ${request.amount.toLocaleString()} ASD 儲值入帳。`);
    setBusyId(null);
    await loadPage();
  }

  async function rejectTopup(request: TopupRequest) {
    const ok = window.confirm(
      `確定要拒絕這筆 ${request.amount.toLocaleString()} ASD 儲值申請嗎？`
    );

    if (!ok) return;

    setBusyId(request.id);
    setError("");
    setMessage("");

    const { error } = await supabase.rpc("platform_admin_reject_topup", {
      p_request_id: request.id,
      p_review_note: reviewNote[request.id] || "儲值申請未通過",
    });

    if (error) {
      setError("拒絕儲值失敗：" + error.message);
      setBusyId(null);
      return;
    }

    setMessage(`已拒絕 ${request.amount.toLocaleString()} ASD 儲值申請。`);
    setBusyId(null);
    await loadPage();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f3ec] px-4 py-10 text-slate-950">
        <div className="mx-auto flex max-w-7xl items-center justify-center py-32">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-violet-600" />
          <span className="text-sm text-slate-500">讀取儲值審核頁中...</span>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <AccessCard
        icon={<Lock className="h-8 w-8" />}
        title="請先登入管理員帳號"
        desc="登入後才能查看儲值審核頁。"
        buttonText="前往登入"
        buttonHref="/login?next=/admin/topups"
      />
    );
  }

  if (!isAdmin) {
    return (
      <AccessCard
        icon={<ShieldCheck className="h-8 w-8" />}
        title="你沒有管理員權限"
        desc="請先到 Supabase 把你的 platform_profiles.role 設為 admin 或 staff。"
        buttonText="回首頁"
        buttonHref="/"
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f3ec] text-slate-950">
      <section className="relative overflow-hidden">
        <div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-violet-200/70 blur-3xl" />
        <div className="absolute right-[-120px] top-20 h-96 w-96 rounded-full bg-fuchsia-200/60 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-10">
          {message && (
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          <div className="mb-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/70 px-4 py-2 text-sm font-bold text-violet-700 shadow-sm">
                <Wallet className="h-4 w-4" />
                ADMIN TOPUPS
              </div>

              <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl">
                儲值審核
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-8 text-slate-600 md:text-base">
                會員送出儲值申請後，管理員在這裡確認收款。確認後系統會自動增加會員 ASD 餘額並建立交易紀錄。
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <AdminStat label="待審核" value={String(pendingCount)} icon={<Clock />} />
              <AdminStat label="待入帳金額" value={pendingAmount.toLocaleString()} icon={<Coins />} />
              <AdminStat label="已入帳" value={String(approvedCount)} icon={<CheckCircle2 />} />
              <AdminStat label="已入帳金額" value={approvedAmount.toLocaleString()} icon={<Wallet />} />
            </div>
          </div>

          <section className="mb-8 rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-xl backdrop-blur-xl">
            <div className="grid gap-4 lg:grid-cols-[1fr_220px_220px_auto]">
              <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 focus-within:border-violet-300 focus-within:bg-white">
                <Search className="h-5 w-5 text-slate-400" />
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="搜尋會員、付款人、金額、備註..."
                  className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-slate-400"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-violet-300 focus:bg-white"
              >
                <option value="all">全部審核狀態</option>
                <option value="pending">待審核</option>
                <option value="approved">已入帳</option>
                <option value="rejected">已拒絕</option>
                <option value="cancelled">已取消</option>
              </select>

              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value as MethodFilter)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-violet-300 focus:bg-white"
              >
                <option value="all">全部付款方式</option>
                <option value="transfer">轉帳 / 匯款</option>
                <option value="card">刷卡</option>
                <option value="manual">其他付款</option>
              </select>

              <button
                onClick={loadPage}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                重新整理
              </button>
            </div>
          </section>

          {filteredRequests.length === 0 ? (
            <section className="rounded-[2rem] border border-white/70 bg-white/80 p-10 text-center shadow-xl backdrop-blur-xl">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-50 text-violet-700">
                <ReceiptText className="h-8 w-8" />
              </div>

              <h2 className="text-2xl font-black text-slate-950">
                目前沒有儲值申請
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
                會員從 /wallet/topup 送出儲值申請後，這裡會顯示待審核資料。
              </p>
            </section>
          ) : (
            <div className="grid gap-6">
              {filteredRequests.map((request) => (
                <TopupCard
                  key={request.id}
                  request={request}
                  member={members[request.user_id]}
                  busy={busyId === request.id}
                  note={reviewNote[request.id] || ""}
                  onNoteChange={(value) =>
                    setReviewNote((prev) => ({
                      ...prev,
                      [request.id]: value,
                    }))
                  }
                  onApprove={() => approveTopup(request)}
                  onReject={() => rejectTopup(request)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function TopupCard({
  request,
  member,
  busy,
  note,
  onNoteChange,
  onApprove,
  onReject,
}: {
  request: TopupRequest;
  member?: MemberProfile;
  busy: boolean;
  note: string;
  onNoteChange: (value: string) => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const canReview = request.status === "pending";

  return (
    <article className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-xl backdrop-blur-xl">
      <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
        <div className="relative bg-gradient-to-br from-violet-100 via-fuchsia-50 to-blue-100 p-6">
          <div className="absolute left-8 top-8 h-28 w-28 rounded-full bg-violet-200/70 blur-3xl" />
          <div className="absolute bottom-10 right-8 h-28 w-28 rounded-full bg-fuchsia-200/70 blur-3xl" />

          <div className="relative">
            <StatusPill status={request.status} />

            <div className="mt-5 flex h-24 w-24 items-center justify-center overflow-hidden rounded-[1.7rem] border-4 border-white bg-white text-violet-700 shadow-xl">
              <Coins className="h-11 w-11" />
            </div>

            <h2 className="mt-5 text-4xl font-black text-violet-700">
              {request.amount.toLocaleString()}
            </h2>

            <p className="mt-1 text-sm font-black text-slate-600">ASD</p>

            <p className="mt-4 text-sm font-semibold text-slate-500">
              {paymentMethodLabel[request.payment_method]}
            </p>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <InfoBox
              label="會員"
              value={member?.display_name || request.user_id.slice(0, 8)}
              icon={<UserRound />}
            />
            <InfoBox
              label="付款方式"
              value={paymentMethodLabel[request.payment_method]}
              icon={<CreditCard />}
            />
            <InfoBox
              label="狀態"
              value={statusLabel[request.status]}
              icon={<ShieldCheck />}
            />
            <InfoBox
              label="送出時間"
              value={new Date(request.created_at).toLocaleString("zh-TW")}
              icon={<Clock />}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <section className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm">
                  <MessageSquareText className="h-5 w-5" />
                </div>
                <h3 className="font-black text-slate-950">付款資訊</h3>
              </div>

              <div className="grid gap-3">
                <DetailLine label="儲值金額" value={`${request.amount.toLocaleString()} ASD`} />
                <DetailLine label="付款方式" value={paymentMethodLabel[request.payment_method]} />
                <DetailLine label="付款人 / 後五碼" value={request.payer_name || "未填寫"} />
                <DetailLine label="會員 ID" value={request.user_id} />
              </div>

              <div className="mt-4 rounded-2xl bg-white p-4 text-sm leading-7 text-slate-600 shadow-sm">
                <p className="font-black text-slate-900">付款備註</p>
                <p className="mt-2 whitespace-pre-wrap">
                  {request.payment_note || "會員沒有填寫付款備註。"}
                </p>
              </div>

              {request.review_note && (
                <div className="mt-4 rounded-2xl bg-violet-50 p-4 text-sm leading-7 text-violet-700">
                  <p className="font-black">審核備註</p>
                  <p className="mt-2 whitespace-pre-wrap">{request.review_note}</p>
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="font-black text-slate-950">審核操作</h3>
              </div>

              {canReview ? (
                <div className="grid gap-3">
                  <textarea
                    value={note}
                    onChange={(e) => onNoteChange(e.target.value)}
                    placeholder="審核備註，例如：末五碼確認無誤 / 金額不符"
                    rows={4}
                    className="resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 outline-none transition focus:border-violet-300"
                  />

                  <button
                    onClick={onApprove}
                    disabled={busy}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500 disabled:opacity-60"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    確認入帳
                  </button>

                  <button
                    onClick={onReject}
                    disabled={busy}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-red-100 transition hover:bg-red-400 disabled:opacity-60"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    拒絕申請
                  </button>
                </div>
              ) : (
                <div className="rounded-2xl bg-white p-4 text-sm font-bold text-slate-500 shadow-sm">
                  這筆儲值申請已處理完成。
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </article>
  );
}

function StatusPill({ status }: { status: TopupRequest["status"] }) {
  const style =
    status === "approved"
      ? "bg-emerald-50 text-emerald-700"
      : status === "rejected"
      ? "bg-red-50 text-red-600"
      : status === "cancelled"
      ? "bg-slate-100 text-slate-500"
      : "bg-amber-50 text-amber-700";

  return (
    <div className={`inline-flex rounded-full px-3 py-1 text-xs font-black shadow-sm ${style}`}>
      {statusLabel[status]}
    </div>
  );
}

function AccessCard({
  icon,
  title,
  desc,
  buttonText,
  buttonHref,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  buttonText: string;
  buttonHref: string;
}) {
  return (
    <main className="min-h-screen bg-[#f7f3ec] px-4 py-16 text-slate-950">
      <section className="mx-auto max-w-xl rounded-[2rem] border border-white/70 bg-white/80 p-8 text-center shadow-xl backdrop-blur-xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-50 text-violet-700">
          {icon}
        </div>

        <p className="text-sm font-bold text-violet-600">ADMIN</p>
        <h1 className="mt-2 text-3xl font-black">{title}</h1>
        <p className="mt-4 text-sm leading-7 text-slate-500">{desc}</p>

        <a
          href={buttonHref}
          className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500"
        >
          {buttonText}
          <ArrowRight className="h-5 w-5" />
        </a>
      </section>
    </main>
  );
}

function AdminStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-xl backdrop-blur-xl">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </div>
      <p className="text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{label}</p>
    </div>
  );
}

function InfoBox({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm [&_svg]:h-4 [&_svg]:w-4">
        {icon}
      </div>
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-1 line-clamp-2 text-sm font-black text-slate-800">
        {value}
      </p>
    </div>
  );
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3 text-sm shadow-sm">
      <span className="shrink-0 font-semibold text-slate-500">{label}</span>
      <span className="break-all text-right font-black text-slate-900">{value}</span>
    </div>
  );
}