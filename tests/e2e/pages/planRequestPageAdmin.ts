import { Page, Locator } from '@playwright/test';

/**
 * Admin/trainer view of /plan-requests (the client-facing "Request a Plan" flow
 * lives in planRequestPage.ts). Manage dialog markup: plan-requests.html:64-90.
 */
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
        // The testid sits on <p-table>, NOT on the component root. locator('app-plan-requests')
        // is already visible while the loading spinner is up, so it never gates on rows.
        this.allPlanRequestsTable = this.page.getByTestId('plan-requests-table');
        this.manageRequestDialog = this.page.getByRole('dialog',{name:'Manage Request'});
        this.assignTrainerDropDown = this.page.locator('#trainerId');
        this.assignButton = this.page.getByTestId('assign-trainer');
        // Kept for a future status-transition test — ADM-05 does NOT touch these:
        // assigning already moves pending -> assigned server-side
        // (plan-request.controller.ts:92-94).
        this.updateStatusDropDown = this.page.locator('#status');
        this.updateButton = this.page.getByTestId('update-status');
        this.listOptions = this.page.getByRole('option');
        // Both dialog actions share summary 'Updated' — only the DETAIL tells
        // 'Trainer assigned.' apart from 'Status updated.' (plan-requests.ts:194-198).
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

    // .first() on purpose: getRowByStatus is a substring match on the row's
    // accessible name, so a second row of the same status would otherwise make
    // this a strict-mode violation.
    //
    // Prefer getManageButtonByGoal when a SPECIFIC request is the target: the
    // list is sorted createdAt desc (plan-request.controller.ts:29), so which row
    // .first() lands on depends on what other specs have already created or
    // assigned in this run.
    getManageButton(status:string):Locator{
        return this.getRowByStatus(status).first().getByRole('button',{name:'Manage'});
    }

    // Goals are unique per seeded request, so this is stable no matter what else
    // ran first. The Manage button carries no testid (plan-requests.html:33).
    getManageButtonByGoal(goal:string):Locator{
        return this.getRowByGoal(goal).getByRole('button',{name:'Manage'});
    }

    // The goal cell renders the optional message as a second line, so read the
    // .cell-title div rather than the whole <td> (plan-requests.html:25-28).
    goalOf(row:Locator):Promise<string>{
        return row.locator('.cell-title').innerText();
    }

    // Trainer option labels are `${name} (${email})` (plan-requests.ts:103), so
    // pass an email and let the default substring match do the work — do NOT use
    // exact:true here. Never pick by index: if an admin test leaks a role change,
    // a non-trainer can land first in the list and the backend 400s with
    // 'trainerId must reference a user with the trainer role'.
    trainerOption(label:string):Locator{
        return this.page.getByRole('option',{name:label});
    }

    // Status labels are the enum with underscores swapped for spaces
    // ('in_progress' -> 'in progress'). exact:true so 'assigned' can't also
    // match a longer label or the overlay's mirrored selection.
    statusOption(label:string):Locator{
        return this.page.getByRole('option',{name:label,exact:true});
    }
}
