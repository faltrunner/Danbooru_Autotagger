# 模塊規格：標籤互動與 UI 介面 (Tag UI & Interaction)

## 1. 功能目標
提供直觀、具備語意化顏色與本地化翻譯的標籤操作面板。

## 2. 核心組件
- **萬能字典 (Localization Dict)**: 內建 101,341 筆標籤的台灣華文譯名。
- **Wiki 連動引擎 (Wiki Linker)**: 
    - 每個標籤左側配置 `?` 連結。
    - 懸停異步抓取 Wiki JSON 摘要並快取。
- **即時編輯器同步 (Live Sync)**: 
    - 監聽 `textarea` 的 `input` 事件。
    - 當標籤已存在於輸入框時，自動將預測區對應標籤變灰並加上刪除線。
- **類別著色器 (Category Painter)**:
    - 呼叫 `/tags.json` 獲取標籤類型 (Artist, Character, etc.)。
    - 動態注入 CSS 類別 `tag-type-X` 並對接 Danbooru 原生 CSS 變數（如 `--general-tag-color`）。

## 3. UI 組件結構
### A. 預測結果 Chip
`[?] [英文名] ([中文譯名]) [信心度%] [+]`
- `+`: 單選添加。
- 本體點擊: 切換排除狀態。

### B. 現有標籤 Chip
`[?] [英文名] ([中文譯名]) [-]`
- `-`: 從輸入框精準移除。

## 4. 樣式規範
- **General (0)**: 藍色 (#0073ff)
- **Artist (1)**: 紅色 (#c00000)
- **Copyright (3)**: 紫色 (#a800aa)
- **Character (4)**: 綠色 (#00aa00)
- **Meta (5)**: 橘紅色 (#f80000)
- **Excluded/Added**: 35% 透明度 + 刪除線。
