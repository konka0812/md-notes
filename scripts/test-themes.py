#!/usr/bin/env python3
"""主题测试：四种风格 × 明暗切换、两级菜单、theme-color"""
import sys
from playwright.sync_api import sync_playwright

BASE = "http://localhost:8123"
results = []
errors = []

def check(name, cond, extra=""):
    results.append((name, bool(cond)))
    print(("  PASS  " if cond else "  FAIL  ") + name + (("  [" + str(extra) + "]") if extra else ""))

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True).new_page()
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(BASE, wait_until="networkidle")

    # 先建一篇笔记，供列表卡片样式断言使用
    page.click("#btn-new")
    page.wait_for_selector("#editor-view.active")
    page.fill("#note-title", "主题测试")
    page.fill("#editor", "# 标题\n\n正文")
    page.click("#btn-back")
    page.wait_for_selector("#list-view.active")

    def state():
        return page.evaluate("""() => ({
            theme: document.documentElement.getAttribute('data-theme'),
            style: document.documentElement.getAttribute('data-style'),
            color: document.querySelector('meta[name="theme-color"]').getAttribute('content'),
            lsTheme: localStorage.getItem('theme'),
            lsStyle: localStorage.getItem('style')
        })""")

    def pick(style_label, theme_label):
        page.click("#btn-more")
        page.get_by_role("button", name="主题", exact=True).click()
        page.get_by_role("button", name=style_label, exact=True).click()
        page.get_by_role("button", name=theme_label, exact=True).click()

    # 默认：纸张浅色
    s = state()
    check("默认 data-style 为空(纸张)", s["style"] == "", s["style"])

    # 打字机 · 深色
    pick("复古打字机", "深色")
    s = state()
    check("打字机 深色 data-style", s["style"] == "typewriter", s["style"])
    check("打字机 深色 data-theme", s["theme"] == "dark", s["theme"])
    check("打字机 深色 theme-color", s["color"] == "#16140F", s["color"])
    check("打字机 深色 已持久化", s["lsStyle"] == "typewriter" and s["lsTheme"] == "dark")

    # 森系 · 浅色
    pick("森系自然", "浅色")
    s = state()
    check("森系 浅色 data-style", s["style"] == "forest", s["style"])
    check("森系 浅色 data-theme", s["theme"] == "light", s["theme"])
    check("森系 浅色 theme-color", s["color"] == "#FAFCF6", s["color"])

    # 顶部月亮按钮：只在当前风格内切明暗
    page.click("#btn-theme")
    page.wait_for_timeout(200)
    s = state()
    check("月亮按钮切到森系深色", s["theme"] == "dark" and s["style"] == "forest", str(s))

    # 刷新后保持
    page.reload(wait_until="networkidle")
    s = state()
    check("刷新后保持森系深色", s["theme"] == "dark" and s["style"] == "forest", str(s))

    # 回到纸张深色（供其余测试的默认状态用）
    pick("纸张", "深色")
    s = state()
    check("纸张 深色 theme-color", s["style"] == "" and s["theme"] == "dark" and s["color"] == "#1E1C17", str(s))

    # 未知/历史 style 值应回退到纸张配色（向后兼容）
    page.evaluate("() => { localStorage.setItem('style', 'nope'); localStorage.setItem('theme', 'light'); }")
    page.reload(wait_until="networkidle")
    s = state()
    check("未知 style 回退到纸张配色", s["color"] == "#FDFBF7", s["color"])

    # ---- 打字机主题的视觉特征 ----
    pick("复古打字机", "浅色")
    tw = page.evaluate("""() => {
        const cs = getComputedStyle(document.body);
        const item = getComputedStyle(document.querySelector('.note-item') || document.body);
        return {
            fontUI: cs.fontFamily,
            bg: cs.backgroundColor,
            accent: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),
            radius: item.borderRadius,
            borderStyle: item.borderStyle
        };
    }""")
    check("打字机 UI 字体含 Courier", "Courier" in tw["fontUI"], tw["fontUI"])
    check("打字机 强调色为印章红", tw["accent"].upper() == "#A8321E", tw["accent"])
    check("打字机 双线边框", "double" in tw["borderStyle"], tw["borderStyle"])

    browser.close()

print(f"\n{sum(1 for _, c in results if c)}/{len(results)} 通过")
if errors:
    print("JS 错误：", errors[:5])
sys.exit(0 if all(c for _, c in results) and not errors else 1)
