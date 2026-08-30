import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';

@Component({
  selector: 'app-verify-account',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './verify-account.component.html',
  styleUrl: './verify-account.component.css'
})
export class VerifyAccountComponent implements OnInit {
  form: FormGroup;
  errorMessage = '';
  isSubmitting: boolean = false;

  isResending: boolean = false;
  resendMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]],
      code: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    const email = this.route.snapshot.queryParamMap.get('email');
    if (email) {
      this.form.patchValue({ email });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage = '';
    this.isSubmitting = true;

    this.authService.verify(this.form.value).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err?.error?.message ?? 'Could not verify your account. Check your code and try again.';
      },
    });
  }

  onResendCode(): void {
    const email = this.form.controls['email'].value;
    if (this.form.controls['email'].invalid) {
      this.form.controls['email'].markAsTouched();
      return;
    }

    this.errorMessage = '';
    this.resendMessage = '';
    this.isResending = true;

    this.authService.resendVerification({ email }).subscribe({
      next: () => {
        this.isResending = false;
        this.resendMessage = 'A new code has been sent to your email.';
      },
      error: (err) => {
        this.isResending = false;
        this.errorMessage = err?.error?.message ?? 'Could not resend the code. Please try again.';
      },
    });
  }
}
