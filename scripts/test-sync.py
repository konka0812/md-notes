#!/usr/bin/env python3
"""导入文件双向同步测试"""
import sys
from playwright.sync_api import sync_playwright

BASE = "http://localhost:8123"
results = []
errors = []

def check(name, cond, extra=""):
    results.append((name, bool(cond)))
    print(("  PASS  " if cond else "  FAIL  ") + name + (("  [" + str(extra) + "]") if extra else ""))

MD_V1 = "# Report\n\nv1 正文"
MD_V2 = "# Report\n\nv2 正文"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    ctx.add_init_script("Object.defineProperty(window, 'showOpenFilePicker', { value: undefined, configurable: true });")
    page = ctx.new_page()
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(BASE, wait_until="networkidle")

    # ---- sources 存储已建立 ----
    page.wait_for_function("() => typeof db !== 'undefined' && db !== null")
    stores = page.evaluate("() => Array.from(db.objectStoreNames)")
    check("sources 存储已创建", "sources" in stores, stores)

    # ---- 哈希函数存在且稳定 ----
    try:
        h = page.evaluate("() => [hashString('abc'), hashString('abc'), hashString('abd')]")
        check("hashString 稳定且可区分", h[0] == h[1] and h[0] != h[2], h)
    except Exception as e:
        check("hashString 稳定且可区分", False, str(e)[:80])

    # ---- 句柄降级：不可克隆的 handle 会被剔除 ----
    res = page.evaluate("""async () => {
        const fake = { noteId: 'n1', name: 'a.md', handle: { getFile() {} } };
        const kept = await saveSource(fake);
        const got = await getSource('n1');
        return { kept: kept, hasHandle: 'handle' in got, name: got.name };
    }""")
    check("不可克隆句柄降级为无句柄", res["kept"] is False and res["hasHandle"] is False and res["name"] == "a.md", res)

    # ---- markFileAsBaseline 写入基线 + 备份剔除 handle ----
    res = page.evaluate("""async () => {
        const s = { noteId: 'n2', name: 'b.md' };
        await markFileAsBaseline(s, { lastModified: 111, size: 5 }, 'hello');
        const backup = await sourcesForBackup();
        const rec = backup.find((x) => x.noteId === 'n2');
        return { hash: rec.contentHash, hasHandle: 'handle' in rec, mtime: rec.lastModified, live: s.lastModified };
    }""")
    check("markFileAsBaseline 写入基线", res["mtime"] == 111 and bool(res["hash"]) and res["live"] == 111, res)
    check("备份剔除 handle", res["hasHandle"] is False, res)

    # ---- 导入（降级路径）并建立来源关联 ----
    # 上面的来源存储用例在同一页面上下文写入了夹具 n1/n2，此处需要干净起点才能断言数量
    page.evaluate("async () => await clearAllSources()")
    page.set_input_files("#file-md", {"name": "report.md", "mimeType": "text/markdown", "buffer": MD_V1.encode("utf-8")})
    page.wait_for_timeout(600)
    check("导入后列表有1篇", page.locator(".note-item").count() == 1)

    srcs = page.evaluate("async () => await getAllSources()")
    check("来源已记录", len(srcs) == 1 and srcs[0]["name"] == "report.md", srcs)
    check("来源记录了内容哈希", bool(srcs[0]["contentHash"]), srcs[0].get("contentHash"))
    h_v1 = srcs[0]["contentHash"]

    page.locator(".note-item").first.click()
    page.wait_for_selector("#editor-view.active")
    check("编辑器显示来源条", page.locator("#source-bar").is_visible())
    check("来源条显示文件名", "report.md" in page.locator("#source-name").inner_text())
    check("来源条有同步按钮", page.locator("#btn-source-sync").is_visible())
    check("降级环境下无写回按钮", page.locator("#btn-source-write").is_hidden())
    check("正文已导入", "v1 正文" in page.input_value("#editor"))

    # ---- 没有来源的笔记不显示来源条 ----
    page.click("#btn-back")
    page.wait_for_selector("#list-view.active")
    page.click("#btn-new")
    page.wait_for_selector("#editor-view.active")
    page.wait_for_timeout(300)
    check("无来源笔记不显示来源条", page.locator("#source-bar").is_hidden())
    check("无来源时 currentSource 为空", page.evaluate("() => currentSource === null"))
    page.click("#btn-back")
    page.wait_for_selector("#list-view.active")

    # ---- v2 -> v3 迁移不丢数据（独立上下文，直接调用应用的 openDB） ----
    ctx_mig = browser.new_context(viewport={"width": 390, "height": 844})
    pm = ctx_mig.new_page()
    pm.on("pageerror", lambda e: errors.append(str(e)))
    pm.goto(BASE, wait_until="networkidle")
    mig = pm.evaluate("""async () => {
        db.close();
        await new Promise((res, rej) => {
            const r = indexedDB.deleteDatabase('zhimo-notes');
            r.onsuccess = res;
            r.onerror = () => rej(r.error);
            r.onblocked = () => rej(new Error('deleteDatabase blocked'));
        });
        await new Promise((res, rej) => {
            const r = indexedDB.open('zhimo-notes', 2);
            r.onupgradeneeded = () => {
                const d = r.result;
                const s = d.createObjectStore('notes', { keyPath: 'id' });
                s.createIndex('updatedAt', 'updatedAt');
                d.createObjectStore('images', { keyPath: 'id' });
            };
            r.onsuccess = () => {
                const d = r.result;
                const tx = d.transaction('notes', 'readwrite');
                tx.objectStore('notes').put({ id: 'legacy-1', title: '迁移前笔记', content: '旧内容', createdAt: 1, updatedAt: 2 });
                tx.oncomplete = () => { d.close(); res(); };
                tx.onerror = () => rej(tx.error);
            };
            r.onerror = () => rej(r.error);
        });
        const up = await openDB();
        const names = Array.from(up.objectStoreNames);
        const note = await new Promise((res, rej) => {
            const rq = up.transaction('notes', 'readonly').objectStore('notes').get('legacy-1');
            rq.onsuccess = () => res(rq.result);
            rq.onerror = () => rej(rq.error);
        });
        up.close();
        return { names: names, note: note };
    }""")
    check("迁移后 sources 存储存在", "sources" in mig["names"], mig["names"])
    check("迁移不丢旧笔记", bool(mig["note"]) and mig["note"]["title"] == "迁移前笔记", mig["note"])
    ctx_mig.close()

    browser.close()

print(f"\n{sum(1 for _, c in results if c)}/{len(results)} 通过")
if errors:
    print("JS 错误：", errors[:5])
sys.exit(0 if all(c for _, c in results) and not errors else 1)
