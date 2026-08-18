import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/loginPage';
import { ACCOUNTS } from '../config/credentials';


const CLIENT = ACCOUNTS.client;

test.describe('Authentication', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('logs in with valid credentials and lands on the dashboard', async ({ page }) => {
    const dashboardTitle = page.getByTestId('dashboard-title');

    await loginPage.goTo();
    await loginPage.login(CLIENT.email, CLIENT.password);

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(dashboardTitle).toBeVisible();
  });

  test('logs out and cannot return to a protected route', async ({ page }) => {
    const logoutButton = page.getByTestId('logout-button');

    await loginPage.goTo();
    await loginPage.login(CLIENT.email, CLIENT.password);
    await expect(page).toHaveURL(/\/dashboard/);

    await logoutButton.click();
    await expect(page).toHaveURL(/\/login/);

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('rejects an invalid password with an error toast', async ({ page }) => {
    const errorToast = page.locator('.p-toast-message');

    await loginPage.goTo();
    await loginPage.login(CLIENT.email, 'WrongPassword1!');

    await expect(page).toHaveURL(/\/login/);
    await expect(errorToast).toContainText('Invalid email or password');
  });

  test('redirects to /login when visiting a protected route while logged out', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
