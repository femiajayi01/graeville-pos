import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ClarityModule } from '@clr/angular';
import { AuthService } from '@core/auth/auth.service';
import { TerminalService } from '@core/services/terminal.service';
import { ToastService } from '@core/services/toast.service';
import { UserService } from '@core/services/user.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { errorMessage } from '@shared/utils/http-error.util';
import { I18NEXT_SERVICE, I18NextPipe } from 'angular-i18next';

const passwordsMatch = (group: AbstractControl): ValidationErrors | null =>
  group.get('newPassword')?.value === group.get('confirmPassword')?.value
    ? null
    : { mismatch: true };

/** Laravel: UserAccount/profile (+ updatePassword). Also lets the cashier name this till. */
@Component({
  selector: 'app-profile',
  imports: [ClarityModule, ReactiveFormsModule, I18NextPipe, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile.component.html',
})
export class ProfileComponent {
  readonly auth = inject(AuthService);
  readonly terminal = inject(TerminalService);
  private readonly users = inject(UserService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(I18NEXT_SERVICE);
  private readonly fb = inject(FormBuilder);

  readonly savingProfile = signal(false);
  readonly savingPassword = signal(false);
  readonly passwordError = signal<string | null>(null);

  readonly profile = this.fb.nonNullable.group({
    firstName: [this.auth.user()?.firstName ?? '', Validators.required],
    lastName: [this.auth.user()?.lastName ?? '', Validators.required],
  });

  readonly password = this.fb.nonNullable.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatch },
  );

  readonly terminalForm = this.fb.nonNullable.group({
    name: [this.terminal.id(), [Validators.required, Validators.maxLength(100)]],
  });

  saveProfile(): void {
    if (this.profile.invalid) return;
    const { firstName, lastName } = this.profile.getRawValue();
    this.savingProfile.set(true);
    this.users.updateProfile(firstName.trim(), lastName.trim()).subscribe({
      next: (user) => {
        this.auth.setUser(user);
        this.savingProfile.set(false);
        this.toast.success(this.i18n.t('profile.saved') as string);
      },
      error: (err) => {
        this.savingProfile.set(false);
        this.toast.error(errorMessage(err));
      },
    });
  }

  changePassword(): void {
    if (this.password.invalid) {
      this.password.markAllAsTouched();
      return;
    }
    const v = this.password.getRawValue();
    this.savingPassword.set(true);
    this.passwordError.set(null);
    this.users.changePassword(v.currentPassword, v.newPassword, v.confirmPassword).subscribe({
      next: (res) => {
        this.savingPassword.set(false);
        this.password.reset();
        this.toast.success(res.message);
      },
      error: (err) => {
        this.savingPassword.set(false);
        this.passwordError.set(errorMessage(err));
      },
    });
  }

  saveTerminal(): void {
    if (this.terminalForm.invalid) return;
    this.terminal.rename(this.terminalForm.getRawValue().name);
    this.toast.success(
      this.i18n.t('profile.terminalSaved', { name: this.terminal.id() }) as string,
    );
  }
}
