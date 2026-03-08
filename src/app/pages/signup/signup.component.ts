import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonLabel, IonInput, IonButton, IonText, IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personAddOutline, mailOutline, lockClosedOutline } from 'ionicons/icons';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonItem, IonLabel, IonInput, IonButton, IonText, IonIcon
  ]
})
export class SignupComponent {
  supabase = inject(SupabaseService);
  router = inject(Router);

  email = '';
  password = '';
  isLoading = false;
  errorMessage = '';

  constructor() {
    addIcons({ personAddOutline, mailOutline, lockClosedOutline });
  }

  async signup() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter email and password';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { error, data } = await this.supabase.client.auth.signUp({
      email: this.email,
      password: this.password,
    });

    this.isLoading = false;

    if (error) {
      this.errorMessage = error.message;
    } else {
      // Typically require email verification, but we'll assume auto-confirm or push to login for MVP
      alert('Signup successful! Please check your email to verify or login directly.');
      this.router.navigate(['/login'], { replaceUrl: true });
    }
  }
}
