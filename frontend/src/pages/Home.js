import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToCart } from '../store/store';
import SimpleSlider from '../components/HomeSlider';
import Footer from '../components/Footer';
import NewArrivals from '../components/NewArrivals';
import './Home.css';

const Home = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useDispatch();
    const searchInputRef = useRef(null);
    
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeCat, setActiveCat] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const categoryIdFromUrl = params.get('category_id');
        const searchQueryFromUrl = params.get('search');
        
        if (categoryIdFromUrl) {
            const catId = parseInt(categoryIdFromUrl);
            setActiveCat(catId);
        }
        
        if (searchQueryFromUrl) {
            setSearchQuery(searchQueryFromUrl);
        }
    }, [location.search]);
    
    // Загружаем данные
    useEffect(() => {
        axios.get('http://music-shop/api/products.php')
            .then(res => {
                setProducts(res.data);
                setFilteredProducts(res.data);
            });
        
        axios.get('http://music-shop/api/get_categories.php')
            .then(res => setCategories(res.data));
    }, []);
    
    // Фильтрация товаров при изменении категории или поискового запроса
    useEffect(() => {
        let filtered = [...products];
        
        // Фильтрация по категории
        if (activeCat !== 0) {
            filtered = filtered.filter(p => p.category_id === activeCat);
        }
        
        // Фильтрация по поисковому запросу
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(product => 
                product.title.toLowerCase().includes(query) ||
                product.artist_name.toLowerCase().includes(query) ||
                (product.description && product.description.toLowerCase().includes(query))
            );
            setIsSearching(true);
        } else {
            setIsSearching(false);
        }
        
        setFilteredProducts(filtered);
    }, [activeCat, searchQuery, products]);
    
    const handleSearch = (e) => {
        e.preventDefault();
        const query = searchQuery.trim();
        
        if (query) {
            if (activeCat === 0) {
                navigate(`/?search=${encodeURIComponent(query)}`);
            } else {
                navigate(`/?category_id=${activeCat}&search=${encodeURIComponent(query)}`);
            }
        } else {
            if (activeCat === 0) {
                navigate('/');
            } else {
                navigate(`/?category_id=${activeCat}`);
            }
        }
    };
    
    // Очистка поиска
    const handleClearSearch = () => {
        setSearchQuery('');
        if (activeCat === 0) {
            navigate('/');
        } else {
            navigate(`/?category_id=${activeCat}`);
        }
        searchInputRef.current?.focus();
    };
    
    // Фильтрация по категории
    const filterByCategory = (categoryId) => {
        setActiveCat(categoryId);
        setSearchQuery('');
        
        if (categoryId === 0) {
            navigate('/');
        } else {
            navigate(`/?category_id=${categoryId}`);
        }
    };
    
    // Добавление в корзину
    const handleAddToCart = (product, e) => {
        e.stopPropagation();

        // Проверяем наличие товара
        if (product.stock <= 0) {
            alert('Товар закончился');
            return;
        }
        
        const getFullImageUrl = (path) => {
            if (!path) return 'http://music-shop/images/products/default.jpg';
            if (path.startsWith('http')) return path;
            return `http://music-shop/${path}`;
        };
        
        const cartItem = {
            ...product,
            image_path: getFullImageUrl(product.image_path)
        };
        
        dispatch(addToCart(cartItem));
        alert(`"${product.title}" добавлен в корзину!`);
    };
    
    return (
        <div className="container">
            <SimpleSlider />
            
            {/* Поисковая строка */}
            <div className="search-section">
                <form onSubmit={handleSearch} className="search-form">
                    <div className="search-input-wrapper">
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Поиск пластинок..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                        <button type="submit" className="search-button">
                            🔍
                        </button>
                        {searchQuery && (
                            <button 
                                type="button" 
                                onClick={handleClearSearch}
                                className="clear-search-button"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </form>
            </div>
            
            {/* Блок фильтров */}
            <div className="filter-section">
                <div className="filter-bar">
                    <button
                        onClick={() => filterByCategory(0)}
                        className={activeCat === 0 ? 'btn-filter active' : 'btn-filter'}
                    >
                        Все жанры
                    </button>
                    
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => filterByCategory(cat.id)}
                            className={activeCat === cat.id ? 'btn-filter active' : 'btn-filter'}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
                
                {/* Информация о результатах */}
                <div className="results-info">
                    {isSearching ? (
                        <p>
                            Найдено {filteredProducts.length} товаров по запросу "
                            <strong>{searchQuery}</strong>"
                            {activeCat !== 0 && ` в категории "${categories.find(c => c.id === activeCat)?.name}"`}
                        </p>
                    ) : activeCat !== 0 ? (
                        <p>
                            Категория: <strong>{categories.find(c => c.id === activeCat)?.name} </strong> 
                            ({filteredProducts.length} товаров)
                        </p>
                    ) : (
                        <p>
                            Все товары: <strong>{filteredProducts.length}</strong> пластинок
                        </p>
                    )}
                </div>
            </div>
            
            {/* Сообщение, если ничего не найдено */}
            {isSearching && filteredProducts.length === 0 && (
                <div className="no-results">
                    <h3>По запросу "{searchQuery}" ничего не найдено</h3>
                    <button 
                        onClick={() => {
                            setSearchQuery('');
                            setActiveCat(0);
                            navigate('/');
                        }}
                        className="btn-back-to-all"
                    >
                        Показать все товары
                    </button>
                </div>
            )}
            
            {/* Сетка товаров */}
            {filteredProducts.length > 0 && (
                <div className="products-grid">
                    {filteredProducts.map(product => (
                        <div 
                            key={product.id} 
                            className="product-card"
                            onClick={() => navigate(`/product/${product.id}`)}
                            style={{ cursor: 'pointer' }}
                        >
                            <div className="product-image">
                                <img 
                                    src={product.image_path.startsWith('http') 
                                        ? product.image_path 
                                        : `http://music-shop/${product.image_path}`} 
                                    alt={product.title}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'http://music-shop/images/products/default.jpg';
                                    }}
                                />
                            </div>
                            <div className="product-info">
                                <h3 className="product-title">{product.title}</h3>
                                <p className="product-artist">{product.artist_name}</p>
                                <div className="product-meta">
                                    <span className="product-category">
                                        {categories.find(c => c.id === product.category_id)?.name}
                                    </span>
                                    <span className="product-format">{product.format}</span>
                                </div>
                                <p className="product-price">{parseFloat(product.price).toFixed(2)} ₽</p>
                                <button
                                    className="btn-add-to-cart"
                                    onClick={(e) => handleAddToCart(product, e)}
                                >
                                    В корзину
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <NewArrivals />
            <Footer />
        </div>
    );
};

export default Home;