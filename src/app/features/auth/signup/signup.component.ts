import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { ErrorResponse } from '../../../shared/interfaces/ErrorResponse';
import { ToastService } from '../../../shared/services/toast/toast.service';

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {
  form: FormGroup;
  isSubmitting: boolean = false;
  showPassword: boolean = false;

  readonly showPasswordLabel = $localize`:@@login.showPassword:Show password`;
  readonly hidePasswordLabel = $localize`:@@login.hidePassword:Hide password`;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService,
  ) {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/)]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    this.authService.signup(this.form.value).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.toastService.success($localize`:@@toast.signup.success:Account created successfully. Please verify your email before logging in.`);
        this.router.navigate(['/verify-account'], { queryParams: { email: this.form.value.email } });
      },
      error: (err: ErrorResponse) => {
        this.isSubmitting = false;
        this.toastService.error(err.message ?? $localize`:@@toast.signup.error:Could not create account.`);
      },
    });
  }

  signupWithGoogle(): void {
    this.authService.loginWithGoogle();
  }

  signupWithIntra(): void {
    this.authService.loginWithIntra();
  }
}
