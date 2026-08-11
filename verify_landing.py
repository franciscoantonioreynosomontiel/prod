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
        await page.wait_for_timeout(2000) # Let AOS animations initialize

        os.makedirs("/home/jules/verification", exist_ok=True)

        # Screenshot 1: Top hero section
        await page.screenshot(path="/home/jules/verification/landing_hero.png", full_page=False)
        print("Captured landing top hero screenshot.")

        # Screenshot 2: Projects showcase
        await page.evaluate("document.getElementById('proyectos').scrollIntoView()")
        await page.wait_for_timeout(1000)
        await page.screenshot(path="/home/jules/verification/landing_projects.png", full_page=False)
        print("Captured projects showcase screenshot.")

        # Scroll to interactive demonstrator
        await page.evaluate("document.getElementById('experiencia-estacional').scrollIntoView()")
        await page.wait_for_timeout(1000)

        # Screenshot 3: Demonstrator - Standard Mode
        await page.screenshot(path="/home/jules/verification/landing_demo_standard.png", full_page=False)
        print("Captured demonstrator in standard mode screenshot.")

        # Click Valentine button
        await page.click("id=btn-theme-valentine")
        await page.wait_for_timeout(1500) # Wait for style transitions and petals to render
        await page.screenshot(path="/home/jules/verification/landing_demo_valentine.png", full_page=False)
        print("Captured demonstrator in valentine mode screenshot.")

        # Click Anniversary button
        await page.click("id=btn-theme-anniversary")
        await page.wait_for_timeout(1500) # Wait for style transitions and sparkles to render
        await page.screenshot(path="/home/jules/verification/landing_demo_anniversary.png", full_page=False)
        print("Captured demonstrator in anniversary mode screenshot.")

        # Scroll to Contact form
        await page.evaluate("document.getElementById('contacto').scrollIntoView()")
        await page.wait_for_timeout(1000)
        await page.screenshot(path="/home/jules/verification/landing_contact.png", full_page=False)
        print("Captured contact form screenshot.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run_verification())
