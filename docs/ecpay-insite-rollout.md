# 綠界站內付 2.0 發布檢查

本次程式碼的站內付信用卡範圍是深夜官網的周邊商品，以及深夜／秋奈機器人共用的服務付款頁；尚未部署或開放正式收款。ATM 虛擬帳號、超商代碼與條碼暫走另行實作的 AIO 取號流程；不要使用 `GetTokenbyTrade.Token` 直接充作 `CreatePayment.PayToken`。

1. 先套用 `supabase/migrations/20260923173000_ecpay_insite_attempts.sql`，確認 RLS 開啟、`anon` 不可讀、`service_role` 可呼叫 `ecpay_insite_claim_create`。
2. 部署網站時先保持 `ECPAY_INSITE_ACCEPT_PAYMENTS=false`；AIO 的 `ECPAY_ACCEPT_PAYMENTS` 保留既有信用卡，ATM/超商需獨立的 `ECPAY_NONCREDIT_ACCEPT_PAYMENTS=true` 才會開放。
3. 在獨立測試環境設定 `ECPAY_ENV=stage` 與綠界公開測試商戶，完成取得 Token、SDK 顯示卡號、取得 PayToken、CreatePayment、3D 跳轉、ReturnURL、OrderResultURL、後台訂單與機器人履約的全流程。測試卡資訊以綠界官方測試介接頁為準。不要在正式資料庫插入測試付款單。
   - 2026-09-23 已用公開 Stage 商戶完成 GetTokenbyTrade，並在瀏覽器確認 SDK 顯示信用卡欄位。
   - 2026-09-23 另以 `scripts/test-ecpay-in-site-flow-stage.mjs` 與臨時 HTTPS 測試入口，用公開 Stage 測試卡完成 PayToken → CreatePayment → 3D → OrderResultURL → ReturnURL；ReturnURL 解密後為 `RtnCode=1`、金額 100 元、測試狀態 `paid`。這驗證了共用綠界協議與解析器，但不是網站資料庫／機器人履約的端到端驗證。臨時入口測完即關閉，不作正式付款回呼網址。
   - SDK 會自行載入相容的 forge 函式庫；不要預載舊版 `node-forge@0.7.0`，否則 `initialize()` 會回傳錯誤。
   - 正式商戶已成功簽發 GetTokenbyTrade Token（未送出 CreatePayment，未產生實際扣款）；正式啟用仍需在限定範圍完成真實付款與入帳／履約核對。
4. 核對正式商戶已開通站內付 2.0、HashKey/HashIV 長度正確、`ECPAY_PUBLIC_BASE_URL` 可公開接收 HTTPS POST；不得將金鑰放進前端或版控。
5. 正式啟用後，先小額真實付款驗證一次，核對綠界交易編號、金額、後端通知、訂單 `paid` 與機器人履約。退款／取消依綠界規範單獨驗證。

若 `CreatePayment` 超時，`ecpay_insite_attempts.status` 保持 `creating`，不可自動再送一次扣款。先用綠界商家後台查詢該 `MerchantTradeNo`，確認未收款後再由客服處理新訂單。付款是否成功只由經 AES 驗證的 ReturnURL 與資料庫核帳函式決定，不能依瀏覽器跳轉頁認定。
