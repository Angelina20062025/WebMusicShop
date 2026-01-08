import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { login } from '../store/store';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

/**
 * Компонент страницы входа.
 * Обрабатывает аутентификацию пользователя через API.
 * Сравнивает введенный пароль с хэшем в базе данных.
 * @returns {JSX.Element} Форма входа с полями email и пароль.
 */
const Login = () => {
  // Состояние для хранения данных формы
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  // Состояние для обработки ошибок и загрузки
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  /**
   * Обработчик изменения полей формы.
   * Обновляет состояние formData при вводе данных.
   * @param {Event} e - Событие изменения input.
   */
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  /**
   * Основная функция входа пользователя.
   * Отправляет данные на сервер для проверки аутентификации.
   * @param {Event} e - Событие отправки формы.
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Базовая валидация на клиенте
    if (!formData.email || !formData.password) {
      setError('Пожалуйста, заполните все поля');
      setLoading(false);
      return;
    }

    try {
      // Отправляем запрос на API для проверки аутентификации
      const res = await axios.post('http://music-shop/api/login.php', formData);
      
      if (res.data.status === 'success') {
        // Успешный вход - сохраняем данные пользователя в Redux
        dispatch(login({ 
          id: res.data.user.id,
          email: res.data.user.email,
          role: res.data.user.role,
          username: res.data.user.username,
          fullName: res.data.user.full_name
        }));
        
        // Перенаправляем в зависимости от роли
        if (res.data.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
        
        // Сохраняем статус входа в localStorage для сохранения сессии
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userRole', res.data.user.role);
      }
    } catch (err) {
      // Обработка ошибок аутентификации
      console.error("Ошибка входа:", err);
      
      if (err.response && err.response.data) {
        setError(err.response.data.message || 'Произошла ошибка при входе');
      } else if (err.request) {
        setError('Не удалось подключиться к серверу. Проверьте соединение.');
      } else {
        setError('Ошибка при отправке запроса');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container login-page">
      <div className="login-form-wrapper">
        <h2>Вход в систему</h2>
        <p className="form-subtitle">Введите email и пароль для доступа к панели управления</p>
        
        {/* Отображение ошибок */}
        {error && (
          <div className="alert alert-error">
            <strong>Ошибка:</strong> {error}
          </div>
        )}
        
        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="admin@music.ru"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Пароль:</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Введите пароль"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Проверка...
              </>
            ) : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;