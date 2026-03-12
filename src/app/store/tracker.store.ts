import { Injectable, signal, computed, effect } from '@angular/core';
import { Profile, Category, Tag, Activity, Habit, Food } from '../models/schema.models';
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
    public habits = signal<Habit[]>([]);
    public foods = signal<Food[]>([]);

    private _dataLoaded = false;

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

        // Sort by date descending (latest first)
        act.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
        if (this._dataLoaded) return;  // Prevent re-fetching on every navigation

        const { data: { user } } = await this.supabase.client.auth.getUser();
        if (!user) return;

        this._dataLoaded = true;

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

        // Load habits (wrapped in try-catch — table may not exist yet if SQL hasn't been run)
        try {
            const { data: habs, error: habsError } = await this.supabase.client
                .from('habits')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
            if (habsError) {
                console.warn('Habits table not available yet:', habsError.message);
            } else if (habs) {
                this.habits.set(habs);
            }
        } catch (e) {
            console.warn('Failed to load habits:', e);
        }

        // Load foods
        try {
            const { data: fds, error: fdsError } = await this.supabase.client
                .from('foods')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: false });
            if (fdsError) {
                console.warn('Foods table not available yet:', fdsError.message);
            } else if (fds) {
                this.foods.set(fds);
            }
        } catch (e) {
            console.warn('Failed to load foods:', e);
        }
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

    async deleteTag(id: string): Promise<{ success: boolean; error?: string }> {
        const { error } = await this.supabase.client
            .from('tags')
            .delete()
            .eq('id', id);

        if (!error) {
            this.tags.update(t => t.filter(tag => tag.id !== id));
            return { success: true };
        }
        return { success: false, error: error?.message || 'Failed to delete tag' };
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

    async updateActivity(id: string, payload: Partial<Activity>) {
        const { data, error } = await this.supabase.client
            .from('activities')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (data && !error) {
            this.activities.update(acts => acts.map(a => a.id === id ? data : a));
            return { success: true };
        }
        return { success: false, error: error?.message || 'Failed to update activity' };
    }

    async deleteActivity(id: string) {
        const { error } = await this.supabase.client
            .from('activities')
            .delete()
            .eq('id', id);

        if (!error) {
            this.activities.update(acts => acts.filter(a => a.id !== id));
            return { success: true };
        }
        return { success: false, error: error?.message || 'Failed to delete activity' };
    }

    async addHabit(title: string, description: string = ''): Promise<{ success: boolean; error?: string }> {
        const { data: { user } } = await this.supabase.client.auth.getUser();
        if (!user) return { success: false, error: 'Not authenticated' };

        const { data, error } = await this.supabase.client
            .from('habits')
            .insert({ user_id: user.id, title, description })
            .select()
            .single();

        if (data && !error) {
            this.habits.update(h => [data, ...h]);
            return { success: true };
        }
        return { success: false, error: error?.message || 'Failed to add habit' };
    }

    async updateHabit(id: string, title: string, description: string = ''): Promise<{ success: boolean; error?: string }> {
        const { data, error } = await this.supabase.client
            .from('habits')
            .update({ title, description })
            .eq('id', id)
            .select()
            .single();

        if (data && !error) {
            this.habits.update(h => h.map(hab => hab.id === id ? data : hab));
            return { success: true };
        }
        return { success: false, error: error?.message || 'Failed to update habit' };
    }

    async deleteHabit(id: string): Promise<{ success: boolean; error?: string }> {
        const { error } = await this.supabase.client
            .from('habits')
            .delete()
            .eq('id', id);

        if (!error) {
            this.habits.update(h => h.filter(hab => hab.id !== id));
            return { success: true };
        }
        return { success: false, error: error?.message || 'Failed to delete habit' };
    }

    async addFood(payload: Omit<Food, 'id' | 'user_id' | 'created_at'>) {
        const { data: { user } } = await this.supabase.client.auth.getUser();
        if (!user) return;

        const { data, error } = await this.supabase.client
            .from('foods')
            .insert({ user_id: user.id, ...payload })
            .select()
            .single();

        if (data && !error) {
            this.foods.update(f => [data, ...f]);
        }
    }

    async updateFood(id: string, payload: Partial<Food>) {
        const { data, error } = await this.supabase.client
            .from('foods')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (data && !error) {
            this.foods.update(fds => fds.map(f => f.id === id ? data : f));
            return { success: true };
        }
        return { success: false, error: error?.message || 'Failed to update food' };
    }

    async deleteFood(id: string) {
        const { error } = await this.supabase.client
            .from('foods')
            .delete()
            .eq('id', id);

        if (!error) {
            this.foods.update(fds => fds.filter(f => f.id !== id));
            return { success: true };
        }
        return { success: false, error: error?.message || 'Failed to delete food' };
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
