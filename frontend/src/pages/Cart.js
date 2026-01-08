import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { removeFromCart, clearCart } from '../store/store';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Cart = () => {
    const cartItems = useSelector(state => state.cart.items);
    const dispatch = useDispatch();

    const [customer, setCustomer] = useState({
        name: '',
        email: '',
        phone: ''
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const totalAmount = cartItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

    // Функции валидации
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePhone = (phone) => {
        // Разрешаем: цифры, пробелы, +, -, (, )
        const phoneRegex = /^[\d\s\-\+\(\)]{11,}$/;
        return phoneRegex.test(phone);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCustomer({ ...customer, [name]: value });
        
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    // Функция валидации формы
    const validateForm = () => {
        const newErrors = {};
        
        // Проверка имени
        if (!customer.name.trim()) {
            newErrors.name = 'Введите имя';
        } else if (customer.name.length < 2) {
            newErrors.name = 'Имя слишком короткое';
        }
        
        // Проверка email
        if (!customer.email.trim()) {
            newErrors.email = 'Введите email';
        } else if (!validateEmail(customer.email)) {
            newErrors.email = 'Введите корректный email';
        }
        
        // Проверка телефона
        if (!customer.phone.trim()) {
            newErrors.phone = 'Введите телефон';
        } else if (!validatePhone(customer.phone)) {
            newErrors.phone = 'Введите корректный телефон';
        }
        
        return newErrors;
    };

    const handleCheckout = async (e) => {
        e.preventDefault();
        
        if (cartItems.length === 0) {
            alert("Корзина пуста.");
            return;
        }

        // Валидация формы
        const formErrors = validateForm();
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            const firstErrorField = Object.keys(formErrors)[0];
            document.querySelector(`[name="${firstErrorField}"]`)?.focus();
            return;
        }

        const orderData = {
            customer_name: customer.name,
            customer_email: customer.email,
            customer_phone: customer.phone,
            total_amount: totalAmount,
            items: cartItems.map(item => ({
                product_id: item.id,
                title: item.title,
                quantity: item.quantity,
                price: item.price,
                artist_name: item.artist_name,
                stock: item.stock
            }))
        };

        console.log('Отправляемые данные:', orderData);

        setIsSubmitting(true);

        try {
            const response = await axios.post('http://music-shop/api/create_order.php', orderData);
            
            console.log('Ответ сервера:', response.data);
            
            if (response.status === 201) {
                alert(`Спасибо за заказ! Номер вашего заказа: ${response.data.order_id}\nКоличество товаров: ${response.data.items_count}`);
                
                dispatch(clearCart());
                setCustomer({ name: '', email: '', phone: '' });
                setErrors({});
            }
        } catch (error) {
            console.error("Ошибка при заказе:", error);
            
            if (error.response) {
                alert(`Ошибка: ${error.response.data.message || 'Не удалось оформить заказ'}`);
                console.error('Детали ошибки:', error.response.data);
            } else if (error.request) {
                alert("Не удалось подключиться к серверу. Проверьте подключение к интернету.");
            } else {
                alert("Произошла ошибка при оформлении заказа.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="container cart-empty" style={{textAlign: 'center', padding: '50px'}}>
                <h2>Ваша корзина пуста</h2>
                <Link to="/" className="btn" style={{
                    marginTop: '20px', 
                    display: 'inline-block', 
                    background: '#3498db', 
                    color: 'white', 
                    padding: '10px 20px', 
                    textDecoration: 'none',
                    borderRadius: '4px'
                }}>
                    Перейти в каталог
                </Link>
            </div>
        );
    }

    return (
        <div className="container cart-page">
            <h2 style={{margin: '20px 0'}}>Корзина</h2>
            
            <div className="cart-content" style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px'}}>
                
                {/* Список товаров */}
                <div className="cart-items">
                    <table className="cart-table" style={{
                        width: '100%', 
                        borderCollapse: 'collapse', 
                        background: 'white', 
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                    }}>
                        <thead>
                            <tr style={{background: '#f8f9fa', borderBottom: '2px solid #dee2e6'}}>
                                <th style={{padding: '10px'}}>Товар</th>
                                <th style={{padding: '10px'}}>Цена</th>
                                <th style={{padding: '10px'}}>Кол-во</th>
                                <th style={{padding: '10px'}}>Сумма</th>
                                <th style={{padding: '10px'}}>Действие</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cartItems.map(item => (
                                <tr key={item.id} style={{borderBottom: '1px solid #eee'}}>
                                    <td style={{padding: '10px', display: 'flex', alignItems: 'center', gap: '10px'}}>
                                        <img 
                                            src={item.image_path} 
                                            alt={item.title} 
                                            style={{width: '50px', height: '50px', objectFit: 'cover'}} 
                                        />
                                        <div>
                                            <strong>{item.title}</strong>
                                            <div style={{fontSize: '12px', color: '#777'}}>{item.artist_name}</div>
                                        </div>
                                    </td>
                                    <td style={{padding: '10px'}}>{item.price} ₽</td>
                                    <td style={{padding: '10px'}}>{item.quantity}</td>
                                    <td style={{padding: '10px'}}>
                                        <strong>{item.price * item.quantity} ₽</strong>
                                    </td>
                                    <td style={{padding: '10px'}}>
                                        <button 
                                            onClick={() => dispatch(removeFromCart(item.id))}
                                            style={{
                                                background: '#e74c3c', 
                                                color: 'white', 
                                                border: 'none', 
                                                padding: '5px 10px', 
                                                borderRadius: '4px', 
                                                cursor: 'pointer'
                                            }}
                                            disabled={isSubmitting}
                                        >
                                            Удалить
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            <tr style={{background: '#f8f9fa'}}>
                                <td colSpan="3" style={{padding: '10px', textAlign: 'right'}}>
                                    <strong>Итого:</strong>
                                </td>
                                <td style={{padding: '10px'}}>
                                    <strong style={{color: '#e74c3c', fontSize: '18px'}}>
                                        {totalAmount} ₽
                                    </strong>
                                </td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Форма оформления (Checkout) */}
                <div className="checkout-form" style={{
                    background: 'white', 
                    padding: '20px', 
                    borderRadius: '8px', 
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)', 
                    height: 'fit-content'
                }}>
                    <h3>Оформление заказа</h3>
                    <div style={{margin: '20px 0', fontSize: '18px', fontWeight: 'bold'}}>
                        Итого: <span style={{color: '#e74c3c'}}>{totalAmount} ₽</span>
                    </div>
                    
                    <div style={{
                        background: '#f8f9fa', 
                        padding: '10px', 
                        borderRadius: '4px',
                        marginBottom: '15px',
                        fontSize: '14px'
                    }}>
                        Товаров в заказе: <strong>{cartItems.length}</strong>
                    </div>

                    <form onSubmit={handleCheckout}>
                        <div className="form-group" style={{marginBottom: '15px'}}>
                            <label style={{display: 'block', marginBottom: '5px'}}>
                                Имя: <span style={{color: 'red'}}>*</span>
                            </label>
                            <input 
                                type="text" 
                                name="name" 
                                required 
                                value={customer.name} 
                                onChange={handleInputChange}
                                style={{
                                    width: '100%', 
                                    padding: '8px', 
                                    border: `1px solid ${errors.name ? '#e74c3c' : '#ddd'}`, 
                                    borderRadius: '4px'
                                }}
                                disabled={isSubmitting}
                            />
                            {errors.name && (
                                <div style={{color: '#e74c3c', fontSize: '12px', marginTop: '5px'}}>
                                    {errors.name}
                                </div>
                            )}
                        </div>
                        
                        <div className="form-group" style={{marginBottom: '15px'}}>
                            <label style={{display: 'block', marginBottom: '5px'}}>
                                Email: <span style={{color: 'red'}}>*</span>
                            </label>
                            <input 
                                type="email" 
                                name="email" 
                                required 
                                value={customer.email} 
                                onChange={handleInputChange}
                                style={{
                                    width: '100%', 
                                    padding: '8px', 
                                    border: `1px solid ${errors.email ? '#e74c3c' : '#ddd'}`, 
                                    borderRadius: '4px'
                                }}
                                placeholder="angelina@gmail.com"
                                disabled={isSubmitting}
                            />
                            {errors.email && (
                                <div style={{color: '#e74c3c', fontSize: '12px', marginTop: '5px'}}>
                                    {errors.email}
                                </div>
                            )}
                        </div>
                        
                        <div className="form-group" style={{marginBottom: '20px'}}>
                            <label style={{display: 'block', marginBottom: '5px'}}>
                                Телефон: <span style={{color: 'red'}}>*</span>
                            </label>
                            <input 
                                type="tel" 
                                name="phone" 
                                required 
                                value={customer.phone} 
                                onChange={handleInputChange}
                                style={{
                                    width: '100%', 
                                    padding: '8px', 
                                    border: `1px solid ${errors.phone ? '#e74c3c' : '#ddd'}`, 
                                    borderRadius: '4px'
                                }}
                                placeholder="+7 (999) 999-99-99"
                                disabled={isSubmitting}
                            />
                            {errors.phone && (
                                <div style={{color: '#e74c3c', fontSize: '12px', marginTop: '5px'}}>
                                    {errors.phone}
                                </div>
                            )}
                        </div>

                        <button 
                            type="submit" 
                            className="btn" 
                            style={{
                                width: '100%', 
                                background: isSubmitting ? '#6c757d' : '#28a745', 
                                color: 'white', 
                                border: 'none', 
                                padding: '12px', 
                                borderRadius: '4px', 
                                cursor: isSubmitting ? 'not-allowed' : 'pointer', 
                                fontSize: '16px',
                                opacity: isSubmitting ? 0.7 : 1
                            }}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Оформление...' : 'Оформить заказ'}
                        </button>
                        
                        <div style={{
                            marginTop: '15px',
                            fontSize: '12px',
                            color: '#6c757d',
                            textAlign: 'center'
                        }}>
                            * Поля, обязательные для заполнения
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Cart;