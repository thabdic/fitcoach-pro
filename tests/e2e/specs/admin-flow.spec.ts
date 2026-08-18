import { test, expect } from '@playwright/test';
import { UsersPage } from '../pages/usersPage';
import { ACCOUNTS } from '../config/credentials';
import { RequestplanPageAdmin } from '../pages/planRequestPageAdmin';

test.use({ storageState: 'e2e/.auth/admin.json' });

test.describe.serial('Admin flow', () => {


  let usersPage: UsersPage;
  let planRequestsPageAdmin:RequestplanPageAdmin;

  test.beforeEach(async ({ page }) => {
    usersPage = new UsersPage(page);
    planRequestsPageAdmin = new RequestplanPageAdmin(page);
    await page.goto('/dashboard');
  });
  test('lists the seeded users with role and status tags', async () => {
    const usersSideBarButton = usersPage.usersSideBarButton;
    const usersTable = usersPage.usersTable;

    await usersSideBarButton.click();
    await expect(usersSideBarButton).toHaveClass(/(^|\s)active(\s|$)/);
    await expect(usersTable).toBeVisible();
    for (const { role, email } of Object.values(ACCOUNTS)) {
      const titlecased = role[0].toUpperCase() + role.slice(1);
      const userRow = usersPage.rowByEmail(email);
      const userRole = usersPage.getRole(email);
      const userStatus = usersPage.getStatus(email);

      await expect(userRow).toBeVisible();
      await expect(userRole).toHaveText(titlecased);
      await expect(userStatus).toHaveText('Active');
    }
  });

  test("changes a user's role and reflects it in the table", async () => {
    const usersSideBarButton = usersPage.usersSideBarButton;
    const usersTable = usersPage.usersTable;
    const dana = ACCOUNTS.client2.email;
    const danaRole = usersPage.getRole(dana);

    await usersSideBarButton.click();
    await expect(usersSideBarButton).toHaveClass(/(^|\s)active(\s|$)/);
    await expect(usersTable).toBeVisible();
    await usersPage.setRole(dana, 'Trainer');
    await expect(danaRole).toHaveText('Trainer');
    await usersPage.setRole(dana, 'Client');
    await expect(danaRole).toHaveText('Client');
  });

  test('deactivates and reactivates a user', async ({ page }) => {
    const usersSideBarButton = usersPage.usersSideBarButton;
    const usersTable = usersPage.usersTable;
    const dana = ACCOUNTS.client2.email;
    const toggleStatusButton = usersPage.toggleStatusButton(dana);
    const statusUpdatedToast = usersPage.successToast.filter({ hasText: 'Status updated' });

    await usersSideBarButton.click();
    await expect(usersSideBarButton).toHaveClass(/(^|\s)active(\s|$)/);
    await expect(usersTable).toBeVisible();
    await toggleStatusButton.click();
    await expect(statusUpdatedToast).toBeVisible();
    await expect(statusUpdatedToast).toBeHidden();
    await expect(toggleStatusButton).toHaveText('Activate');
    await toggleStatusButton.click();
    await expect(statusUpdatedToast).toBeVisible();
    await expect(toggleStatusButton).toHaveText('Deactivate');
  });

  test('assigns a trainer to a pending plan request', async () => {
    const allPlanRequestsSideBarButton = planRequestsPageAdmin.allPlanRequestsSideBarButton;
    const allPlanRequestsTable = planRequestsPageAdmin.allPlanRequestsTable;
    const pendingRow = planRequestsPageAdmin.getRowByStatus('Pending').first();
    const managePendingButton = planRequestsPageAdmin.getManageButton('Pending');
    const manageRequestDialog = planRequestsPageAdmin.manageRequestDialog;
    const assignTrainerDropDown = planRequestsPageAdmin.assignTrainerDropDown;
    const trainerOption = planRequestsPageAdmin.trainerOption(ACCOUNTS.trainer.email);
    const assignButton = planRequestsPageAdmin.assignButton;
    const trainerAssignedToast = planRequestsPageAdmin.successToastDetail.filter({ hasText: 'Trainer assigned' });

    await allPlanRequestsSideBarButton.click();
    await expect(allPlanRequestsSideBarButton).toHaveClass(/(^|\s)active(\s|$)/);
    await expect(allPlanRequestsTable).toBeVisible();

    await expect(pendingRow).toBeVisible();
    const goal = await planRequestsPageAdmin.goalOf(pendingRow);

    await managePendingButton.click();
    await expect(manageRequestDialog).toBeVisible();
    await assignTrainerDropDown.click();
    await trainerOption.click();
    await assignButton.click();
    await expect(trainerAssignedToast).toBeVisible();
    await expect(manageRequestDialog).toBeHidden();
    await expect(planRequestsPageAdmin.getRowByGoal(goal)).toContainText('Assigned');
  });
});
