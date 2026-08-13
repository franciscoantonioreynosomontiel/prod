import os
from playwright.sync_api import sync_playwright, expect

def verify_enhanced_modal():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # We navigate to the file directly
        file_path = f"file://{os.path.abspath('docs/constuctora.html')}"
        page = browser.new_page(viewport={"width": 1280, "height": 800})

        print("Navigating to page...")
        page.goto(file_path)

        # 1. Click first trade card to open the modal (State A)
        print("Clicking Structural division card...")
        page.locator("text=Structural & Building").first.click()

        # Verify modal is visible
        modal = page.locator("#professionals-modal")
        expect(modal).to_be_visible()

        # Take screenshot of State A (Professionals Grid)
        print("Taking screenshot of State A...")
        page.screenshot(path="/home/jules/verification/enhanced_modal_state_a.png")

        # 2. Click "View Full Landing Page" for the first professional
        print("Clicking 'View Full Landing Page'...")
        page.locator("text=View Full Landing Page").first.click()

        # Verify State B is visible
        state_b = page.locator("#state-professional-landing")
        expect(state_b).to_be_visible()

        # Take screenshot of State B Profile (Stats sub-tab)
        print("Taking screenshot of State B Profile (Stats)...")
        page.screenshot(path="/home/jules/verification/enhanced_modal_state_b_stats.png")

        # 3. Click "Technical Videos" sub-tab inside profile
        print("Switching to Technical Videos sub-tab...")
        page.locator("#profile-tab-btn-videos").click()

        # Verify videos panel is visible
        videos_panel = page.locator("#profile-panel-videos")
        expect(videos_panel).to_be_visible()

        # Take screenshot of State B Profile (Videos sub-tab)
        print("Taking screenshot of State B Profile (Videos)...")
        page.screenshot(path="/home/jules/verification/enhanced_modal_state_b_videos.png")

        # 4. Click "Procedures" sub-tab inside profile
        print("Switching to Procedures sub-tab...")
        page.locator("#profile-tab-btn-routines").click()

        # Verify routines panel is visible
        routines_panel = page.locator("#profile-panel-routines")
        expect(routines_panel).to_be_visible()

        # Take screenshot of State B Profile (Procedures sub-tab)
        print("Taking screenshot of State B Profile (Procedures)...")
        page.screenshot(path="/home/jules/verification/enhanced_modal_state_b_procedures.png")

        # 5. Click "Assign to Project Planner" and check success message
        print("Switching back to Stats tab to request assignment...")
        page.locator("#profile-tab-btn-stats").click()
        page.locator("text=Assign To Project Planner").click()

        success_msg = page.locator("text=Specialist assignment successfully requested")
        expect(success_msg).to_be_visible()

        # Take screenshot of assignment success
        print("Taking screenshot of assigned success...")
        page.screenshot(path="/home/jules/verification/enhanced_modal_state_b_assigned.png")

        browser.close()
        print("Verification script finished successfully!")

if __name__ == "__main__":
    verify_enhanced_modal()
