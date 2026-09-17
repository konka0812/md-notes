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

    # ---- 同步：本地文件更新 -> 网页更新 ----
    page.locator(".note-item", has_text="Report").first.click()
    page.wait_for_selector("#editor-view.active")
    page.wait_for_timeout(300)
    page.evaluate("() => { pendingSyncSource = currentSource; }")
    page.set_input_files("#file-sync", {"name": "report.md", "mimeType": "text/markdown", "buffer": MD_V2.encode("utf-8")})
    page.wait_for_timeout(700)
    check("同步后正文更新", "v2 正文" in page.input_value("#editor"), page.input_value("#editor")[:40])
    srcs = page.evaluate("async () => await getAllSources()")
    check("同步后哈希已更新", srcs[0]["contentHash"] != h_v1, srcs[0]["contentHash"])

    # ---- 再同步同一文件：无变化 ----
    page.evaluate("() => { pendingSyncSource = currentSource; }")
    page.set_input_files("#file-sync", {"name": "report.md", "mimeType": "text/markdown", "buffer": MD_V2.encode("utf-8")})
    page.wait_for_timeout(600)
    check("无变化时正文不变", "v2 正文" in page.input_value("#editor"))
    check("无变化时不弹冲突面板", page.locator("#sheet").is_hidden())

    # ---- 冲突：网页也改过 + 文件也变了 ----
    page.fill("#editor", "# Report\n\n网页版内容")
    page.wait_for_timeout(900)  # 等自动保存，updatedAt 晚于 syncedAt
    page.evaluate("() => { pendingSyncSource = currentSource; }")
    page.set_input_files("#file-sync", {"name": "report.md", "mimeType": "text/markdown", "buffer": b"# Report\n\nv3 \xe6\x96\x87\xe4\xbb\xb6"})
    page.wait_for_timeout(700)
    page.wait_for_selector("#sheet:not([hidden])")
    items = page.locator("#sheet .sheet-item").all_inner_texts()
    check("冲突面板提供3个选项", len(items) == 3, items)
    check("冲突面板含'用本地文件覆盖'", any("覆盖" in t for t in items), items)
    check("冲突面板含'保留网页版'", any("保留网页版" in t for t in items), items)
    check("冲突面板含'都保留'", any("都保留" in t for t in items), items)

    # 选「用本地文件覆盖」
    page.locator("#sheet .sheet-item", has_text="用本地文件覆盖").click()
    page.wait_for_timeout(700)
    check("覆盖后正文为文件内容", "v3 文件" in page.input_value("#editor"), page.input_value("#editor")[:40])

    # ---- 冲突：选「保留网页版」 ----
    page.fill("#editor", "# Report\n\n网页版二")
    page.wait_for_timeout(900)
    page.evaluate("() => { pendingSyncSource = currentSource; }")
    page.set_input_files("#file-sync", {"name": "report.md", "mimeType": "text/markdown", "buffer": b"# Report\n\nv4 \xe6\x96\x87\xe4\xbb\xb6"})
    page.wait_for_timeout(700)
    page.wait_for_selector("#sheet:not([hidden])")
    page.locator("#sheet .sheet-item", has_text="保留网页版").click()
    page.wait_for_timeout(700)
    check("保留网页版后正文不变", "网页版二" in page.input_value("#editor"))

    # 再次同步同一文件应无变化、不弹冲突
    page.evaluate("() => { pendingSyncSource = currentSource; }")
    page.set_input_files("#file-sync", {"name": "report.md", "mimeType": "text/markdown", "buffer": b"# Report\n\nv4 \xe6\x96\x87\xe4\xbb\xb6"})
    page.wait_for_timeout(700)
    check("保留网页版后不再重复冲突", page.locator("#sheet").is_hidden())

    # ---- 冲突：选「都保留」 ----
    page.fill("#editor", "# Report\n\n网页版三")
    page.wait_for_timeout(900)
    page.evaluate("() => { pendingSyncSource = currentSource; }")
    page.set_input_files("#file-sync", {"name": "report.md", "mimeType": "text/markdown", "buffer": b"# Report\n\nv5 \xe6\x96\x87\xe4\xbb\xb6"})
    page.wait_for_timeout(700)
    page.wait_for_selector("#sheet:not([hidden])")
    page.locator("#sheet .sheet-item", has_text="都保留").click()
    page.wait_for_timeout(800)
    check("都保留后当前正文不变", "网页版三" in page.input_value("#editor"))

    page.click("#btn-back")
    page.wait_for_selector("#list-view.active")
    check("都保留后多出一篇笔记", page.locator(".note-item").count() == 2, page.locator(".note-item").count())

    # ---- 降级路径也要给出同步结果反馈 ----
    # 上一步返回列表后 currentSource 已清空，需重新打开笔记才能取到来源
    page.locator(".note-item").first.click()
    page.wait_for_selector("#editor-view.active")
    page.wait_for_timeout(300)
    page.evaluate("() => { pendingSyncSource = currentSource; }")
    page.set_input_files("#file-sync", {"name": "report.md", "mimeType": "text/markdown", "buffer": b"# Report\n\nv5 \xe6\x96\x87\xe4\xbb\xb6"})
    page.wait_for_timeout(700)
    check("降级路径反馈'已是最新'", "已是最新" in page.locator("#toast").inner_text(), page.locator("#toast").inner_text())

    # ---- 选错文件名：提示且不改动基线 ----
    before_hash = page.evaluate("async () => (await getAllSources())[0].contentHash")
    page.evaluate("() => { pendingSyncSource = currentSource; }")
    page.set_input_files("#file-sync", {"name": "other.md", "mimeType": "text/markdown", "buffer": b"# Other\n\nx"})
    page.wait_for_timeout(600)
    check("选错文件名给出提示", "请选择同名文件" in page.locator("#toast").inner_text(), page.locator("#toast").inner_text())
    after_hash = page.evaluate("async () => (await getAllSources())[0].contentHash")
    check("选错文件名不改动基线", before_hash == after_hash, [before_hash, after_hash])

    # ---- 笔记不存在时同步会清理来源关联 ----
    page.evaluate("""async () => {
        await saveSource({ noteId: 'ghost-note', name: 'report.md', lastModified: 1, size: 1, contentHash: 'deadbeef', syncedAt: 1 });
        pendingSyncSource = await getSource('ghost-note');
    }""")
    page.set_input_files("#file-sync", {"name": "report.md", "mimeType": "text/markdown", "buffer": b"# Report\n\nv9"})
    page.wait_for_timeout(700)
    ghost = page.evaluate("async () => await getSource('ghost-note')")
    check("笔记不存在时清理来源关联", ghost is None, ghost)

    # ---- Chromium 句柄路径（独立上下文，注入假句柄） ----
    ctx_c = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    ctx_c.add_init_script("""
        window.showOpenFilePicker = async () => [{ name: 'c.md', getFile: async () => new File(['# C\\n\\nv1'], 'c.md', { type: 'text/markdown', lastModified: 1000 }) }];
        window.showSaveFilePicker = async () => { throw new Error('cancel'); };
    """)
    pc = ctx_c.new_page()
    pc.on("pageerror", lambda e: errors.append(str(e)))
    pc.goto(BASE, wait_until="networkidle")
    pc.click("#btn-more")
    pc.get_by_role("button", name="导入 Markdown (.md)", exact=True).click()
    pc.wait_for_timeout(800)
    pc.locator(".note-item").first.click()
    pc.wait_for_selector("#editor-view.active")
    pc.wait_for_timeout(300)
    pc.evaluate("""() => {
        currentSource.handle = {
            queryPermission: async () => 'granted',
            requestPermission: async () => 'granted',
            getFile: async () => new File(['# C\\n\\n句柄同步内容'], 'c.md', { type: 'text/markdown', lastModified: 2000 })
        };
    }""")
    pc.evaluate("async () => { await syncCurrentSource(); }")
    pc.wait_for_timeout(600)
    check("Chromium 句柄路径同步生效", "句柄同步内容" in pc.input_value("#editor"), pc.input_value("#editor")[:40])

    # reportSyncResult 会用 IndexedDB 里的记录刷新 currentSource，假句柄需重新注入
    pc.evaluate("""() => {
        currentSource.handle = {
            queryPermission: async () => 'denied',
            requestPermission: async () => 'denied',
            getFile: async () => new File(['# C\\n\\n不应写入'], 'c.md', { type: 'text/markdown', lastModified: 3000 })
        };
    }""")
    pc.evaluate("async () => { await syncCurrentSource(); }")
    pc.wait_for_timeout(400)
    check("权限被拒时给出提示", "未获得文件访问权限" in pc.locator("#toast").inner_text(), pc.locator("#toast").inner_text())
    ctx_c.close()

    # ---- 降级环境：不应出现写回/另存为入口 ----
    page.click("#btn-editor-more")
    page.wait_for_selector("#sheet:not([hidden])")
    labels = page.locator("#sheet .sheet-item").all_inner_texts()
    check("降级环境菜单含'同步本地文件'", any("同步本地文件" in t for t in labels), labels)
    check("降级环境菜单无'写回本地文件'", not any("写回本地文件" in t for t in labels), labels)
    check("降级环境菜单无'另存为本地文件并关联'", not any("另存为本地文件" in t for t in labels), labels)
    page.click("#sheet-cancel")
    check("降级环境来源条无写回按钮", page.locator("#btn-source-write").is_hidden())

    # ---- Chromium 写回 / 另存为（独立上下文，注入假句柄） ----
    ctx_wb = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    ctx_wb.add_init_script("""
        window.showOpenFilePicker = async () => [{ name: 'wb.md', getFile: async () => new File([window.__fileContent || '# WB\\n\\nv1'], 'wb.md', { type: 'text/markdown', lastModified: 5000 }) }];
        window.showSaveFilePicker = async () => ({
            name: 'new.md',
            getFile: async () => new File([window.__written || ''], 'new.md', { type: 'text/markdown', lastModified: 6000 }),
            createWritable: async () => ({ write: async (t) => { window.__written = t; }, close: async () => {} })
        });
    """)
    pw = ctx_wb.new_page()
    pw.on("pageerror", lambda e: errors.append(str(e)))
    pw.goto(BASE, wait_until="networkidle")
    pw.click("#btn-more")
    pw.get_by_role("button", name="导入 Markdown (.md)", exact=True).click()
    pw.wait_for_timeout(800)
    pw.locator(".note-item").first.click()
    pw.wait_for_selector("#editor-view.active")
    pw.wait_for_timeout(300)

    # 注入可用句柄后，菜单应出现「写回本地文件」
    pw.evaluate("""() => {
        currentSource.handle = {
            queryPermission: async () => 'granted',
            requestPermission: async () => 'granted',
            getFile: async () => new File([window.__fileContent || '# WB\\n\\nv1'], 'wb.md', { type: 'text/markdown', lastModified: 5000 }),
            createWritable: async () => ({ write: async (t) => { window.__written = t; }, close: async () => {} })
        };
    }""")
    pw.click("#btn-editor-more")
    pw.wait_for_selector("#sheet:not([hidden])")
    labels_wb = pw.locator("#sheet .sheet-item").all_inner_texts()
    check("有句柄时菜单含写回入口", any("写回本地文件" in t for t in labels_wb), labels_wb)
    pw.click("#sheet-cancel")

    # 写回：编辑器内容应写入文件
    pw.fill("#editor", "# WB\n\n网页写回内容")
    pw.wait_for_timeout(700)
    pw.evaluate("async () => { await writeBackCurrent(); }")
    pw.wait_for_timeout(500)
    written = pw.evaluate("() => window.__written")
    check("写回内容为编辑器内容", written is not None and "网页写回内容" in written, written)

    # 文件在外部变化时先弹确认
    pw.evaluate("() => { window.__fileContent = '# WB\\n\\n外部改动导致长度不同'; }")
    pw.evaluate("async () => { await writeBackCurrent(); }")
    pw.wait_for_selector("#dialog:not([hidden])")
    check("外部改动时提示覆盖", "覆盖" in pw.locator("#dialog-message").inner_text(), pw.locator("#dialog-message").inner_text())
    pw.click("#dialog-confirm")
    pw.wait_for_timeout(500)

    # 取消覆盖：不应写入
    pw.evaluate("""() => {
        window.__written = null;
        window.__fileContent = '# WB\\n\\n又一次外部改动导致长度不同';
    }""")
    pw.evaluate("async () => { await writeBackCurrent(); }")
    pw.wait_for_selector("#dialog:not([hidden])")
    pw.click("#dialog-cancel")
    pw.wait_for_timeout(400)
    check("取消覆盖不写入", pw.evaluate("() => window.__written") is None)

    # 另存为并关联：网页新建的无来源笔记
    pw.click("#btn-back")
    pw.wait_for_selector("#list-view.active")
    pw.click("#btn-new")
    pw.wait_for_selector("#editor-view.active")
    pw.fill("#note-title", "网页新笔记")
    pw.fill("#editor", "另存内容")
    pw.wait_for_timeout(700)
    pw.click("#btn-editor-more")
    pw.wait_for_selector("#sheet:not([hidden])")
    labels_new = pw.locator("#sheet .sheet-item").all_inner_texts()
    check("无来源笔记菜单含另存为关联", any("另存为本地文件并关联" in t for t in labels_new), labels_new)
    pw.get_by_role("button", name="另存为本地文件并关联", exact=True).click()
    pw.wait_for_timeout(800)
    saved = pw.evaluate("() => window.__written")
    check("另存为写入笔记原文", saved == "另存内容", saved)
    src_new = pw.evaluate("async () => (await getAllSources()).find((s) => s.name === 'new.md')")
    check("另存为建立来源关联", src_new is not None and src_new["name"] == "new.md", src_new)

    # 来源条写回按钮的正向可见性：用桩让 getSource 返回带句柄的记录（真实路径，不伪造 DOM）
    pw.evaluate("""() => {
        currentSource.handle = {
            queryPermission: async () => 'granted',
            requestPermission: async () => 'granted',
            getFile: async () => new File([window.__fileContent || ''], 'wb.md', { type: 'text/markdown', lastModified: 5000 }),
            createWritable: async () => ({ write: async () => {}, close: async () => {} })
        };
        window.__realGetSource = getSource;
        getSource = async (id) => ({
            noteId: id, name: 'wb.md', lastModified: 5000, size: 8,
            contentHash: 'h', syncedAt: 1, handle: currentSource.handle
        });
    }""")
    pw.evaluate("async () => { await refreshSourceBar(currentId); }")
    check("有句柄时来源条显示写回按钮", pw.locator("#btn-source-write").is_visible())
    pw.evaluate("() => { getSource = window.__realGetSource; }")

    check("批量同步函数存在", pw.evaluate("() => typeof syncAllSources") == "function")
    check("启动检测函数存在", pw.evaluate("() => typeof checkSourcesOnStartup") == "function")

    # 此处处于编辑器视图（#btn-more 属于列表视图，不可见），直接走真实 openListMenu
    pw.evaluate("() => openListMenu()")
    pw.wait_for_selector("#sheet:not([hidden])")
    labels2 = pw.locator("#sheet .sheet-item").all_inner_texts()
    check("Chromium 菜单含'同步所有来源'", any("同步所有来源" in t for t in labels2), labels2)
    pw.click("#sheet-cancel")

    # ---- 批量同步（桩：一个带句柄、文件已更新的来源） ----
    pw.wait_for_timeout(700)
    pw.evaluate("""() => {
        window.__fileContent = '# WB\\n\\n批量同步后的内容';
        const fakeHandle = {
            queryPermission: async () => 'granted',
            requestPermission: async () => 'granted',
            getFile: async () => new File([window.__fileContent], 'wb.md', { type: 'text/markdown', lastModified: 9000 }),
            createWritable: async () => ({ write: async () => {}, close: async () => {} })
        };
        window.__realGetAllSources = getAllSources;
        getAllSources = async () => [{
            noteId: currentId, name: 'wb.md', lastModified: 5000, size: 8,
            contentHash: hashString(editor.value), syncedAt: 1, handle: fakeHandle
        }];
    }""")
    pw.evaluate("async () => { await syncAllSources(); }")
    pw.wait_for_timeout(600)
    check("批量同步统计更新篇数", "已同步 1 篇" in pw.locator("#toast").inner_text(), pw.locator("#toast").inner_text())
    check("批量同步后正文更新", "批量同步后的内容" in pw.input_value("#editor"), pw.input_value("#editor")[:40])
    pw.evaluate("() => { getAllSources = window.__realGetAllSources; }")

    # ---- 批量同步：有冲突时不弹面板、只计数 ----
    pw.wait_for_timeout(700)
    pw.evaluate("""() => {
        window.__fileContent = '# WB\\n\\n批量冲突的文件内容';
        const fakeHandle = {
            queryPermission: async () => 'granted',
            requestPermission: async () => 'granted',
            getFile: async () => new File([window.__fileContent], 'wb.md', { type: 'text/markdown', lastModified: 9100 })
        };
        window.__realGetAllSources = getAllSources;
        getAllSources = async () => [{
            noteId: currentId, name: 'wb.md', lastModified: 5000, size: 8,
            contentHash: hashString('与网页和文件都不同的基线'), syncedAt: 1, handle: fakeHandle
        }];
    }""")
    pw.evaluate("async () => { await syncAllSources(); }")
    pw.wait_for_timeout(600)
    check("批量同步不弹冲突面板", pw.locator("#sheet").is_hidden())
    check("批量同步统计冲突篇数", "1 篇有冲突" in pw.locator("#toast").inner_text(), pw.locator("#toast").inner_text())
    pw.evaluate("() => { getAllSources = window.__realGetAllSources; }")
    ctx_wb.close()

    # ---- 启动检测：2 秒后提示本地文件可能有更新 ----
    ctx_s = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    ctx_s.add_init_script("""
        window.showOpenFilePicker = async () => { throw new Error('stub'); };
        window.showSaveFilePicker = async () => { throw new Error('stub'); };
    """)
    ps = ctx_s.new_page()
    ps.on("pageerror", lambda e: errors.append(str(e)))
    ps.goto(BASE, wait_until="domcontentloaded")
    ps.evaluate("""() => {
        getAllSources = async () => [{
            noteId: 'x', name: 'startup.md', lastModified: 1000, size: 5,
            contentHash: 'h', syncedAt: 1,
            handle: {
                queryPermission: async () => 'granted',
                getFile: async () => new File(['12345'], 'startup.md', { type: 'text/markdown', lastModified: 9999 })
            }
        }];
    }""")
    ps.wait_for_timeout(2600)
    check("启动检测提示可能有更新", "可能有更新" in ps.locator("#toast").inner_text(), ps.locator("#toast").inner_text())
    ctx_s.close()

    # ---- 备份与恢复：sources 兼容 ----
    ctx_r = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    ctx_r.add_init_script("Object.defineProperty(window, 'showOpenFilePicker', { value: undefined, configurable: true });")
    pr = ctx_r.new_page()
    pr.on("pageerror", lambda e: errors.append(str(e)))
    pr.goto(BASE, wait_until="networkidle")

    # 先导入一篇，确保存在来源记录
    pr.set_input_files("#file-md", {"name": "bk.md", "mimeType": "text/markdown", "buffer": b"# BK\n\n\xe5\xa4\x87\xe4\xbb\xbd"})
    pr.wait_for_timeout(700)
    check("备份前已有来源", pr.evaluate("async () => (await getAllSources()).length") == 1)
    check("备份数据不含 handle", pr.evaluate("async () => (await sourcesForBackup()).every((s) => !('handle' in s))") is True)

    # 彻底删除笔记时应清理来源
    pr.evaluate("""async () => {
        const src = (await getAllSources())[0];
        await softDelete(src.noteId);
        await emptyTrash();
    }""")
    check("彻底删除后清理来源", pr.evaluate("async () => (await getAllSources()).length") == 0)

    # 未删除的笔记，其来源不能被 emptyTrash 误删
    pr.evaluate("""async () => {
        await putNote({ id: 'keep-1', title: '保留', content: 'x', createdAt: 1, updatedAt: 1 });
        await saveSource({ noteId: 'keep-1', name: 'keep.md', lastModified: 1, size: 1, contentHash: 'h', syncedAt: 1 });
        await putNote({ id: 'gone-1', title: '待删', content: 'x', createdAt: 1, updatedAt: 1, deletedAt: Date.now() });
        await saveSource({ noteId: 'gone-1', name: 'gone.md', lastModified: 1, size: 1, contentHash: 'h', syncedAt: 1 });
        await emptyTrash();
    }""")
    check("emptyTrash 保留未删除笔记的来源", pr.evaluate("async () => (await getSource('keep-1')) !== null") is True)
    check("emptyTrash 删除已删笔记的来源", pr.evaluate("async () => (await getSource('gone-1')) === null") is True)

    # 过期笔记的自动清理也应清理来源
    pr.evaluate("""async () => {
        await putNote({ id: 'old-1', title: '过期', content: 'x', createdAt: 1, updatedAt: 1, deletedAt: Date.now() - 31 * 24 * 3600 * 1000 });
        await saveSource({ noteId: 'old-1', name: 'old.md', lastModified: 1, size: 1, contentHash: 'h', syncedAt: 1 });
        await purgeOldTrash();
    }""")
    check("purgeOldTrash 清理来源", pr.evaluate("async () => await getSource('old-1')") is None)

    # 恢复含 sources 的备份后，来源仍显示文件名
    pr.evaluate("""async () => { await clearAllNotes(); await clearAllSources(); await renderList(); }""")
    payload = ('{"app":"纸墨","version":3,"notes":[{"id":"n1","title":"恢复的笔记","content":"内容",'
               '"createdAt":1,"updatedAt":2}],"images":[],"sources":[{"noteId":"n1","name":"restored.md",'
               '"lastModified":1700000000000,"size":10,"contentHash":"abc","syncedAt":1700000000000}]}')
    pr.set_input_files("#file-json", {"name": "backup.json", "mimeType": "application/json", "buffer": payload.encode("utf-8")})
    pr.wait_for_selector("#dialog:not([hidden])")
    pr.click("#dialog-confirm")
    pr.wait_for_timeout(800)
    check("恢复后笔记存在", pr.locator(".note-item").count() == 1, pr.locator(".note-item").count())
    pr.locator(".note-item").first.click()
    pr.wait_for_selector("#editor-view.active")
    pr.wait_for_timeout(400)
    check("恢复后来源条显示文件名", "restored.md" in pr.locator("#source-name").inner_text())
    check("恢复后来源记录不含 handle", pr.evaluate("async () => !('handle' in (await getSource('n1')))") is True)
    check("恢复后来源条无写回按钮", pr.locator("#btn-source-write").is_hidden())
    ctx_r.close()

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
