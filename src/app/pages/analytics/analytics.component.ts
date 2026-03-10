import { Component, ElementRef, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
  IonGrid, IonRow, IonCol, IonButton, IonIcon, IonItem, IonLabel, IonList,
  IonPopover, IonCheckbox, IonBadge, IonCard, IonCardContent, IonCardHeader, IonCardTitle
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { pieChartOutline, albumsOutline, checkmarkCircleOutline, calendarOutline } from 'ionicons/icons';
import { TrackerStore } from '../../store/tracker.store';

Chart.register(...registerables);

// Palette for slices
const PALETTE = [
  '#4fd1c5', '#63b3ed', '#f6ad55', '#fc8181', '#b794f4',
  '#68d391', '#f687b3', '#76e4f7', '#faf089', '#a0aec0'
];

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
    IonGrid, IonRow, IonCol, IonButton, IonIcon, IonItem, IonLabel, IonList,
    IonPopover, IonCheckbox, IonBadge, IonCard, IonCardContent, IonCardHeader, IonCardTitle
  ]
})
export class AnalyticsComponent {
  store = inject(TrackerStore);

  selectedCategoryId = signal('');

  // --- Local date range (independent from dashboard) ---
  dateRangeMode = 'thisMonth';
  customStartDate = new Date().toISOString().split('T')[0];
  customEndDate = new Date().toISOString().split('T')[0];
  dateRange = signal<{ start: Date; end: Date } | null>(null);

  @ViewChild('pieCanvas') pieCanvas!: ElementRef<HTMLCanvasElement>;
  chart: Chart | null = null;

  @ViewChild('categoryCanvas') categoryCanvas!: ElementRef<HTMLCanvasElement>;
  categoryChart: Chart | null = null;

  /** Computed breakdown: counts per tag + "No Tag" for the selected category */
  breakdown = computed(() => {
    const catId = this.selectedCategoryId();
    if (!catId) return { slices: [], total: 0 };

    // Filter all activities by category AND local date range
    let acts = this.store.activities().filter(a => a.category_id === catId);
    const dr = this.dateRange();
    if (dr) {
      acts = acts.filter(a => {
        const d = new Date(a.date);
        return d >= dr.start && d <= dr.end;
      });
    }
    const total = acts.length;
    if (total === 0) return { slices: [], total: 0 };

    // Tags that belong to this category + common tags (category_id = null)
    const categoryTags = this.store.tags().filter(t => t.category_id === catId);
    const commonTags = this.store.tags().filter(t => t.category_id === null);
    const allRelevantTags = [...categoryTags, ...commonTags];

    const slices: { label: string; count: number; perc: number; color: string }[] = [];

    allRelevantTags.forEach((tag, i) => {
      const count = acts.filter(a => a.tag_id === tag.id).length;
      if (count > 0) {
        slices.push({
          label: tag.name + (tag.category_id === null ? ' (Common)' : ''),
          count,
          perc: Math.round((count / total) * 100),
          color: PALETTE[i % PALETTE.length]
        });
      }
    });

    // "No Tag" slice — only activities with no tag_id at all
    const knownTagIds = new Set(allRelevantTags.map(t => t.id));
    const noTagCount = acts.filter(a => !a.tag_id || !knownTagIds.has(a.tag_id)).length;
    if (noTagCount > 0) {
      slices.push({
        label: 'No Tag',
        count: noTagCount,
        perc: Math.round((noTagCount / total) * 100),
        color: '#94a3b8'
      });
    }

    return { slices, total };
  });

  /** Computed category breakdown: counts per category */
  categoryBreakdown = computed(() => {
    // Filter all activities by local date range
    let acts = this.store.activities();
    const dr = this.dateRange();
    if (dr) {
      acts = acts.filter(a => {
        const d = new Date(a.date);
        return d >= dr.start && d <= dr.end;
      });
    }
    const total = acts.length;
    if (total === 0) return { slices: [], total: 0 };

    const slices: { label: string; count: number; perc: number; color: string }[] = [];

    this.store.categories().forEach((cat, i) => {
      const count = acts.filter(a => a.category_id === cat.id).length;
      if (count > 0) {
        slices.push({
          label: cat.name,
          count,
          perc: Math.round((count / total) * 100),
          color: PALETTE[i % PALETTE.length]
        });
      }
    });

    // "No Category"
    const catCount = acts.filter(a => !a.category_id).length;
    if (catCount > 0) {
      slices.push({
        label: 'No Category',
        count: catCount,
        perc: Math.round((catCount / total) * 100),
        color: '#94a3b8'
      });
    }

    return { slices, total };
  });

