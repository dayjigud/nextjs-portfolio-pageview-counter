import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(
            viewport={'width': 390, 'height': 844},
            device_scale_factor=3,
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
        )
        await page.goto("http://localhost:5173", timeout=60000)

        # Scroll to the skills section
        await page.locator("#skills").scroll_into_view_if_needed()
        await page.wait_for_timeout(1000) # wait for animations

        await page.screenshot(path="jules-scratch/verification/verification_mobile.png")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
