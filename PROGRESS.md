# Danbooru AI Tagger 開發進度與版本日誌

---

## [腳本 v1.3.0] - 2026-03-16
### 修正 source URL 邏輯（符合 Danbooru 規範）

#### Bug 修正
- **根本問題**：Danbooru 上傳頁面會以 `?url=`（圖片 CDN URL）預填 source 欄位；舊版腳本只在欄位空白時才覆蓋，導致 source 停留在 CDN URL 而非貼文頁面 URL。
- **修正**：`initSourceHelper` 改為：若 `?ref=` 與 `?url=` 不同，無條件以 `?ref=`（頁面 URL）覆蓋 source 欄位。

#### 新功能：`extractSourceUrl()` DOM 提取
右鍵圖片時，改用平台專屬邏輯提取正確的貼文 URL（而非直接以 `location.href` 為 ref）：

| 平台 | 提取方式 |
|------|---------|
| Twitter/X (`pbs.twimg.com`) | 若在 status 頁則截取 status URL；否則從最近的 `<article>` 找 `/status/` 連結 |
| Pixiv (`i.pximg.net`) | 從 page URL 提取 `/artworks/` 段落；或找 DOM 中的 artwork 連結 |
| Fanbox | 清除 post URL 的 query string |
| ArtStation / DeviantArt | 清除 query string |
| 其他 | 直接用 `location.href` |

**實際效果範例**：在 x.com tweet 頁面右鍵圖片 → source = `https://x.com/user/status/12345`（而非 `pbs.twimg.com/media/...`）

---

## [腳本 v1.2.0] - 2026-03-16
### 任意網站右鍵圖片上傳

#### 新功能：全站右鍵選單
- **`@match *://*/*`**：腳本現在在所有網站執行（Danbooru 專屬 UI 仍僅在 danbooru.donmai.us 載入）。
- **右鍵自訂選單**：在任意網站右鍵 `<img>` 元素時，抑制原生選單，改顯示自訂深色浮動選單：
  - 來源平台標頭（若能辨識）
  - 「📤 Upload to Danbooru」選項
- **自動整合 URL 修正**：跳轉 URL 已套用 `fixupSourceUrl()`，開啟的上傳頁面會帶入清理後的圖片 URL + `?ref=` 來源頁面。
- **`GM_openInTab`**：在新分頁開啟 Danbooru 上傳頁面。
- **排除例外**：`data:` 與 `blob:` URL 不觸發（避免誤判頁面內嵌縮圖）。
- `isDanbooru` 變數統一控制 Danbooru 專屬邏輯的載入範圍。

---

## [腳本 v1.1.0] - 2026-03-16
### 來源 URL 偵測與自動修正

#### 新功能：Source URL Helper
靈感來自 Upload-to-Danbooru 瀏覽器擴充功能的 URL 修正邏輯，在上傳頁面的 source 欄位旁注入輔助 UI：

- **來源網站徽章**：偵測 22 個主流畫師平台（Pixiv、Twitter/X、Fanbox、ArtStation、DeviantArt、Booth、Fantia 等），自動顯示彩色平台名稱標籤。
- **🔧 Fix URL 按鈕**：一鍵清除各平台的縮圖/壓縮參數，還原為原始解析度 URL。支援規則：
  - Pinterest：`/736x/` → `/originals/`
  - Discord CDN：移除查詢參數（`?width=`、`?height=` 等）
  - Bilibili (`hdslb.com`)：移除 `@240w_320h_...` 縮圖後綴
  - Pixiv/Fanbox (`pximg.net`)：移除 `/c/1620x580_90_a2_g5/` resize 路徑
  - Booth：移除 `/c/300x300_a2_g5/` 及 `_base_resized`
  - Fantia：移除檔名 `main_` 前綴
  - imgix（無簽名）：移除查詢字串
