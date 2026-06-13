import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItemCount, setCartItemCount] = useState(0);
  const { getUserId, isAuthenticated } = useAuth();

  const fetchCartCount = useCallback(async () => {
    if (!isAuthenticated()) {
      setCartItemCount(0);
      return;
    }

    const userId = getUserId();
    if (!userId) {
      setCartItemCount(0);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/cart/viewCart/${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.items) {
          const totalItems = data.data.items.reduce((sum, item) => sum + item.quantity, 0);
          setCartItemCount(totalItems);
        } else {
          setCartItemCount(0);
        }
      }
    } catch (error) {
      console.error('Error fetching cart count:', error);
      setCartItemCount(0);
    }
  }, [getUserId, isAuthenticated]);

  // Fetch cart count khi component mount hoặc khi user thay đổi
  useEffect(() => {
    fetchCartCount();
  }, [fetchCartCount]);

  const refreshCart = useCallback(() => {
    fetchCartCount();
  }, [fetchCartCount]);

  const clearCart = useCallback(() => {
    setCartItemCount(0);
  }, []);

  return (
    <CartContext.Provider value={{ cartItemCount, refreshCart, fetchCartCount, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}