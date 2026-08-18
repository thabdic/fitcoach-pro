import { test, expect } from '@playwright/test';
import { RequestplanPageAdmin } from '../pages/planRequestPageAdmin';
import { WorkoutPlans } from '../pages/workoutPlansPage';
import { MealPlans } from '../pages/mealPlanspage';
import { ProgressPage } from '../pages/progressPage';

test.use({ storageState: 'e2e/.auth/trainer.json' });

const ASSIGNED_GOAL = 'Lose 5kg before summer';

const TRAINER_GOALS = [
  'Build muscle and improve strength',
  'Off-season conditioning',
  ASSIGNED_GOAL,
];

const SEEDED_NOTES = ['Week 1 baseline', 'Down 1kg, lifts up', 'Getting used to the routine'];

test.describe.serial('Trainer flow', () => {
  let planRequestsPage: RequestplanPageAdmin;
  let workoutPlansPage: WorkoutPlans;
  let mealPlansPage: MealPlans;
  let progressPage: ProgressPage;

  test.beforeEach(async ({ page }) => {
    planRequestsPage = new RequestplanPageAdmin(page);
    workoutPlansPage = new WorkoutPlans(page);
    mealPlansPage = new MealPlans(page);
    progressPage = new ProgressPage(page);
    await page.goto('/dashboard');
  });

  test('shows only the plan requests assigned to this trainer', async () => {
    const allPlanRequestsSideBarButton = planRequestsPage.allPlanRequestsSideBarButton;
    const allPlanRequestsTable = planRequestsPage.allPlanRequestsTable;
    const pendingRows = planRequestsPage.getRowByStatus('Pending');

    await allPlanRequestsSideBarButton.click();
    await expect(allPlanRequestsSideBarButton).toHaveClass(/(^|\s)active(\s|$)/);
    await expect(allPlanRequestsTable).toBeVisible();

    for (const goal of TRAINER_GOALS) {
      const goalRow = planRequestsPage.getRowByGoal(goal);
      await expect(goalRow).toBeVisible();
    }
    await expect(pendingRows).toHaveCount(0);
  });

  test('moves an assigned request to in progress', async () => {
    const allPlanRequestsSideBarButton = planRequestsPage.allPlanRequestsSideBarButton;
    const manageAssignedButton = planRequestsPage.getManageButtonByGoal(ASSIGNED_GOAL);
    const manageRequestDialog = planRequestsPage.manageRequestDialog;
    const updateStatusDropDown = planRequestsPage.updateStatusDropDown;
    const inProgressOption = planRequestsPage.statusOption('in progress');
    const updateButton = planRequestsPage.updateButton;
    const statusUpdatedToast = planRequestsPage.successToastDetail.filter({ hasText: 'Status updated' });
    const assignedRow = planRequestsPage.getRowByGoal(ASSIGNED_GOAL);

    await allPlanRequestsSideBarButton.click();
    await expect(allPlanRequestsSideBarButton).toHaveClass(/(^|\s)active(\s|$)/);

    await manageAssignedButton.click();
    await expect(manageRequestDialog).toBeVisible();
    await updateStatusDropDown.click();
    await inProgressOption.click();
    await updateButton.click();

    await expect(statusUpdatedToast).toBeVisible();
    await expect(manageRequestDialog).toBeHidden();
    await expect(assignedRow).toContainText('In_progress');
  });

  test('creates a workout plan for an assigned client', async () => {
    const title = `Summer routine for losing weight ${Date.now()}`;
    const workoutPlansSideBarButton = workoutPlansPage.workoutPlansSideBarButton;
    const newPlanButton = workoutPlansPage.newPlanButton;
    const newWorkoutPlanDialog = workoutPlansPage.newWorkoutPlanDialog;
    const planCreatedToast = workoutPlansPage.successToastDetail.filter({ hasText: 'Plan created' });

    await workoutPlansSideBarButton.click();
    await expect(workoutPlansSideBarButton).toHaveClass(/(^|\s)active(\s|$)/);
    await newPlanButton.click();
    await expect(newWorkoutPlanDialog).toBeVisible();

    await workoutPlansPage.addNewWorkoutPlan({
      title,
      difficulty: 'intermediate',
      daysPerWeek: '5',
      description: 'Workout routine for losing belly fat and getting ready for beach',
      exerciseName: 'Lat pull down',
      sets: '4',
      reps: '12',
      rest: '60',
    });

    await expect(planCreatedToast).toBeVisible();
    await workoutPlansPage.verifyPlanTitle(title);
  });


  test('creates a meal plan for an assigned client', async () => {
    const title = `Summer cut ${Date.now()}`;
    const mealPlansSideBarButton = mealPlansPage.mealPlansSideBarButton;
    const newMealPlanButton = mealPlansPage.newMealPlanButton;
    const newMealPlanDialog = mealPlansPage.newMealPlanDialog;
    const planCreatedToast = mealPlansPage.successToastDetail.filter({ hasText: 'Plan created' });

    await mealPlansSideBarButton.click();
    await expect(mealPlansSideBarButton).toHaveClass(/(^|\s)active(\s|$)/);
    await newMealPlanButton.click();
    await expect(newMealPlanDialog).toBeVisible();

    await mealPlansPage.newMealPlan({
      title,
      calories: '1600',
      mealName: 'Breakfast',
      timeOfDay: 'morning',
      foods: 'Greek yogurt with whey protein, 5 eggs',
    });

    await expect(planCreatedToast).toBeVisible();
    await mealPlansPage.verifyPlanTitle(title);
  });


  test("reviews assigned clients' progress read-only", async () => {
    const myProgressSideBarButton = progressPage.myProgressSideBarButton;
    const pageTitle = progressPage.pageTitle;
    const progressTable = progressPage.progressTable;
    const logProgressButton = progressPage.logProgressButton;

    await myProgressSideBarButton.click();
    await expect(myProgressSideBarButton).toHaveClass(/(^|\s)active(\s|$)/);
    await expect(pageTitle).toHaveText('Client Progress');
    await expect(progressTable).toBeVisible();

    await expect(logProgressButton).toHaveCount(0);
    for (const note of SEEDED_NOTES) {
      const noteRow = progressPage.rowByNotes(note);
      await expect(noteRow).toBeVisible();
    }
  });
});
