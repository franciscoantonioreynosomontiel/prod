import asyncio
import os
from playwright.async_api import async_playwright

async def run_verification():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Load local constuctora.html path
        file_path = os.path.abspath("docs/constuctora.html")
        await page.goto(f"file://{file_path}")

        # Set viewport to standard high definition screen
        await page.set_viewport_size({"width": 1440, "height": 900})
        await page.wait_for_timeout(1000)

        os.makedirs("/home/jules/verification", exist_ok=True)

        # Screenshot 1: Desktop Full Page of Construction Landing Page
        await page.screenshot(path="/home/jules/verification/constuctora_desktop_full.png", full_page=True)
        print("Captured desktop full page screenshot of Apex United Contractors.")

        # Interactive check: Click Master Electrical tab in Trade Standards Lookup
        await page.click("id=tab-btn-elec")
        await page.wait_for_timeout(500)
        await page.screenshot(path="/home/jules/verification/constuctora_electrical_tab.png", full_page=False)
        print("Captured electrical tab active state screenshot.")

        # Interactive check: Click Roofing Envelope tab in Trade Standards Lookup
        await page.click("id=tab-btn-roof")
        await page.wait_for_timeout(500)
        await page.screenshot(path="/home/jules/verification/constuctora_roofing_tab.png", full_page=False)
        print("Captured roofing tab active state screenshot.")

        # Interactive check: change project classification selection in simulator
        await page.select_option("id=sim-project-type", "electrical_upgrade")
        await page.wait_for_timeout(300)
        await page.screenshot(path="/home/jules/verification/constuctora_simulator_electrical_upgrade.png", full_page=False)
        print("Captured simulator electrical upgrade select state screenshot.")

        # Interactive check: change permit complexity modifier selection in simulator
        await page.select_option("id=sim-complexity", "complex")
        await page.wait_for_timeout(300)
        await page.screenshot(path="/home/jules/verification/constuctora_simulator_complex_permits.png", full_page=False)
        print("Captured simulator complex zoning state screenshot.")

        # Change Viewport to Mobile to check responsiveness
        await page.set_viewport_size({"width": 375, "height": 812})
        await page.wait_for_timeout(500)
        await page.screenshot(path="/home/jules/verification/constuctora_mobile_hero.png", full_page=False)
        print("Captured mobile hero view screenshot.")

        # Toggle mobile menu open
        await page.click("id=mobile-menu-btn")
        await page.wait_for_timeout(400)
        await page.screenshot(path="/home/jules/verification/constuctora_mobile_menu_open.png", full_page=False)
        print("Captured mobile menu open view screenshot.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run_verification())
