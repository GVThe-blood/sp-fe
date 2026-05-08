import { Component, inject } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { ThemeService } from './services/theme.service';
import { ChatModalComponent } from './components/chat-modal/chat-modal.component';
import { TranslationService } from './services/translation.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent,
    FooterComponent,
    CommonModule,
    ChatModalComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'springfood';

  private router = inject(Router);

  // Inject ThemeService to initialize theme on app bootstrap (Requirement 4.4)
  private themeService = inject(ThemeService);

  // Inject TranslationService to initialize i18n on app bootstrap
  private translationService = inject(TranslationService);

  // Routes that should hide header/footer
  private authRoutes = ['/login', '/register'];

  showHeaderFooter = true;

  constructor() {
    // Subscribe to router events to update showHeaderFooter
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.showHeaderFooter = !this.authRoutes.includes(event.urlAfterRedirects);
    });

    // Check initial route
    this.showHeaderFooter = !this.authRoutes.includes(this.router.url);
  }
}
