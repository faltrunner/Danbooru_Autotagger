# 支援網站列表

本腳本支援在 **22 個網站** 上右鍵上傳圖片至 Danbooru。

## 📋 完整列表

| # | 網站 | 域名 | 徽章顏色 | 特殊處理 |
|---|------|------|--------|--------|
| 1 | **Pixiv** | `pixiv.net` | <span style="color:#0096fa">■</span> 藍 | ✓ DOM提取 `/artworks/` |
| 2 | **Twitter/X** | `twitter.com`, `x.com`, `twimg.com` | <span style="color:#1da1f2">■</span> 藍 | ✓ DOM提取 `/status/` |
| 3 | **Pixiv Fanbox** | `pximg.net`, `fanbox.cc` | <span style="color:#f96854">■</span> 紅 | ✓ URL清理 |
| 4 | **ArtStation** | `artstation.com` | <span style="color:#13aff0">■</span> 淺藍 | ✓ Query string清理 |
| 5 | **DeviantArt** | `deviantart.com` | <span style="color:#05cc47">■</span> 綠 | ✓ Query string清理 |
| 6 | **Tumblr** | `tumblr.com` | <span style="color:#35465c">■</span> 灰 | 基本支援 |
| 7 | **Bluesky** | `bsky.app`, `bsky.social` | <span style="color:#0085ff">■</span> 藍 | 基本支援 |
| 8 | **Weibo** | `weibo.com`, `weibo.cn` | <span style="color:#df2029">■</span> 紅 | 基本支援 |
| 9 | **Booth** | `booth.pm` | <span style="color:#fc4d50">■</span> 紅 | ✓ URL清理（移除resize） |
| 10 | **Fantia** | `fantia.jp` | <span style="color:#e74c3c">■</span> 紅 | ✓ URL清理（移除main_前綴） |
| 11 | **Skeb** | `skeb.jp` | <span style="color:#6772e5">■</span> 紫 | 基本支援 |
| 12 | **Reddit** | `reddit.com` | <span style="color:#ff4500">■</span> 橙 | 基本支援 |
| 13 | **Instagram** | `instagram.com` | <span style="color:#c13584">■</span> 粉紅 | 基本支援 |
| 14 | **Patreon** | `patreon.com` | <span style="color:#f96854">■</span> 紅 | 基本支援 |
| 15 | **Bilibili** | `bilibili.com`, `hdslb.com` | <span style="color:#00a1d6">■</span> 藍 | ✓ URL清理（移除@WxH） |
| 16 | **Discord** | `discord.com`, `discordapp.com` | <span style="color:#7289da">■</span> 紫 | ✓ URL清理（移除query） |
| 17 | **Pinterest** | `pinimg.com`, `pinterest.com` | <span style="color:#e60023">■</span> 紅 | ✓ URL清理（/736x/ → /originals/） |
| 18 | **Ko-fi** | `ko-fi.com` | <span style="color:#00aff0">■</span> 淺藍 | 基本支援 |
| 19 | **Lofter** | `lofter.com` | <span style="color:#0080c0">■</span> 藍 | 基本支援 |
| 20 | **Nijie** | `nijie.info` | <span style="color:#ff6699">■</span> 粉 | 基本支援 |
| 21 | **FurAffinity** | `furaffinity.net` | <span style="color:#faaf3a">■</span> 金 | 基本支援 |
| 22 | **Gelbooru** | `gelbooru.com` | <span style="color:#0050c0">■</span> 深藍 | 基本支援 |

---

## 特殊處理說明

### ✓ DOM 提取（自動找出正確的貼文/作品 URL）

**Twitter/X**：
- 從最近的 `<article>` 中尋找 `/status/` 連結
- 自動移除 `/photo/N` 或 `/video/N` 後綴
- 即使在 feed 頁面右鍵也能取得完整推文 URL

**Pixiv**：
- 從頁面 URL 提取 `/artworks/XXXXX` 部分
- 若找不到，從 DOM 中搜尋 artwork 連結
- 移除 query string（如 `?lang=zh`）

### ✓ URL 清理（自動移除 CDN 縮圖參數）

