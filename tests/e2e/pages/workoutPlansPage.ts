import { Page, Locator, expect } from "@playwright/test";

/**
 * Fields of the New/Edit Workout Plan dialog (workout-plans.html:45-101).
 * An object rather than positional args: the form has ten fields, most optional,
 * and `addNewWorkoutPlan(t, d, e, s, r, rest, '', '', '', desc)` at the call site
 * says nothing about which blank is which.
 */
export interface WorkoutPlanForm {
    title: string;
    difficulty: string;
    exerciseName: string;
    sets: string;
    reps: string;
    rest: string;
    daysPerWeek?: string;
    /** Substring of a client option label — omit to take the first option. */
    client?: string;
    status?: string;
    description?: string;
}

export class WorkoutPlans {
    private page:Page
    readonly workoutPlansSideBarButton:Locator;
    readonly planCards: Locator;
    readonly assignedTag:Locator;
    readonly cellTitles:Locator;
    readonly editWorkoutPlansDialog:Locator;
    readonly newPlanButton:Locator;
    readonly newWorkoutPlanDialog:Locator;
    readonly titleField:Locator;
    readonly clientDropDown:Locator;
    readonly difficultyDropDown:Locator;
    readonly daysPerWeekInput:Locator;
    readonly statusDropDown:Locator;
    readonly descriptionInput:Locator;
    readonly exercisesInput:Locator;
    readonly setsInput:Locator;
    readonly repsInput:Locator;
    readonly restInput:Locator;
    readonly addExerciseButton:Locator;
    readonly dropDownOptions:Locator;
    readonly savePlanButton:Locator;
    readonly successToastDetail:Locator;


    constructor(page:Page){
        this.page = page;
        this.workoutPlansSideBarButton = this.page.getByTestId('sidebar-workout-plans');
        this.planCards = this.page.getByTestId('workout-plan-card');
        // CAVEAT: the status p-tag hardcodes severity="success" for every status
        // (workout-plans.html:19), so this means "a card exists", NOT "a card is
        // assigned". Clients only ever receive assigned plans (the backend filters
        // drafts out), which is what makes it a usable proxy in CLI-04.
        this.assignedTag = this.planCards.locator('[severity="success"]');
        this.cellTitles = this.planCards.locator('.cell-title');
        this.editWorkoutPlansDialog = this.page.getByRole('dialog',{name:'Edit Workout Plan'});
        // By testid, not by the 'New Plan' label: the meal-plans page uses the
        // SAME label (meal-plans.html:5), so a page-wide role locator resolves on
        // the wrong page instead of failing.
        this.newPlanButton = this.page.getByTestId('create-workout-plan');
        this.newWorkoutPlanDialog = this.page.getByRole('dialog',{name:'New Workout Plan'});
        this.titleField = this.page.locator('#title');
        this.clientDropDown = this.page.locator('#clientId');
        this.difficultyDropDown = this.page.locator('#difficulty');
        this.daysPerWeekInput = this.page.locator('#daysPerWeek');
        this.statusDropDown = this.page.locator('#status');
        this.descriptionInput = this.page.locator('#description');
        // Exercise-row inputs carry no ids, only placeholders (workout-plans.html:87-90).
        this.exercisesInput = this.page.getByPlaceholder('Exercise name');
        this.setsInput = this.page.getByPlaceholder('Sets');
        this.repsInput = this.page.getByPlaceholder('Reps');
        this.restInput = this.page.getByPlaceholder('Rest (s)');
        this.addExerciseButton = this.page.getByRole('button',{name:'Add exercise'})
        this.dropDownOptions = this.page.getByRole('option');
        this.savePlanButton = this.page.getByTestId('submit-workout-plan');
        // Create and update share summary 'Saved' — only the detail tells
        // 'Plan created.' from 'Plan updated.' (workout-plans.ts:205,216,234).
        this.successToastDetail = this.page.locator('.p-toast-detail');
    }

    cardByTitle(title:string):Locator{
        return this.planCards.filter({hasText:title});
    }

    async verifyPlanTitle(title:string){
        await expect(this.cellTitles.filter({hasText:title})).toBeVisible();
    }

    // Scoped to the CARD, not to its status tag: Edit lives in .row-actions
    // further down the card (workout-plans.html:33), so it is a sibling of the
    // tag, never a descendant.
    editButton(title:string):Locator{
        return this.cardByTitle(title).getByRole('button',{name:'Edit'});
    }

    async addNewWorkoutPlan(plan:WorkoutPlanForm){
        await this.titleField.fill(plan.title);
        // Client options are DERIVED labels — `<goal> · #<last6 of clientId>`, no
        // real names (workout-plans.ts:100-110). Taking the first option is
        // legitimate for a trainer: every option comes from their own plan
        // requests, which is exactly the link the backend requires.
        await this.clientDropDown.click();
        if(plan.client){
            await this.dropDownOptions.filter({hasText:plan.client}).click();
        }else{
            await this.dropDownOptions.first().click();
        }
        // Required and defaults to null, so an unpicked difficulty leaves the form
        // invalid and submit() returns silently.
        await this.difficultyDropDown.click();
        await this.dropDownOptions.filter({hasText:plan.difficulty}).click();
        if(plan.daysPerWeek){
            await this.daysPerWeekInput.clear();
            await this.daysPerWeekInput.fill(plan.daysPerWeek);
        }
        if(plan.status){
            await this.statusDropDown.click();
            await this.dropDownOptions.filter({hasText:plan.status}).click();
        }
        if(plan.description){
            await this.descriptionInput.fill(plan.description);
        }
        // openCreate() pre-pushes one empty exercise row; rows left blank are
        // dropped on submit.
        await this.exercisesInput.fill(plan.exerciseName);
        await this.setsInput.fill(plan.sets);
        await this.repsInput.fill(plan.reps);
        await this.restInput.fill(plan.rest);
        await this.savePlanButton.click();
    }

}
