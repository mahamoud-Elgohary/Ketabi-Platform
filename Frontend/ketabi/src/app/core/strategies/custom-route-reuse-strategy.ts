import { ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy } from '@angular/router';

/**
 * Custom route reuse strategy that prevents reuse of book details route
 * to ensure component reloads when navigating between different books
 */
export class CustomRouteReuseStrategy implements RouteReuseStrategy {
  private storedRoutes = new Map<string, DetachedRouteHandle>();

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    // Don't store any routes
    return false;
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {
    // Don't store any routes
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    // Don't reuse any routes
    return false;
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    return null;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    // Check if this is a book details route (path: ':id')
    const isBookDetailsRoute = future.routeConfig?.path === ':id' && curr.routeConfig?.path === ':id';
    
    if (isBookDetailsRoute) {
      const futureId = future.params['id'];
      const currId = curr.params['id'];
      
      // Don't reuse if the book ID changed - this forces component reload
      if (futureId && currId && futureId !== currId) {
        console.log(`Route reuse prevented: Book ID changed from ${currId} to ${futureId}`);
        return false;
      }
      
      // If IDs are the same, allow reuse
      if (futureId === currId) {
        return true;
      }
    }
    
    // Default behavior: reuse route if route configs match
    return future.routeConfig === curr.routeConfig;
  }
}

