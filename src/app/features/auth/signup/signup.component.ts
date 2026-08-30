import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { ErrorResponse } from '../../../shared/interfaces/ErrorResponse';

@Component({
  selector: 'app-signup',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {
  form: FormGroup;
  errorMessage = '';
  isSubmitting: boolean = false;
  showPassword: boolean = false;

  readonly showPasswordLabel = $localize`:@@login.showPassword:Show password`;
  readonly hidePasswordLabel = $localize`:@@login.hidePassword:Hide password`;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.isSubmitting = true;

    this.authService.signup(this.form.value).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/verify-account'], { queryParams: { email: this.form.value.email } });
      },
      error: (err: ErrorResponse) => {
        console.error('Signup error:', err);
        this.isSubmitting = false;
        this.errorMessage = err.message ?? 'Could not create account.';
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
