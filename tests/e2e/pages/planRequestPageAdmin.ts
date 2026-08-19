import { Page, Locator } from '@playwright/test';

export class RequestplanPageAdmin{
    private page:Page;
    readonly allPlanRequestsSideBarButton:Locator;
    readonly allPlanRequestsTable:Locator;
    readonly manageRequestDialog:Locator;
    readonly assignTrainerDropDown:Locator;
    readonly updateStatusDropDown:Locator;
    readonly assignButton:Locator;
    readonly updateButton:Locator;
    readonly listOptions:Locator;
    readonly successToastSummary:Locator;
    readonly successToastDetail:Locator;
    readonly allPlanRequestsTableBody:Locator;

    constructor(page:Page){
        this.page = page;
        this.allPlanRequestsSideBarButton = this.page.getByTestId('sidebar-plan-requests');
        this.allPlanRequestsTable = this.page.getByTestId('plan-requests-table');
        this.manageRequestDialog = this.page.getByRole('dialog',{name:'Manage Request'});
        this.assignTrainerDropDown = this.page.locator('#trainerId');
        this.assignButton = this.page.getByTestId('assign-trainer');
        this.updateStatusDropDown = this.page.locator('#status');
        this.updateButton = this.page.getByTestId('update-status');
        this.listOptions = this.page.getByRole('option');
        this.successToastSummary = this.page.locator('.p-toast-summary');
        this.successToastDetail = this.page.locator('.p-toast-detail');
        this.allPlanRequestsTableBody = this.page.getByTestId('plan-requests-table').locator('[data-pc-section="tbody"] tr');
    }

    getRowByStatus(status:string):Locator{
        return this.allPlanRequestsTable.getByRole('row',{name:status});
    }

    getRowByGoal(goal:string):Locator{
        return this.allPlanRequestsTable.getByRole('row',{name:goal});
    }

    getManageButton(status:string):Locator{
        return this.getRowByStatus(status).first().getByRole('button',{name:'Manage'});
    }
    getManageButtonByGoal(goal:string):Locator{
        return this.getRowByGoal(goal).getByRole('button',{name:'Manage'});
    }
    goalOf(row:Locator):Promise<string>{
        return row.locator('.cell-title').innerText();
    }

    trainerOption(label:string):Locator{
        return this.page.getByRole('option',{name:label});
    }

    statusOption(label:string):Locator{
        return this.page.getByRole('option',{name:label,exact:true});
    }
}
