import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './Admin.css';

const OrdersAdmin = () => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  // Пагинация
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  
  // Фильтры
  const [statusFilter, setStatusFilter] = useState('all');
  
  const fetchOrders = useCallback(async (page = 1, status = 'all') => {
    try {
      setLoading(true);
      const url = `http://music-shop/api/admin_orders.php?page=${page}&limit=10${status !== 'all' ? `&status=${status}` : ''}`;
      const response = await axios.get(url);
      
      if (response.data.orders) {
        setOrders(response.data.orders);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Ошибка загрузки заказов:', error);
      alert('Не удалось загрузить заказы');
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Загружаем заказы при изменении фильтра или пагинации
  useEffect(() => {
    fetchOrders(pagination.currentPage, statusFilter);
  }, [fetchOrders, statusFilter, pagination.currentPage]);
  
  // Загрузка деталей заказа
  const fetchOrderDetails = async (orderId) => {
    try {
      setDetailsLoading(true);
      const response = await axios.get(`http://music-shop/api/admin_orders.php?id=${orderId}`);
      setOrderDetails(response.data);
      setSelectedOrder(orderId);
    } catch (error) {
      console.error('Ошибка загрузки деталей заказа:', error);
      alert('Не удалось загрузить детали заказа');
    } finally {
      setDetailsLoading(false);
    }
  };
  
  // Обновление статуса заказа
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put('http://music-shop/api/admin_orders.php', {
        id: orderId,
        status: newStatus
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      alert('Статус обновлен');
      // Перезагружаем заказы с текущими фильтрами
      fetchOrders(pagination.currentPage, statusFilter);
      if (selectedOrder === orderId) {
        fetchOrderDetails(orderId);
      }
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
      alert('Не удалось обновить статус');
    }
  };
  
  // Форматирование даты
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Форматирование цены
  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB'
    }).format(price);
  };
  
  // Обработчик изменения статуса
  const handleStatusChange = (orderId, newStatus) => {
    if (window.confirm(`Изменить статус заказа #${orderId} на "${newStatus}"?`)) {
      updateOrderStatus(orderId, newStatus);
    }
  };
  
  // Пагинация
  const handlePageChange = (page) => {
    setPagination(prev => ({...prev, currentPage: page}));
  };
  
  // Фильтрация по статусу
  const handleFilterChange = (status) => {
    setStatusFilter(status);
    setPagination(prev => ({...prev, currentPage: 1})); // Сбрасываем на первую страницу
  };
  
  return (
    <div className="admin-section">
      <h2>Управление заказами</h2>
      
      {/* Фильтры */}
      <div className="filters-section">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => handleFilterChange('all')}
          >
            Все заказы
          </button>
          <button
            className={`filter-btn ${statusFilter === 'новый' ? 'active' : ''}`}
            onClick={() => handleFilterChange('новый')}
          >
            Новые
          </button>
          <button
            className={`filter-btn ${statusFilter === 'оплачен' ? 'active' : ''}`}
            onClick={() => handleFilterChange('оплачен')}
          >
            Оплаченные
          </button>
          <button
            className={`filter-btn ${statusFilter === 'доставлен' ? 'active' : ''}`}
            onClick={() => handleFilterChange('доставлен')}
          >
            Доставленные
          </button>
          <button
            className={`filter-btn ${statusFilter === 'отменен' ? 'active' : ''}`}
            onClick={() => handleFilterChange('отменен')}
          >
            Отмененные
          </button>
        </div>
      </div>
      
      <div className="orders-container">
        {/* Список заказов */}
        <section className="orders-list-section">
          <h3>Список заказов ({orders.length})</h3>
          
          {loading ? (
            <div className="loading">Загрузка заказов...</div>
          ) : (
            <>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Клиент</th>
                    <th>Дата</th>
                    <th>Сумма</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr 
                      key={order.id} 
                      className={selectedOrder === order.id ? 'selected' : ''}
                    >
                      <td>#{order.id}</td>
                      <td>
                        <strong>{order.customer_name}</strong><br/>
                        <small>{order.customer_email}</small><br/>
                        <small>{order.customer_phone}</small>
                      </td>
                      <td>{formatDate(order.created_at)}</td>
                      <td>{formatPrice(order.total_amount || order.total_amount_calc)}</td>
                      <td>
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className={`status-select status-${order.status}`}
                        >
                          <option value="новый">Новый</option>
                          <option value="оплачен">Оплачен</option>
                          <option value="доставлен">Доставлен</option>
                          <option value="отменен">Отменен</option>
                        </select>
                      </td>
                      <td>
                        <button
                          onClick={() => fetchOrderDetails(order.id)}
                          className="btn-view btn-sm"
                        >
                          {selectedOrder === order.id ? 'Просмотр' : 'Просмотр'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Пагинация */}
              {pagination.totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="pagination-btn"
                  >
                    ← Назад
                  </button>
                  
                  <span className="pagination-info">
                    Страница {pagination.currentPage} из {pagination.totalPages}
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="pagination-btn"
                  >
                    Вперед →
                  </button>
                </div>
              )}
            </>
          )}
        </section>
        
        {/* Детали заказа */}
        {selectedOrder && (
          <section className="order-details-section">
            <div className="section-header">
              <h3>Детали заказа #{selectedOrder}</h3>
              <button 
                className="btn-close"
                onClick={() => setSelectedOrder(null)}
              >
                ✕
              </button>
            </div>
            
            {detailsLoading ? (
              <div className="loading">Загрузка деталей...</div>
            ) : orderDetails ? (
              <div className="order-details">
                {/* Информация о заказе */}
                <div className="order-info">
                  <div className="info-row">
                    <span className="info-label">Статус:</span>
                    <select
                      value={orderDetails.order.status}
                      onChange={(e) => handleStatusChange(orderDetails.order.id, e.target.value)}
                      className={`status-select status-${orderDetails.order.status}`}
                    >
                      <option value="новый">Новый</option>
                      <option value="оплачен">Оплачен</option>
                      <option value="доставлен">Доставлен</option>
                      <option value="отменен">Отменен</option>
                    </select>
                  </div>
                  
                  <div className="info-row">
                    <span className="info-label">Клиент:</span>
                    <span className="info-value">{orderDetails.order.customer_name}</span>
                  </div>
                  
                  <div className="info-row">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{orderDetails.order.customer_email}</span>
                  </div>
                  
                  <div className="info-row">
                    <span className="info-label">Телефон:</span>
                    <span className="info-value">{orderDetails.order.customer_phone}</span>
                  </div>
                  
                  <div className="info-row">
                    <span className="info-label">Дата заказа:</span>
                    <span className="info-value">{formatDate(orderDetails.order.created_at)}</span>
                  </div>
                  
                  <div className="info-row">
                    <span className="info-label">Итоговая сумма:</span>
                    <span className="info-value total-amount">
                      {formatPrice(orderDetails.order.total_amount)}
                    </span>
                  </div>
                </div>
                
                {/* Товары в заказе */}
                <div className="order-items">
                  <h4>Товары в заказе ({orderDetails.items.length}):</h4>
                  
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>Товар</th>
                        <th>Цена</th>
                        <th>Кол-во</th>
                        <th>Сумма</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderDetails.items.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <div className="item-info">
                              <img 
                                src={`http://music-shop/${item.image_path || 'images/products/default.jpg'}`}
                                alt={item.title}
                                className="item-image"
                              />
                              <div className="item-details">
                                <div className="item-title">{item.title}</div>
                                <div className="item-artist">{item.artist_name}</div>
                              </div>
                            </div>
                          </td>
                          <td>{formatPrice(item.price)}</td>
                          <td>{item.quantity}</td>
                          <td>{formatPrice(item.price * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3" className="total-label">Итого:</td>
                        <td className="total-value">
                          {formatPrice(orderDetails.items.reduce((sum, item) => sum + (item.price * item.quantity), 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              <div className="no-details">Не удалось загрузить детали заказа</div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default OrdersAdmin;