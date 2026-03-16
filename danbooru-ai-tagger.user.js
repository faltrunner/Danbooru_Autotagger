// ==UserScript==
// @name         Danbooru AI 標記
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  腳本 v1.0.0 | 字典 v1.0.0 ── 字典從 CDN 下載並快取，無需本地檔案
// @author       FaltRunner
// @match        *://danbooru.donmai.us/uploads*
// @match        *://danbooru.donmai.us/posts/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @connect      autotagger.donmai.us
// @connect      donmai.us
// @connect      cdn.jsdelivr.net
// ==/UserScript==

(function() {
    'use strict';

    let lastAiResponse = [];
    let currentThreshold = 0.35;
    let excludedTags = new Set();
    const wikiCache = new Map();
    const categoryCache = new Map();
    let commonTagsZh = {}; // 外部載入的中文字典

    const DICT_VER     = '1.0.0';
    const DICT_URL     = 'https://cdn.jsdelivr.net/gh/faltrunner/Danbooru_Autotagger@master/DICTIONARY.json';
    const DICT_KEY_DATA = 'danbooruAI_dict_data';
    const DICT_KEY_VER  = 'danbooruAI_dict_version';

    // 注入極簡 CSS，完全依賴 Danbooru 官方變數
    const style = document.createElement('style');
    style.innerHTML = `
        #ai-tagger-panel .ai-chip { display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; border: 1px solid currentColor; border-radius: 3px; cursor: pointer; user-select: none; font-size: 0.8rem; margin: 2px; line-height: 1.4; background: transparent; }
        #ai-tagger-panel .ai-chip:hover { filter: brightness(1.2); }
        #ai-tagger-panel .tag-type-0 { color: var(--general-tag-color); }
        #ai-tagger-panel .tag-type-1 { color: var(--artist-tag-color); }
        #ai-tagger-panel .tag-type-3 { color: var(--copyright-tag-color); }
        #ai-tagger-panel .tag-type-4 { color: var(--character-tag-color); }
        #ai-tagger-panel .tag-type-5 { color: var(--meta-tag-color); }
        #ai-tagger-panel .is-added { opacity: 0.35 !important; text-decoration: line-through !important; filter: grayscale(1) !important; }
        #ai-tagger-panel .wiki-link { text-decoration: none !important; color: inherit !important; font-weight: bold; border-right: 1px solid currentColor; padding-right: 4px; margin-right: 2px; opacity: 0.7; }
        #ai-tagger-panel .add-btn, #ai-tagger-panel .remove-btn { font-weight: bold; border-left: 1px solid currentColor; padding-left: 4px; margin-left: 2px; opacity: 0.7; }
        #ai-tagger-panel .section-title { font-size: 0.75rem; font-weight: bold; opacity: 0.7; margin: 12px 0 6px 2px; text-transform: uppercase; border-bottom: 1px solid currentColor; border-bottom-color: rgba(128,128,128,0.2); padding-bottom: 2px; }
        #tag-search-input { width: 100%; box-sizing: border-box; padding: 4px 8px; font-size: 0.8rem; border: 1px solid rgba(128,128,128,0.3); border-radius: 3px; background: transparent; color: inherit; margin-bottom: 4px; }
        #tag-search-input:focus { outline: none; border-color: var(--general-tag-color, #0073ff); }
        #tag-search-results { display: flex; flex-wrap: wrap; gap: 2px; max-height: 120px; overflow-y: auto; }
        #tag-search-results:not(:empty) { padding-bottom: 16px; margin-bottom: 6px; }
    `;
    document.head.appendChild(style);

    function fetchDictionaryFromCDN() {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: DICT_URL,
                onload: (res) => {
                    if (res.status !== 200) return reject(`HTTP ${res.status}`);
                    try { resolve(JSON.parse(res.responseText)); }
                    catch (e) { reject("JSON parse failed"); }
                },
                onerror: () => reject("Network error")
            });
        });
    }

    async function loadDictionary(statusEl) {
        // 1. 快取命中
        if (GM_getValue(DICT_KEY_VER, '') === DICT_VER) {
            const raw = GM_getValue(DICT_KEY_DATA, '');
            if (raw) {
                commonTagsZh = JSON.parse(raw);
                console.log("[Danbooru AI] 字典從快取載入，總數：", Object.keys(commonTagsZh).length);
                return;
            }
        }
        // 2. 從 CDN 下載
        if (statusEl) statusEl.textContent = '正在下載中文字典（首次約需數秒）...';
        try {
            commonTagsZh = await fetchDictionaryFromCDN();
            GM_setValue(DICT_KEY_DATA, JSON.stringify(commonTagsZh));
            GM_setValue(DICT_KEY_VER, DICT_VER);
            console.log("[Danbooru AI] 字典從 CDN 下載完成，總數：", Object.keys(commonTagsZh).length);
        } catch (e) {
            // 3. 降級：讀舊快取
            const stale = GM_getValue(DICT_KEY_DATA, '');
            if (stale) {
                commonTagsZh = JSON.parse(stale);
                console.warn("[Danbooru AI] CDN 失敗，使用舊版快取：", e);
            } else {
                console.error("[Danbooru AI] 字典完全無法載入，中文功能停用：", e);
                if (statusEl) statusEl.textContent = '字典載入失敗，中文翻譯暫時停用。';
                return;
            }
        }
        if (statusEl) statusEl.textContent = '';
    }

    const getTagInput = () => document.querySelector("#post_tag_string, #upload_tag_string, textarea[name='post[tag_string]'], textarea[name='upload[tag_string]']");
    const getImgElement = () => document.querySelector("#image, .media-asset-image, .upload-preview img, #post-view img, .image-container img");

    async function fetchTagCategories(tagNames) {
        const normalized = tagNames.map(n => n.replace(/ /g, "_")).filter(n => n.length > 0);
        const unknown = normalized.filter(n => !categoryCache.has(n));
        if (unknown.length === 0) return;

        const chunkSize = 50;
        for (let i = 0; i < unknown.length; i += chunkSize) {
            const chunk = unknown.slice(i, i + chunkSize);
            await new Promise(resolve => {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: `https://danbooru.donmai.us/tags.json?search[name_comma]=${encodeURIComponent(chunk.join(","))}`,
                    onload: (res) => {
                        if (res.status === 200) {
                            try {
                                const tags = JSON.parse(res.responseText);
                                tags.forEach(t => categoryCache.set(t.name, t.category));
                            } catch (e) {}
                        }
                        resolve();
                    },
                    onerror: () => resolve()
                });
            });
        }
    }

    function fetchWikiSummary(tagName) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: `https://danbooru.donmai.us/wiki_pages/${tagName}.json`,
                onload: (res) => {
                    if (res.status !== 200) return reject();
                    try {
                        const data = JSON.parse(res.responseText);
                        const body = data.body || "";
                        let summary = body.replace(/\[\[|\]\]/g, "").split("\n")[0].trim();
                        const zhMatch = body.match(/Chinese:\s*([^\n]+)/i);
                        if (zhMatch) summary = `[中] ${zhMatch[1].trim()} | ${summary}`;
                        resolve(summary.substring(0, 150));
                    } catch (e) { reject(); }
                },
                onerror: () => reject()
            });
        });
    }

    function fetchBlob(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: "GET", url: url, responseType: "blob",
                onload: (res) => res.status === 200 ? resolve(res.response) : reject(`HTTP ${res.status}`),
                onerror: () => reject("Network error")
            });
        });
    }

    function callAiTagger(blob) {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append("file", blob, "image.jpg");
            formData.append("threshold", "0.01");
            formData.append("limit", "100");
            GM_xmlhttpRequest({
                method: "POST",
                url: "https://autotagger.donmai.us/evaluate",
                data: formData,
                onload: (res) => {
                    try {
                        const tags = [];
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(res.responseText, "text/html");
                        const rows = doc.querySelectorAll("table tr, ul li, p, div");
                        rows.forEach(el => {
                            const text = el.innerText || el.textContent;
                            const match = text.match(/([a-z0-9_()]+)\s+(\d+)%/i);
                            if (match && !text.includes("Threshold") && !text.includes("Limit")) {
                                const name = match[1].trim().toLowerCase();
                                if (name && !name.startsWith("rating:") && !name.startsWith("status:") && !["e", "s", "g", "q"].includes(name)) {
                                    tags.push({ name: match[1].trim(), confidence: parseInt(match[2]) / 100 });
                                }
                            }
                        });
                        if (tags.length === 0) {
                            try {
                                const data = JSON.parse(res.responseText);
                                const tagsObj = Array.isArray(data) ? data[0] : data;
                                if (tagsObj && typeof tagsObj === 'object') {
                                    Object.entries(tagsObj).forEach(([name, conf]) => {
                                        const low = name.toLowerCase();
                                        if (!low.startsWith("rating:") && !low.startsWith("status:") && !["e", "s", "g", "q"].includes(low)) {
                                            tags.push({ name, confidence: parseFloat(conf) });
                                        }
                                    });
                                }
                            } catch(e){}
                        }
                        const unique = Array.from(new Set(tags.map(t => t.name))).map(n => tags.find(t => t.name === n));
                        resolve(unique);
                    } catch (e) { reject("Parsing failed"); }
                },
                onerror: () => reject("Server error")
            });
        });
    }

    async function renderAiResults(tagData, container, applyBtn) {
        if (!tagData || tagData.length === 0) {
            container.innerHTML = `<span style="opacity: 0.5; font-style: italic; font-size: 0.75rem;">Predict tags to see suggestions...</span>`;
            applyBtn.style.display = "none";
            return;
        }
        const filtered = tagData.filter(t => t.confidence >= currentThreshold);
        applyBtn.style.display = filtered.length > 0 ? "block" : "none";

        const tagInput = getTagInput();
        const currentTags = tagInput ? tagInput.value.trim().split(/\s+/) : [];
        
        await fetchTagCategories(filtered.map(t => t.name));

        container.innerHTML = filtered.map(t => {
            const normName = t.name.replace(/ /g, "_");
            const cat = categoryCache.get(normName) ?? 0;
            const isAdded = currentTags.includes(normName);
            const isExcluded = excludedTags.has(t.name) || isAdded;
            const chinese = commonTagsZh[t.name] || commonTagsZh[normName] || "";
            
            return `<span data-tag="${t.name}" class="ai-chip tag-type-${cat} ${isExcluded ? 'is-added' : ''}">
                <a href="https://danbooru.donmai.us/wiki_pages/${t.name}" target="_blank" class="wiki-link" onclick="event.stopPropagation();">?</a>
                ${t.name}${chinese ? ` (${chinese})` : ''}
                <span style="opacity: 0.6; border-left: 1px solid rgba(128,128,128,0.2); padding-left: 4px;">${Math.round(t.confidence * 100)}%</span>
                <span class="add-btn" title="Add">+</span>
            </span>`;
        }).join("");
    }

    async function renderLiveEditor(tagInput, container) {
        const tagNames = tagInput.value.trim().split(/\s+/).filter(n => n.length > 0);
        if (tagNames.length === 0) {
            container.innerHTML = '<span style="opacity: 0.5; font-style: italic; font-size: 0.75rem;">No tags in editor...</span>';
            return;
        }
        await fetchTagCategories(tagNames);
        container.innerHTML = tagNames.map(name => {
            const cat = categoryCache.get(name) ?? 0;
            const cleanName = name.replace(/_/g, " ");
            const chinese = commonTagsZh[cleanName] || commonTagsZh[name] || "";
            return `<span data-tag="${name}" class="ai-chip tag-type-${cat}">
                <a href="https://danbooru.donmai.us/wiki_pages/${name}" target="_blank" class="wiki-link" onclick="event.stopPropagation();">?</a>
                ${name}${chinese ? ` (${chinese})` : ''}
                <span class="remove-btn" title="Remove">-</span>
            </span>`;
        }).join("");
    }

    async function renderSearchResults(query, container, tagInput) {
        if (!query || query.trim().length === 0) {
            container.innerHTML = '';
            return;
        }
        const q = query.trim().toLowerCase();
        const matches = [];
        for (const [en, zh] of Object.entries(commonTagsZh)) {
            if (matches.length >= 30) break;
            if (en.toLowerCase().includes(q) || (zh && zh.toLowerCase().includes(q))) {
                matches.push({ en, zh });
            }
        }
        if (matches.length === 0) {
            container.innerHTML = `<span style="opacity:0.5; font-size:0.75rem; font-style:italic;">No results for "${query}"</span>`;
            return;
        }
        await fetchTagCategories(matches.map(m => m.en));
        const currentTags = tagInput.value.trim().split(/\s+/);
        container.innerHTML = matches.map(({ en, zh }) => {
            const normName = en.replace(/ /g, "_");
            const cat = categoryCache.get(normName) ?? categoryCache.get(en) ?? 0;
            const isAdded = currentTags.includes(normName) || currentTags.includes(en);
            return `<span data-tag="${en}" class="ai-chip tag-type-${cat} ${isAdded ? 'is-added' : ''}">
                <a href="https://danbooru.donmai.us/wiki_pages/${en}" target="_blank" class="wiki-link" onclick="event.stopPropagation();">?</a>
                ${en}${zh ? ` (${zh})` : ''}
                <span class="add-btn" title="Add">+</span>
            </span>`;
        }).join('');
    }

    async function init() {
        const tagInput = getTagInput();
        if (!tagInput || document.getElementById("ai-tagger-panel")) return;

        const panel = document.createElement("div");
        panel.id = "ai-tagger-panel";
        panel.className = "card p-2 space-y-2";
        panel.style.cssText = "margin-bottom: 8px;";
        panel.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <button id="ai-run-btn" type="button" class="button-primary">Predict Tags (AI)</button>
                <div style="display: flex; align-items: center; gap: 6px; flex: 1; min-width: 160px;">
                    <label style="font-size: 0.75rem;">Threshold: <span id="thresh-val">35</span>%</label>
                    <input id="thresh-slider" type="range" min="1" max="100" value="35" style="flex: 1; cursor: pointer; accent-color: var(--general-tag-color, #0073ff);">
                </div>
                <button id="ai-apply-btn" type="button" class="button-primary" style="display: none;">Apply All</button>
            </div>
            <div id="dict-status" style="font-size: 0.75rem; opacity: 0.6; font-style: italic; min-height: 1em;"></div>
            <div class="section-title">AI Suggestions</div>
            <div id="ai-results-list" style="display: flex; flex-wrap: wrap; gap: 2px; min-height: 24px; padding-bottom: 4px;"></div>
            <div class="section-title">Editor Panel</div>
            <input id="tag-search-input" type="text" placeholder="Search tags (EN / 中文)..." autocomplete="off">
            <div id="tag-search-results"></div>
            <div id="live-tag-editor" style="display: flex; flex-wrap: wrap; gap: 2px; min-height: 24px; border: 1px solid rgba(128,128,128,0.45); border-radius: 4px; padding: 6px;"></div>
        `;
        tagInput.parentNode.insertBefore(panel, tagInput);

        const aiList = panel.querySelector("#ai-results-list");
        const liveEditor = panel.querySelector("#live-tag-editor");
        const runBtn = panel.querySelector("#ai-run-btn");
        const applyBtn = panel.querySelector("#ai-apply-btn");
        const slider = panel.querySelector("#thresh-slider");
        const threshVal = panel.querySelector("#thresh-val");
        const searchInput = panel.querySelector("#tag-search-input");
        const searchResults = panel.querySelector("#tag-search-results");
        const dictStatus = panel.querySelector("#dict-status");

        await loadDictionary(dictStatus);

        let renderSeq = 0;
        const updateAll = async () => {
            const seq = ++renderSeq;
            await renderAiResults(lastAiResponse, aiList, applyBtn);
            if (seq !== renderSeq) return;
            await renderLiveEditor(tagInput, liveEditor);
            if (seq !== renderSeq) return;
            if (searchInput.value.trim()) {
                await renderSearchResults(searchInput.value, searchResults, tagInput);
            }
        };

        let inputDebounce;
        const scheduleUpdate = () => {
            clearTimeout(inputDebounce);
            inputDebounce = setTimeout(updateAll, 80);
        };
        tagInput.addEventListener("input", scheduleUpdate);
        tagInput.addEventListener("keyup", scheduleUpdate);
        tagInput.addEventListener("change", scheduleUpdate);
        slider.oninput = () => { currentThreshold = slider.value / 100; threshVal.innerText = slider.value; updateAll(); };

        runBtn.onclick = async () => {
            const img = getImgElement();
            if (!img) return alert("Image not found.");
            runBtn.disabled = true; runBtn.innerText = "Analyzing...";
            aiList.innerHTML = `<span style="opacity: 0.5; font-size: 0.75rem;">🧠 Analyzing image, please wait...</span>`;
            try {
                excludedTags.clear();
                const blob = await fetchBlob(img.src);
                lastAiResponse = await callAiTagger(blob);
                await updateAll();
                runBtn.innerText = "Re-predict";
            } catch (err) { aiList.innerHTML = `<span style="color:red; font-size: 0.75rem;">Error: ${err}</span>`; runBtn.innerText = "Retry"; }
            finally { runBtn.disabled = false; }
        };

        applyBtn.onclick = () => {
            const selected = lastAiResponse.filter(t => t.confidence >= currentThreshold && !excludedTags.has(t.name)).map(t => t.name.replace(/ /g, "_"));
            const currentText = tagInput.value.trim();
            const currentTags = currentText ? currentText.split(/\s+/) : [];
            tagInput.value = [...new Set([...currentTags, ...selected])].join(" ") + " ";
            tagInput.dispatchEvent(new Event('input', { bubbles: true }));
        };

        aiList.onclick = (e) => {
            const addBtn = e.target.closest(".add-btn");
            const chip = e.target.closest("[data-tag]");
            if (!chip) return;
            const tagName = chip.dataset.tag;
            if (addBtn) {
                const formatted = tagName.replace(/ /g, "_");
                const current = tagInput.value.trim().split(/\s+/);
                if (!current.includes(formatted)) {
                    tagInput.value = (tagInput.value.trim() ? tagInput.value.trim() + " " : "") + formatted + " ";
                    tagInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
                return;
            }
            if (excludedTags.has(tagName)) excludedTags.delete(tagName); else excludedTags.add(tagName);
            updateAll();
        };

        liveEditor.onclick = (e) => {
            const removeBtn = e.target.closest(".remove-btn");
            const chip = e.target.closest("[data-tag]");
            if (!chip || !removeBtn) return;
            const tagName = chip.dataset.tag;
            const current = tagInput.value.trim().split(/\s+/).filter(n => n !== tagName);
            tagInput.value = current.join(" ") + (current.length > 0 ? " " : "");
            tagInput.dispatchEvent(new Event('input', { bubbles: true }));
        };

        let searchDebounce;
        searchInput.oninput = () => {
            clearTimeout(searchDebounce);
            searchDebounce = setTimeout(() => renderSearchResults(searchInput.value, searchResults, tagInput), 200);
        };

        searchResults.onclick = (e) => {
            const addBtn = e.target.closest(".add-btn");
            const chip = e.target.closest("[data-tag]");
            if (!chip || !addBtn) return;
            const tagName = chip.dataset.tag.replace(/ /g, "_");
            const current = tagInput.value.trim().split(/\s+/);
            if (!current.includes(tagName)) {
                tagInput.value = (tagInput.value.trim() ? tagInput.value.trim() + " " : "") + tagName + " ";
                tagInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        };

        const handleHover = async (e) => {
            const link = e.target.closest(".wiki-link");
            if (!link) return;
            const tagName = link.closest("[data-tag]").dataset.tag;
            if (wikiCache.has(tagName)) { link.title = wikiCache.get(tagName); return; }
            link.title = "Loading...";
            try {
                const summary = await fetchWikiSummary(tagName);
                wikiCache.set(tagName, summary);
                link.title = summary;
            } catch (err) {}
        };
        aiList.onmouseover = handleHover;
        liveEditor.onmouseover = handleHover;
        searchResults.onmouseover = handleHover;

        updateAll();
        setTimeout(updateAll, 1200);
    }

    const observer = new MutationObserver((mutations) => { for (const m of mutations) { if (m.addedNodes.length) { init(); break; } } });
    observer.observe(document.body, { childList: true, subtree: true });
    init();
})();
