import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth/auth.service';
import { ErrorResponse } from '../../../shared/interfaces/ErrorResponse';
import { ToastService } from '../../../shared/services/toast/toast.service';

@Component({
  selector: 'app-verify-account',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './verify-account.component.html',
  styleUrl: './verify-account.component.css'
})
export class VerifyAccountComponent implements OnInit {
  form: FormGroup;
  isSubmitting: boolean = false;

  isResending: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService,
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

    this.isSubmitting = true;

    this.authService.verify(this.form.value).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.toastService.success('Account verified successfully. You can now log in.');
        this.router.navigate(['/login']);
      },
      error: (err: ErrorResponse) => {
        this.isSubmitting = false;
        this.toastService.error(err.message ?? 'Could not verify your account. Check your code and try again.');
      },
    });
  }

  onResendCode(): void {
    const email = this.form.controls['email'].value;
    if (this.form.controls['email'].invalid) {
      this.form.controls['email'].markAsTouched();
      return;
    }

    this.isResending = true;

    this.authService.resendVerification({ email }).subscribe({
      next: () => {
        this.isResending = false;
        this.toastService.success('A new code has been sent to your email.');
      },
      error: (err: ErrorResponse) => {
        this.isResending = false;
        this.toastService.error(err.message ?? 'Could not resend the code. Please try again.');
      },
    });
  }
}
