import { useState } from 'react';
import { useSelector } from 'react-redux';
import ArticlesAdmin from './ArticlesAdmin';
import OrdersAdmin from './OrdersAdmin';
import ProductsAdmin from './ProductsAdmin';

const Admin = () => {
  const isAdmin = useSelector(state => state.user.isAdmin);
  const [activeTab, setActiveTab] = useState('products'); // 'products', 'articles', 'orders'
  
  const tabs = [
    { id: 'products', label: 'Товары' },
    { id: 'articles', label: 'Статьи' },
    { id: 'orders', label: 'Заказы' }
  ];

  // Проверка прав доступа
  if (!isAdmin) {
    return (
      <div className="container">
        <h2 style={{ color: '#e74c3c' }}>Доступ запрещен.</h2>
        <p>Эта страница доступна только администраторам.</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Панель администратора</h1>
      
      {/* Навигация по разделам */}
      <div className="admin-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Содержимое активного раздела */}
      <div className="admin-content">
        {activeTab === 'products' && <ProductsAdmin />}
        {activeTab === 'articles' && <ArticlesAdmin />}
        {activeTab === 'orders' && <OrdersAdmin />}
      </div>
    </div>
  );
};

export default Admin;