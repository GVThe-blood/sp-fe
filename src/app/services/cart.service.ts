import { Injectable, signal, computed } from '@angular/core';

export interface CustomizationOption {
  id: string;
  name: string;
  priceModifier: number;
}

export interface CustomizationGroup {
  id: string;
  name: string;
  required: boolean;
  maxSelection: number;
  options: CustomizationOption[];
}

export interface Product {
  id: number | string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  sold?: number;
  likes?: number;
  rating?: number;
  isSoldOut?: boolean;
  categoryId?: number;
  description?: string;
  customizationGroups?: CustomizationGroup[];
  shopName?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  note?: string;
  selectedOptions?: Map<string, string>;
}

/**
 * CartService - Global cart state management
 * 
 * Provides centralized cart functionality:
 * - Add/remove/update cart items
 * - Calculate totals
 * - Persist cart to localStorage
 * - Share cart state across components
 */
@Injectable({
  providedIn: 'root'
})
export class CartService {
  // Cart state
  private cart = signal<CartItem[]>([]);
  
  // Expose readonly cart
  readonly cartItems = this.cart.asReadonly();
  
  // Cart total
  readonly cartTotal = computed(() => {
    return this.cart().reduce((acc, item) => {
      return acc + this.calculateItemTotal(item);
    }, 0);
  });
  
  // Cart count
  readonly cartCount = computed(() => {
    return this.cart().reduce((acc, item) => acc + item.quantity, 0);
  });
  
  constructor() {
    // Load cart from localStorage on init
    this.loadCartFromStorage();
  }
  
  /**
   * Add item to cart
   * If item with same product and options exists, increase quantity
   */
  addToCart(cartItem: CartItem): void {
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

      let newCart: CartItem[];
      if (existingItemIndex !== -1) {
        // Update quantity of existing item
        newCart = currentCart.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + cartItem.quantity }
            : item
        );
      } else {
        // Add new item
        newCart = [...currentCart, cartItem];
      }
      
      this.saveCartToStorage(newCart);
      return newCart;
    });
  }
  
  /**
   * Update cart item at specific index
   */
  updateCartItem(index: number, cartItem: CartItem): void {
    this.cart.update(currentCart => {
      const newCart = [...currentCart];
      newCart[index] = cartItem;
      this.saveCartToStorage(newCart);
      return newCart;
    });
  }
  
  /**
   * Remove item from cart by index
   */
  removeCartItem(index: number): void {
    this.cart.update(currentCart => {
      const newCart = currentCart.filter((_, i) => i !== index);
      this.saveCartToStorage(newCart);
      return newCart;
    });
  }
  
  /**
   * Increment cart item quantity
   */
  incrementCartItem(index: number): void {
    this.cart.update(currentCart => {
      const newCart = currentCart.map((item, i) =>
        i === index
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      this.saveCartToStorage(newCart);
      return newCart;
    });
  }
  
  /**
   * Decrement cart item quantity (remove if quantity becomes 0)
   */
  decrementCartItem(index: number): void {
    this.cart.update(currentCart => {
      const item = currentCart[index];
      if (!item) return currentCart;
      
      let newCart: CartItem[];
      if (item.quantity > 1) {
        newCart = currentCart.map((item, i) =>
          i === index
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      } else {
        newCart = currentCart.filter((_, i) => i !== index);
      }
      
      this.saveCartToStorage(newCart);
      return newCart;
    });
  }
  
  /**
   * Clear entire cart
   */
  clearCart(): void {
    this.cart.set([]);
    this.saveCartToStorage([]);
  }
  
  /**
   * Calculate item total with modifiers
   */
  calculateItemTotal(item: CartItem): number {
    let total = typeof item.product.price === 'string' 
      ? parseFloat(item.product.price) 
      : item.product.price;
    
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
  
  /**
   * Format cart item options for display
   */
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
  
  /**
   * Save cart to localStorage
   */
  private saveCartToStorage(cart: CartItem[]): void {
    try {
      // Convert Map to array for JSON serialization
      const serializedCart = cart.map(item => ({
        ...item,
        selectedOptions: item.selectedOptions 
          ? Array.from(item.selectedOptions.entries())
          : undefined
      }));
      localStorage.setItem('springfood_cart', JSON.stringify(serializedCart));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }
  
  /**
   * Load cart from localStorage
   */
  private loadCartFromStorage(): void {
    try {
      const stored = localStorage.getItem('springfood_cart');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert array back to Map
        const cart = parsed.map((item: any) => ({
          ...item,
          selectedOptions: item.selectedOptions 
            ? new Map(item.selectedOptions)
            : undefined
        }));
        this.cart.set(cart);
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      this.cart.set([]);
    }
  }
}
