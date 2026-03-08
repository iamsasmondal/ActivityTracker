import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SupabaseService {
    public client: SupabaseClient;

    constructor() {
        this.client = createClient(
            environment.supabase.url || 'https://mock.supabase.co',
            environment.supabase.key || 'mock-key',
            {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    // Note: NavigatorLockAcquireTimeoutError is a known warning during Angular HMR (live reload) 
                    // because the older tab instance holds the sync lock. It resolves itself and does not affect production builds.
                }
            }
        );
    }
}
