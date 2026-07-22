import type { Metadata } from "next";
import PolicyShell, { PolicySection } from "../PolicyShell";

export const metadata: Metadata = {
  title: "退換貨政策",
  description: "深夜不關燈周邊商品的取消、退貨、換貨與退款說明。",
  alternates: { canonical: "/policies/returns" },
};

export default function ReturnsPolicyPage() {
  return (
    <PolicyShell eyebrow="Returns and exchanges" title="退換貨政策" intro="本政策適用於深夜不關燈（We Are Still Here）官網販售的實體周邊商品；如法令提供更有利於消費者的權利，依該法令辦理。">
      <PolicySection title="一、下單後取消">
        <p>商品尚未出貨前，如需取消訂單，請以電子郵件提供訂購人姓名、電話與訂單資訊。我們確認後會停止出貨並協助取消；若款項已完成，將依原付款方式辦理退款。</p>
      </PolicySection>

      <PolicySection title="二、七日解除權">
        <p>網路購買的非客製化實體商品，原則上可自收到商品次日起七日內，以退回商品或書面通知方式解除契約，無須說明理由或負擔費用。七日為考慮期，不是試用期。</p>
        <p>為確認商品所必要的拆封與檢查，不影響解除權；若因超出必要檢查而造成商品毀損、滅失或價值減少，可能需依實際減損程度負擔責任。</p>
      </PolicySection>

      <PolicySection title="三、例外與客製化商品">
        <p>如商品是依消費者要求製作的客製化給付，且我們在下單前已清楚告知不適用七日解除權，才會依規定排除該解除權。一般現貨帆布袋與鑰匙圈不會僅因拆封就當然失去七日解除權。</p>
      </PolicySection>

      <PolicySection title="四、瑕疵、短缺或寄錯商品">
        <p>收到商品後如有破損、缺件、數量不符或寄錯，請保留商品、包裝與物流單據，並來信附上照片及訂購資料。我們確認後會安排補寄、換貨、退款或其他適當處理，相關必要物流費用由我們負擔。</p>
      </PolicySection>

      <PolicySection title="五、退貨方式與退款">
        <p>請先來信取得退貨指示，避免寄錯地址或遺失。商品退回後，我們會核對內容與付款紀錄，並以原付款方式退款；實際入帳時間依銀行或支付服務商作業時間而異。</p>
      </PolicySection>
    </PolicyShell>
  );
}
