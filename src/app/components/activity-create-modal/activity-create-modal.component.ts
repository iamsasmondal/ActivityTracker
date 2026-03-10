import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
    IonList, IonItem, IonLabel, IonInput, IonTextarea, IonSelect, IonSelectOption,
    IonModal, IonIcon, ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, cameraOutline, checkmarkOutline } from 'ionicons/icons';
import { TrackerStore } from '../../store/tracker.store';
import { ImageKitService } from '../../services/imagekit.service';

@Component({
    selector: 'app-activity-create-modal',
    templateUrl: './activity-create-modal.component.html',
    standalone: true,
    imports: [
        CommonModule, ReactiveFormsModule,
        IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
        IonList, IonItem, IonLabel, IonInput, IonTextarea, IonSelect, IonSelectOption,
        IonModal, IonIcon
    ]
})
export class ActivityCreateModalComponent implements OnInit {
    store = inject(TrackerStore);
    ikService = inject(ImageKitService);
    modalCtrl = inject(ModalController);
    fb = inject(FormBuilder);

    activityForm!: FormGroup;
    todayDate: string;

    photoBase64: string | null = null;
    isUploading = false;

    constructor() {
        addIcons({ closeOutline, cameraOutline, checkmarkOutline });
        this.todayDate = new Date().toISOString();
    }

    ngOnInit() {
        this.activityForm = this.fb.group({
            name: ['', Validators.required],
            description: [''],
            date: [this.todayDate, Validators.required],
            category_id: ['', Validators.required],
            tag_id: ['']
        });

        // Reset tag if category changes and tag is no longer valid
        this.activityForm.get('category_id')?.valueChanges.subscribe(() => {
            const currentTagId = this.activityForm.get('tag_id')?.value;
            if (currentTagId) {
                const isValid = this.availableTags.some(t => t.id === currentTagId);
                if (!isValid) {
                    this.activityForm.get('tag_id')?.setValue('');
                }
            }
        });
    }

    dismiss() {
        this.modalCtrl.dismiss();
    }

    async takePhoto() {
        try {
            const image = await Camera.getPhoto({
                quality: 90,
                allowEditing: false,
                resultType: CameraResultType.Base64,
                source: CameraSource.Prompt
            });
            if (image.base64String) {
                this.photoBase64 = image.base64String;
            }
        } catch (e) {
            console.log('Camera cancelled or failed', e);
        }
    }

    async saveActivity() {
        if (this.activityForm.invalid) return;
        this.isUploading = true;

        let image_id = undefined;
        if (this.photoBase64) {
            try {
                image_id = await this.ikService.uploadBase64(
                    this.photoBase64,
                    `activity_${Date.now()}.jpg`
                );
            } catch (e) {
                console.warn('Upload fallback applied');
            }
        }

        const rawForm = this.activityForm.value;
        const dateOnly = Array.isArray(rawForm.date) ? rawForm.date[0].split('T')[0] : rawForm.date.split('T')[0];

        const payload = {
            name: rawForm.name,
            description: rawForm.description,
            date: dateOnly,
            category_id: rawForm.category_id,
            tag_id: rawForm.tag_id || undefined,
            image_id
        };

        await this.store.addActivity(payload);

        this.isUploading = false;
        this.modalCtrl.dismiss({ saved: true });
    }

    get availableTags() {
        const catId = this.activityForm.get('category_id')?.value;
        return this.store.tags().filter(t => !t.category_id || t.category_id === catId);
    }
}
