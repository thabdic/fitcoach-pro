import {Page,Locator} from '@playwright/test'

export class LoginPage{
    private page:Page;

    readonly emailInput: Locator;
    readonly passwordInput: Locator;  
    readonly submitButton: Locator;

    constructor(page:Page){
        this.page = page;
        this.emailInput = this.page.getByTestId('login-email');
        this.passwordInput = page.getByTestId('login-password').locator('input');
        this.submitButton  = page.getByTestId('login-submit');
    }

    async goTo(){
        await this.page.goto('/login');
    }

    async login(email:string,password:string){
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.submitButton.click();
    }

}
