import { Page, Locator } from '@playwright/test';

export class RequestplanPage{

    private page:Page;
    readonly requestPlanSideBarButton:Locator;
    readonly requestAplanButton:Locator;
    readonly requestAplanDialog:Locator;
    readonly goalInputField:Locator;
    readonly messageField:Locator;
    readonly submitPlanButton:Locator;
    readonly successToast:Locator;
    readonly planRequestsTable:Locator;

    constructor(page:Page){
        this.page = page;
        this.requestPlanSideBarButton = this.page.getByTestId('sidebar-plan-requests');
        this.requestAplanButton = this.page.getByRole('button',{name:'Request a Plan'});
        this.requestAplanDialog = this.page.getByRole('dialog').locator('#goal');
        this.goalInputField = this.page.getByLabel('Goal');
        this.messageField = this.page.getByLabel('Message (optional)');
        this.submitPlanButton = this.page.getByTestId('submit-plan-request');
        this.successToast = this.page.locator('.p-toast-summary').filter({hasText:'Request sent'})
        this.planRequestsTable = this.page.getByTestId('plan-requests-table');
    }

    async completeRequestPlan(goal:string,message?:string){
        await this.goalInputField.fill(goal);
        if(message){
            await this.messageField.fill(message);
        }
        await this.submitPlanButton.click();
    }

    rowByGoal(goal:string):Locator{
        return this.planRequestsTable.getByRole('row',{name:goal});
    }


}