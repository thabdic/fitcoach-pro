import {Page,Locator,expect} from '@playwright/test';

export interface MealPlanForm {
    title: string;
    calories: string;
    mealName: string;
    timeOfDay: string;
    foods: string;
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
        this.assignedTag = this.planCards.locator('[severity="success"]');
        this.newMealPlanButton = this.page.getByTestId('create-meal-plan');
        this.newMealPlanDialog = this.page.getByRole('dialog',{name:'New Meal Plan'});
        this.mealPlanTitle = this.page.locator('#mtitle');
        this.clientID = this.page.locator('#mclientId');
        this.caloriesTarget = this.page.locator('#caloriesTarget');
        this.status = this.page.locator('#mstatus');
        this.description = this.page.locator('#mdescription');
        this.mealName = this.page.getByPlaceholder('Meal name');
        this.timeOfDay = this.page.getByPlaceholder('Time of day');
        this.foods = this.page.getByPlaceholder('Foods (comma separated)');
        this.dropDownOptions = this.page.getByRole('option');
        this.savePlanButton = this.page.getByTestId('submit-meal-plan');
        this.cellTitles = this.planCards.locator('.cell-title');
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
        await this.caloriesTarget.clear();
        await this.caloriesTarget.fill(plan.calories);
        await this.mealName.fill(plan.mealName);
        await this.timeOfDay.fill(plan.timeOfDay);
        await this.foods.fill(plan.foods);
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
