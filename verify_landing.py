import asyncio
import os
from playwright.async_api import async_playwright

async def run_verification():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Load local landing.html path
        file_path = os.path.abspath("docs/landing.html")
        await page.goto(f"file://{file_path}")

        # Set viewport to standard high definition screen
        await page.set_viewport_size({"width": 1440, "height": 900})
        await page.wait_for_timeout(1000)

        os.makedirs("/home/jules/verification", exist_ok=True)

        # Screenshot 1: Full Page View of visual catalog & features
        await page.screenshot(path="/home/jules/verification/landing_full_minimal.png", full_page=True)
        print("Captured full page minimal landing screenshot.")

        # Let's interact with the ordering button simulation - Toggle extras
        await page.click("id=chk-truffle")
        await page.wait_for_timeout(200)
        await page.click("id=chk-asparagus")
        await page.wait_for_timeout(200)

        # Confirm the simulated checkout order
        await page.click("id=btn-simulate-order")
        await page.wait_for_timeout(500)
        await page.screenshot(path="/home/jules/verification/landing_order_success.png", full_page=False)
        print("Captured order success state screenshot with recalculated pricing.")

        # Click Anniversary seasonal theme inside browser mockup
        await page.click("id=btn-theme-anniversary")
        await page.wait_for_timeout(800) # Wait for style transitions
        await page.screenshot(path="/home/jules/verification/landing_seasonal_anniversary.png", full_page=False)
        print("Captured anniversary mockup theme screenshot.")

        # Click San Valentín theme
        await page.click("id=btn-theme-romance")
        await page.wait_for_timeout(800) # Wait for style transitions
        await page.screenshot(path="/home/jules/verification/landing_seasonal_romance.png", full_page=False)
        print("Captured romance mockup theme screenshot.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run_verification())
