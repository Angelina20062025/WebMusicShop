import { configureStore, createSlice } from '@reduxjs/toolkit';

/**
 * Слайс (slice) для управления состоянием корзины.
 * Содержит товары, добавленные пользователем, с количеством каждого товара.
 */
const cartSlice = createSlice({
  name: 'cart',
  initialState: { 
    items: [],
    totalCount: 0
  },
  reducers: {
    /**
     * Добавляет товар в корзину или увеличивает его количество.
     * @param {Object} state - Текущее состояние корзины.
     * @param {Object} action
     */
    addToCart: (state, action) => {
      const existingItem = state.items.find(item => item.id === action.payload.id);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push({ ...action.payload, quantity: 1 });
      }
      state.totalCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
    },
    
    /**
     * Удаляет товар из корзины по ID.
     * @param {Object} state - Текущее состояние корзины.
     * @param {Object} action
     */
    removeFromCart: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload);
      state.totalCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
    },
    
    /**
     * Очищает всю корзину.
     * @param {Object} state - Текущее состояние корзины.
     */
    clearCart: (state) => {
      state.items = [];
      state.totalCount = 0;
    },
    
    /**
     * Изменяет количество конкретного товара в корзине.
     * @param {Object} state - Текущее состояние корзины.
     * @param {Object} action
     */
    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.items.find(item => item.id === id);
      if (item) {
        item.quantity = Math.max(1, quantity);
        state.totalCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
      }
    }
  }
});

/**
 * Слайс (slice) для управления состоянием пользователя.
 * Хранит информацию о текущем пользователе и его правах доступа.
 */
const userSlice = createSlice({
  name: 'user',
  initialState: { 
    isAuthenticated: false,
    isAdmin: false,
    userData: null,
    token: null
  },
  reducers: {
    /**
     * Устанавливает состояние пользователя после успешного входа.
     * @param {Object} state - Текущее состояние пользователя.
     * @param {Object} action
     */
    login: (state, action) => {
      state.isAuthenticated = true;
      state.isAdmin = action.payload.role === 'admin';
      state.userData = action.payload;
      state.token = `user-token-${Date.now()}`;
    },
    
    /**
     * Сбрасывает состояние пользователя при выходе из системы.
     * @param {Object} state - Текущее состояние пользователя.
     */
    logout: (state) => {
      state.isAuthenticated = false;
      state.isAdmin = false;
      state.userData = null;
      state.token = null;
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userRole');
    },
    
    /**
     * Восстанавливает состояние пользователя из localStorage.
     * Используется при перезагрузке страницы.
     * @param {Object} state - Текущее состояние пользователя.
     */
    restoreSession: (state) => {
      const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
      const userRole = localStorage.getItem('userRole');
      
      if (isAuthenticated && userRole) {
        state.isAuthenticated = true;
        state.isAdmin = userRole === 'admin';
      }
    }
  }
});

//действия (actions)
export const { addToCart, removeFromCart, clearCart, updateQuantity } = cartSlice.actions;
export const { login, logout, restoreSession } = userSlice.actions;

/**
 * Конфигурация Redux store.
 * Объединяет редьюсеры корзины и пользователя.
 */
export const store = configureStore({
  reducer: {
    cart: cartSlice.reducer,
    user: userSlice.reducer
  },
  devTools: process.env.NODE_ENV !== 'production'
});