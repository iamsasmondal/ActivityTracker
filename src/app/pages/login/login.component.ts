import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonItem, IonLabel, IonInput, IonButton, IonText, IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logInOutline, mailOutline, lockClosedOutline } from 'ionicons/icons';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonItem, IonLabel, IonInput, IonButton, IonText, IonIcon
  ]
})
export class LoginComponent {
  supabase = inject(SupabaseService);
  router = inject(Router);

  email = '';
  password = '';
  isLoading = false;
  errorMessage = '';

  constructor() {
    addIcons({ logInOutline, mailOutline, lockClosedOutline });
  }

  async login() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Please enter email and password';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { error } = await this.supabase.client.auth.signInWithPassword({
      email: this.email,
      password: this.password,
    });

    this.isLoading = false;

    if (error) {
      this.errorMessage = error.message;
    } else {
      this.router.navigate(['/dashboard'], { replaceUrl: true });
    }
  }
}