| 網站 | 清理規則 | 範例 |
|------|--------|------|
| **Pinterest** | `/736x/` → `/originals/` | `pinimg.com/736x/...` → `pinimg.com/originals/...` |
| **Discord** | 移除 `?width=`, `?height=` 等 | `cdn.discordapp.com/...?width=400` → `cdn.discordapp.com/...` |
| **Bilibili** | 移除 `@240w_320h_...` 後綴 | `hdslb.com/image.jpg@240w_320h` → `hdslb.com/image.jpg` |
| **Fanbox** | 移除 `/c/1620x580_90_a2_g5/` | `pximg.net/c/1620x580_a2_g5/xxx.png` → `pximg.net/xxx.png` |
| **Booth** | 移除 `/c/300x300_a2_g5/` + `_base_resized` | `booth.pximg.net/c/300x300/.../image_base_resized.jpg` → clean URL |
| **Fantia** | 移除檔名 `main_` 前綴 | `fantia.jp/image/main_abc123.jpg` → `fantia.jp/image/abc123.jpg` |
| **imgix** | 移除 query string（若無簽名） | `example.imgix.net/image.jpg?w=1200` → `example.imgix.net/image.jpg` |

### 基本支援

這些網站能識別並顯示徽章，但沒有特殊的 URL 清理或 DOM 提取。直接使用 `location.href` 作為來源 URL。

---

## 使用情況

### ✅ 完整支援（推薦）

- **Pixiv** - DOM智慧提取 + URL清理
- **Twitter/X** - DOM智慧提取 + 推文狀態自動抽取
- **Fanbox** - DOM智慧提取 + URL清理
- **Pinterest** - URL自動清理（縮圖→原圖）
- **Bilibili** - URL自動清理（移除壓縮參數）

### ⚠️ 基本支援（仍可使用）

- **Instagram**, **Reddit**, **Bluesky**, **Weibo** 等：能識別網站、顯示徽章，但無特殊 URL 清理

### ⚠️ 注意事項

1. **直接開啟 CDN URL**：若使用者直接在瀏覽器開啟圖片 CDN URL（如 `pbs.twimg.com/media/xxx.jpg`），無法自動取得原推文 URL。建議在**貼文頁面上右鍵圖片**。

2. **JavaScript 動態載入**：若網站使用 infinite scroll 或懶載入，圖片可能尚未完全載入。建議**稍候再右鍵**。

3. **登入限制**：有些網站需要登入才能查看圖片（如私密貼文），此時 URL 可能包含臨時 token，上傳後可能失效。

---

## 新增支援網站

若要支援新網站，需在 `danbooru-ai-tagger.user.js` 中新增：

### 1. 平台偵測（`SOURCE_SITES` 陣列）

```javascript
const SOURCE_SITES = [
    // ... existing sites
    { p: /example\.com/,  name: 'Example',  color: '#FF0000' },  // 新網站
];
```

### 2. （可選）DOM 提取邏輯（`extractSourceUrl()` 函數）

```javascript
// Example: extract post URL from page
if (/example\.com/.test(pageUrl) && /\/posts\/\d+/.test(pageUrl))
    return pageUrl.split('?')[0];  // 清除 query string
```

### 3. （可選）URL 清理規則（`fixupSourceUrl()` 函數）

```javascript
// Example: remove CDN parameters
if (host.includes('cdn.example.com')) {
    return url.replace(/@\d+x\d+/, '');  // 移除 @640x480 等
}
```

提交 Pull Request 時請附上該網站的 URL 範例及清理規則文檔。

---

## 常見問題

**Q: 為什麼我右鍵的網站沒有出現徽章？**

A: 該網站可能不在支援列表內。歡迎 [提交 issue](https://github.com/FaltRunner/Danbooru_autotagger) 要求新增支援。

**Q: source 欄位被填成了 CDN URL 而非原始頁面？**

A: 表示：
- 你在**直接開啟的 CDN 圖片頁面**右鍵（如 `pbs.twimg.com/media/xxx.jpg`）
- 解決方法：改為在**原始貼文/作品頁面**右鍵圖片

**Q: Pinterest 的縮圖 URL 怎樣才能自動清理？**

A: 若 source 欄出現「🔧 Fix URL」按鈕，點擊即可一鍵清理。也可手動在 Danbooru 上傳頁面進行。

---

*最後更新：2026-03-16*
