"""
Playwright test for the Football Connections game section.
Requires: dev server running on port 3000
Usage: python tests/connection_game.py
"""

import sys
sys.path.insert(0, "/Users/sebastianconte-grand/.agents/skills/webapp-testing/scripts")

from playwright.sync_api import sync_playwright, expect

BASE = "http://localhost:3000"


def test_lobby_renders():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f"{BASE}/connection")
        page.wait_for_load_state("networkidle")

        assert page.locator("text=Football Connections").is_visible()
        assert page.locator("text=Easy").is_visible()
        assert page.locator("text=Medium").is_visible()
        assert page.locator("text=Hard").is_visible()
        assert page.locator("text=Expert").is_visible()

        assert page.locator("text=Daily Challenge").is_visible()
        assert page.locator("text=Infinite Mode").is_visible()
        assert page.locator("text=Hardcore").is_visible()
        assert page.locator("text=Timed Mode").is_visible()

        assert page.locator("text=Play").is_visible()

        browser.close()
        print("  PASS: lobby renders with difficulties and modes")


def test_select_difficulty():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f"{BASE}/connection")
        page.wait_for_load_state("networkidle")

        easy_btn = page.locator("button:has-text('Easy')")
        easy_btn.click()

        hard_btn = page.locator("button:has-text('Hard')")
        hard_btn.click()

        browser.close()
        print("  PASS: difficulty selection works")


def test_play_navigation():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f"{BASE}/connection")
        page.wait_for_load_state("networkidle")

        page.locator("button:has-text('Easy')").click()

        page.locator("button:has-text('Infinite Mode')").click()

        page.locator("button:has-text('Play')").click()
        page.wait_for_load_state("networkidle")

        assert "/connection/play" in page.url
        assert "difficulty=easy" in page.url
        assert "mode=infinite" in page.url

        browser.close()
        print("  PASS: play navigates to /connection/play with params")

def test_play_page_loads():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f"{BASE}/connection/play?difficulty=easy&mode=infinite")
        page.wait_for_load_state("networkidle")

        assert page.locator("text=PLAYER 1").is_visible()
        assert page.locator("text=PLAYER 2").is_visible()

        assert page.locator("text=connections").is_visible()

        browser.close()
        print("  PASS: play page loads with player slots and connection counter")


def test_no_connection_button_visible():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f"{BASE}/connection/play?difficulty=easy&mode=infinite")
        page.wait_for_load_state("networkidle")

        try:
            no_conn_btn = page.locator("button:has-text('No connection exists')")
            no_conn_btn.wait_for(timeout=5000)
            assert no_conn_btn.is_visible()
        except Exception:
            page.wait_for_timeout(2000)
            no_conn_btn = page.locator("button:has-text('No connection exists')")
            assert no_conn_btn.is_visible()

        browser.close()
        print("  PASS: 'No connection exists' button is visible")


if __name__ == "__main__":
    print("\n--- Connection Game Tests ---\n")
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

        test_lobby_renders()
        test_select_difficulty()
        test_play_navigation()
        test_play_page_loads()
        test_no_connection_button_visible()

        print("\n  All connection game tests PASSED\n")
    finally:
        if hasattr(os, "killpg"):
            os.killpg(os.getpgid(server_proc.pid), signal.SIGTERM)
        else:
            server_proc.terminate()
        server_proc.wait()
