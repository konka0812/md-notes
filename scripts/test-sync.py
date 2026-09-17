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

    browser.close()

print(f"\n{sum(1 for _, c in results if c)}/{len(results)} 通过")
if errors:
    print("JS 错误：", errors[:5])
sys.exit(0 if all(c for _, c in results) and not errors else 1)
