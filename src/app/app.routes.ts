import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { LoginComponent } from './features/auth/login/login.component';
import { SignupComponent } from './features/auth/signup/signup.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './features/auth/reset-password/reset-password.component';
import { VerifyAccountComponent } from './features/auth/verify-account/verify-account.component';
import { AuthCallbackComponent } from './features/auth/auth-callback/auth-callback.component';
import { ProfileComponent } from './features/profile/profile.component';
import { UsersComponent } from './features/users/users.component';
import { MoviesComponent } from './features/movies/movies.component';
import { MovieDetailsComponent } from './features/movie-details/movie-details.component';
import { SearchComponent } from './features/search/search.component';
import { MyListComponent } from './features/my-list/my-list.component';
import { NotFoundComponent } from './shared/components/not-found/not-found.component';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'movies/:category', component: MoviesComponent, canActivate: [authGuard] },
  { path: 'movie/:id', component: MovieDetailsComponent, canActivate: [authGuard] },
  { path: 'search', component: SearchComponent, canActivate: [authGuard]},
  { path: 'my-list', component: MyListComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'users/:id', component: UsersComponent, canActivate: [authGuard] },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'signup', component: SignupComponent, canActivate: [guestGuard] },
  { path: 'forgot-password', component: ForgotPasswordComponent, canActivate: [guestGuard] },
  { path: 'reset-password', component: ResetPasswordComponent, canActivate: [guestGuard] },
  { path: 'verify-account', component: VerifyAccountComponent, canActivate: [guestGuard] },
  { path: 'auth/facebook/callback', component: AuthCallbackComponent, data: { provider: 'facebook' } },
  { path: 'auth/google/callback', component: AuthCallbackComponent, data: { provider: 'google' } },
  { path: 'auth/42/callback', component: AuthCallbackComponent, data: { provider: '42' } },
  { path: '**', component: NotFoundComponent },
];
