import { Component, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { StarRatingComponent } from '../../components/star-rating/star-rating.component';
import { ProductDetailModalComponent } from '../../components/product-detail-modal/product-detail-modal.component';
import { FooterComponent } from '../../components/footer/footer.component';

interface Category {
  id: number;
  name: string;
  count: number;
}

interface CustomizationOption {
  id: string;
  name: string;
  priceModifier: number;
}

interface CustomizationGroup {
  id: string;
  name: string;
  required: boolean;
  maxSelection: number;
  options: CustomizationOption[];
}

interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  sold: number;
  likes: number;
  rating?: number; // Added rating
  isSoldOut: boolean;
  categoryId: number;
  description?: string;
  customizationGroups?: CustomizationGroup[];
}

interface CartItem {
  product: Product;
  quantity: number;
  note?: string;
  selectedOptions?: Map<string, string>;
}

interface StoreInfo {
  name: string;
  address: string;
  rating: number;
  reviewCount: string;
  openTime: string;
  distance: string;
  image: string;
  bannerImage: string;
}

@Component({
  selector: 'app-store-detail',
  standalone: true,
  imports: [CommonModule, StarRatingComponent, ProductDetailModalComponent, FooterComponent],
  templateUrl: './store-detail.component.html',
  styleUrl: './store-detail.component.css'
})
export class StoreDetailComponent implements OnInit, OnDestroy {
  storeId: string | null = null;
  private intersectionObserver?: IntersectionObserver;

  // Mock Store Data
  storeInfo: StoreInfo = {
    name: 'The Coffee Factory - Trương Định',
    address: '107A Trương Định, Phường Võ Thị Sáu, Quận 3, Hồ Chí Minh',
    rating: 5,
    reviewCount: '102',
    openTime: '07:00 - 22:00',
    distance: '1357.7 km',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1000&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80'
  };

  // Categories
  categories = signal<Category[]>([
    { id: 1, name: 'CÀ PHÊ VIỆT', count: 6 },
    { id: 2, name: 'CÀ PHÊ Ý', count: 3 },
    { id: 3, name: 'TRÀ/TRÀ SỮA', count: 17 },
    { id: 4, name: 'NƯỚC ÉP/MÓN KHÁC', count: 7 },
    { id: 5, name: 'SODA', count: 2 },
    { id: 6, name: 'TCF KEM MUỐI', count: 6 },
    { id: 7, name: 'TCF CAKE', count: 14 },
    { id: 8, name: 'ĐÁ XAY', count: 8 }
  ]);

