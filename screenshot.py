import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1280, "height": 800})

        await page.goto('http://localhost:4200')
        await page.wait_for_timeout(5000)
        await page.screenshot(path='frontend_verify.png', full_page=True)
        await browser.close()

asyncio.run(main())
