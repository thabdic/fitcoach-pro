import { test, expect } from '@playwright/test';
import { RequestplanPage } from '../pages/planRequestPage';
import { ProfilePage } from '../pages/profilePage';
import { WorkoutPlans } from '../pages/workoutPlansPage';
import { MealPlans } from '../pages/mealPlanspage';
import { ProgressPage } from '../pages/progressPage';

test.use({ storageState: 'e2e/.auth/client.json' });

test.describe('Client flow', () => {

  let planRequestPage:RequestplanPage;
  let profilePage:ProfilePage;
  let workoutsPlans:WorkoutPlans;
  let mealPlans:MealPlans;
  let progresspage:ProgressPage;

  test.beforeEach(async({page})=>{
    planRequestPage = new RequestplanPage(page);
    profilePage = new ProfilePage(page);
    workoutsPlans = new WorkoutPlans(page);
    mealPlans = new MealPlans(page);
    progresspage = new ProgressPage(page);
    await page.goto('/dashboard');
  })

  
  test('creates a plan request that appears as Pending', async ({ page }) => {
    const goal:string = `Lose 7kg ${Date.now()}`;
    const comment:string = 'Getting ready for marathon';
    const requestPlanSideBarButton = planRequestPage.requestPlanSideBarButton;
    const requestAplanButton = planRequestPage.requestAplanButton;
    const requestAplanDialog = planRequestPage.requestAplanDialog;
    const successToast = planRequestPage.successToast;
    const rowByGoal = planRequestPage.rowByGoal(goal);

    await requestPlanSideBarButton.click();
    await expect(requestAplanButton).toBeVisible();
    await requestAplanButton.click();
    await expect(requestAplanDialog).toBeVisible();
    await planRequestPage.completeRequestPlan(goal, comment);
    await expect(successToast).toBeVisible();
    await expect(rowByGoal).toContainText('Pending');
  });

  test('creates or updates the fitness profile and persists it', async ({ page }) => {
    const profileSideBarButton = profilePage.profileSideBarButton;
    const successToast = profilePage.successToast;

    await profileSideBarButton.click();
    await profilePage.updateProfile('27','Male','186','102','Lose Weight','Active','none','high protein intake with some carbs');
    await expect(successToast).toBeVisible();
  });

  test('shows at least one assigned workout plan', async ({ page }) => {
    const workoutPlansSideBarButton = workoutsPlans.workoutPlansSideBarButton;
    const assignedTag = workoutsPlans.assignedTag.first();

    await workoutPlansSideBarButton.click();
    await expect(workoutPlansSideBarButton).toHaveClass(/(^|\s)active(\s|$)/)
    await expect(assignedTag).toBeVisible();
  });

  test('shows at least one assigned meal plan', async ({ page }) => {
    const mealPlansSideBarButton = mealPlans.mealPlansSideBarButton;
    const assignedTag = mealPlans.assignedTag.first();

    await mealPlansSideBarButton.click();
    await expect(mealPlansSideBarButton).toHaveClass(/(^|\s)active(\s|$)/)
    await expect(assignedTag).toBeVisible();
  });

  test('logs a progress update that appears in the table', async ({ page }) => {
    const weight:string='101';
    const energy:string='8';
    const mood:string='sleepy';
    const notes:string=`Targeting higher reps ${Date.now()}`;
    const myProgressSideBarButton = progresspage.myProgressSideBarButton;
    const logProgressButton = progresspage.logProgressButton;
    const logProgressDialog = progresspage.logProgressDialog;
    const successToast = progresspage.successToast;
    const rowByNotes = progresspage.rowByNotes(notes);

    await myProgressSideBarButton.click();
    await expect(myProgressSideBarButton).toHaveClass(/(^|\s)active(\s|$)/);
    await logProgressButton.click();
    await expect(logProgressDialog).toBeVisible();
    await progresspage.updateAndSubmitProgress(weight,energy,mood,notes);
    await expect(successToast).toBeVisible();
    await expect(rowByNotes).toContainText(weight);
  });
});
