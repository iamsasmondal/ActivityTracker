import { Component, inject, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
    IonList, IonItem, IonLabel, IonInput, IonTextarea, IonSelect, IonSelectOption,
    IonIcon, ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, checkmarkOutline } from 'ionicons/icons';
import { TrackerStore } from '../../store/tracker.store';

@Component({
    selector: 'app-food-create-modal',
    templateUrl: './food-create-modal.component.html',
    standalone: true,
    imports: [
        CommonModule, ReactiveFormsModule,
        IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
        IonList, IonItem, IonLabel, IonInput, IonTextarea, IonSelect, IonSelectOption,
        IonIcon
    ]
})
export class FoodCreateModalComponent implements OnInit {
    store = inject(TrackerStore);
    modalCtrl = inject(ModalController);
    fb = inject(FormBuilder);

    @Input() foodId?: string;
    @Input() existingData?: any;

    foodForm!: FormGroup;
    todayDate: string;
    isSaving = false;

    categories = ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Other'];

    constructor() {
        addIcons({ closeOutline, checkmarkOutline });
        this.todayDate = new Date().toISOString().split('T')[0];
    }

    ngOnInit() {
        this.foodForm = this.fb.group({
            name: [this.existingData?.name || '', Validators.required],
            description: [this.existingData?.description || ''],
            date: [this.existingData?.date || this.todayDate, Validators.required],
            category: [this.existingData?.category || 'Breakfast', Validators.required]
        });
    }

    dismiss() {
        this.modalCtrl.dismiss();
    }

    async saveFood() {
        if (this.foodForm.invalid) return;
        this.isSaving = true;

        const rawForm = this.foodForm.value;
        const payload = {
            name: rawForm.name,
            description: rawForm.description,
            date: rawForm.date,
            category: rawForm.category
        };

        if (this.foodId) {
            await this.store.updateFood(this.foodId, payload);
        } else {
            await this.store.addFood(payload);
        }

        this.isSaving = false;
        this.modalCtrl.dismiss({ saved: true });
    }
}
