"use client";

import { Check, ChevronDown, Languages } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Locale = "zh-Hant" | "en" | "ja" | "ko";
type Translation = Record<Exclude<Locale, "zh-Hant">, string>;

const STORAGE_KEY = "wash-language";
const localeOptions: Array<{ value: Locale; label: string; shortLabel: string }> = [
  { value: "zh-Hant", label: "繁體中文", shortLabel: "繁中" },
  { value: "en", label: "English", shortLabel: "EN" },
  { value: "ja", label: "日本語", shortLabel: "日本語" },
  { value: "ko", label: "한국어", shortLabel: "한국어" },
];

const phrases: Record<string, Translation> = {
  "深夜不關燈": { en: "We Are Still Here", ja: "深夜不關燈", ko: "심야불관등" },
  "今晚不只在線，也在你身邊。": {
    en: "More than online tonight — right here with you.",
    ja: "今夜はオンラインだけでなく、あなたのそばに。",
    ko: "오늘 밤은 온라인을 넘어, 당신 곁에 함께합니다.",
  },
  "遊戲、聊天、打賞與星夜聯盟會籍，讓每一個晚睡的理由，都有更好的陪伴方式。": {
    en: "Gaming, conversation, gifts and Starry Night membership — better company for every late night.",
    ja: "ゲーム、会話、ギフト、星夜連盟メンバーシップ。夜更かしの時間に、より良い寄り添いを。",
    ko: "게임, 대화, 후원과 별밤 연맹 멤버십으로 모든 늦은 밤을 더 따뜻하게 함께합니다.",
  },
  "服務": { en: "Services", ja: "サービス", ko: "서비스" },
  "商品": { en: "Shop", ja: "商品", ko: "상품" },
  "介紹": { en: "About", ja: "紹介", ko: "소개" },
  "活動": { en: "Events", ja: "イベント", ko: "이벤트" },
  "聯絡": { en: "Contact", ja: "お問い合わせ", ko: "문의" },
  "隱私權": { en: "Privacy", ja: "プライバシー", ko: "개인정보" },
  "退換貨": { en: "Returns", ja: "返品・交換", ko: "교환·환불" },
  "付款說明": { en: "Payments", ja: "お支払い", ko: "결제 안내" },
  "會員登入": { en: "Member Login", ja: "会員ログイン", ko: "회원 로그인" },
  "探索服務": { en: "Explore Services", ja: "サービスを見る", ko: "서비스 둘러보기" },
  "進入會員中心": { en: "Member Center", ja: "会員センター", ko: "회원 센터" },
  "全年無休": { en: "Open All Year", ja: "年中無休", ko: "연중무휴" },
  "專人安排": { en: "Personal Matching", ja: "専任スタッフ対応", ko: "전담 매칭" },
  "會員連動": { en: "Member Benefits", ja: "会員特典", ko: "회원 혜택" },
  "深夜有人回應，就是一種安心。": {
    en: "Knowing someone will answer at night brings peace of mind.",
    ja: "深夜でも誰かが応えてくれる。それだけで安心できます。",
    ko: "깊은 밤에도 누군가 답해 준다는 것만으로 마음이 놓입니다.",
  },
  "想怎麼過今晚？": { en: "How would you like to spend tonight?", ja: "今夜はどう過ごしますか？", ko: "오늘 밤은 어떻게 보내고 싶나요?" },
  "從一場遊戲到一段對話，選擇你需要的陪伴。我們把價格與服務整理得清楚，客服也會協助確認細節。": {
    en: "From a game to a conversation, choose the company you need. Pricing and services are clearly listed, and support will help confirm the details.",
    ja: "ゲームから会話まで、必要な寄り添い方を選べます。料金とサービスを分かりやすくご案内し、スタッフが詳細を確認します。",
    ko: "게임부터 대화까지 원하는 동행을 선택하세요. 가격과 서비스를 명확하게 안내하며, 고객지원이 세부 내용을 확인해 드립니다.",
  },
  "我們的服務": { en: "Our Services", ja: "サービス", ko: "서비스 안내" },
  "價目表": { en: "Pricing", ja: "料金表", ko: "가격표" },
  "上一張價目表": { en: "Previous price list", ja: "前の料金表", ko: "이전 가격표" },
  "下一張價目表": { en: "Next price list", ja: "次の料金表", ko: "다음 가격표" },
  "暫停輪播": { en: "Pause slideshow", ja: "スライドショーを一時停止", ko: "슬라이드 일시정지" },
  "繼續輪播": { en: "Resume slideshow", ja: "スライドショーを再開", ko: "슬라이드 계속" },
  "上一張": { en: "Previous", ja: "前へ", ko: "이전" },
  "下一張": { en: "Next", ja: "次へ", ko: "다음" },
  "暫停播放": { en: "Pause", ja: "一時停止", ko: "일시정지" },
  "繼續播放": { en: "Play", ja: "再生", ko: "재생" },
  "周邊商品": { en: "Merchandise", ja: "グッズ", ko: "굿즈" },
  "把深夜的陪伴帶回家。": { en: "Bring the comfort of the night home.", ja: "深夜のぬくもりを、おうちへ。", ko: "깊은 밤의 따뜻함을 집으로 가져가세요." },
  "官方周邊商品會在這裡更新；庫存、付款與寄送方式以商品頁及客服確認為準。": {
    en: "Official merchandise is updated here. Please refer to each product page or contact support for stock, payment and shipping details.",
    ja: "公式グッズはこちらで更新します。在庫、お支払い、配送方法は商品ページまたはスタッフへご確認ください。",
    ko: "공식 굿즈는 이곳에서 업데이트됩니다. 재고, 결제 및 배송은 상품 페이지와 고객지원을 통해 확인해 주세요.",
  },
  "周邊商品準備中": { en: "Merchandise coming soon", ja: "グッズ準備中", ko: "굿즈 준비 중" },
  "新品上架後會第一時間在這裡公布。": { en: "New products will be announced here first.", ja: "新商品はまずこちらでお知らせします。", ko: "신상품은 이곳에서 가장 먼저 안내합니다." },
  "查看詳情": { en: "View Details", ja: "詳細を見る", ko: "상세 보기" },
  "查看／購買": { en: "View / Buy", ja: "詳細・購入", ko: "보기 / 구매" },
  "加入購物車": { en: "Add to Cart", ja: "カートに追加", ko: "장바구니 담기" },
  "購物車": { en: "Cart", ja: "カート", ko: "장바구니" },
  "前往結帳": { en: "Checkout", ja: "購入手続きへ", ko: "결제하기" },
  "返回主頁": { en: "Back to Home", ja: "ホームへ戻る", ko: "홈으로" },
  "商品數量": { en: "Quantity", ja: "数量", ko: "수량" },
  "商品小計": { en: "Subtotal", ja: "小計", ko: "상품 금액" },
  "運費": { en: "Shipping", ja: "送料", ko: "배송비" },
  "總金額": { en: "Total", ja: "合計", ko: "총액" },
  "滿 NT$490 免運，未滿酌收 NT$60 運費。": {
    en: "Free shipping over NT$490; otherwise NT$60.",
    ja: "NT$490以上で送料無料。未満の場合は送料NT$60。",
    ko: "NT$490 이상 무료배송, 미만 시 배송비 NT$60.",
  },
  "輸入貨運資料詳情": { en: "Enter Shipping Details", ja: "配送情報を入力", ko: "배송 정보 입력" },
  "收件人姓名": { en: "Recipient Name", ja: "受取人氏名", ko: "수령인 이름" },
  "姓名": { en: "Name", ja: "氏名", ko: "이름" },
  "電話": { en: "Phone", ja: "電話番号", ko: "전화번호" },
  "門市名稱": { en: "Store Name", ja: "店舗名", ko: "매장명" },
  "付款方式": { en: "Payment Method", ja: "お支払い方法", ko: "결제 수단" },
  "申請中，成功後開放": { en: "Integration pending — coming soon", ja: "申請中・準備完了後に公開", ko: "연동 신청 중 · 준비 후 오픈" },
  "申請中待開放": { en: "Coming Soon", ja: "近日公開", ko: "오픈 준비 중" },
  "網站設計委託": { en: "Website Design", ja: "ウェブサイト制作", ko: "웹사이트 제작" },
  "洽談後報價": { en: "Quote after Consultation", ja: "ご相談後にお見積り", ko: "상담 후 견적" },
  "輸入詳情": { en: "Enter Project Details", ja: "詳細を入力", ko: "상세 정보 입력" },
  "網站名稱": { en: "Website Name", ja: "サイト名", ko: "웹사이트 이름" },
  "風格": { en: "Style", ja: "スタイル", ko: "스타일" },
  "色調": { en: "Color Palette", ja: "配色", ko: "색상" },
  "聯絡方式": { en: "Contact Details", ja: "連絡先", ko: "연락처" },
  "陪陪介紹": { en: "Meet Our Companions", ja: "キャスト紹介", ko: "파트너 소개" },
  "從遊戲分類找到今晚最對頻的陪伴。金榜陪陪會優先推薦，點擊預約即可前往專屬邀請入口。": {
    en: "Find the right companion by game. Featured companions appear first; select Book to open their dedicated invitation.",
    ja: "ゲームカテゴリーから相性の良いキャストを探せます。注目キャストを優先表示し、「予約」から専用招待へ進めます。",
    ko: "게임 카테고리에서 잘 맞는 파트너를 찾아보세요. 추천 파트너가 먼저 표시되며 예약을 누르면 전용 초대 페이지로 이동합니다.",
  },
  "顯示更多陪陪": { en: "Show more companions", ja: "さらに表示", ko: "더 보기" },
  "可接單": { en: "Available", ja: "受付中", ko: "예약 가능" },
  "本月金榜": { en: "Featured this month", ja: "今月のおすすめ", ko: "이달의 추천" },
  "點我預約": { en: "Book now", ja: "予約する", ko: "예약하기" },
  "預約連結準備中": { en: "Booking link coming soon", ja: "予約リンク準備中", ko: "예약 링크 준비 중" },
  "查看全部": { en: "View All", ja: "すべて見る", ko: "전체 보기" },
  "目前活動": { en: "Current Event", ja: "開催中のイベント", ko: "진행 중 이벤트" },
  "把今晚的幸運，也一起帶走。": { en: "Take a little luck home tonight.", ja: "今夜の幸運も、一緒に持ち帰ろう。", ko: "오늘 밤의 행운도 함께 가져가세요." },
  "活動期間每消費滿 1,000 元獲得 1 張抽獎券；前 50 筆滿額訂單抽獎券翻倍，限量 100 張。": {
    en: "Receive one draw entry for every NT$1,000 spent. The first 50 qualifying orders receive double entries, limited to 100 entries.",
    ja: "期間中、NT$1,000ご利用ごとに抽選券を1枚進呈。条件を満たす先着50件は2倍、合計100枚限定です。",
    ko: "이벤트 기간 NT$1,000 결제마다 응모권 1장을 드립니다. 조건을 충족한 선착순 50건은 2배, 총 100장 한정입니다.",
  },
  "完成消費即可累積抽獎券": { en: "Earn draw entries with completed purchases", ja: "購入完了で抽選券を獲得", ko: "결제 완료 시 응모권 적립" },
  "每千元 1 張": { en: "1 entry per NT$1,000", ja: "NT$1,000ごとに1枚", ko: "NT$1,000당 1장" },
  "可依消費金額持續累加": { en: "Entries accumulate with spending", ja: "ご利用金額に応じて累積", ko: "결제 금액에 따라 누적" },
  "中獎與領獎方式依官方公告": { en: "Winner and prize collection details will follow the official announcement", ja: "当選・受取方法は公式発表をご確認ください", ko: "당첨 및 수령 방법은 공식 공지를 따릅니다" },
  "活動期間": { en: "Event Period", ja: "開催期間", ko: "이벤트 기간" },
  "抽獎規則": { en: "Draw Rules", ja: "抽選ルール", ko: "추첨 규칙" },
  "開獎日期": { en: "Draw Date", ja: "抽選日", ko: "추첨일" },
  "權責聲明": { en: "Responsibility Statement", ja: "責任に関する声明", ko: "책임 고지" },
  "聯絡我們": { en: "Contact Us", ja: "お問い合わせ", ko: "문의하기" },
  "有想法就來，我們替你把今晚安排好。": { en: "Tell us what you have in mind. We will arrange the rest.", ja: "ご希望をお聞かせください。今夜を素敵にご案内します。", ko: "원하는 것을 알려 주세요. 오늘 밤을 알맞게 준비해 드릴게요." },
  "一般客服與服務安排": { en: "General support and service arrangements", ja: "一般お問い合わせ・サービス手配", ko: "일반 문의 및 서비스 안내" },
  "最新消息與活動": { en: "News and events", ja: "最新情報・イベント", ko: "새 소식 및 이벤트" },
  "追蹤我們的日常": { en: "Follow our daily updates", ja: "日々の投稿をフォロー", ko: "일상 소식 팔로우" },
  "金流問題客服信箱": { en: "Payment support email", ja: "決済サポートメール", ko: "결제 문의 이메일" },
  "金流相關問題": { en: "Payment Support", ja: "決済に関するお問い合わせ", ko: "결제 관련 문의" },
  "電子郵件": { en: "Email", ja: "メール", ko: "이메일" },
  "登入": { en: "Sign In", ja: "ログイン", ko: "로그인" },
  "登出": { en: "Sign Out", ja: "ログアウト", ko: "로그아웃" },
  "會員中心": { en: "Member Center", ja: "会員センター", ko: "회원 센터" },
  "我的訂單": { en: "My Orders", ja: "注文履歴", ko: "내 주문" },
  "我的錢包": { en: "My Wallet", ja: "ウォレット", ko: "내 지갑" },
  "錢包餘額": { en: "Wallet Balance", ja: "ウォレット残高", ko: "지갑 잔액" },
  "訂單明細": { en: "Order Details", ja: "注文詳細", ko: "주문 내역" },
  "打賞紀錄": { en: "Gift History", ja: "ギフト履歴", ko: "후원 내역" },
  "載入中": { en: "Loading", ja: "読み込み中", ko: "불러오는 중" },
  "確認": { en: "Confirm", ja: "確認", ko: "확인" },
  "取消": { en: "Cancel", ja: "キャンセル", ko: "취소" },
  "關閉": { en: "Close", ja: "閉じる", ko: "닫기" },
  "儲存": { en: "Save", ja: "保存", ko: "저장" },
  "送出": { en: "Submit", ja: "送信", ko: "제출" },
  "搜尋": { en: "Search", ja: "検索", ko: "검색" },
  "選擇語言": { en: "Choose language", ja: "言語を選択", ko: "언어 선택" },
};

