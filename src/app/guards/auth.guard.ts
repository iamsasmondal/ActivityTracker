import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

export const authGuard: CanActivateFn = async (route, state) => {
    const supabase = inject(SupabaseService);
    const router = inject(Router);

    // Use getSession for immediate sync checking
    const { data: { session } } = await supabase.client.auth.getSession();

    if (session) {
        return true; // Authenticated
    } else {
        // Navigate to the login page
        return router.createUrlTree(['/login']);
    }
};
