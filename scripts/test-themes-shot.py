#!/usr/bin/env python3
"""主题截图：四种风格 × 浅色/深色"""
import os
from playwright.sync_api import sync_playwright

BASE = "http://localhost:8123"
OUT = os.path.join(os.path.dirname(__file__), "shots")
os.makedirs(OUT, exist_ok=True)

STYLES = [("", "paper"), ("sketch", "sketch"), ("typewriter", "typewriter"), ("forest", "forest")]

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True).new_page()
    page.goto(BASE, wait_until="networkidle")
    page.click("#btn-new")
    page.wait_for_selector("#editor-view.active")
    page.fill("#note-title", "主题预览")
    page.fill("#editor", "# 一级标题\n\n这是一段**正文**，用来观察字体与行距。\n\n- 列表项一\n- 列表项二\n\n> 引用文字\n\n`code` 与 [链接](https://example.com)\n")
    page.click("#btn-back")
    page.wait_for_selector("#list-view.active")

    for style_id, slug in STYLES:
        for theme in ("light", "dark"):
            page.evaluate(
                """([t, s]) => { document.documentElement.setAttribute('data-theme', t);
                                 document.documentElement.setAttribute('data-style', s); }""",
                [theme, style_id],
            )
            page.wait_for_timeout(250)
            page.screenshot(path=os.path.join(OUT, f"theme-{slug}-{theme}-list.png"))
            page.locator(".note-item").first.click()
            page.wait_for_selector("#editor-view.active")
            page.wait_for_timeout(250)
            page.screenshot(path=os.path.join(OUT, f"theme-{slug}-{theme}-editor.png"))
            page.click("#btn-back")
            page.wait_for_selector("#list-view.active")
    browser.close()

print("截图完成 ->", OUT)