const translatedAttributes = ["placeholder", "title", "aria-label"] as const;
const textRecords = new WeakMap<Text, { source: string; applied: string }>();
const attributeRecords = new WeakMap<Element, Map<string, { source: string; applied: string }>>();

function translateText(source: string, locale: Locale) {
  if (locale === "zh-Hant" || !/[\u3400-\u9fff]/u.test(source)) return source;
  const language = locale as Exclude<Locale, "zh-Hant">;
  const exact = phrases[source.trim()]?.[language];
  if (exact) return source.replace(source.trim(), exact);

  return source;
}

function shouldSkip(element: Element | null) {
  return Boolean(element?.closest("script, style, code, pre, [data-no-translate]"));
}

function translateNode(node: Text, locale: Locale) {
  if (shouldSkip(node.parentElement)) return;
  const current = node.nodeValue ?? "";
  const saved = textRecords.get(node);
  const source = !saved || (current !== saved.applied && current !== saved.source) ? current : saved.source;
  const applied = translateText(source, locale);
  textRecords.set(node, { source, applied });
  if (current !== applied) node.nodeValue = applied;
}

function translateAttributes(element: Element, locale: Locale) {
  if (shouldSkip(element)) return;
  const records = attributeRecords.get(element) ?? new Map();
  translatedAttributes.forEach((attribute) => {
    const current = element.getAttribute(attribute);
    if (!current) return;
    const saved = records.get(attribute);
    const source = !saved || (current !== saved.applied && current !== saved.source) ? current : saved.source;
    const applied = translateText(source, locale);
    records.set(attribute, { source, applied });
    if (current !== applied) element.setAttribute(attribute, applied);
  });
  attributeRecords.set(element, records);
}

