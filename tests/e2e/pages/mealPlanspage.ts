import {Page,Locator,expect} from '@playwright/test';

/**
 * Fields of the New/Edit Meal Plan dialog (meal-plans.html:44-97). Every id is
 * prefixed ('#mtitle', '#mclientId', …) so it cannot collide with the workout
 * form. There is no difficulty select here.
 */
export interface MealPlanForm {
    title: string;
    calories: string;
    mealName: string;
    timeOfDay: string;
    /** Comma-separated; split client-side into foods[]. */
    foods: string;
    /** Substring of a client option label — omit to take the first option. */
    client?: string;
    status?: string;
    description?: string;
}

export class MealPlans{
    private page:Page;
    readonly mealPlansSideBarButton:Locator;
    readonly planCards:Locator;
    readonly assignedTag:Locator;
    readonly newMealPlanButton:Locator;
    readonly newMealPlanDialog:Locator;
    readonly mealPlanTitle:Locator;
    readonly clientID:Locator;
    readonly caloriesTarget:Locator;
    readonly status:Locator;
    readonly description:Locator;
    readonly mealName:Locator;
    readonly timeOfDay:Locator;
    readonly foods:Locator;
    readonly dropDownOptions:Locator;
    readonly savePlanButton:Locator;
    readonly cellTitles:Locator;
    readonly successToastDetail:Locator;

    constructor(page:Page){
        this.page = page;
        this.mealPlansSideBarButton = this.page.getByTestId('sidebar-meal-plans');
        this.planCards = this.page.getByTestId('meal-plan-card');
        // Same caveat as the workout card: severity="success" is hardcoded for
        // every status (meal-plans.html:19), so this proves a card exists.
        this.assignedTag = this.planCards.locator('[severity="success"]');
        // By testid, not by the 'New Plan' label — the workout-plans page uses the
        // SAME label, so a page-wide role locator would resolve there too.
        this.newMealPlanButton = this.page.getByTestId('create-meal-plan');
        this.newMealPlanDialog = this.page.getByRole('dialog',{name:'New Meal Plan'});
        this.mealPlanTitle = this.page.locator('#mtitle');
        this.clientID = this.page.locator('#mclientId');
        this.caloriesTarget = this.page.locator('#caloriesTarget');
        this.status = this.page.locator('#mstatus');
        this.description = this.page.locator('#mdescription');
        // Meal-row inputs carry no ids, only placeholders (meal-plans.html:84-86).
        this.mealName = this.page.getByPlaceholder('Meal name');
        this.timeOfDay = this.page.getByPlaceholder('Time of day');
        this.foods = this.page.getByPlaceholder('Foods (comma separated)');
        this.dropDownOptions = this.page.getByRole('option');
        this.savePlanButton = this.page.getByTestId('submit-meal-plan');
        this.cellTitles = this.planCards.locator('.cell-title');
        // Detail, not summary: create and update both report 'Saved'
        // (meal-plans.ts:198,216). Identical to the workout toast, so when both
        // specs could overlap, assert the card rather than the toast.
        this.successToastDetail = this.page.locator('.p-toast-detail');
    }

    cardByTitle(title:string):Locator{
        return this.planCards.filter({hasText:title});
    }

    async verifyPlanTitle(title:string){
        await expect(this.cellTitles.filter({hasText:title})).toBeVisible();
    }

    async newMealPlan(plan:MealPlanForm){
        await this.mealPlanTitle.fill(plan.title);
        // Defaults to 2000, so clear before filling.
        await this.caloriesTarget.clear();
        await this.caloriesTarget.fill(plan.calories);
        // openCreate() pre-pushes one empty meal row.
        await this.mealName.fill(plan.mealName);
        await this.timeOfDay.fill(plan.timeOfDay);
        await this.foods.fill(plan.foods);
        // Derived labels, no real names — see the note in workoutPlansPage.
        await this.clientID.click();
        if(plan.client){
            await this.dropDownOptions.filter({hasText:plan.client}).click();
        }else{
            await this.dropDownOptions.first().click();
        }
        if(plan.status){
            await this.status.click();
            await this.dropDownOptions.filter({hasText:plan.status}).click()
        }
        if(plan.description){
            await this.description.fill(plan.description);
        }
        await this.savePlanButton.click();
    }
}
