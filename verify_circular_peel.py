import http.server
import socketserver
import threading
import time
from playwright.sync_api import sync_playwright

PORT = 8089

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

def start_server():
    with socketserver.TCPServer(("", PORT), QuietHandler) as httpd:
        httpd.serve_forever()

server_thread = threading.Thread(target=start_server, daemon=True)
server_thread.start()
time.sleep(1)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 800})

    # Load .stickers.html
    page.goto(f"http://localhost:{PORT}/docs/.stickers.html")
    page.wait_for_timeout(1000)

    # Find first sticker wrapper
    sticker = page.locator('.sticker-wrapper').first
    box = sticker.bounding_box()

    if box:
        start_x = box["x"] + box["width"] / 2
        start_y = box["y"] + box["height"] / 2

        # Pointer down & drag to trigger peel state
        page.mouse.move(start_x, start_y)
        page.mouse.down()
        page.mouse.move(start_x + 50, start_y + 50, steps=5)
        page.wait_for_timeout(200)

        page.screenshot(path="verification_stickers/circular_white_fold.png")
        print("Captured circular white fold screenshot successfully.")

        page.mouse.up()

    browser.close()
