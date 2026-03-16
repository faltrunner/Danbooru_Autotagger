# 模塊規格：AI 標籤預測功能 (Prediction Engine)

## 1. 功能目標
自動分析當前網頁中的圖片內容，並透過遠端 AI 伺服器獲取建議標籤。

## 2. 核心組件
- **影像獲取器 (Blob Fetcher)**: 負責將網頁上的 `img.src` 轉換為二進位 `Blob` 格式，以利上傳。
- **通訊器 (API Comm)**: 呼叫 `autotagger.donmai.us` 介面。
- **解析器 (Parser)**: 
    - **Method A (HTML)**: 解析回傳的渲染頁面（防止 API 格式變動）。
    - **Method B (JSON)**: 解析扁平物件格式 `[{"tag": confidence}, ...]`.
- **翻譯引擎 (Translation Engine - v6.5)**:
    - **在地化資料庫**: 內建 101,341 筆 Danbooru 通用標籤的台灣華文譯名。
    - **資源加載**: 透過 `@resource` 機制從 `DICTIONARY.json` 異步載入，解決 Userscript 長度限制。
    - **校正邏輯**: 自動校正 `on_`, `in_`, `at_` 等介係詞標籤的用語標準。
- **過濾器 (Global Filter)**: 
    - 排除 `rating:`, `status:` 開頭的系統標籤。
    - 排除 `e, s, g, q` 單字母分級標籤。
    - 排除帶有括號的角色或作品名，確保通用標籤純淨度。

## 3. 資料結構
```typescript
interface PredictedTag {
    name: string;       // 英文標籤名
    confidence: number; // 信心度 (0.0 ~ 1.0)
}
```

## 4. 流程邏輯
1. 使用者點擊 `Predict Tags` 按鈕。
2. 尋找頁面圖片元素 (`#image` 或相關類別)。
3. 將圖片轉換為 Blob 並 POST 至 AI 伺服器 (Threshold=0.01, Limit=100)。
4. 獲取回傳值並進行雙重解析與去重。
5. 將結果存入全域變數 `lastAiResponse` 並觸發 UI 渲染。
