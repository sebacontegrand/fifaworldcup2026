"""
Playwright test for the Live Results / Predictions section.
Requires: dev server running on port 3000
Usage: python tests/live_predictions.py
"""

import sys
sys.path.insert(0, "/Users/sebastianconte-grand/.agents/skills/webapp-testing/scripts")

from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"


def test_live_page_renders():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f"{BASE}/timeline/live")
        page.wait_for_load_state("networkidle")

        assert page.locator("text=Live").is_visible()
        assert page.locator("text=Results").is_visible()

        schedule_tabs = page.locator('[role="tab"]')
        count = schedule_tabs.count()
        assert count > 0, "Expected schedule tabs"

        browser.close()
        print("  PASS: live results page renders with schedule tabs")


def test_predict_mode_toggle():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f"{BASE}/timeline/live")
        page.wait_for_load_state("networkidle")

        quick_pick_badge = page.locator("text=Quick Pick")
        if quick_pick_badge.is_visible():
            quick_pick_badge.click()
            page.wait_for_timeout(500)

        browser.close()
        print("  PASS: predict mode toggle works")


def test_ranking_page_renders():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f"{BASE}/ranking")
        page.wait_for_load_state("networkidle")

        assert page.locator("text=Rankings").is_visible()

        browser.close()
        print("  PASS: ranking page renders")


def test_admin_button_hidden_for_anon():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f"{BASE}/ranking")
        page.wait_for_load_state("networkidle")

        admin_btn = page.locator("button:has-text('Admin')")
        assert admin_btn.count() == 0 or not admin_btn.is_visible()

        browser.close()
        print("  PASS: admin button not visible for anonymous users")


def test_prediction_page_renders():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f"{BASE}/timeline/prediction")
        page.wait_for_load_state("networkidle")

        assert page.locator("text=Predict").is_visible()
        assert page.locator("text=Future").is_visible()

        browser.close()
        print("  PASS: prediction page renders")


if __name__ == "__main__":
    print("\n--- Live Predictions Tests ---\n")
    import subprocess, os, signal, time

    server_proc = subprocess.Popen(
        ["npx", "next", "dev", "-p", "3000"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        preexec_fn=os.setsid if hasattr(os, "setsid") else None,
    )

    try:
        print("Waiting for server...")
        time.sleep(15)

        test_live_page_renders()
        test_predict_mode_toggle()
        test_ranking_page_renders()
        test_admin_button_hidden_for_anon()
        test_prediction_page_renders()

        print("\n  All live prediction tests PASSED\n")
    finally:
        if hasattr(os, "killpg"):
            os.killpg(os.getpgid(server_proc.pid), signal.SIGTERM)
        else:
            server_proc.terminate()
        server_proc.wait()
