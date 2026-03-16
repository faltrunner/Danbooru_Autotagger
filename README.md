# Danbooru AI Tagger

一個專為 Danbooru 貢獻者設計的 Userscript，旨在極大化縮短上傳流程。

## 核心功能

### `danbooru-ai-tagger.user.js`
直接整合在 Danbooru 上傳與貼文介面中。

- **AI 預測**：呼叫 `autotagger.donmai.us` API 進行圖像辨識。
- **雲端字典**：**102,706 筆**台灣華文譯名，從 CDN 下載並快取於本機，無需本地檔案。
- **雙語搜尋**：在 Editor Panel 即時搜尋英文 tag 或中文譯名。
- **Live Editor**：可視化標籤管理，支援分類顏色、wiki 預覽、單鍵新增/刪除。

## 版本管理

本專案採用**架構與數據分離**的雙版本策略：

| 版本 | 當前 | 說明 |
|---|---|---|
| 腳本版本 | `1.0.0` | 功能、架構、UI 異動時更新（SemVer） |
| 字典版本 | `1.0.0` | DICTIONARY.json 內容更新時遞增，觸發用戶重新下載快取 |

## 安裝

1. 安裝 [Tampermonkey](https://www.tampermonkey.net/)
2. 將 `danbooru-ai-tagger.user.js` 匯入 Tampermonkey
3. 前往 Danbooru 任意 post 或 upload 頁面即可使用

首次使用時腳本會自動從 CDN 下載字典（約 3.8MB），之後從本機快取讀取。

## 開發日誌

詳細版本紀錄請參閱 [PROGRESS.md](./PROGRESS.md)。

---
*Disclaimer: 此工具僅供學術研究使用。*
