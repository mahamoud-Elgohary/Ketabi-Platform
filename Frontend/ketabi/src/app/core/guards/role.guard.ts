// guards/role.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const expectedRoles = route.data['roles'] as string[];
    const userRole = this.authService.getUserRole();

    if (!userRole) {
      this.router.navigate(['/auth/login']);
      return false;
    }
    if (expectedRoles?.length && !expectedRoles.includes(userRole)) {
      console.warn(`Access denied. User role '${userRole}' not in allowed roles:`, expectedRoles);
      this.authService.redirectToDashboard();
      return false;
    }
    return true;
  }
}
