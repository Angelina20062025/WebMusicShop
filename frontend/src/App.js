import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from './store/store';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Cart from './pages/Cart';
import Articles from './pages/Articles';
import ArticleDetail from './pages/ArticleDetail';
import Login from './pages/Login';
import ProductDetail from './pages/ProductDetail';
import './App.css';

/**
 * Главный компонент приложения.
 * Отвечает за маршрутизацию и отображение общей структуры сайта (шапка, навигация).
 * Использует react-router-dom для навигации без перезагрузки страницы (SPA).
 * Использует react-redux для доступа к глобальному состоянию (корзина, пользователь).
 */
function App() {
  // Получаем состояние пользователя из Redux хранилища
  const isAdmin = useSelector(state => state.user.isAdmin);
  const dispatch = useDispatch();

  /**
   * Функция для выхода из учетной записи администратора.
   * Вызывает экшен logout, который сбрасывает состояние пользователя в Redux.
   */
  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <BrowserRouter>
      <div className="App">
        {/* Шапка сайта (Header) */}
        <header id="header">
          <div className="container">
            <div id="logo"><h1>Music Shop</h1></div>
            <nav id="main-menu">
              <ul>
                <li><Link to="/">Главная</Link></li>
                <li><Link to="/articles">Статьи</Link></li>
                <li><Link to="/cart">Корзина</Link></li>
                {isAdmin && (
                  <li><Link to="/admin">Админ-панель</Link></li>
                )}
                {/* "Войти" или "Выйти" */}
                {isAdmin ? (
                  <li>
                    <button onClick={handleLogout} className="btn-logout">
                      Выйти
                    </button>
                  </li>
                ) : (
                  <li><Link to="/login">Войти</Link></li>
                )}
              </ul>
            </nav>
          </div>
        </header>

        {/* Основное содержимое страницы (Main Content) */}
        <main id="content" className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/article/:slug" element={<ArticleDetail />} />
            {/* Динамический маршрут для детальной страницы товара */}
            <Route path="/product/:id" element={<ProductDetail />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
