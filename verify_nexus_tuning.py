import re
from playwright.sync_api import sync_playwright

def verify_nexus_tuning():
    with sync_playwright() as p:
        # Launch browser in headless mode
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate directly to the newly created Nexus Custom Design page
        page.goto("file:///app/docs/mecanica.html")
        print("Page loaded successfully.")

        # Set standard viewport for desktop verification
        page.set_viewport_size({"width": 1440, "height": 900})

        # 1. Capture Hero screenshot
        page.screenshot(path="/home/jules/verification/nexus_tuning_hero.png")
        print("Nexus Tuning Hero screenshot captured.")

        # 2. Open navigation overlay
        page.click("text=Explore Portal")
        page.wait_for_timeout(800) # wait for CSS transition slide
        page.screenshot(path="/home/jules/verification/nexus_tuning_menu_open.png")
        print("Menu open screenshot captured.")

        # Close overlay menu
        page.click("text=Close Studio Portal")
        page.wait_for_timeout(800)

        # 3. Interact with Paint Simulator: Select Magenta and Matte Finish
        page.click("button[title='Hyper Magenta']")
        page.wait_for_timeout(500)

        page.click("text=Satin Stealth Matte")
        page.wait_for_timeout(500)

        active_finish = page.locator("#current-finish-label").inner_text()
        print("Active Finish Text after swap:", active_finish)

        # Capture Paint Simulator screenshot
        page.screenshot(path="/home/jules/verification/nexus_tuning_paint_simulator.png")
        print("Paint Simulator screenshot captured.")

        # 4. Interact with ECU Tuning Profile: Select Economy and verify wave parameter modifications
        page.click("text=Efficiency Lean Burn")
        page.wait_for_timeout(500)
        active_ecu_map = page.locator("#current-tuning-map-label").inner_text()
        print("Active ECU Map:", active_ecu_map)

        # Capture Tuning screenshot
        page.screenshot(path="/home/jules/verification/nexus_tuning_ecu_board.png")
        print("ECU Tuning Board screenshot captured.")

        # 5. Programmatically inspect the document body to find any digits/numbers
        body_text = page.locator("body").inner_text()

        # Regex search for digits
        digits = re.findall(r"\d", body_text)
        print("Digits found in page body:", digits)

        # 6. Verify mobile layout responsive view
        page.set_viewport_size({"width": 375, "height": 812})
        page.wait_for_timeout(500)
        page.screenshot(path="/home/jules/verification/nexus_tuning_mobile.png")
        print("Mobile view screenshot captured.")

        browser.close()

if __name__ == "__main__":
    import os
    os.makedirs("/home/jules/verification", exist_ok=True)
    verify_nexus_tuning()
