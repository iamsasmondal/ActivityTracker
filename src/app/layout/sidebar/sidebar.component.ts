import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonMenu, IonHeader, IonToolbar, IonTitle,
  IonContent, IonList, IonItem, IonIcon, IonLabel, IonMenuToggle,
  IonFooter, IonButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { gridOutline, pieChartOutline, folderOutline, pricetagOutline, logOutOutline } from 'ionicons/icons';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  host: { style: 'display: contents' },
  imports: [
    RouterLink, RouterLinkActive,
    IonMenu, IonHeader, IonToolbar, IonTitle,
    IonContent, IonList, IonItem, IonIcon, IonLabel, IonMenuToggle,
    IonFooter, IonButton
  ]
})
export class SidebarComponent {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  public appPages = [
    { title: 'Dashboard', url: '/dashboard', icon: 'grid' },
    { title: 'Analytics', url: '/analytics', icon: 'pie-chart' },
    { title: 'Categories', url: '/categories', icon: 'folder' },
    { title: 'Tags', url: '/tags', icon: 'pricetag' },
  ];

  constructor() {
    addIcons({ gridOutline, pieChartOutline, folderOutline, pricetagOutline, logOutOutline });
  }

  async logout() {
    await this.supabase.client.auth.signOut();
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
