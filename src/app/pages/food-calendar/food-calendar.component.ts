import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton, IonButton,
    IonList, IonItem, IonLabel, IonAvatar, IonBadge, IonFab, IonFabButton,
    ModalController, AlertController, IonItemSliding, IonItemOptions, IonItemOption, IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { restaurantOutline, addOutline, pencilOutline, trashOutline, fastFoodOutline } from 'ionicons/icons';
import { TrackerStore } from '../../store/tracker.store';
import { FoodCreateModalComponent } from '../../components/food-create-modal/food-create-modal.component';
import { Food } from '../../models/schema.models';

@Component({
    selector: 'app-food-calendar',
    templateUrl: './food-calendar.component.html',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
        IonList, IonItem, IonLabel, IonAvatar, IonBadge, IonFab, IonFabButton, IonButton,
        IonItemSliding, IonItemOptions, IonItemOption, IonIcon
    ]
})
export class FoodCalendarComponent {
    store = inject(TrackerStore);
    modalCtrl = inject(ModalController);
    alertCtrl = inject(AlertController);

    constructor() {
        addIcons({ restaurantOutline, addOutline, pencilOutline, trashOutline, fastFoodOutline });
    }

    async openCreateModal(food?: Food) {
        const componentProps: any = {};
        if (food) {
            componentProps.foodId = food.id;
            componentProps.existingData = food;
        }

        const modal = await this.modalCtrl.create({
            component: FoodCreateModalComponent,
            componentProps,
            breakpoints: [0, 0.5, 0.8, 1],
            initialBreakpoint: 0.8
        });
        await modal.present();
    }

    async deleteFood(id: string) {
        const alert = await this.alertCtrl.create({
            header: 'Delete Food Entry',
            message: 'Are you sure you want to delete this food entry?',
            buttons: [
                { text: 'Cancel', role: 'cancel' },
                {
                    text: 'Delete',
                    role: 'destructive',
                    handler: () => {
                        this.store.deleteFood(id);
                    }
                }
            ]
        });
        await alert.present();
    }

    getCategoryName(id: string) {
        return this.store.foodCategories().find(c => c.id === id)?.name || 'Unknown';
    }

    getIconForCategory(categoryId: string) {
        const categoryName = this.getCategoryName(categoryId).toLowerCase();
        if (categoryName.includes('breakfast') || categoryName.includes('lunch') || categoryName.includes('dinner')) {
            return 'restaurant-outline';
        }
        if (categoryName.includes('snack') || categoryName.includes('fast food')) {
            return 'fast-food-outline';
        }
        return 'restaurant-outline';
    }
}
