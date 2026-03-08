import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
  IonList, IonItem, IonLabel, IonButton, IonIcon, IonInput, IonCard, IonCardContent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, folderOutline, pricetagOutline } from 'ionicons/icons';
import { TrackerStore } from '../../store/tracker.store';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
    IonList, IonItem, IonLabel, IonButton, IonIcon, IonInput, IonCard, IonCardContent
  ]
})
export class CategoriesComponent {
  store = inject(TrackerStore);
  newCategoryName = '';

  constructor() {
    addIcons({ addOutline, folderOutline, pricetagOutline });
  }

  async addCategory() {
    if (!this.newCategoryName.trim()) return;
    await this.store.addCategory(this.newCategoryName.trim());
    this.newCategoryName = '';
  }
}
