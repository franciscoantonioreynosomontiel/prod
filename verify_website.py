import asyncio
import os
from playwright.async_api import async_playwright

async def run_verification():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Load local website.html path
        file_path = os.path.abspath("docs/website/website.html")
        await page.goto(f"file://{file_path}")

        # Set viewport to standard high definition screen
        await page.set_viewport_size({"width": 1440, "height": 900})
        await page.wait_for_timeout(2000) # Let animations and swiper initialize

        os.makedirs("/home/jules/verification_website", exist_ok=True)

        # Screenshot 1: Top hero with laptop 3D model
        await page.screenshot(path="/home/jules/verification_website/new_website_hero.png", full_page=False)
        print("Captured website top hero screenshot.")

        # Screenshot 2: Scroll to Swiper Laptop carousel
        await page.evaluate("window.scrollTo(0, 1100)")
        await page.wait_for_timeout(1000)
        await page.screenshot(path="/home/jules/verification_website/new_website_carousel.png", full_page=False)
        print("Captured website carousel screenshot.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run_verification())
