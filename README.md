# Danbooru AI Tagger

一個專為 Danbooru 貢獻者設計的 Tampermonkey Userscript，從**任意網站右鍵上傳圖片**到 Danbooru，並提供 AI 標籤預測、雲端字典、智慧來源 URL 提取等功能。

## 核心功能

### 🌐 **全網右鍵上傳**
在**任意網站**上右鍵點擊圖片，選擇 `📤 Upload to Danbooru`：
- 自動開啟 Danbooru 上傳頁面
- 圖片 URL 與來源頁面 URL 智慧填入
- 支援 Twitter/X、Pixiv、Fanbox、ArtStation、DeviantArt 等 22+ 平台識別

### 📝 **AI 標籤預測**（Danbooru 頁面）
直接整合在 Danbooru 上傳與貼文介面中：
- **AI 預測**：呼叫 `autotagger.donmai.us` API 進行圖像辨識
- **雲端字典**：**102,706 筆**台灣華文譯名，從 CDN 下載並快取，無需本地檔案
- **雙語搜尋**：在 Editor Panel 即時搜尋英文 tag 或中文譯名
- **Live Editor**：可視化標籤管理，支援分類顏色、wiki 預覽、單鍵新增/刪除

### 🔧 **智慧來源 URL 處理**
- **平台偵測**：自動辨識來源網站（Pixiv、Twitter 等），顯示彩色標籤
- **URL 自動修正**：一鍵清除 Pinterest、Discord、Bilibili、Fanbox、Booth 等 CDN 縮圖參數
- **DOM 提取**：從 Twitter feed 或 Pixiv 搜尋頁右鍵時，自動提取正確的推文/作品 URL（而非 CDN 圖片 URL）
- **自動填入**：上傳頁面的 source 欄自動填入正確的貼文頁面 URL

## 版本資訊

| 版本 | 當前 | 說明 |
|---|---|---|
| 腳本版本 | `1.3.0` | SemVer：新功能→MINOR、bug修復→PATCH、架構改動→MAJOR |
| 字典版本 | `1.0.0` | SemVer：新增10+標籤→MINOR、單標籤修正→PATCH、格式改變→MAJOR |

詳見 [VERSIONING.md](./VERSIONING.md) 的完整版本控制政策。

**v1.3.0 亮點**（2026-03-16）：
- ✨ 全網右鍵圖片上傳（支援 Twitter/X、Pixiv、Fanbox 等）
- 🎯 平台特定 DOM 提取（Twitter status 連結、Pixiv artwork）
- 🔧 CDN URL 自動修正（Pinterest、Discord、Bilibili、Fanbox、Booth）
- ✅ Source 欄位自動填入（來源頁面 URL，而非原始 CDN URL）

## 安裝

1. 安裝 [Tampermonkey](https://www.tampermonkey.net/)
2. 將 `danbooru-ai-tagger.user.js` 內容複製至新 Tampermonkey 腳本
3. 儲存並啟用

首次使用時腳本會自動從 CDN 下載字典（約 3.8MB），之後從本機快取讀取。

## 使用方式

### 🌐 全網右鍵上傳圖片

**在任意網站上**（Twitter、Pixiv、ArtStation 等）：

1. **右鍵點擊圖片** → 出現深色浮動選單
2. 點擊 `📤 Upload to Danbooru` → 新分頁開啟 Danbooru 上傳頁面
3. 自動填入：
   - **圖片 URL**：經過 CDN 參數清理的直連 URL
   - **Source 欄位**：正確的貼文/作品頁面 URL（而非原始 CDN 圖片 URL）
   - **平台徽章**：顯示識別的來源網站

**支援的平台**（自動識別）：
- Twitter/X、Pixiv、Fanbox、ArtStation、DeviantArt、Tumblr、Bluesky、Weibo
- Booth、Fantia、Skeb、Reddit、Instagram、Patreon、Bilibili、Discord、Pinterest
- Ko-fi、Lofter、Nijie、FurAffinity、Gelbooru...等 22+ 平台

### 🧠 在 Danbooru 上使用 AI 標籤

**在 Danbooru 上傳或編輯貼文時**：

#### Predict Tags (AI)
1. 點擊「**Predict Tags (AI)**」按鈕
2. 等待 AI 分析圖片（通常數秒）
3. 檢視建議標籤與信心度百分比
4. 調整 **Threshold 滑塊**（1~100%）篩選信心度
5. 點擊 **Apply All** 套用所有標籤 或 逐個點擊 `+` 新增

#### 搜尋與編輯標籤
- **搜尋欄**：輸入英文 tag 或中文查詢
  - `e.g.` 輸入 "girl" → 檢視相關 tag 與中文譯名
  - 輸入 "女孩" → 反向查詢英文 tag
- **Live Editor**：即時顯示已添加的 tag，點擊 `-` 移除
- **Wiki 預覽**：悬停 tag 旁的 `?` 圖標，查看詞條定義

#### 平台識別與 URL 修正
上傳頁面會自動：
- 偵測 Source 欄的來源平台，顯示彩色徽章
- 若 URL 含有縮圖參數（e.g. Pinterest `736x`, Discord 寬度參數），出現 **🔧 Fix URL** 按鈕
- 一鍵清理 CDN 參數，還原原始解析度 URL

## 開發日誌

詳細版本紀錄請參閱 [PROGRESS.md](./PROGRESS.md)。

---
*Disclaimer: 此工具僅供學術研究使用。*

## 技術細節

### 右鍵上傳流程

```
右鍵圖片 → 攔截 contextmenu 事件
  ↓
extractSourceUrl() - DOM/URL 智慧提取
  ├─ Twitter/X: 找 <article> 中的 /status/ 連結
  ├─ Pixiv: 從 /artworks/ URL 提取
  ├─ Fanbox/ArtStation: 清除 query string
  └─ 其他: 直接使用 location.href
  ↓
fixupSourceUrl() - 清理 CDN 參數
  ├─ Pinterest: /736x/ → /originals/
  ├─ Discord/imgix: 移除 ?width= 等
  ├─ Bilibili: 移除 @240w_320h_... 後綴
  ├─ Fanbox/Booth: 移除 /c/WIDTHxHEIGHT_a2_g5/
  └─ Fantia: 移除 main_ 檔名前綴
  ↓
開啟: danbooru.donmai.us/uploads/new?url=<清理後圖片>&ref=<頁面URL>
```

### Source URL 自動填入邏輯

Danbooru 上傳頁面載入後：
- 檢查 `?url=`（圖片 CDN URL）和 `?ref=`（頁面 URL）
- **若兩者不同**：強制設定 source = `?ref=`（正確的貼文/作品 URL，而非 CDN URL）
- **若兩者相同**：使用 CDN URL 為 fallback（直接開啟 CDN 圖片 URL 的情況）

### 已知限制

- ⚠️ **直接查看 CDN URL 時**：若使用者直接在瀏覽器開啟圖片 CDN URL（e.g. `pbs.twimg.com/media/xxx.jpg`），無法自動得知原貼文 URL。建議在貼文頁面上右鍵圖片。
- ⚠️ **JavaScript 動態載入**：若網站使用 infinite scroll，圖片可能尚未完全載入。建議稍候再右鍵。

---

*此工具與 [Upload-to-Danbooru](https://github.com/danbooru/upload-to-danbooru) 瀏覽器擴充功能獨立開發，概念相似但程式碼完全獨立。*
