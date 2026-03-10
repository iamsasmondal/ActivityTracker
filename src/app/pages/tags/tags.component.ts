import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
  IonList, IonItem, IonLabel, IonButton, IonIcon, IonInput, IonCard, IonCardContent,
  IonSelect, IonSelectOption, IonBadge, IonModal, ToastController, AlertController,
  IonItemSliding, IonItemOptions, IonItemOption, IonNote
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, folderOutline, pricetagOutline, pencilOutline, trashOutline, informationCircleOutline } from 'ionicons/icons';
import { TrackerStore } from '../../store/tracker.store';
import { Tag } from '../../models/schema.models';

@Component({
  selector: 'app-tags',
  templateUrl: './tags.component.html',
  styleUrls: ['./tags.component.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
    IonList, IonItem, IonLabel, IonButton, IonIcon, IonInput, IonCard, IonCardContent,
    IonSelect, IonSelectOption, IonBadge, IonModal, IonItemSliding, IonItemOptions, IonItemOption, IonNote
  ]
})
export class TagsComponent {
  store = inject(TrackerStore);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);

  newTagName = '';
  selectedCategoryId: string | null = null;

  isEditModalOpen = false;
  editingTag: Tag | null = null;
  editTagName = '';
  editTagCategoryId: string | null = null;
  isCategoryDisabled = false;

  constructor() {
    addIcons({ addOutline, folderOutline, pricetagOutline, pencilOutline, trashOutline, informationCircleOutline });
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

  hasActivities(tagId: string): boolean {
    return this.store.activities().some(a => a.tag_id === tagId);
  }

  openEditModal(tag: Tag) {
    this.editingTag = tag;
    this.editTagName = tag.name;
    this.editTagCategoryId = tag.category_id;
    this.isCategoryDisabled = this.store.activities().some(a => a.tag_id === tag.id);
    this.isEditModalOpen = true;
  }

  closeEditModal() {
    this.isEditModalOpen = false;
    this.editingTag = null;
  }

  async saveEditTag() {
    if (!this.editingTag || !this.editTagName.trim()) return;
    const result = await this.store.updateTag(this.editingTag.id, this.editTagName.trim(), this.editTagCategoryId);

    if (result.success) {
      this.closeEditModal();
      this.showToast('Tag updated successfully', 'success');
    } else {
      this.showToast(result.error || 'Failed to update tag', 'danger');
    }
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

  async deleteTag(id: string) {
    const alert = await this.alertCtrl.create({
      header: 'Delete Tag',
      message: 'Are you sure you want to delete this tag? This action cannot be undone.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            const result = await this.store.deleteTag(id);
            if (result.success) {
              this.showToast('Tag deleted successfully', 'success');
            } else {
              this.showToast(result.error || 'Failed to delete tag', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }
}
