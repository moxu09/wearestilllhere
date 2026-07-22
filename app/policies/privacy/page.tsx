import type { Metadata } from "next";
import PolicyShell, { PolicySection } from "../PolicyShell";

export const metadata: Metadata = {
  title: "隱私權政策",
  description: "深夜不關燈官網蒐集、處理及利用個人資料的說明。",
  alternates: { canonical: "/policies/privacy" },
};

export default function PrivacyPolicyPage() {
  return (
    <PolicyShell eyebrow="Privacy policy" title="隱私權政策" intro="深夜不關燈（We Are Still Here）重視你的個人資料。本政策說明商品訂購及網站服務過程中，個人資料如何被蒐集、處理、利用與保護。">
      <PolicySection title="一、蒐集者與聯絡方式">
        <p>蒐集者：深夜不關燈（We Are Still Here）。關於個人資料的查詢或權利行使，請寄送電子郵件至本頁所列客服信箱。</p>
      </PolicySection>

      <PolicySection title="二、蒐集目的與資料類別">
        <p>我們可能蒐集姓名、電話、電子郵件、Discord 帳號、超商及門市名稱、訂購商品與數量、付款方式、交易識別資料、客服往來內容，以及裝置、瀏覽器、IP 位址與必要的系統紀錄。</p>
        <p>資料用於會員與訂單管理、身分及付款確認、出貨取件、客服聯繫、退款退貨、資訊安全、防詐與依法保存會計或交易紀錄。</p>
      </PolicySection>

      <PolicySection title="三、利用期間、地區、對象及方式">
        <p>資料會在蒐集目的存續期間、契約關係期間及法令要求的保存期間內，以電子或紙本方式利用；利用地區以台灣及提供網站、資料庫、物流、付款或客服服務之受託處理地區為限。</p>
        <p>必要時會提供給受託的網站與資料庫服務商、物流業者、支付服務商、金融機構、專業顧問或依法有權調取的機關，且僅提供完成目的所需的範圍。我們不會任意出售個人資料。</p>
      </PolicySection>

      <PolicySection title="四、你的權利">
        <p>依適用法令，你可以請求查詢或閱覽、製給複製本、補充或更正、停止蒐集／處理／利用，以及刪除個人資料。若法律要求保存交易或會計紀錄，我們可能於法定期間內限制刪除。</p>
      </PolicySection>

      <PolicySection title="五、不提供資料的影響">
        <p>你可以自由選擇是否提供資料；但姓名、聯絡電話、取件門市及必要付款資訊若不完整，我們可能無法建立訂單、完成出貨、處理退款或提供客服。</p>
      </PolicySection>

      <PolicySection title="六、資訊安全與政策更新">
        <p>我們採取合理的存取控制、權限管理及系統安全措施，但網路傳輸無法保證絕對安全。政策如有調整，會更新本頁內容與日期；重大變更將以適當方式通知。</p>
      </PolicySection>
    </PolicyShell>
  );
}
