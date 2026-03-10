import { Injectable, signal, computed, effect } from '@angular/core';
import { Profile, Category, Tag, Activity } from '../models/schema.models';
import { SupabaseService } from '../services/supabase.service';

@Injectable({
    providedIn: 'root'
})
export class TrackerStore {
    // Master state
    public profile = signal<Profile | null>(null);
    public categories = signal<Category[]>([]);
    public tags = signal<Tag[]>([]);
    public activities = signal<Activity[]>([]);

    // Filter signals
    // Date range picker values (start, end)
    public dateRange = signal<{ start: Date; end: Date } | null>(null);
    public searchQuery = signal<string>('');

    // Multi-select combinations
    public selectedCategories = signal<string[]>([]);
    public selectedTags = signal<string[]>([]);
    public filterHasImage = signal<boolean>(false);

    // Computeds
    public filteredActivities = computed(() => {
        let act = this.activities();

        // Date Range Filter
        const dr = this.dateRange();
        if (dr) {
            act = act.filter(a => {
                const d = new Date(a.date);
                return d >= dr.start && d <= dr.end;
            });
        }

        // Search Filter
        const sq = this.searchQuery().toLowerCase().trim();
        if (sq) {
            act = act.filter(a =>
                a.name.toLowerCase().includes(sq) ||
                (a.description && a.description.toLowerCase().includes(sq))
            );
        }

        // Category Filter
        const sc = this.selectedCategories();
        if (sc.length > 0) {
            act = act.filter(a => sc.includes(a.category_id));
        }

        // Tag Filter
        const st = this.selectedTags();
        if (st.length > 0) {
            act = act.filter(a => a.tag_id && st.includes(a.tag_id));
        }

        // Has Image Filter
        if (this.filterHasImage()) {
            act = act.filter(a => !!a.image_id);
        }

        return act;
    });

    constructor(private supabase: SupabaseService) {
        effect(() => {
            // Debug effect when filtered activities change
            console.log('Filtered activities recalculated:', this.filteredActivities().length);
        });
    }

    // --- Actions/Operations ---

    async loadInitialData() {
        // In a real app, retrieve user data here from Supabase
        const { data: { user } } = await this.supabase.client.auth.getUser();
        if (!user) return; // Note in a real app, handle unauthenticated differently

        // Load categories
        const { data: cats } = await this.supabase.client
            .from('categories')
            .select('*')
            .eq('user_id', user.id);
        if (cats) this.categories.set(cats);

        // Load tags
        const { data: tgs } = await this.supabase.client
            .from('tags')
            .select('*')
            .eq('user_id', user.id);
        if (tgs) this.tags.set(tgs);

        // Load activities
        const { data: acts } = await this.supabase.client
            .from('activities')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false });
        if (acts) this.activities.set(acts);
    }

    async addCategory(name: string): Promise<{ success: boolean; error?: string }> {
        const { data: { user } } = await this.supabase.client.auth.getUser();
        if (!user) return { success: false, error: 'Not authenticated' };

        const { data, error } = await this.supabase.client
            .from('categories')
            .insert({ user_id: user.id, name })
            .select()
            .single();

        if (data && !error) {
            this.categories.update(c => [...c, data]);
            return { success: true };
        }
        return { success: false, error: error?.message || 'Failed to add category' };
    }

    async updateCategory(id: string, name: string): Promise<{ success: boolean; error?: string }> {
        const { data, error } = await this.supabase.client
            .from('categories')
            .update({ name })
            .eq('id', id)
            .select()
            .single();

        if (data && !error) {
            this.categories.update(c => c.map(cat => cat.id === id ? data : cat));
            return { success: true };
        }
        return { success: false, error: error?.message || 'Failed to update category' };
    }
    async deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
        const { error } = await this.supabase.client
            .from('categories')
            .delete()
            .eq('id', id);

        if (!error) {
            this.categories.update(c => c.filter(cat => cat.id !== id));
            return { success: true };
        }
        return { success: false, error: error?.message || 'Failed to delete category' };
    }

    async addTag(name: string, category_id: string | null = null) {
        const { data: { user } } = await this.supabase.client.auth.getUser();
        if (!user) return;

        const { data, error } = await this.supabase.client
            .from('tags')
            .insert({ user_id: user.id, name, category_id })
            .select()
            .single();

        if (data && !error) {
            this.tags.update(t => [...t, data]);
        }
    }

    async updateTag(id: string, name: string, category_id: string | null = null): Promise<{ success: boolean; error?: string }> {
        const { data, error } = await this.supabase.client
            .from('tags')
            .update({ name, category_id })
            .eq('id', id)
            .select()
            .single();

        if (data && !error) {
            this.tags.update(t => t.map(tag => tag.id === id ? data : tag));
            return { success: true };
        }
        return { success: false, error: error?.message || 'Failed to update tag' };
    }
    async addActivity(payload: Omit<Activity, 'id' | 'user_id' | 'created_at'>) {
        const { data: { user } } = await this.supabase.client.auth.getUser();
        if (!user) return;

        const { data, error } = await this.supabase.client
            .from('activities')
            .insert({ user_id: user.id, ...payload })
            .select()
            .single();

        if (data && !error) {
            this.activities.update(a => [data, ...a]);
        }
    }

    // Set Filters
    setDateRange(start: Date, end: Date) {
        this.dateRange.set({ start, end });
    }

    setSearchQuery(q: string) {
        this.searchQuery.set(q);
    }

    toggleCategoryFilter(catId: string) {
        const current = this.selectedCategories();
        if (current.includes(catId)) {
            this.selectedCategories.set(current.filter(id => id !== catId));
        } else {
            this.selectedCategories.set([...current, catId]);
        }
    }

    toggleTagFilter(tagId: string) {
        const current = this.selectedTags();
        if (current.includes(tagId)) {
            this.selectedTags.set(current.filter(id => id !== tagId));
        } else {
            this.selectedTags.set([...current, tagId]);
        }
    }

    toggleHasImage() {
        this.filterHasImage.update(val => !val);
    }
}
