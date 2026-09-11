import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { UserService } from '../../../core/services/user/user.service';
import { ErrorResponse } from '../../../shared/interfaces/ErrorResponse';
import { ToastService } from '../../../shared/services/toast/toast.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  form: FormGroup;
  isSubmitting = false;
  showPassword: boolean = false;

  readonly showPasswordLabel = $localize`:@@login.showPassword:Show password`;
  readonly hidePasswordLabel = $localize`:@@login.hidePassword:Hide password`;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private toastService: ToastService,
  ) {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    this.authService.login(this.form.value).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.userService.loadCurrentUser();
        this.toastService.success($localize`:@@toast.login.success:Logged in successfully.`);
        this.router.navigate(['/']);
      },
      error: (err: ErrorResponse) => {
        this.isSubmitting = false;
        this.toastService.error(err.message ?? $localize`:@@toast.login.error:Invalid username or password.`);
      },
    });
  }

  loginWithGoogle(): void {
    this.authService.loginWithGoogle();
  }

  loginWithIntra(): void {
    this.authService.loginWithIntra();
  }

  loginWithFacebook(): void {
    this.authService.loginWithFacebook();
  }

}
