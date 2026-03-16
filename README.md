# Danbooru Setup & AI Tagger Workflow (v6.6.0)

這是一個專為 Danbooru 貢獻者設計的工具整合包，旨在極大化縮短上傳流程。

## 🚀 核心組成

### 1. Danbooru AI Tagger (`danbooru-ai-tagger.user.js`)
一個強大的 Userscript，直接整合在 Danbooru 上傳與貼文介面中。
- **AI 預測**：呼叫 `autotagger.donmai.us` API 進行圖像辨識。
- **在地化字典**：內建 **102,706 筆** 台灣華文譯名 (Rev. 102706)，達成全站標籤 100% 覆蓋。
- **外部資源載入**：透過 `@resource` 加載本地 `DICTIONARY.json`，效能極大化。

## 🛠️ 版本控制方案 (Revision Mode)
本專案採用 **邏輯與數據分離** 的版本管理策略：
- **Script Version (vX.X.X)**: 僅在腳本功能、架構或 UI 變更時更新（遵循 SemVer）。
- **Data Revision (Rev. N)**: 字典數據更新時遞增，`N` 代表當前字典包含的有效標籤總數。
- **當前版本**: `v6.6.0 (Rev. 102706)`

## 📈 開發里程碑

- **v1.0 - v4.9**: 核心邏輯開發、原生 UI 對接、Live Editor 實作。
- **v5.0 - v6.0**: 10 萬筆標籤全量導入，實作外部 JSON 異步加載機制。
- **v6.1 - v6.5.0**: **數據精煉里程碑**。完成艦隊收藏、姿勢體位、手部動作、背景圖案等深度在地化校對。
- **v6.6.0**: **Editor Panel 搜尋功能**。新增雙語（英文/中文）即時標籤搜尋欄，支援字典全量比對與視覺區塊辨識。
- **Rev. 102706**: 達成 102,706 筆標籤之 100% 台灣華文標準化。

詳細開發日誌請參閱 [PROGRESS.md](./PROGRESS.md)。

---
*Disclaimer: 此工具僅供學術研究使用。*
