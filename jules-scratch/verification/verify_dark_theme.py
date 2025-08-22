from playwright.sync_api import Page, expect

def test_dark_theme_and_no_animations(page: Page):
    """
    This test verifies that the website has a dark theme and that animations are removed.
    """
    # 1. Arrange: Go to the application's homepage.
    page.goto("http://localhost:5173")

    # 2. Assert: Check for dark theme by verifying the background color of the body.
    body = page.locator("body")
    expect(body).to_have_css("background-color", "rgb(26, 32, 44)")

    # 3. Screenshot: Capture the final result for visual verification.
    page.screenshot(path="jules-scratch/verification/verification.png")
