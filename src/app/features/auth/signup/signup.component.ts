import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

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

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
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
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = typeof err?.error === 'string' && err.error
          ? err.error
          : 'Could not create account.';
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