  constructor() {
    addIcons({ pieChartOutline, albumsOutline, checkmarkCircleOutline, calendarOutline });
    this.setDateRangePreset('thisMonth'); // default

    effect(() => {
      const d = this.breakdown();
      if (d.slices.length === 0) {
        this.chart?.destroy();
        this.chart = null;
      } else {
        // Delay to ensure canvas is in the DOM after @if resolves
        setTimeout(() => {
          if (this.chart) {
            this.updateChart(d);
          } else {
            this.createChart(d);
          }
        }, 50);
      }
    });

    effect(() => {
      const c = this.categoryBreakdown();
      if (c.slices.length === 0) {
        this.categoryChart?.destroy();
        this.categoryChart = null;
      } else {
        setTimeout(() => {
          if (this.categoryChart) {
            this.updateCategoryChart(c);
          } else {
            this.createCategoryChart(c);
          }
        }, 50);
      }
    });
  }

  onCategorySelect(id: string) {
    this.selectedCategoryId.set(id);
    this.chart?.destroy();
    this.chart = null;
  }

  setDateRangePreset(mode: string) {
    this.dateRangeMode = mode;
    const now = new Date();
    let start = new Date();
    start.setHours(0, 0, 0, 0);
    if (mode === 'week') {
      start.setDate(now.getDate() - 7);
    } else if (mode === 'thisMonth') {
      start.setDate(1);
    } else if (mode === 'year') {
      start.setMonth(0, 1);
    }
    if (mode !== 'custom') {
      this.dateRange.set({ start, end: now });
      this.customStartDate = start.toISOString().split('T')[0];
      this.customEndDate = now.toISOString().split('T')[0];
    }
  }

  applyCustomRange() {
    if (!this.isDateRangeValid()) return;
    const start = new Date(this.customStartDate);
    const end = new Date(this.customEndDate);
    end.setHours(23, 59, 59, 999);
    this.dateRange.set({ start, end });
  }

  isDateRangeValid(): boolean {
    return this.customStartDate <= this.customEndDate;
  }

  get dateLabel(): string {
    const m = this.dateRangeMode;
    if (m === 'custom') return 'Custom Range';
    if (m === 'day') return 'Today';
    if (m === 'week') return 'This Week';
    if (m === 'year') return 'This Year';
    return 'This Month';
  }

  getCategoryName() {
    return this.store.categories().find(c => c.id === this.selectedCategoryId())?.name || '';
  }

  createChart(d: ReturnType<typeof this.breakdown>) {
    const ctx = this.pieCanvas?.nativeElement;
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: d.slices.map(s => s.label),
        datasets: [{
          data: d.slices.map(s => s.count),
          backgroundColor: d.slices.map(s => s.color),
          borderColor: '#1e293b',
          borderWidth: 3,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#cbd5e1',
              padding: 16,
              font: { size: 13 }
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const val = ctx.parsed as number;
                const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0);
                const pct = Math.round((val / total) * 100);
                return ` ${val} activities (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }

  updateChart(d: ReturnType<typeof this.breakdown>) {
    if (!this.chart) return;
    this.chart.data.labels = d.slices.map(s => s.label);
    this.chart.data.datasets[0].data = d.slices.map(s => s.count);
    (this.chart.data.datasets[0] as any).backgroundColor = d.slices.map(s => s.color);
    this.chart.update();
  }

  createCategoryChart(c: ReturnType<typeof this.categoryBreakdown>) {
    const ctx = this.categoryCanvas?.nativeElement;
    if (!ctx) return;

    this.categoryChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: c.slices.map(s => s.label),
        datasets: [{
          data: c.slices.map(s => s.count),
          backgroundColor: c.slices.map(s => s.color),
          borderColor: '#1e293b',
          borderWidth: 3,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#cbd5e1',
              padding: 16,
              font: { size: 13 }
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const val = ctx.parsed as number;
                const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0);
                const pct = Math.round((val / total) * 100);
                return ` ${val} activities (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }

  updateCategoryChart(c: ReturnType<typeof this.categoryBreakdown>) {
    if (!this.categoryChart) return;
    this.categoryChart.data.labels = c.slices.map(s => s.label);
    this.categoryChart.data.datasets[0].data = c.slices.map(s => s.count);
    (this.categoryChart.data.datasets[0] as any).backgroundColor = c.slices.map(s => s.color);
    this.categoryChart.update();
  }
}