  // Mock Products
  products = signal<Product[]>([
    {
      id: 1,
      name: 'Bạc Xỉu',
      price: 39000,
      originalPrice: 45000,
      image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=200&q=80',
      sold: 1200,
      likes: 500,
      rating: 4.8,
      isSoldOut: false,
      categoryId: 1,
      description: 'ĐÁ/NÓNG: ĐÁ',
      customizationGroups: [
        {
          id: 'temp-1',
          name: 'Nhiệt độ',
          required: true,
          maxSelection: 1,
          options: [
            { id: 'ice', name: 'Đá', priceModifier: 0 },
            { id: 'hot', name: 'Nóng', priceModifier: 0 }
          ]
        },
        {
          id: 'size-1',
          name: 'Kích cỡ',
          required: true,
          maxSelection: 1,
          options: [
            { id: 'medium', name: 'Vừa', priceModifier: 0 },
            { id: 'large', name: 'Lớn', priceModifier: 10000 }
          ]
        },
        {
          id: 'sugar-1',
          name: 'Đường',
          required: false,
          maxSelection: 1,
          options: [
            { id: 'normal', name: 'Bình thường', priceModifier: 0 },
            { id: 'less', name: 'Ít đường', priceModifier: 0 },
            { id: 'no', name: 'Không đường', priceModifier: 0 }
          ]
        }
      ]
    },
    {
      id: 2,
      name: 'Cà Phê Sữa Đá',
      price: 35000,
      image: 'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?auto=format&fit=crop&w=200&q=80',
      sold: 850,
      likes: 300,
      rating: 4.9,
      isSoldOut: false,
      categoryId: 1,
      customizationGroups: [
        {
          id: 'temp-2',
          name: 'Nhiệt độ',
          required: true,
          maxSelection: 1,
          options: [
            { id: 'ice', name: 'Đá', priceModifier: 0 },
            { id: 'hot', name: 'Nóng', priceModifier: 0 }
          ]
        },
        {
          id: 'size-2',
          name: 'Kích cỡ',
          required: true,
          maxSelection: 1,
          options: [
            { id: 'medium', name: 'Vừa', priceModifier: 0 },
            { id: 'large', name: 'Lớn', priceModifier: 10000 }
          ]
        }
      ]
    },
    {
      id: 3,
      name: 'Trà Sen Kem Muối',
      price: 56000,
      originalPrice: 65000,
      image: 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?auto=format&fit=crop&w=200&q=80',
      sold: 200,
      likes: 150,
      rating: 4.5,
      isSoldOut: false,
      categoryId: 6,
      description: 'TOPPING: TRÂN CHÂU TRẮNG',
      customizationGroups: [
        {
          id: 'temp-3',
          name: 'Nhiệt độ',
          required: true,
          maxSelection: 1,
          options: [
            { id: 'ice', name: 'Đá', priceModifier: 0 },
            { id: 'normal', name: 'Thường', priceModifier: 0 }
          ]
        },
        {
          id: 'topping-3',
          name: 'Topping',
          required: false,
          maxSelection: 1,
          options: [
            { id: 'none', name: 'Không topping', priceModifier: 0 },
            { id: 'pearl', name: 'Trân châu trắng', priceModifier: 5000 },
            { id: 'jelly', name: 'Thạch', priceModifier: 5000 },
            { id: 'pudding', name: 'Pudding', priceModifier: 8000 }
          ]
        },
        {
          id: 'ice-3',
          name: 'Đá',
          required: false,
          maxSelection: 1,
          options: [
            { id: 'normal', name: 'Bình thường', priceModifier: 0 },
            { id: 'less', name: 'Ít đá', priceModifier: 0 },
            { id: 'no', name: 'Không đá', priceModifier: 0 }
          ]
        }
      ]
    },
    {
      id: 4,
      name: 'Soda Việt Quất',
      price: 45000,
      image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=200&q=80',
      sold: 50,
      likes: 20,
      rating: 4.2,
      isSoldOut: false,
      categoryId: 5,
      customizationGroups: [
        {
          id: 'size-4',
          name: 'Kích cỡ',
          required: true,
          maxSelection: 1,
          options: [
            { id: 'medium', name: 'Vừa', priceModifier: 0 },
            { id: 'large', name: 'Lớn', priceModifier: 10000 }
          ]
        },
        {
          id: 'ice-4',
          name: 'Đá',
          required: false,
          maxSelection: 1,
          options: [
            { id: 'normal', name: 'Bình thường', priceModifier: 0 },
            { id: 'less', name: 'Ít đá', priceModifier: 0 },
            { id: 'extra', name: 'Nhiều đá', priceModifier: 0 }
          ]
        }
      ]
    }
  ]);

  // Grouped products
  groupedProducts = computed(() => {
    const prods = this.products();
    const cats = this.categories();
    return cats.map(cat => ({
      ...cat,
      products: prods.filter(p => p.categoryId === cat.id)
    })).filter(group => group.products.length > 0);
  });

  // Favorite Logic
  favoriteProducts = signal<Set<number>>(new Set());
  isStoreFavorite = signal<boolean>(false);

  // Active category tracking
  activeCategory = signal<number | null>(null);

  // Modal state
  selectedProduct = signal<Product | null>(null);
  isModalOpen = signal<boolean>(false);

  // Cart Logic
  cart = signal<CartItem[]>([]);
  
  // Add-to-cart success animation
  addedToCartProductId = signal<number | null>(null);
  
  // Cart edit mode for bulk delete
  isCartEditMode = signal<boolean>(false);
  selectedCartItems = signal<Set<number>>(new Set());
  
  // Track which cart item is being edited
  editingCartItem = signal<{item: CartItem, index: number} | null>(null);
  
  // Fallback images
  private readonly FALLBACK_BANNER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="250" viewBox="0 0 1200 250"%3E%3Crect fill="%23e5e7eb" width="1200" height="250"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%239ca3af"%3EStore Banner%3C/text%3E%3C/svg%3E';
  private readonly FALLBACK_PRODUCT_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23e5e7eb" width="200" height="200"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="16" fill="%239ca3af"%3ENo Image%3C/text%3E%3C/svg%3E';

