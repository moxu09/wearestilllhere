"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Bell,
  ChevronDown,
  Coins,
  Gift,
  Headphones,
  LogIn,
  Menu,
  ReceiptText,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wallet,
  X,
} from "lucide-react";

type UserState = {
  id: string;
  email: string | null;
  name: string | null;
  role: string | null;
  balance: number;
};

const navItems = [
  { label: "找陪玩", href: "/players" },
  { label: "語音廳", href: "/voice-rooms" },
  { label: "送禮打賞", href: "/gifts/send" },
  { label: "我的錢包", href: "/wallet" },
];

export default function PlatformTopNav() {
  const [user, setUser] = useState<UserState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUser(null);
        setLoaded(true);
        return;
      }

      const { data: profile } = await supabase
        .from("platform_profiles")
        .select("role, display_name")
        .eq("id", user.id)
        .maybeSingle();

      const { data: wallet } = await supabase
        .from("platform_wallets")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();

      setUser({
        id: user.id,
        email: user.email ?? null,
        name:
          profile?.display_name ||
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.user_metadata?.user_name ||
          user.email ||
          "會員",
        role: profile?.role || "customer",
        balance: wallet?.balance || 0,
      });

      setLoaded(true);
    }

    loadUser();

    const { data } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const isPlayer = user?.role === "player";
  const isAdmin = user?.role === "admin" || user?.role === "staff";

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-slate-200/80 bg-white/80 text-slate-950 shadow-sm backdrop-blur-2xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl bg-violet-300 opacity-50 blur-lg" />
              <div className="relative flex h-11 w-11 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-lg shadow-violet-200">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>

            <div className="hidden leading-tight sm:block">
              <p className="text-base font-black tracking-wide">深夜不關燈</p>
              <p className="text-xs text-slate-500">We Are Still Here</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-2xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-violet-50 hover:text-violet-700"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="hidden min-w-[260px] max-w-sm flex-1 px-8 xl:block">
          <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 focus-within:border-violet-300 focus-within:bg-white">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              placeholder="搜尋陪玩師、禮物、語音廳..."
              className="w-full bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <a
            href="/apply-player"
            className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-bold text-violet-700 transition hover:bg-violet-100"
          >
            申請成為陪玩師
          </a>

          {!loaded ? null : user ? (
            <>
              <a
                href="/wallet"
                className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-700"
              >
                <Coins className="h-4 w-4" />
                {user.balance.toLocaleString()} ASD
              </a>

              <button className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50">
                <Bell className="h-4 w-4" />
              </button>

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm transition hover:bg-slate-50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                    <UserRound className="h-4 w-4" />
                  </div>
                  <span className="max-w-[120px] truncate text-slate-700">
                    {user.name}
                  </span>
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-12 w-72 overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-2xl">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {user.name}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {user.email || "社群登入會員"}
                      </p>
                    </div>

                    <MenuSection title="會員功能" />

                    <MenuLink href="/member" icon={<UserRound className="h-4 w-4" />}>
                      會員中心
                    </MenuLink>

                    <MenuLink href="/member/orders" icon={<ReceiptText className="h-4 w-4" />}>
                      我的訂單
                    </MenuLink>

                    <MenuLink href="/wallet" icon={<Wallet className="h-4 w-4" />}>
                      我的錢包
                    </MenuLink>

                    <MenuLink href="/gifts/send" icon={<Gift className="h-4 w-4" />}>
                      送禮打賞
                    </MenuLink>

                    {isPlayer && (
                      <>
                        <MenuSection title="陪玩師功能" />

                        <MenuLink
                          href="/player-center"
                          icon={<Headphones className="h-4 w-4" />}
                        >
                          陪玩師中心
                        </MenuLink>

                        <MenuLink
                          href="/player-center/orders"
                          icon={<ReceiptText className="h-4 w-4" />}
                        >
                          我的接單
                        </MenuLink>

                        <MenuLink
                          href="/player-center/gifts"
                          icon={<Gift className="h-4 w-4" />}
                        >
                          收禮紀錄
                        </MenuLink>
                      </>
                    )}

                    {isAdmin && (
                      <>
                        <MenuSection title="管理員功能" />

                        <MenuLink
                          href="/admin"
                          icon={<ShieldCheck className="h-4 w-4" />}
                        >
                          管理後台
                        </MenuLink>

                        <MenuLink
                          href="/admin/orders"
                          icon={<ReceiptText className="h-4 w-4" />}
                        >
                          訂單管理
                        </MenuLink>

                        <MenuLink
                          href="/admin/player-applications"
                          icon={<UserRound className="h-4 w-4" />}
                        >
                          陪玩師審核
                        </MenuLink>
                      </>
                    )}

                    <button
                      onClick={logout}
                      className="mt-2 w-full rounded-2xl px-4 py-2.5 text-left text-sm font-semibold text-red-500 transition hover:bg-red-50"
                    >
                      登出
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <a
              href="/login"
              className="flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500"
            >
              <LogIn className="h-4 w-4" />
              登入 / 註冊
            </a>
          )}
        </div>

        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white md:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <div className="grid gap-2">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-violet-50"
              >
                {item.label}
              </a>
            ))}

            <a
              href="/apply-player"
              className="rounded-2xl bg-violet-50 px-4 py-3 text-sm font-bold text-violet-700"
            >
              申請成為陪玩師
            </a>

            {user ? (
              <>
                <MobileDivider />

                <MobileLink href="/member">會員中心</MobileLink>
                <MobileLink href="/member/orders">我的訂單</MobileLink>
                <MobileLink href="/wallet">我的錢包</MobileLink>
                <MobileLink href="/gifts/send">送禮打賞</MobileLink>

                {isPlayer && (
                  <>
                    <MobileDivider />
                    <MobileLink href="/player-center">陪玩師中心</MobileLink>
                    <MobileLink href="/player-center/orders">我的接單</MobileLink>
                    <MobileLink href="/player-center/gifts">收禮紀錄</MobileLink>
                  </>
                )}

                {isAdmin && (
                  <>
                    <MobileDivider />
                    <MobileLink href="/admin">管理後台</MobileLink>
                    <MobileLink href="/admin/orders">訂單管理</MobileLink>
                    <MobileLink href="/admin/player-applications">
                      陪玩師審核
                    </MobileLink>
                  </>
                )}

                <button
                  onClick={logout}
                  className="rounded-2xl px-4 py-3 text-left text-sm font-bold text-red-500 hover:bg-red-50"
                >
                  登出
                </button>
              </>
            ) : (
              <a
                href="/login"
                className="rounded-2xl bg-violet-600 px-4 py-3 text-center text-sm font-bold text-white"
              >
                登入 / 註冊
              </a>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function MenuSection({ title }: { title: string }) {
  return (
    <p className="px-4 pb-1 pt-3 text-[11px] font-black tracking-widest text-slate-400">
      {title}
    </p>
  );
}

function MenuLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-violet-50 hover:text-violet-700"
    >
      <span className="text-slate-400">{icon}</span>
      {children}
    </a>
  );
}

function MobileLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className="rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-violet-50"
    >
      {children}
    </a>
  );
}

function MobileDivider() {
  return <div className="my-2 border-t border-slate-100" />;
}
