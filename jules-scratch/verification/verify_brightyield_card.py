
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    page.goto("http://localhost:5173/")

    # Click the "View Case Study" button for the Brightyield project
    brightyield_button = page.locator('button[data-modal-target="modal-brightyield"]')
    brightyield_button.click()

    # Wait for the modal to appear
    page.wait_for_selector('#modal-brightyield.opacity-0', state='detached')

    # Take a screenshot of the modal
    page.screenshot(path="jules-scratch/verification/brightyield_modal.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
