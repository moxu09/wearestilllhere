"use client";

import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  Camera,
  Clock3,
  ExternalLink,
  Gamepad2,
  Headphones,
  Mail,
  Menu,
  MessageCircle,
  Package,
  Pause,
  Play,
  ShieldCheck,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import ThanksWall from "./components/ThanksWall";
import HomePlayers from "./components/HomePlayers";
import MerchandiseDetailModal from "./components/MerchandiseDetailModal";
import MerchandiseCart from "./components/MerchandiseCart";
import CommercePolicyLinks from "./components/CommercePolicyLinks";
import type { SiteContentItem } from "@/lib/siteContent";
import {
  getMerchandiseProduct,
  getMerchandiseSlugFromTitle,
  isWebsiteDesignTitle,
  type MerchandiseProduct,
} from "@/lib/merchandiseCatalog";

const discordUrl = "https://discord.gg/tXNnXWMHbJ";
const flightSearchUrl = "https://flights.wearestilllhere.com";
const websiteDesignUrl = "https://design.wearestilllhere.com";

const headerNavItems = [
  { label: "服務", href: "#services" },
  { label: "商品", href: "#merchandise" },
  { label: "介紹", href: "#players" },
  { label: "活動", href: "#lottery" },
  { label: "聯絡", href: "#contact" },
  { label: "隱私權", href: "/policies/privacy" },
  { label: "退換貨", href: "/policies/returns" },
  { label: "付款說明", href: "/policies/payment" },
] as const;

const priceSlides = [
  {
    title: "三角洲行動",
    src: "/home/prices/delta-force.png",
  },
  {
    title: "語音聊天",
    src: "/home/prices/voice-chat.png",
  },
  {
    title: "特戰英豪代打",
    src: "/home/prices/valorant-boost.png",
  },
  {
    title: "Steam 遊戲",
    src: "/home/prices/steam.png",
  },
  {
    title: "PUBG Mobile",
    src: "/home/prices/pubg-mobile.png",
  },
  {
    title: "Apex 英雄",
    src: "/home/prices/apex.png",
  },
  {
    title: "第五人格",
    src: "/home/prices/identity-v.png",
  },
  {
    title: "英雄聯盟",
    src: "/home/prices/league-of-legends.png",
  },
  {
    title: "特戰英豪",
    src: "/home/prices/valorant.png",
  },
  {
    title: "王者榮耀",
    src: "/home/prices/honor-of-kings.png",
  },
];