  // Calculate item total with modifiers
  calculateItemTotal(item: CartItem): number {
    let total = item.product.price;
    
    if (item.selectedOptions && item.product.customizationGroups) {
      item.selectedOptions.forEach((optionId, groupId) => {
        const group = item.product.customizationGroups!.find(g => g.id === groupId);
        if (group) {
          const option = group.options.find(o => o.id === optionId);
          if (option) {
            total += option.priceModifier;
          }
        }
      });
    }
    
    return total * item.quantity;
  }

  cartTotal = computed(() => {
    return this.cart().reduce((acc, item) => {
      return acc + this.calculateItemTotal(item);
    }, 0);
  });

  cartCount = computed(() => {
    return this.cart().reduce((acc, item) => acc + item.quantity, 0);
  });

  constructor(private route: ActivatedRoute) {
    this.storeId = this.route.snapshot.paramMap.get('id');
  }

  ngOnInit() {
    this.setupIntersectionObserver();
  }

  ngOnDestroy() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }

  private setupIntersectionObserver() {
    const options = {
      root: null,
      rootMargin: '-20% 0px -70% 0px', // Trigger when section is in the top 30% of viewport
      threshold: 0
    };

    this.intersectionObserver = new IntersectionObserver((entries) => {
      // Find the topmost visible category section
      const visibleEntries = entries.filter(entry => entry.isIntersecting);
      
      if (visibleEntries.length > 0) {
        // Sort by position to get the topmost one
        visibleEntries.sort((a, b) => {
          return a.boundingClientRect.top - b.boundingClientRect.top;
        });
        
        const topmostEntry = visibleEntries[0];
        const categoryId = parseInt(topmostEntry.target.id.replace('category-', ''));
        this.activeCategory.set(categoryId);
      }
    }, options);

    // Observe all category sections after a short delay to ensure DOM is ready
    setTimeout(() => {
      this.categories().forEach(cat => {
        const element = document.getElementById(`category-${cat.id}`);
        if (element && this.intersectionObserver) {
          this.intersectionObserver.observe(element);
        }
      });
    }, 100);
  }

  openProductModal(product: Product) {
    if (product.isSoldOut) return;
    this.selectedProduct.set(product);
    this.isModalOpen.set(true);
  }

  closeProductModal() {
    this.isModalOpen.set(false);
    // Delay clearing the product to allow modal animation to complete
    setTimeout(() => {
      this.selectedProduct.set(null);
      this.editingCartItem.set(null);
    }, 300);
  }

  handleAddToCart(cartItem: CartItem) {
    this.cart.update(currentCart => {
      // Check if the same product with same options already exists
      const existingItemIndex = currentCart.findIndex(item => {
        if (item.product.id !== cartItem.product.id) return false;
        
        // Compare selected options
        if (!item.selectedOptions && !cartItem.selectedOptions) return true;
        if (!item.selectedOptions || !cartItem.selectedOptions) return false;
        
        if (item.selectedOptions.size !== cartItem.selectedOptions.size) return false;
        
        for (const [key, value] of item.selectedOptions) {
          if (cartItem.selectedOptions.get(key) !== value) return false;
        }
        
        return true;
      });

      if (existingItemIndex !== -1) {
        // Update quantity of existing item
        return currentCart.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + cartItem.quantity }
            : item
        );
      } else {
        // Add new item
        return [...currentCart, cartItem];
      }
    });
    
    // Show success animation
    this.showAddSuccess(cartItem.product.id);
  }
  
  // Handle cart item update from modal
  handleUpdateCartItem(data: {index: number, cartItem: CartItem}): void {
    this.cart.update(currentCart => {
      const newCart = [...currentCart];
      newCart[data.index] = data.cartItem;
      return newCart;
    });
    this.editingCartItem.set(null);
  }
  
  // Open cart item for editing
  editCartItem(item: CartItem, index: number): void {
    this.selectedProduct.set(item.product);
    this.editingCartItem.set({item, index});
    this.isModalOpen.set(true);
  }
  
  showAddSuccess(productId: number) {
    this.addedToCartProductId.set(productId);
    setTimeout(() => {
      this.addedToCartProductId.set(null);
    }, 1000);
  }

  addToCart(product: Product) {
    // This method is now used for quick add from product card
    // Open modal for customization
    this.openProductModal(product);
  }

  removeFromCart(productId: number) {
    this.cart.update(currentCart => {
      const existingItem = currentCart.find(item => item.product.id === productId);
      if (existingItem && existingItem.quantity > 1) {
        return currentCart.map(item =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      } else {
        return currentCart.filter(item => item.product.id !== productId);
      }
    });
  }

  incrementCartItem(item: CartItem) {
    this.cart.update(currentCart => {
      return currentCart.map(cartItem =>
        cartItem === item
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      );
    });
  }

  toggleStoreFavorite() {
    this.isStoreFavorite.update(current => !current);
  }

  toggleProductFavorite(productId: number) {
    this.favoriteProducts.update(favorites => {
      const newFavorites = new Set(favorites);
      if (newFavorites.has(productId)) {
        newFavorites.delete(productId);
      } else {
        newFavorites.add(productId);
      }
      return newFavorites;
    });
  }

  isProductFavorite(productId: number): boolean {
    return this.favoriteProducts().has(productId);
  }

  toggleLike(product: Product) {
    console.log('Liked', product.name);
  }

  scrollToCategory(categoryId: number) {
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Update active category immediately when clicking
      this.activeCategory.set(categoryId);
    }
  }

  isCategoryActive(categoryId: number): boolean {
    return this.activeCategory() === categoryId;
  }

  // TrackBy functions for performance optimization
  trackByCategory(index: number, category: Category): number {
    return category.id;
  }

  trackByProduct(index: number, product: Product): number {
    return product.id;
  }

  trackByCartItem(index: number, item: CartItem): number {
    return item.product.id;
  }

  trackByGroup(index: number, group: any): number {
    return group.id;
  }
  
  // Format cart item options for display
  formatCartItemOptions(item: CartItem): string {
    if (!item.selectedOptions || !item.product.customizationGroups) {
      return '';
    }
    
    const options: string[] = [];
    item.selectedOptions.forEach((optionId, groupId) => {
      const group = item.product.customizationGroups!.find(g => g.id === groupId);
      if (group) {
        const option = group.options.find(o => o.id === optionId);
        if (option) {
          let optionText = option.name;
          if (option.priceModifier > 0) {
            optionText += ` (+${option.priceModifier.toLocaleString()}đ)`;
          }
          options.push(optionText);
        }
      }
    });
    
    return options.join(', ');
  }
  
  // Toggle cart edit mode
  toggleCartEditMode(): void {
    this.isCartEditMode.update(v => !v);
    if (!this.isCartEditMode()) {
      this.selectedCartItems.set(new Set());
    }
  }
  
  // Toggle cart item selection
  toggleCartItemSelection(index: number): void {
    this.selectedCartItems.update(selected => {
      const newSet = new Set(selected);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }
  
  // Handle keyboard navigation for cart edit mode
  handleCartKeyDown(event: KeyboardEvent, index: number): void {
    if (!this.isCartEditMode()) return;
    
    // Space key to toggle selection
    if (event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      this.toggleCartItemSelection(index);
    }
    
    // Enter key to toggle selection
    if (event.key === 'Enter') {
      event.preventDefault();
      this.toggleCartItemSelection(index);
    }
  }
  
  // Select all cart items
  selectAllCartItems(): void {
    const allIndices = this.cart().map((_, i) => i);
    this.selectedCartItems.set(new Set(allIndices));
  }
  
  // Check if all items are selected
  areAllItemsSelected(): boolean {
    const cartLength = this.cart().length;
    const selectedLength = this.selectedCartItems().size;
    return cartLength > 0 && cartLength === selectedLength;
  }
  
  // Toggle select all
  toggleSelectAll(): void {
    if (this.areAllItemsSelected()) {
      this.selectedCartItems.set(new Set());
    } else {
      this.selectAllCartItems();
    }
  }
  
  // Delete selected cart items
  deleteSelectedCartItems(): void {
    const selected = this.selectedCartItems();
    if (selected.size === 0) return;
    
    this.cart.update(currentCart => 
      currentCart.filter((_, index) => !selected.has(index))
    );
    this.selectedCartItems.set(new Set());
    this.isCartEditMode.set(false);
  }
  
  // Check if delete button should be disabled
  isDeleteDisabled(): boolean {
    return this.selectedCartItems().size === 0;
  }
  
  // Error handling for images
  onBannerImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    // Prevent infinite loop by checking if already on fallback
    if (!img.src.startsWith('data:image/svg+xml')) {
      img.src = this.FALLBACK_BANNER_IMAGE;
    }
  }
  
  onProductImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    // Prevent infinite loop by checking if already on fallback
    if (!img.src.startsWith('data:image/svg+xml')) {
      img.src = this.FALLBACK_PRODUCT_IMAGE;
    }
  }
}
