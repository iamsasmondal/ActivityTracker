import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
  IonList, IonItem, IonLabel, IonButton, IonIcon, IonInput, IonCard, IonCardContent,
  IonSpinner, IonItemSliding, IonItemOptions, IonItemOption,
  AlertController, ToastController, IonNote
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, restaurantOutline, trashOutline, pencilOutline, informationCircleOutline } from 'ionicons/icons';
import { TrackerStore } from '../../store/tracker.store';

@Component({
  selector: 'app-food-categories',
  templateUrl: './food-categories.component.html',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
    IonList, IonItem, IonLabel, IonButton, IonIcon, IonInput, IonCard, IonCardContent,
    IonSpinner, IonItemSliding, IonItemOptions, IonItemOption, IonNote
  ]
})
export class FoodCategoriesComponent {
  store = inject(TrackerStore);
  private alertCtrl = inject(AlertController);
  private toastCtrl = inject(ToastController);
  newCategoryName = '';
  isAdding = signal(false);

  constructor() {
    addIcons({ addOutline, restaurantOutline, trashOutline, pencilOutline, informationCircleOutline });
  }

  isInUse(categoryId: string): boolean {
    return this.store.foods().some(f => f.food_category_id === categoryId);
  }

  async addCategory() {
    if (!this.newCategoryName.trim()) return;
    this.isAdding.set(true);
    const result = await this.store.addFoodCategory(this.newCategoryName.trim());
    this.isAdding.set(false);
    if (result.success) {
      this.newCategoryName = '';
      this.showToast('Category added successfully', 'success');
    } else {
      this.showToast(result.error || 'Failed to add category', 'danger');
    }
  }

  async editCategory(id: string, currentName: string) {
    const alert = await this.alertCtrl.create({
      header: 'Edit Food Category',
      inputs: [
        {
          name: 'name',
          type: 'text',
          value: currentName,
          placeholder: 'Category Name'
        }
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Save',
          handler: async (data) => {
            const newName = data.name?.trim();
            if (newName && newName !== currentName) {
              const result = await this.store.updateFoodCategory(id, newName);
              if (result.success) {
                this.showToast('Category updated', 'success');
              } else {
                this.showToast(result.error || 'Failed to update', 'danger');
              }
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async deleteCategory(id: string) {
    const alert = await this.alertCtrl.create({
      header: 'Delete Food Category',
      message: 'Are you sure you want to delete this category? This action cannot be undone.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            const result = await this.store.deleteFoodCategory(id);
            if (result.success) {
              this.showToast('Category deleted successfully', 'success');
            } else {
              this.showToast(result.error || 'Failed to delete category', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  private async showToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    await toast.present();
  }
}
