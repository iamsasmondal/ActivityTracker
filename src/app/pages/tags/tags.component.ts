import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
  IonList, IonItem, IonLabel, IonButton, IonIcon, IonInput, IonCard, IonCardContent,
  IonSelect, IonSelectOption, IonBadge
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, folderOutline, pricetagOutline } from 'ionicons/icons';
import { TrackerStore } from '../../store/tracker.store';

@Component({
  selector: 'app-tags',
  templateUrl: './tags.component.html',
  styleUrls: ['./tags.component.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
    IonList, IonItem, IonLabel, IonButton, IonIcon, IonInput, IonCard, IonCardContent,
    IonSelect, IonSelectOption, IonBadge
  ]
})
export class TagsComponent {
  store = inject(TrackerStore);
  newTagName = '';
  selectedCategoryId: string | null = null;

  constructor() {
    addIcons({ addOutline, folderOutline, pricetagOutline });
  }

  async addTag() {
    if (!this.newTagName.trim()) return;
    await this.store.addTag(this.newTagName.trim(), this.selectedCategoryId);
    this.newTagName = '';
    this.selectedCategoryId = null;
  }

  getCategoryName(id: string | null) {
    if (!id) return 'Common (All Categories)';
    return this.store.categories().find(c => c.id === id)?.name || 'Unknown';
  }
}
