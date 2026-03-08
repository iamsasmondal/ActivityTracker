import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonMenu, IonHeader, IonToolbar, IonTitle,
  IonContent, IonList, IonItem, IonIcon, IonLabel, IonMenuToggle
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { gridOutline, pieChartOutline, folderOutline, pricetagOutline, settingsOutline } from 'ionicons/icons';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [
    RouterLink, RouterLinkActive,
    IonMenu, IonHeader, IonToolbar, IonTitle,
    IonContent, IonList, IonItem, IonIcon, IonLabel, IonMenuToggle
  ]
})
export class SidebarComponent {
  public appPages = [
    { title: 'Dashboard', url: '/dashboard', icon: 'grid' },
    { title: 'Analytics', url: '/analytics', icon: 'pie-chart' },
    { title: 'Categories', url: '/categories', icon: 'folder' },
    { title: 'Tags', url: '/tags', icon: 'pricetag' },
    { title: 'Settings', url: '/settings', icon: 'settings' }
  ];

  constructor() {
    addIcons({ gridOutline, pieChartOutline, folderOutline, pricetagOutline, settingsOutline });
  }
}
