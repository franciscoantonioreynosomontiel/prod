import asyncio
import os
from playwright.async_api import async_playwright

async def run_verification():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Load local stickers.html path
        file_path = os.path.abspath("docs/stickers.html")
        await page.goto(f"file://{file_path}")

        # Set viewport to standard desktop screen
        await page.set_viewport_size({"width": 1440, "height": 900})
        await page.wait_for_timeout(2000)

        os.makedirs("verification_stickers", exist_ok=True)

        # Capture top landing page layout
        await page.screenshot(path="verification_stickers/stickers_hero_desktop.png", full_page=False)
        print("Captured stickers top hero screenshot (desktop).")

        # Scroll to sticker sheet collection
        await page.locator("#sticker-sheet").scroll_into_view_if_needed()
        await page.wait_for_timeout(1000)
        await page.screenshot(path="verification_stickers/stickers_sheet.png", full_page=False)
        print("Captured stickers collection sheet screenshot.")

        # Scroll to workspace area
        await page.locator("#workspace").scroll_into_view_if_needed()
        await page.wait_for_timeout(1000)
        await page.screenshot(path="verification_stickers/stickers_workspace.png", full_page=False)
        print("Captured stickers workspace screenshot.")

        # Scroll to custom designer studio
        await page.locator("#creator").scroll_into_view_if_needed()
        await page.wait_for_timeout(1000)
        await page.screenshot(path="verification_stickers/stickers_designer.png", full_page=False)
        print("Captured stickers creator studio screenshot.")

        # Mobile Viewport Verification
        await page.set_viewport_size({"width": 375, "height": 812})
        await page.goto(f"file://{file_path}")
        await page.wait_for_timeout(2000)
        await page.screenshot(path="verification_stickers/stickers_hero_mobile.png", full_page=False)
        print("Captured stickers top hero screenshot (mobile).")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run_verification())
