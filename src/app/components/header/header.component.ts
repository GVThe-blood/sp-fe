import { Component, ChangeDetectionStrategy, signal, ElementRef, viewChild, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { UserService } from '../../services/user.service';

interface Language {
  code: string;
  name: string;
}

interface MenuColumn {
  title: string;
  links: string[];
}

interface NavItem {
  name:string;
  menu?: MenuColumn[];
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, CommonModule, ThemeToggleComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'onEscapeKey()',
  }
})
export class HeaderComponent {
  userService = inject(UserService);
  user = this.userService.currentUser;

  langDropdownContainer = viewChild<ElementRef>('langDropdownContainer');
  searchContainer = viewChild<ElementRef>('searchContainer');
  searchIcon = viewChild<ElementRef>('searchIcon');
  userDropdownContainer = viewChild<ElementRef>('userDropdownContainer');

  navItems = signal<NavItem[]>([
    {
      name: 'Store',
      menu: [
        { title: 'Shop', links: ['Shop the Latest', 'Fresh Produce', 'Meat & Seafood', 'Dairy & Eggs', 'Bakery'] },
        { title: 'Quick Links', links: ['Find a Store', 'Order Status', 'Delivery Options', 'Gift Cards'] },
        { title: 'Special Stores', links: ['Organic Selection', 'Local Farmers', 'Bulk Orders'] }
      ]
    },
    {
      name: 'Categories',
      menu: [
        { title: 'Fresh Food', links: ['Vegetables', 'Fruits', 'Meat', 'Seafood', 'Dairy'] },
        { title: 'Pantry', links: ['Grains & Rice', 'Canned Goods', 'Snacks', 'Beverages'] },
        { title: 'Frozen', links: ['Ice Cream', 'Frozen Meals', 'Frozen Vegetables'] }
      ]
    },
    { name: 'Recipes' },
    { name: 'Meal Plans' },
    {
      name: 'Support',
      menu: [
        { title: 'Get Help', links: ['Order Help', 'Delivery Info', 'Returns', 'Contact Us'] },
        { title: 'Account', links: ['My Orders', 'Saved Items', 'Payment Methods'] }
      ]
    }
  ]);

  languages = signal<Language[]>([
    { code: 'en', name: 'English' },
    { code: 'vi', name: 'Tiếng Việt' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
  ]);

  quickLinks = signal<string[]>(['Fresh Vegetables', 'Premium Meat', 'Organic Products', 'Daily Deals']);
  selectedLanguage = signal<Language>(this.languages()[0]);
  isLangDropdownOpen = signal(false);
  isSearchOpen = signal(false);
  isUserDropdownOpen = signal(false);
  logoUrl = signal<string>('http://localhost:9000/categories/image-removebg-preview_LE_upscale_balanced_x4_light_ai_30_tone_enhance_30_color_enhance_30_remove_background_general_clip_to_object_off.png');

  activeMenu = signal<NavItem | null>(null);
  private hideMenuTimeout: any;

  onDocumentClick(event: MouseEvent): void {
    const langContainer = this.langDropdownContainer();
    if (langContainer && !langContainer.nativeElement.contains(event.target)) {
      this.isLangDropdownOpen.set(false);
    }

    const userContainer = this.userDropdownContainer();
    if (userContainer && !userContainer.nativeElement.contains(event.target)) {
      this.isUserDropdownOpen.set(false);
    }

    const searchContainerEl = this.searchContainer();
    const searchIconEl = this.searchIcon();
    if (
      searchContainerEl &&
      searchIconEl &&
      !searchContainerEl.nativeElement.contains(event.target) &&
      !searchIconEl.nativeElement.contains(event.target)
    ) {
      this.isSearchOpen.set(false);
    }
  }

  onEscapeKey(): void {
    this.activeMenu.set(null);
    this.isSearchOpen.set(false);
    this.isLangDropdownOpen.set(false);
    this.isUserDropdownOpen.set(false);
  }

  toggleLangDropdown(): void {
    this.isLangDropdownOpen.update(open => !open);
    if (this.isLangDropdownOpen()) {
      this.activeMenu.set(null);
      this.isSearchOpen.set(false);
      this.isUserDropdownOpen.set(false);
    }
  }

  toggleUserDropdown(): void {
    this.isUserDropdownOpen.update(open => !open);
    if (this.isUserDropdownOpen()) {
      this.activeMenu.set(null);
      this.isSearchOpen.set(false);
      this.isLangDropdownOpen.set(false);
    }
  }

  logout() {
    this.userService.updateUser({}); // Reset user logic (simplified for mock)
    // Actually for nulling:
    // this.userService.currentUser.set(null);
    // But since UserService uses signal<User | null>(this.mockUser), I should probably add a logout method there or set to null directly if it was public writeable, but it is not.
    // Looking at UserService: `currentUser = signal<User | null>(this.mockUser);` it is public.
    this.userService.currentUser.set(null);
    this.isUserDropdownOpen.set(false);
  }

  toggleSearch(): void {
    this.isSearchOpen.update(open => !open);
    if (this.isSearchOpen()) {
      this.activeMenu.set(null);
      this.isUserDropdownOpen.set(false);
    }
  }

  selectLanguage(language: Language): void {
    this.selectedLanguage.set(language);
    this.isLangDropdownOpen.set(false);
  }

  showMenu(item: NavItem): void {
    clearTimeout(this.hideMenuTimeout);
    if (item.menu) {
      this.isSearchOpen.set(false);
      this.activeMenu.set(item);
    } else {
      this.hideMenu();
    }
  }

  hideMenu(): void {
    this.hideMenuTimeout = setTimeout(() => {
      this.activeMenu.set(null);
    }, 150);
  }

  onMenuEnter(): void {
    clearTimeout(this.hideMenuTimeout);
  }

  closeAll(): void {
    this.activeMenu.set(null);
    this.isSearchOpen.set(false);
    this.isLangDropdownOpen.set(false);
    this.isUserDropdownOpen.set(false);
  }
}