export default function HomePage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const navScrollFrame = useRef<number | null>(null);
  const [siteContent, setSiteContent] = useState<SiteContentItem[]>([]);
  const [selectedMerchandise, setSelectedMerchandise] = useState<{
    item: SiteContentItem;
    product: MerchandiseProduct;
  } | null>(null);

  useEffect(() => {
    if (!isPlaying) return;

    const timer = window.setTimeout(() => {
      setActiveSlide((current) => (current + 1) % priceSlides.length);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [activeSlide, isPlaying]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/site-content", { cache: "no-store", signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("讀取官網內容失敗");
        return response.json();
      })
      .then((payload: { items?: SiteContentItem[] }) => {
        if (Array.isArray(payload.items)) setSiteContent(payload.items);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error("Unable to refresh site content", error);
        }
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    return () => {
      if (navScrollFrame.current !== null) {
        window.cancelAnimationFrame(navScrollFrame.current);
      }
      document.documentElement.classList.remove("site-nav-scrolling");
    };
  }, []);

  const navigateToSection = (
    event: ReactMouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (!href.startsWith("#")) return;

    const target = document.querySelector<HTMLElement>(href);
    if (!target) return;

    event.preventDefault();
    if (target.matches("[data-reveal]")) {
      target.classList.add("is-revealed");
    }
    target.querySelectorAll("[data-reveal]").forEach((element) => {
      element.classList.add("is-revealed");
    });

    if (navScrollFrame.current !== null) {
      window.cancelAnimationFrame(navScrollFrame.current);
    }

    const root = document.documentElement;
    const startY = window.scrollY;
    const targetY = Math.max(
      0,
      startY + target.getBoundingClientRect().top - 80,
    );
    const distance = targetY - startY;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion || Math.abs(distance) < 12) {
      window.scrollTo({ top: targetY, behavior: "auto" });
      window.history.pushState(null, "", href);
      return;
    }

    const duration = Math.min(640, Math.max(360, Math.abs(distance) * 0.09));
    const startedAt = window.performance.now();
    root.classList.add("site-nav-scrolling");

    const step = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      window.scrollTo(0, startY + distance * eased);

      if (progress < 1) {
        navScrollFrame.current = window.requestAnimationFrame(step);
        return;
      }

      navScrollFrame.current = null;
      root.classList.remove("site-nav-scrolling");
      window.history.pushState(null, "", href);
    };

    navScrollFrame.current = window.requestAnimationFrame(step);
  };

  const activity = siteContent.find((item) => item.content_type === "activity");
  const visibleHeaderNavItems = activity
    ? headerNavItems
    : headerNavItems.filter((item) => item.href !== "#lottery");
  const prizes = siteContent.filter((item) => item.content_type === "prize");
  const merchandise = siteContent.filter((item) => item.content_type === "merchandise");
  const contacts = siteContent.filter((item) => item.content_type === "contact");

  return (
    <main className="home-intro-sequence home-soft-font min-h-screen overflow-hidden bg-[#0d0e10] text-white">
      <div className="site-scroll-progress" aria-hidden="true"><span /></div>
      <div className="site-grain" aria-hidden="true" />

      <header className="home-header fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0d0e10]/90 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-[1536px] items-center gap-4 px-5 sm:px-8 lg:px-10">
          <a href="#home" className="flex min-w-0 items-center gap-3">
            <Image
              src="/brand-logo-gold-v2.png"
              alt="深夜不關燈"
              width={68}
              height={48}
              priority
              className="home-header-logo h-11 w-auto rounded-md object-contain"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">深夜不關燈</p>
              <p className="truncate text-[10px] text-white/40">We Are Still Here</p>
            </div>
          </a>
          <nav aria-label="主要導覽" className="ml-auto hidden items-center gap-3 whitespace-nowrap text-xs font-bold text-white/60 lg:flex xl:gap-4 2xl:gap-6">
            {visibleHeaderNavItems.map((item) => (
              <a key={item.href} href={item.href} onClick={(event) => navigateToSection(event, item.href)} className="nav-link hover:text-white">
                {item.label}
              </a>
            ))}
            <a href="/membership" className="nav-link text-[#e7ba67] hover:text-[#f6d792]">會員登入</a>
          </nav>
          <a href={discordUrl} target="_blank" rel="noreferrer" className="premium-button hidden h-9 shrink-0 items-center gap-2 rounded-md bg-[#e7ba67] px-3 text-xs font-bold text-[#111214] hover:bg-[#f2cf8b] lg:inline-flex xl:px-4">
            Discord <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <button
            type="button"
            aria-label={mobileNavOpen ? "關閉導覽選單" : "開啟導覽選單"}
            aria-expanded={mobileNavOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileNavOpen((open) => !open)}
            className="ml-auto grid h-10 w-10 shrink-0 place-items-center rounded-md border border-white/15 text-white transition hover:border-[#e7ba67]/70 hover:text-[#f2cf8b] lg:hidden"
          >
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileNavOpen && (
          <nav id="mobile-navigation" aria-label="行動版主要導覽" className="border-t border-white/10 bg-[#0d0e10]/95 px-5 py-4 shadow-2xl lg:hidden">
            <div className="mx-auto grid max-w-[1536px] gap-2 sm:grid-cols-2">
              {visibleHeaderNavItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(event) => {
                    setMobileNavOpen(false);
                    navigateToSection(event, item.href);
                  }}
                  className="rounded-md border border-white/[0.08] px-4 py-3 text-sm font-bold text-white/70 transition hover:border-[#e7ba67]/50 hover:bg-white/[0.04] hover:text-white"
                >
                  {item.label}
                </a>
              ))}
              <a href="/membership" onClick={() => setMobileNavOpen(false)} className="rounded-md border border-[#e7ba67]/35 px-4 py-3 text-sm font-bold text-[#f2cf8b] transition hover:bg-[#e7ba67]/10">
                會員登入
              </a>
              <a href={discordUrl} target="_blank" rel="noreferrer" onClick={() => setMobileNavOpen(false)} className="flex items-center justify-between rounded-md bg-[#e7ba67] px-4 py-3 text-sm font-bold text-[#111214] transition hover:bg-[#f2cf8b]">
                Discord <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </nav>
        )}
      </header>

      <section id="home" className="hero-stage min-h-[92vh] border-b border-white/10 pt-16">
        <Image
          src="/home/midnight-lounge-v2.png"
          alt="深夜城市中的陪伴空間"
          fill
          priority
          sizes="100vw"
          className="hero-media object-cover object-[62%_center] sm:object-center"
        />
        <div className="hero-vignette absolute inset-0" />
        <div className="hero-orb hero-orb-gold" aria-hidden="true" />
        <div className="hero-orb hero-orb-cyan" aria-hidden="true" />
        <div className="relative z-[2] mx-auto flex min-h-[calc(92vh-4rem)] max-w-7xl items-end px-5 pb-16 pt-24 sm:px-8 sm:pb-20 lg:px-12">
          <div className="max-w-3xl">
            <p className="hero-badge inline-flex items-center gap-2 border-l-2 border-[#e7ba67] pl-3 text-xs font-bold uppercase text-[#f2cf8b]">
              <Clock3 className="h-4 w-4" /> WE ARE STILL HERE · 深夜不關燈
            </p>
            <h1 className="hero-rise hero-title home-title-font mt-6 text-5xl leading-[1.12] sm:text-7xl lg:text-8xl">
              深夜不關燈
            </h1>
            <p className="hero-rise hero-copy-primary mt-5 max-w-xl text-lg font-semibold text-white/90 sm:text-2xl">
              把今晚，交給懂你節奏的人。
            </p>
            <p className="hero-rise hero-copy-secondary mt-5 max-w-xl text-sm leading-7 text-white/65 sm:text-base">
              想認真玩一場、輕鬆聊一晚，或找位合拍的隊友？從服務價目到陪陪介紹，都可以在這裡慢慢挑選，再透過官方入口確認安排。
            </p>
            <div className="hero-rise hero-actions mt-8 flex flex-wrap gap-3">
              <a href="#services" className="premium-button inline-flex h-12 items-center gap-2 rounded-md bg-[#e7ba67] px-6 text-sm font-bold text-[#111214] hover:bg-[#f2cf8b]">
                查看服務價目 <ArrowRight className="h-4 w-4" />
              </a>
              <a href="#players" className="premium-button inline-flex h-12 items-center gap-2 rounded-md border border-white/30 bg-black/20 px-6 text-sm font-bold hover:border-white/70 hover:bg-black/40">
                認識陪陪
              </a>
            </div>
          </div>
        </div>
        <div className="hero-trust-panel absolute bottom-0 right-0 hidden w-[34%] border-l border-t border-white/15 bg-[#0d0e10]/85 p-6 backdrop-blur md:block">
          <div className="grid grid-cols-3 divide-x divide-white/10 text-center">
            {["遊戲陪玩", "語音聊天", "會員服務"].map((item) => <p key={item} className="text-xs font-bold text-white/65">{item}</p>)}
          </div>
        </div>
      </section>

      <section className="night-directory border-b border-white/10" aria-labelledby="night-directory-heading">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
          <div className="night-directory-heading">
            <div>
              <p className="night-directory-kicker">START YOUR NIGHT / 從這裡開始</p>
              <h2 id="night-directory-heading" className="home-title-font mt-4 text-3xl sm:text-4xl">今晚想找什麼？</h2>
            </div>
            <p>先看服務、認識陪陪，再決定今晚適合怎麼玩。</p>
          </div>
          <div className="night-directory-grid">
            <a href="#services" className="night-directory-card">
              <span className="night-directory-number">01 / SERVICE</span>
              <Gamepad2 aria-hidden="true" />
              <strong>遊戲與聊天服務</strong>
              <span>查看玩法與價目，找到適合自己的節奏。</span>
              <span className="night-directory-link">探索服務 <ArrowRight aria-hidden="true" /></span>
            </a>
            <a href="#players" className="night-directory-card">
              <span className="night-directory-number">02 / PLAYERS</span>
              <Headphones aria-hidden="true" />
              <strong>認識深夜陪陪</strong>
              <span>依遊戲分類與介紹，選擇想一起玩的隊友。</span>
              <span className="night-directory-link">查看陪陪 <ArrowRight aria-hidden="true" /></span>
            </a>
            <a href="/membership" className="night-directory-card">
              <span className="night-directory-number">03 / MEMBERSHIP</span>
              <ShieldCheck aria-hidden="true" />
              <strong>會員與訂單</strong>
              <span>進入會員中心，查看自己的相關服務資訊。</span>
              <span className="night-directory-link">進入會員中心 <ArrowRight aria-hidden="true" /></span>
            </a>
          </div>
          <a className="night-directory-extra" href={flightSearchUrl}>
            航空外站票查詢 <ExternalLink aria-hidden="true" />
          </a>
        </div>
      </section>

      <section id="services" className="site-section section-ambient px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
            <div data-reveal="clip" className="lg:sticky lg:top-28 lg:self-start">
              <p className="text-xs font-bold uppercase text-[#5bd6d0]">Service directory</p>
              <h2 className="home-title-font mt-4 text-4xl sm:text-5xl">想怎麼過今晚？</h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-white/55">
                從一場遊戲到一段對話，選擇你需要的陪伴。我們把價格與服務整理得清楚，客服也會協助確認細節。
              </p>
            </div>

            <div data-reveal="right">
              <PriceCarousel
                activeSlide={activeSlide}
                isPlaying={isPlaying}
                onSelect={setActiveSlide}
                onTogglePlay={() => setIsPlaying((playing) => !playing)}
              />
              <p className="mt-5 text-xs leading-6 text-white/35">
                實際價格、接單內容與活動資格，仍以客服確認及官方最新公告為準。
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="merchandise" className="site-section border-t border-white/10 bg-[#15171a] px-5 py-20 sm:px-8 lg:px-12 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div data-reveal="clip" className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-[#5bd6d0]">Official merchandise</p>
              <h2 className="home-title-font mt-4 text-4xl sm:text-5xl">把深夜的陪伴帶回家。</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/50">官方周邊商品會在這裡更新；庫存、付款與寄送方式以商品頁及客服確認為準。</p>
            </div>
            <Package className="hidden h-9 w-9 text-[#e7ba67] sm:block" />
          </div>

          {merchandise.length ? (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {merchandise.map((item, index) => {
                const slug = getMerchandiseSlugFromTitle(item.title);
                const product = slug ? getMerchandiseProduct(slug) : null;
                const websiteDesign = isWebsiteDesignTitle(item.title);

                return (
                  <article key={item.id} data-reveal="scale" data-reveal-delay={String(Math.min(index + 1, 3))} className="interactive-card group overflow-hidden rounded-md border border-white/10 bg-[#0d0e10]">
                    <ContentImage src={item.image_url} alt={item.title} aspectClass="aspect-[4/3]" />
                    <div className="p-6">
                      {item.subtitle && <p className="text-xs font-bold text-[#5bd6d0]">{item.subtitle}</p>}
                      <div className="mt-2 flex items-start justify-between gap-4">
                        <h3 className="text-xl font-bold">{item.title}</h3>
                        {websiteDesign ? (
                          <p className="shrink-0 text-right font-bold text-[#e7ba67]">
                            洽談後報價
                          </p>
                        ) : item.price !== null ? (
                          <p className="shrink-0 font-bold text-[#e7ba67]">NT$ {Number(item.price).toLocaleString("zh-TW")}</p>
                        ) : null}
                      </div>
                      {item.description && <p className="mt-4 text-sm leading-7 text-white/50">{item.description}</p>}
                      {websiteDesign ? (
                        <a
                          href={websiteDesignUrl}
                          className="premium-button mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#e7ba67] text-sm font-bold text-[#111214] hover:bg-[#f2cf8b]"
                        >
                          輸入詳情 <ArrowRight className="h-4 w-4" />
                        </a>
                      ) : product ? (
                        <button
                          type="button"
                          onClick={() => setSelectedMerchandise({ item, product })}
                          className="premium-button mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#e7ba67] text-sm font-bold text-[#111214] hover:bg-[#f2cf8b]"
                        >
                          查看／購買 <ArrowRight className="h-4 w-4" />
                        </button>
                      ) : item.link_url ? (
                        <a href={item.link_url} target="_blank" rel="noreferrer" className="premium-button mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#e7ba67] text-sm font-bold text-[#111214] hover:bg-[#f2cf8b]">查看／購買 <ExternalLink className="h-4 w-4" /></a>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-10 flex min-h-44 items-center justify-center rounded-md border border-dashed border-white/15 bg-white/[0.02] px-6 text-center">
              <div><Package className="mx-auto h-7 w-7 text-white/25" /><p className="mt-4 text-sm font-bold text-white/60">周邊商品準備中</p><p className="mt-2 text-xs text-white/35">新品上架後會第一時間在這裡公布。</p></div>
            </div>
          )}
        </div>
      </section>

      <HomePlayers />

      {activity && <section id="lottery" className="site-section border-y border-white/10 bg-[#15171a] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div data-reveal="clip" className="grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:items-end">
            <div>
              <Trophy className="h-7 w-7 text-[#e7ba67]" />
              {activity.subtitle && <p className="mt-6 text-xs font-bold uppercase text-[#ff806f]">{activity.subtitle}</p>}
              <h2 className="home-title-font mt-4 text-4xl leading-tight sm:text-6xl">{activity.title}</h2>
            </div>
            {activity.description && <p className="max-w-xl text-sm leading-7 text-white/55 lg:justify-self-end">{activity.description}</p>}
          </div>
          {prizes.length > 0 && <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {prizes.map((prize, index) => (
              <article key={prize.id} data-reveal="scale" data-reveal-delay={String(Math.min(index + 1, 3))} className="interactive-card group overflow-hidden rounded-md border border-white/10 bg-[#0d0e10]">
                <div className="relative">
                  <ContentImage src={prize.image_url} alt={prize.title} aspectClass="aspect-[16/10]" light />
                  <span className="absolute left-3 top-3 rounded-md bg-[#0d0e10]/85 px-2.5 py-1.5 text-xs font-bold text-[#5bd6d0] backdrop-blur">0{index + 1}</span>
                </div>
                <div className="p-5">
                  <p className="text-sm font-semibold leading-6">{prize.title}</p>
                  {prize.description && <p className="mt-2 text-xs leading-5 text-white/40">{prize.description}</p>}
                </div>
              </article>
            ))}
          </div>}
          {activity.responsibility_note && (
            <div data-reveal className="mt-8 border-l-2 border-[#e7ba67]/55 bg-[#e7ba67]/[0.06] px-5 py-4 sm:px-6">
              <p className="text-xs font-bold text-[#e7ba67]">權責聲明</p>
              <p className="mt-2 whitespace-pre-line text-xs leading-6 text-white/45">
                {activity.responsibility_note}
              </p>
            </div>
          )}
        </div>
      </section>}

      <section className="site-section service-assurance px-5 py-20 sm:px-8 lg:px-12 lg:py-28" aria-labelledby="service-assurance-heading">
        <div className="mx-auto max-w-7xl">
          <div className="service-assurance-heading" data-reveal>
            <p>HOW IT WORKS / 官方服務流程</p>
            <h2 id="service-assurance-heading" className="home-title-font">從心動，到正式開局。</h2>
            <span>每一步都有明確入口，服務細節與價格以官方確認為準。</span>
          </div>
          <div className="service-assurance-grid">
            <article data-reveal>
              <span>01</span>
              <Gamepad2 aria-hidden="true" />
              <h3>挑選服務</h3>
              <p>先查看遊戲、聊天項目與價目，確認你想要的玩法。</p>
            </article>
            <article data-reveal>
              <span>02</span>
              <MessageCircle aria-hidden="true" />
              <h3>找到合拍陪陪</h3>
              <p>瀏覽陪陪介紹與遊戲分類，透過提供的官方入口提出需求。</p>
            </article>
            <article data-reveal>
              <span>03</span>
              <ShieldCheck aria-hidden="true" />
              <h3>確認後再開始</h3>
              <p>服務內容與付款方式經官方流程確認後，再安心開始遊戲。</p>
            </article>
          </div>
        </div>
      </section>

      <section id="contact" className="site-section bg-[#e7ba67] px-5 py-20 text-[#111214] sm:px-8 lg:px-12 lg:py-24">
        <div data-reveal="clip" className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase">The light is on</p>
            <h2 className="home-title-font mt-4 max-w-3xl text-4xl leading-tight sm:text-6xl">有想法就來，我們替你把今晚安排好。</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {contacts.map((item, index) => (
              <SocialLink
                key={item.id}
                href={item.link_url || "#contact"}
                label={item.title}
                detail={item.subtitle || item.description || undefined}
                icon={contactIcon(item)}
                dark={index === 0}
              />
            ))}
          </div>
        </div>
      </section>

      <ThanksWall />

      <footer className="border-t border-white/10 bg-[#090a0c] px-5 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 text-xs text-white/35 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-bold text-white/70">深夜不關燈 · We Are Still Here</p>
            <p className="mt-2">© 2026 深夜不關燈 · We Are Still Here</p>
          </div>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center lg:justify-end">
            <div aria-label="合作支付品牌：街口支付、綠界支付">
              <p className="mb-2 font-bold text-white/70">合作支付品牌</p>
              <div className="flex flex-wrap gap-2">
                <div className="flex h-14 w-28 items-center justify-center overflow-hidden rounded-md shadow-lg shadow-black/20">
                  <Image src="/jkopay-logo.png" alt="街口支付 JKOPAY" width={1081} height={552} className="h-full w-full object-cover" />
                </div>
                <div className="flex h-14 w-28 items-center justify-center overflow-hidden rounded-md bg-[#e4f0e8] shadow-lg shadow-black/20">
                  <Image src="/ecpay-logo-transparent.png" alt="綠界支付 ECPay" width={300} height={180} className="h-full w-full object-cover" />
                </div>
              </div>
            </div>
            <CommercePolicyLinks className="justify-start lg:justify-end" />
          </div>
        </div>
      </footer>

      {selectedMerchandise && (
        <MerchandiseDetailModal
          item={selectedMerchandise.item}
          product={selectedMerchandise.product}
          onClose={() => setSelectedMerchandise(null)}
        />
      )}

      <MerchandiseCart />
    </main>
  );
}

function PriceCarousel({ activeSlide, isPlaying, onSelect, onTogglePlay }: { activeSlide: number; isPlaying: boolean; onSelect: (index: number) => void; onTogglePlay: () => void }) {
  const slide = priceSlides[activeSlide];
  const goPrevious = () => onSelect((activeSlide - 1 + priceSlides.length) % priceSlides.length);
  const goNext = () => onSelect((activeSlide + 1) % priceSlides.length);

  return (
    <div className="overflow-hidden rounded-md border border-white/10 bg-[#08090b]">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{slide.title}</p>
          <p className="mt-1 text-[11px] text-white/40">{String(activeSlide + 1).padStart(2, "0")} / {String(priceSlides.length).padStart(2, "0")}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={goPrevious} title="上一張" aria-label="上一張價目表" className="grid h-9 w-9 place-items-center rounded-md border border-white/15 text-white/70 hover:border-white/40 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={onTogglePlay} title={isPlaying ? "暫停輪播" : "繼續輪播"} aria-label={isPlaying ? "暫停輪播" : "繼續輪播"} className="grid h-9 w-9 place-items-center rounded-md border border-white/15 text-white/70 hover:border-white/40 hover:text-white">
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button type="button" onClick={goNext} title="下一張" aria-label="下一張價目表" className="grid h-9 w-9 place-items-center rounded-md border border-white/15 text-white/70 hover:border-white/40 hover:text-white">
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative aspect-[3/2] w-full bg-[#101319]">
        <Image
          key={slide.src}
          src={slide.src}
          alt={`${slide.title}價目表`}
          fill
          sizes="(max-width: 1024px) 100vw, 1152px"
          className="price-slide-enter object-contain"
        />
      </div>

      <div className="flex items-center justify-center gap-2 overflow-x-auto border-t border-white/10 px-4 py-4">
        {priceSlides.map((item, index) => (
          <button
            key={item.src}
            type="button"
            onClick={() => onSelect(index)}
            title={item.title}
            aria-label={`查看${item.title}價目表`}
            aria-current={index === activeSlide ? "true" : undefined}
            className={`h-2.5 shrink-0 rounded-full transition-all ${index === activeSlide ? "w-8 bg-[#e7ba67]" : "w-2.5 bg-white/20 hover:bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  );
}

function ContentImage({ src, alt, aspectClass, light = false }: { src: string | null; alt: string; aspectClass: string; light?: boolean }) {
  const background = light ? "bg-[#f1f2f4]" : "bg-[#17191d]";
  if (!src) return <div data-card-media role="img" aria-label={`${alt}尚無圖片`} className={`${aspectClass} grid place-items-center border-b border-white/10 ${background}`}><Package className="h-8 w-8 text-black/20" /></div>;
  if (src.startsWith("/")) return <div data-card-media className={`relative ${aspectClass} border-b border-white/10 ${background}`}><Image src={src} alt={alt} fill sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw" className="object-cover" /></div>;
  return (
    <div data-card-media role="img" aria-label={alt} className={`relative ${aspectClass} overflow-hidden border-b border-white/10 ${background}`}>
      <div className="absolute inset-0 grid place-items-center">
        <Package className={`h-8 w-8 ${light ? "text-black/20" : "text-white/20"}`} />
      </div>
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${JSON.stringify(src)})` }} />
    </div>
  );
}

function contactIcon(item: SiteContentItem) {
  const value = `${item.title} ${item.link_url || ""}`.toLowerCase();
  if (value.includes("mail") || value.includes("信箱") || value.includes("email")) return Mail;
  if (value.includes("instagram")) return Camera;
  if (value.includes("threads")) return AtSign;
  return ExternalLink;
}

function SocialLink({ href, label, detail, icon: Icon, dark = false }: { href: string; label: string; detail?: string; icon: typeof Sparkles; dark?: boolean }) {
  const external = href.startsWith("http");
  return (
    <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className={`premium-button flex min-h-14 items-center justify-between gap-4 rounded-md border px-5 py-3 text-sm font-bold transition ${dark ? "border-[#111214] bg-[#111214] text-white hover:bg-[#26282b]" : "border-black/30 hover:border-black"}`}>
      <span>{label}{detail && <span className={`mt-1 block text-[11px] font-medium ${dark ? "text-white/50" : "text-black/55"}`}>{detail}</span>}</span> <Icon className="h-4 w-4 shrink-0" />
    </a>
  );
}
