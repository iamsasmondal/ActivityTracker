import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'signup',
    loadComponent: () => import('./pages/signup/signup.component').then(m => m.SignupComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'analytics',
    loadComponent: () => import('./pages/analytics/analytics.component').then(m => m.AnalyticsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'categories',
    loadComponent: () => import('./pages/categories/categories.component').then(m => m.CategoriesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'tags',
    loadComponent: () => import('./pages/tags/tags.component').then(m => m.TagsComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
