import asyncio
import os
from playwright.async_api import async_playwright

async def run_verification():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Load local gym1.html path
        file_path = os.path.abspath("docs/gym1.html")
        await page.goto(f"file://{file_path}")

        # Set viewport to standard high definition screen
        await page.set_viewport_size({"width": 1440, "height": 900})
        await page.wait_for_timeout(1000)

        os.makedirs("/home/jules/verification", exist_ok=True)

        # Screenshot 1: Desktop Full Page of Gym Landing Page
        await page.screenshot(path="/home/jules/verification/gym_desktop_full.png", full_page=True)
        print("Captured desktop full page screenshot.")

        # Interactive check: Click Annual billing cycle toggle
        await page.click("id=toggle-annual")
        await page.wait_for_timeout(300)
        await page.screenshot(path="/home/jules/verification/gym_annual_billing.png", full_page=False)
        print("Captured annual billing active state screenshot.")

        # Interactive check: Click Monthly billing cycle toggle back
        await page.click("id=toggle-monthly")
        await page.wait_for_timeout(300)

        # Interactive check: Select plan
        # We can click the second plan button (Iron Member)
        # Select the register buttons. The second plan button is inside the second card.
        # Let's select it by text or element click. Let's click the "REGISTRARME HOY" button.
        await page.click("text=REGISTRARME HOY")
        await page.wait_for_timeout(500)
        await page.screenshot(path="/home/jules/verification/gym_plan_selected.png", full_page=False)
        print("Captured plan selection state screenshot.")

        # Change Viewport to Mobile to check responsiveness
        await page.set_viewport_size({"width": 375, "height": 812})
        await page.wait_for_timeout(500)
        await page.screenshot(path="/home/jules/verification/gym_mobile_hero.png", full_page=False)
        print("Captured mobile hero view screenshot.")

        # Toggle mobile menu open
        await page.click("id=mobile-menu-btn")
        await page.wait_for_timeout(400)
        await page.screenshot(path="/home/jules/verification/gym_mobile_menu_open.png", full_page=False)
        print("Captured mobile menu open view screenshot.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run_verification())
