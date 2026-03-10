import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

/**
 * Custom lock implementation that wraps navigator.locks with a retry/timeout
 * strategy to prevent NavigatorLockAcquireTimeoutError on page reload.
 */
function navigatorLockWithRetry<R>(
    name: string,
    acquireTimeout: number,
    fn: () => Promise<R>
): Promise<R> {
    if (typeof navigator === 'undefined' || !navigator.locks) {
        // Fallback: no locking available, just run the function
        return fn();
    }

    return new Promise<R>((resolve, reject) => {
        const tryAcquire = (retries: number) => {
            navigator.locks.request(
                name,
                { ifAvailable: true },
                async (lock) => {
                    if (lock) {
                        try {
                            resolve(await fn());
                        } catch (err) {
                            reject(err);
                        }
                        return;
                    }

                    // Lock not available — retry with a short delay
                    if (retries > 0) {
                        setTimeout(() => tryAcquire(retries - 1), 100);
                    } else {
                        // After retries exhausted, run without lock
                        try {
                            resolve(await fn());
                        } catch (err) {
                            reject(err);
                        }
                    }
                }
            );
        };

        tryAcquire(Math.max(1, Math.floor(acquireTimeout / 100)));
    });
}

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
                    detectSessionInUrl: false,
                    lock: navigatorLockWithRetry,
                }
            }
        );
    }
}
