import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { LoginComponent } from './features/auth/login/login.component';
import { SignupComponent } from './features/auth/signup/signup.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './features/auth/reset-password/reset-password.component';
import { VerifyAccountComponent } from './features/auth/verify-account/verify-account.component';
import { AuthCallbackComponent } from './features/auth/auth-callback/auth-callback.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'verify-account', component: VerifyAccountComponent },
  { path: 'auth/google/callback', component: AuthCallbackComponent, data: { provider: 'google' } },
  { path: 'auth/42/callback', component: AuthCallbackComponent, data: { provider: 'intra' } },
];
