import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto("http://localhost:5173", timeout=60000)

        # Scroll down the page to trigger lazy loading
        for i in range(5):
            await page.mouse.wheel(0, 1500)
            await page.wait_for_timeout(500)

        await page.screenshot(path="jules-scratch/verification/verification.png", full_page=True)
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