function translateTree(root: ParentNode, locale: Locale) {
  if (root instanceof Element) translateAttributes(root, locale);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let current = walker.nextNode();
  while (current) {
    if (current.nodeType === Node.TEXT_NODE) translateNode(current as Text, locale);
    else translateAttributes(current as Element, locale);
    current = walker.nextNode();
  }
}

export default function AppLanguageProvider() {
  const [locale, setLocale] = useState<Locale>("zh-Hant");
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (!saved || !localeOptions.some((option) => option.value === saved)) return;
    const timer = window.setTimeout(() => setLocale(saved), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dataset.locale = locale;
    window.localStorage.setItem(STORAGE_KEY, locale);
    let observer: MutationObserver | null = null;
    const startTimer = window.setTimeout(() => {
      translateTree(document.body, locale);
      observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === "characterData") translateNode(mutation.target as Text, locale);
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) translateNode(node as Text, locale);
            else if (node instanceof Element) translateTree(node, locale);
          });
          if (mutation.type === "attributes" && mutation.target instanceof Element) {
            translateAttributes(mutation.target, locale);
          }
        });
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: [...translatedAttributes],
      });
    }, 350);
    return () => {
      window.clearTimeout(startTimer);
      observer?.disconnect();
    };
  }, [locale]);

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, []);

  const selected = localeOptions.find((option) => option.value === locale) ?? localeOptions[0];

  return (
    <div className="app-language" data-no-translate ref={menuRef}>
      {open && (
        <div className="app-language__menu" role="menu" aria-label="Choose language">
          <p>Language</p>
          {localeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              role="menuitemradio"
              aria-checked={locale === option.value}
              onClick={() => {
                setLocale(option.value);
                setOpen(false);
              }}
            >
              <span>{option.label}</span>
              {locale === option.value && <Check size={16} />}
            </button>
          ))}
        </div>
      )}
      <button
        className="app-language__trigger"
        type="button"
        aria-label="Choose language"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Languages size={18} />
        <span>{selected.shortLabel}</span>
        <ChevronDown size={14} className={open ? "is-open" : ""} />
      </button>
    </div>
  );
}
