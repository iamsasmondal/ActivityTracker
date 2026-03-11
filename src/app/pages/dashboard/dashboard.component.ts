import { Component, computed, inject } from '@angular/core';
import { Activity } from '../../models/schema.models';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
  IonGrid, IonRow, IonCol,
  IonSearchbar, IonButton, IonIcon, IonItem, IonLabel,
  IonList, IonAvatar, IonChip, IonBadge, IonFab, IonFabButton, ModalController, IonPopover, IonCheckbox, AlertController, IonItemSliding, IonItemOptions, IonItemOption
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { downloadOutline, imageOutline, documentTextOutline, searchOutline, pricetagOutline, pricetagsOutline, addOutline, calendarOutline, albumsOutline, pencilOutline, trashOutline } from 'ionicons/icons';
import { TrackerStore } from '../../store/tracker.store';
import { ActivityCreateModalComponent } from '../../components/activity-create-modal/activity-create-modal.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
    IonGrid, IonRow, IonCol,
    IonSearchbar, IonButton, IonIcon, IonItem, IonLabel,
    IonList, IonAvatar, IonChip, IonBadge,
    IonFab, IonFabButton, IonPopover, IonCheckbox, IonItemSliding, IonItemOptions, IonItemOption
  ]
})
export class DashboardComponent {
  store = inject(TrackerStore);
  modalCtrl = inject(ModalController);
  alertCtrl = inject(AlertController);

  dateRangeMode = 'year';
  customStartDate = new Date().toISOString().split('T')[0];
  customEndDate = new Date().toISOString().split('T')[0];


  constructor() {
    addIcons({ downloadOutline, imageOutline, documentTextOutline, searchOutline, pricetagOutline, pricetagsOutline, addOutline, calendarOutline, albumsOutline, pencilOutline, trashOutline });
    this.setDateRangePreset('year');
  }

  async openCreateModal(activity?: Activity) {
    const componentProps: any = {};
    if (activity) {
      componentProps.activityId = activity.id;
      componentProps.existingData = activity;
    }

    const modal = await this.modalCtrl.create({
      component: ActivityCreateModalComponent,
      componentProps,
      breakpoints: [0, 0.5, 0.8, 1],
      initialBreakpoint: 0.8
    });
    await modal.present();
    await modal.onWillDismiss();
    // Modal dismissal handles reactive array via signals
  }

  setDateRangePreset(mode: string) {
    this.dateRangeMode = mode;
    const now = new Date();
    let start = new Date();
    start.setHours(0, 0, 0, 0);

    if (mode === 'day') {
      // exactly today
    } else if (mode === 'week') {
      start.setDate(now.getDate() - 7);
    } else if (mode === 'thisMonth') {
      start.setDate(1);
    } else if (mode === 'year') {
      start.setMonth(0, 1);
    }

    if (mode !== 'custom') {
      this.store.setDateRange(start, now);
      // Reset custom inputs to today for next time
      this.customStartDate = start.toISOString().split('T')[0];
      this.customEndDate = now.toISOString().split('T')[0];
    } else {
      // Don't auto-apply for custom mode anymore, require Apply button
    }
  }

  onCustomDateChange() {
    if (!this.isDateRangeValid()) return;

    const start = new Date(this.customStartDate);
    const end = new Date(this.customEndDate);
    end.setHours(23, 59, 59, 999);
    this.store.setDateRange(start, end);
  }

  isDateRangeValid(): boolean {
    return this.customStartDate <= this.customEndDate;
  }


  async exportCsv() {
    const activities = this.store.filteredActivities();
    if (!activities.length) return;

    const headers = ['Name', 'Description', 'Date', 'Category ID', 'Tag ID', 'Has Image'];
    const rows = activities.map(a => [
      `"${a.name}"`,
      `"${a.description || ''}"`,
      a.date,
      a.category_id,
      a.tag_id || '',
      a.image_id ? 'Yes' : 'No'
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');

    try {
      const fileName = `activities_export_${new Date().getTime()}.csv`;
      await Filesystem.writeFile({
        path: fileName,
        data: csvContent,
        directory: Directory.Documents,
        encoding: Encoding.UTF8
      });
      alert(`Exported successfully to Documents/${fileName}`);
    } catch (e) {
      console.error('Export failed', e);
      alert('Export failed.');
    }
  }

  getCategoryName(id: string) {
    return this.store.categories().find(c => c.id === id)?.name || 'All Categories';
  }

  getTagName(id: string | undefined) {
    if (!id) return '';
    return this.store.tags().find(t => t.id === id)?.name || 'Common';
  }

  async deleteActivity(id: string) {
    const alert = await this.alertCtrl.create({
      header: 'Delete Activity',
      message: 'Are you sure you want to delete this activity? This action cannot be undone.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.store.deleteActivity(id);
          }
        }
      ]
    });
    await alert.present();
  }
}
