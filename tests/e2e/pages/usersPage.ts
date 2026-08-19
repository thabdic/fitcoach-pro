import { Page, Locator } from '@playwright/test';

export class UsersPage {
    private page:Page;
    readonly usersSideBarButton:Locator;
    readonly usersTable:Locator;
    readonly updateRoleDialog:Locator;
    readonly roleDropDown:Locator;
    readonly roleDropDownOptions:Locator;
    readonly saveRoleButton:Locator;
    readonly successToast: Locator;

    constructor(page:Page){
        this.page = page;
        this.usersSideBarButton = this.page.getByTestId('sidebar-users');
        this.usersTable = this.page.getByTestId('users-table');
        this.updateRoleDialog = this.page.getByRole('dialog',{name:'Update Role'});
        this.roleDropDown = this.page.locator('#role');
        this.roleDropDownOptions = this.page.getByRole('option');
        this.saveRoleButton = this.page.getByRole('button',{name:'Save role'});
        this.successToast = this.page.locator('.p-toast-summary');

    }

    rowByEmail(email:string):Locator{
        return this.usersTable.getByRole('row',{name:email});
    }

    getRole(email:string):Locator{
        return this.rowByEmail(email).locator('td').nth(2);
    }

    getStatus(email:string):Locator{
        return this.rowByEmail(email).locator('td').nth(3);
    }

    changeRoleButton(email:string):Locator{
        return this.rowByEmail(email).getByTestId('change-role');
    }

    toggleStatusButton(email:string):Locator{
        return this.rowByEmail(email).getByTestId('toggle-status');
    }

    roleOption(label:string):Locator{
        return this.page.getByRole('option',{name:label,exact:true});
    }

    async setRole(email:string,label:string):Promise<void>{
        await this.changeRoleButton(email).click();
        await this.updateRoleDialog.waitFor({state:'visible'});
        await this.roleDropDown.click();
        await this.roleOption(label).click();
        await this.saveRoleButton.click();
        await this.updateRoleDialog.waitFor({state:'hidden'});
    }
}
