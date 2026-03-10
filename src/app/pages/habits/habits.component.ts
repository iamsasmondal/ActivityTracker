import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
    IonList, IonItem, IonLabel, IonButton, IonIcon, IonInput, IonTextarea, IonCard, IonCardContent,
    IonSpinner, IonItemSliding, IonItemOptions, IonItemOption,
    AlertController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addOutline, refreshOutline, trashOutline, pencilOutline } from 'ionicons/icons';
import { TrackerStore } from '../../store/tracker.store';

@Component({
    selector: 'app-habits',
    templateUrl: './habits.component.html',
    styleUrls: ['./habits.component.scss'],
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
        IonList, IonItem, IonLabel, IonButton, IonIcon, IonInput, IonTextarea, IonCard, IonCardContent,
        IonSpinner, IonItemSliding, IonItemOptions, IonItemOption
    ]
})
export class HabitsComponent {
    store = inject(TrackerStore);
    private alertCtrl = inject(AlertController);
    private toastCtrl = inject(ToastController);

    newHabitTitle = '';
    newHabitDescription = '';
    isAdding = signal(false);

    constructor() {
        addIcons({ addOutline, refreshOutline, trashOutline, pencilOutline });
    }

    async addHabit() {
        if (!this.newHabitTitle.trim()) return;
        this.isAdding.set(true);
        const result = await this.store.addHabit(this.newHabitTitle.trim(), this.newHabitDescription.trim());
        this.isAdding.set(false);

        if (result.success) {
            this.newHabitTitle = '';
            this.newHabitDescription = '';
            this.showToast('Habit added successfully', 'success');
        } else {
            this.showToast(result.error || 'Failed to add habit', 'danger');
        }
    }

    async editHabit(id: string, currentTitle: string, currentDescription: string = '') {
        const alert = await this.alertCtrl.create({
            header: 'Edit Habit',
            cssClass: 'habit-edit-alert',
            inputs: [
                {
                    name: 'title',
                    type: 'text',
                    value: currentTitle,
                    placeholder: 'Habit Title'
                },
                {
                    name: 'description',
                    type: 'textarea',
                    value: currentDescription,
                    placeholder: 'Habit Description'
                }
            ],
            buttons: [
                { text: 'Cancel', role: 'cancel' },
                {
                    text: 'Save',
                    handler: async (data) => {
                        const newTitle = data.title?.trim();
                        const newDescription = data.description?.trim() || '';
                        if (newTitle && (newTitle !== currentTitle || newDescription !== currentDescription)) {
                            const result = await this.store.updateHabit(id, newTitle, newDescription);
                            if (result.success) {
                                this.showToast('Habit updated', 'success');
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

    async deleteHabit(id: string) {
        const alert = await this.alertCtrl.create({
            header: 'Delete Habit',
            message: 'Are you sure you want to delete this habit? This action cannot be undone.',
            buttons: [
                { text: 'Cancel', role: 'cancel' },
                {
                    text: 'Delete',
                    role: 'destructive',
                    handler: async () => {
                        const result = await this.store.deleteHabit(id);
                        if (result.success) {
                            this.showToast('Habit deleted successfully', 'success');
                        } else {
                            this.showToast(result.error || 'Failed to delete habit', 'danger');
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
