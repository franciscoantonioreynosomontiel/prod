import asyncio
import os
from playwright.async_api import async_playwright

async def run_verification():
    async with async_playwright() as p:
        browser = await p.chromium.launch()

        # Desktop view
        page_desktop = await browser.new_page()
        file_path = os.path.abspath("docs/menus/index.html")
        await page_desktop.goto(f"file://{file_path}")
        await page_desktop.set_viewport_size({"width": 1440, "height": 900})
        await page_desktop.wait_for_timeout(2000)

        os.makedirs("/home/jules/verification_menus", exist_ok=True)
        await page_desktop.screenshot(path="/home/jules/verification_menus/desktop_menu.png", full_page=False)
        print("Captured desktop menu screenshot.")
        await page_desktop.close()

        # Mobile view
        page_mobile = await browser.new_page()
        await page_mobile.goto(f"file://{file_path}")
        await page_mobile.set_viewport_size({"width": 375, "height": 667})
        await page_mobile.wait_for_timeout(2000)
        await page_mobile.screenshot(path="/home/jules/verification_menus/mobile_menu.png", full_page=False)
        print("Captured mobile menu screenshot.")
        await page_mobile.close()

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run_verification())
