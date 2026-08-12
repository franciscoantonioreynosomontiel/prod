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
        await page.wait_for_timeout(2000) # Let model-viewer and page elements render

        # Ensure directory exists
        os.makedirs("/home/jules/verification_shirt", exist_ok=True)

        # Desktop Hero and Grid Screenshots
        await page.screenshot(path="/home/jules/verification_shirt/shirt_desktop_hero.png", full_page=False)
        print("Captured desktop hero screenshot.")

        # Scroll to columns
        await page.evaluate("window.scrollTo(0, 800)")
        await page.wait_for_timeout(500)
        await page.screenshot(path="/home/jules/verification_shirt/shirt_desktop_grid.png", full_page=False)
        print("Captured desktop grid screenshot.")

        # Scroll to carousel and form
        await page.evaluate("window.scrollTo(0, 1600)")
        await page.wait_for_timeout(500)
        await page.screenshot(path="/home/jules/verification_shirt/shirt_desktop_form.png", full_page=False)
        print("Captured desktop form screenshot.")

        # Mobile Viewport
        await page.set_viewport_size({"width": 375, "height": 812})
        await page.wait_for_timeout(1000)
        await page.goto(f"file://{file_path}")
        await page.wait_for_timeout(2000)
        await page.screenshot(path="/home/jules/verification_shirt/shirt_mobile_hero.png", full_page=False)
        print("Captured mobile hero screenshot.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run_verification())
