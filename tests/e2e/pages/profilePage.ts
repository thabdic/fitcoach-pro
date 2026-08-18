import { Page, Locator } from '@playwright/test';

export class ProfilePage {
    private page: Page;
    readonly profileSideBarButton: Locator;
    readonly ageInput: Locator;
    readonly genderDropDown: Locator;
    readonly heightInput: Locator;
    readonly weightInput: Locator;
    readonly goalDropDown: Locator;
    readonly activityLevelDropdown: Locator;
    readonly injuriesInput: Locator;
    readonly dietaryPreferencyInput: Locator;
    readonly notesInput: Locator;
    readonly submitButton: Locator;
    readonly successToast: Locator;

    constructor(page: Page) {
        this.page = page;
        this.profileSideBarButton = this.page.getByTestId('sidebar-profile');
        this.ageInput = this.page.locator('#age');
        this.genderDropDown = this.page.locator('#gender');
        this.goalDropDown = this.page.locator('#goal');
        this.activityLevelDropdown = this.page.locator('#activityLevel');
        this.injuriesInput = this.page.locator('#injuries');
        this.dietaryPreferencyInput = this.page.locator('#dietaryPreference');
        this.heightInput = this.page.locator('#heightCm');
        this.weightInput = this.page.locator('#weightKg');
        this.notesInput = this.page.locator('#notes');
        this.submitButton = this.page.getByTestId('profile-submit');
        this.successToast = this.page.locator('.p-toast-summary').filter({ hasText: 'Profile saved' });
    }

    private async choose(dropdown: Locator, optionLabel: string) {
        await dropdown.click();
        await this.page.getByRole('option', { name: optionLabel, exact: true }).click();
    }

    async updateProfile(age: string, gender: string, height: string, weight: string, goal: string, activityLevel: string, injuries?: string, diet?: string, notes?: string) {
        await this.ageInput.fill(age);
        await this.choose(this.genderDropDown, gender);
        await this.heightInput.fill(height);
        await this.weightInput.fill(weight);
        await this.choose(this.goalDropDown, goal);
        await this.choose(this.activityLevelDropdown, activityLevel);
        if (injuries) {
            await this.injuriesInput.fill(injuries);
        }
        if (diet) {
            await this.dietaryPreferencyInput.fill(diet);
        }
        if (notes) {
            await this.notesInput.fill(notes);
        }
        await this.submitButton.click();
    }
}
