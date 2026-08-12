import asyncio
import os
from playwright.async_api import async_playwright

async def run_verification():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Load local shirt.html path
        file_path = os.path.abspath("docs/shirt/shirt.html")
        await page.goto(f"file://{file_path}")

        # Desktop Viewport
        await page.set_viewport_size({"width": 1440, "height": 900})
        await page.wait_for_timeout(3000) # Let model-viewer and page elements render

        # Ensure directory exists
        os.makedirs("/home/jules/verification_shirt", exist_ok=True)

        # Full page desktop screenshot
        await page.screenshot(path="/home/jules/verification_shirt/shirt_desktop_full.png", full_page=True)
        print("Captured desktop full page screenshot.")

        # Full page mobile screenshot
        await page.set_viewport_size({"width": 375, "height": 812})
        await page.wait_for_timeout(1000)
        await page.goto(f"file://{file_path}")
        await page.wait_for_timeout(3000)
        await page.screenshot(path="/home/jules/verification_shirt/shirt_mobile_full.png", full_page=True)
        print("Captured mobile full page screenshot.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run_verification())
