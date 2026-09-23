import type { Metadata } from "next";
import PolicyShell, { PolicySection } from "../PolicyShell";
import { getEcpayConfig } from "@/lib/ecpay";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "付款說明",
  description: "深夜不關燈周邊商品的價格、運費、付款狀態與退款入帳說明。",
  alternates: { canonical: "/policies/payment" },
};

export default function PaymentPolicyPage() {
  const ecpayAvailable = getEcpayConfig().available;
  return (
    <PolicyShell eyebrow="Payment information" title="付款說明" intro="商品頁顯示的金額以新臺幣計價，實際可用方式以結帳頁為準。">
      <PolicySection title="一、目前付款狀態">
        <p>街口支付已開放使用；{ecpayAvailable ? "綠界信用卡亦可於結帳頁選用；" : "綠界信用卡準備中；"}LINE Pay、PAYUNi 與全支付仍在申請中。結帳頁會顯示實際應付金額，選擇付款方式後將前往相應的安全付款頁。</p>
      </PolicySection>

      <PolicySection title="二、商品、運費與應付總額">
        <p>應付總額為購物車商品小計加上運費。單次商品小計滿 NT$ 490 免運；未滿 NT$ 490，運費為 NT$ 60。正式付款前請再次核對商品、數量、取件門市與總額。</p>
      </PolicySection>

      <PolicySection title="三、訂單成立與付款確認">
        <p>付款頁顯示成功且系統建立訂單後，才代表付款流程完成。若頁面中斷、付款失敗或顯示處理中，請勿重複付款；可先保留畫面與交易編號並聯絡客服確認。</p>
      </PolicySection>

      <PolicySection title="四、付款資料與安全">
        <p>支付帳號、卡號或金融驗證資料由選用的支付服務商處理；本網站僅接收完成訂單與對帳所需的交易狀態或識別資訊。請勿透過 Discord 私訊或一般電子郵件傳送密碼或驗證碼。</p>
      </PolicySection>

      <PolicySection title="五、重複扣款、付款異常與退款">
        <p>若發生重複扣款、金額不符或已扣款但未建立訂單，請提供訂購人資料、付款時間、金額與交易編號聯絡客服。退款核准後原則上退回原付款方式，實際入帳日依銀行或支付服務商作業時間為準。</p>
      </PolicySection>
    </PolicyShell>
  );
}
