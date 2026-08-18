import { Page,Locator } from '@playwright/test';


export class ProgressPage {
    private page:Page
    readonly myProgressSideBarButton:Locator;
    readonly myProgressTablerows:Locator;
    readonly pageTitle:Locator;
    readonly logProgressButton:Locator;
    readonly logProgressDialog:Locator;
    readonly weightInput:Locator;
    readonly energyInput:Locator;
    readonly moodInput:Locator;
    readonly notesInput:Locator;
    readonly saveButton:Locator;
    readonly successToast:Locator;
    readonly progressTable:Locator;

    constructor(page:Page){
        this.page = page;
        this.myProgressSideBarButton = this.page.getByTestId('sidebar-progress');
        this.myProgressTablerows = this.page.locator('[data-pc-section="tbody"] tr');
        // 'My Progress' for a client, 'Client Progress' for a trainer/admin
        // (progress.html:3) — the cheapest role assertion on this page.
        this.pageTitle = this.page.getByRole('heading',{level:1});
        // By testid rather than by label, so the same locator can prove the button
        // is ABSENT for a trainer: it renders only under @if (isClient())
        // (progress.html:5), and the backend 403s a non-client POST /api/progress.
        this.logProgressButton = this.page.getByTestId('create-progress-update');
        this.logProgressDialog = this.page.getByRole('dialog',{name:'Log Progress'})
        this.weightInput = this.page.locator('#weightKg');
        this.energyInput = this.page.locator('#energyLevel')
        this.moodInput = this.page.locator('#mood');
        this.notesInput = this.page.locator('#pnotes');
        this.saveButton = this.page.getByRole('button',{name:'Save'});
        this.successToast = this.page.locator('.p-toast-detail').filter({hasText:'Progress update saved'})
        this.progressTable = this.page.getByTestId('progress-table');
    }

    rowByNotes(notes:string):Locator{
        return this.progressTable.getByRole('row',{name:notes});
    }

    async updateAndSubmitProgress(weight:string,energy:string,mood:string,notes:string){
       await this.weightInput.fill(weight);
       await this.energyInput.fill(energy);
       await this.moodInput.fill(mood);
       await this.notesInput.fill(notes);
       await this.saveButton.click();
    }
}