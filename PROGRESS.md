# Danbooru AI Tagger 開發進度與版本日誌

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
