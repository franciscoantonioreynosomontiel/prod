import asyncio
import os
from playwright.async_api import async_playwright

async def run_verification():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Load local index.html path
        file_path = os.path.abspath("docs/index.html")
        await page.goto(f"file://{file_path}")

        # Set viewport to standard high definition screen
        await page.set_viewport_size({"width": 1440, "height": 900})
        await page.wait_for_timeout(2000) # Let animations and swiper initialize

        os.makedirs("/home/jules/verification", exist_ok=True)

        # Screenshot 1: Top hero with laptop 3D model
        await page.screenshot(path="/home/jules/verification/new_portfolio_hero.png", full_page=False)
        print("Captured top hero screenshot.")

        # Screenshot 2: Scroll to Swiper Laptop carousel
        await page.evaluate("window.scrollTo(0, 1100)")
        await page.wait_for_timeout(1000)
        await page.screenshot(path="/home/jules/verification/new_portfolio_carousel.png", full_page=False)
        print("Captured carousel screenshot.")

        # Load local adminWebsite.html path
        admin_path = os.path.abspath("docs/adminWebsite.html")
        await page.goto(f"file://{admin_path}")
        await page.wait_for_timeout(1000)
        await page.screenshot(path="/home/jules/verification/new_admin_dashboard.png", full_page=False)
        print("Captured admin dashboard screenshot.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run_verification())
