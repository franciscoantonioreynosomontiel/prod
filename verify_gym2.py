import asyncio
import os
from playwright.async_api import async_playwright

async def run_verification():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Load local gym2.html path
        file_path = os.path.abspath("docs/gym2.html")
        await page.goto(f"file://{file_path}")

        # Set viewport to standard high definition screen
        await page.set_viewport_size({"width": 1440, "height": 900})
        await page.wait_for_timeout(1000)

        os.makedirs("/home/jules/verification", exist_ok=True)

        # Screenshot 1: Desktop Full Page of Chuze Gym Landing Page
        await page.screenshot(path="/home/jules/verification/gym2_desktop_full.png", full_page=True)
        print("Captured desktop full page screenshot.")

        # Interactive check: Click Classes tab 'tab-zona-cardio'
        await page.click("id=tab-zona-cardio")
        await page.wait_for_timeout(500)
        await page.screenshot(path="/home/jules/verification/gym2_cardio_tab.png", full_page=False)
        print("Captured cardio tab active state screenshot.")

        # Interactive check: Click Martes day button in schedule
        await page.click("id=btn-sch-martes")
        await page.wait_for_timeout(300)
        await page.screenshot(path="/home/jules/verification/gym2_martes_schedule.png", full_page=False)
        print("Captured schedule day switch state screenshot.")

        # Interactive check: fill and submit the contact form
        await page.fill("id=form-name", "Alejandra Gómez")
        await page.fill("id=form-email", "alejandra@ejemplo.com")
        await page.fill("id=form-phone", "+34 611 222 333")
        await page.select_option("id=form-interest", "recuperacion")
        await page.fill("id=form-notes", "Me gustaría saber si la sauna de infrarrojos tiene límite de tiempo de uso.")
        await page.click("text=Enviar Solicitud de Información")
        await page.wait_for_timeout(600)
        await page.screenshot(path="/home/jules/verification/gym2_form_submitted.png", full_page=False)
        print("Captured contact form success state screenshot.")

        # Change Viewport to Mobile to check responsiveness
        await page.set_viewport_size({"width": 375, "height": 812})
        await page.wait_for_timeout(500)
        await page.screenshot(path="/home/jules/verification/gym2_mobile_hero.png", full_page=False)
        print("Captured mobile hero view screenshot.")

        # Toggle mobile menu open
        await page.click("id=mobile-menu-btn")
        await page.wait_for_timeout(400)
        await page.screenshot(path="/home/jules/verification/gym2_mobile_menu_open.png", full_page=False)
        print("Captured mobile menu open view screenshot.")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run_verification())
