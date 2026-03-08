import { Component, ElementRef, ViewChild, computed, effect, inject, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
  IonGrid, IonRow, IonCol, IonSelect, IonSelectOption, IonList, IonItem, IonLabel, IonIcon
} from '@ionic/angular/standalone';
import { TrackerStore } from '../../store/tracker.store';

Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
    IonGrid, IonRow, IonCol, IonSelect, IonSelectOption, IonList, IonItem, IonLabel, IonIcon
  ]
})
export class AnalyticsComponent implements AfterViewInit {
  store = inject(TrackerStore);

  selectedCategoryId = '';

  @ViewChild('pieCanvas') pieCanvas!: ElementRef<HTMLCanvasElement>;
  chart: Chart | null = null;

  chartData = computed(() => {
    // Only looking at globally filtered activities
    const act = this.store.filteredActivities();
    const catId = this.selectedCategoryId;

    if (!catId || act.length === 0) return { labels: [], data: [], stats: [], totalDays: 0 };

    const dr = this.store.dateRange();
    let totalDays = 30;
    if (dr) {
      const diffTime = Math.abs(dr.end.getTime() - dr.start.getTime());
      totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    const catActs = act.filter(a => a.category_id === catId);
    const tagCounts: Record<string, number> = {};
    let daysWithTags = 0;

    catActs.forEach(a => {
      if (a.tag_id) {
        tagCounts[a.tag_id] = (tagCounts[a.tag_id] || 0) + 1;
        daysWithTags++;
      }
    });

    const otherDays = Math.max(0, totalDays - daysWithTags);
    const labels = [];
    const data = [];
    const stats = [];

    for (const [tId, count] of Object.entries(tagCounts)) {
      const tagName = this.store.tags().find(t => t.id === tId)?.name || 'Unknown';
      labels.push(tagName);
      data.push(count);
      stats.push({ name: tagName, perc: Math.round((count / totalDays) * 100) });
    }

    if (otherDays > 0) {
      labels.push('Other Days');
      data.push(otherDays);
      stats.push({ name: 'Other Days', perc: Math.round((otherDays / totalDays) * 100) });
    }

    return { labels, data, stats, totalDays };
  });

  constructor() {
    effect(() => {
      const d = this.chartData();
      // Only update if chart exists and canvas is available
      if (this.chart) {
        this.updateChart(d.labels, d.data);
      } else if (d.labels.length > 0) {
        // Create dynamically if not exists but we have data
        setTimeout(() => this.createChart(), 100);
      }
    });
  }

  ngAfterViewInit() {
    // Intentionally left for component setup, chart initializes in effect
  }

  createChart() {
    if (this.chart) this.chart.destroy();

    const ctx = this.pieCanvas?.nativeElement;
    if (!ctx) return;

    const d = this.chartData();

    this.chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: d.labels,
        datasets: [{
          data: d.data,
          backgroundColor: ['#00a887', '#1ab193', '#007e65', '#42d77d', '#cccccc'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  updateChart(labels: string[], data: number[]) {
    if (this.chart) {
      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = data;
      this.chart.update();
    }
  }

  getCategoryName() {
    return this.store.categories().find(c => c.id === this.selectedCategoryId)?.name || 'Category';
  }
}