- **?ref= 自動填入**：若上傳頁面 URL 含 `?ref=<page_url>`（例如從 Upload-to-Danbooru 擴充功能跳轉），且 source 欄空白時，自動填入參照 URL 並顯示提示。

#### 技術說明
- 完全獨立實作，未複製外部程式碼，僅參考 URL 修正邏輯概念自行撰寫。
- `initSourceHelper()` 在找不到 source input 時直接返回，對 `/posts/*` 頁面無副作用。

---

## [腳本 v1.0.0] - 2026-03-16（持續更新）

### 驗證測試 - 2026-03-16
- **CDN 獨立運作確認**：驗證插件在完全無本機 `DICTIONARY.json`/`DICTIONARY.csv` 的情況下，可純靠 CDN 正常載入字典。
- **字典讀取機制分析**：確認 `loadDictionary()` 三段降級策略（快取命中 → CDN 下載 → 舊快取）運作正確。
- **本機檔案定位釐清**：確認 `DICTIONARY.json`/`DICTIONARY.csv` 僅為推送至 GitHub 的來源檔，腳本執行時不直接讀取。

---

## [腳本 v1.0.0] - 2026-03-16
### 重大架構升級：雲端字典 + 穩定性修正

#### 字典載入機制重構
- **移除本地依賴**：原 `@resource` + `GM_getResourceText` 本地路徑方案全面廢棄。
- **CDN 主路徑**：字典從 `cdn.jsdelivr.net/gh/faltrunner/Danbooru_Autotagger` 下載。
- **GM_setValue 快取**：首次下載後快取於 Tampermonkey storage，後續離線可用。
- **降級機制**：CDN 失敗時自動讀取舊版快取，確保中文功能不中斷。
- **首次下載提示**：面板顯示「正在下載中文字典...」狀態列，下載完畢自動消失。

#### Bug 修正
- **顏色渲染不穩定**：加入 render 版本號（`renderSeq`），偵測到過時渲染時自動中止，防止 async race condition 導致舊結果覆蓋新結果。頁面載入後延遲 1.2 秒補跑一次渲染，確保 Danbooru JS 填完 textarea 後顏色全部正確。
- **tag 更新需多按空格**：改監聽 `input` + `keyup` + `change` 三種事件（含 80ms debounce），解決 Danbooru autocomplete 填入 tag 時不觸發 `input` 事件的問題。

#### 版本管理方案確立
- 採用**架構與數據分離**雙版本策略（`腳本 Major.Minor.Patch` / `字典 Major.Minor.Patch`）。
- `@version` 與 `DICT_VER` 完全獨立，互不影響。

---

## [腳本 v0.6.6 / 字典 Rev.102706] - 2026-03-16
### Editor Panel 標籤搜尋功能
- 新增即時雙語搜尋欄（英文 tag / 中文譯名），比對 102,706 筆字典，最多顯示 30 筆。
- 搜尋結果 chip 支援 Wiki 摘要 tooltip、已添加標籤顯示刪除線。

---

## [字典 Rev.101341 → Rev.102706] - 2026-03-15
### 數據精煉第一階段
- 背景與環境：40+ 筆（顏色、紋樣、3D/AI 生成）。
- 學園偶像大師新角色、艦隊收藏核心術語校正。
- 手部動作 60+ 筆、姿勢體位 50+ 筆標準化。
- 生理用品、花卉印花等細分標籤補齊。

---

## [腳本 v0.5.0 - v0.6.0] - 2026-03-15
### 十萬標籤全覆蓋與架構重整
- 字典規模從 2,500 筆躍升至 101,341 筆。
- 實作外部 JSON 資源加載機制（`@resource`）。
- 確立台灣華文（繁體）為唯一翻譯標準。

---

## [腳本 v0.1.0 - v0.4.9] - 2026-03-15
### 核心開發期
- 整合 Danbooru Autotagger API。
- 對接 Danbooru CSS 變數，支援深/淺色主題。
- 實作 Live Editor、標籤排除、雙重解析引擎（HTML + JSON）。
