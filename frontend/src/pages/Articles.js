import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './Articles.css';

const Articles = () => {
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [error, setError] = useState(null);
    const [featuredArticles, setFeaturedArticles] = useState([]);

    const categories = [
        { id: 'all', name: 'Все статьи' },
        { id: 'История', name: 'История музыки' },
        { id: 'Подборки', name: 'Подборки' },
        { id: 'Советы', name: 'Советы' },
        { id: 'Обзоры', name: 'Обзоры' }
    ];

    // Функция для получения статей
    const fetchArticles = async (category = 'all') => {
        try {
            setLoading(true);
            setError(null);
            
            const API_URL = category === 'all' 
                ? 'http://music-shop/api/articles.php'
                : `http://music-shop/api/articles.php?category=${category}`;
            
            console.log('Загружаем статьи по URL:', API_URL);
            const response = await axios.get(API_URL);
            
            if (Array.isArray(response.data)) {
                setArticles(response.data);
                
                const featured = response.data.filter(article => article.is_featured);
                setFeaturedArticles(featured);
            } else {
                console.error('Некорректный формат ответа:', response.data);
                setError('Некорректный формат данных от сервера');
                setArticles([]);
            }
        } catch (err) {
            console.error("Ошибка загрузки статей:", err);
            
            if (err.response) {
                setError(`Ошибка сервера: ${err.response.status} - ${err.response.statusText}`);
            } else if (err.request) {
                setError("Не удалось подключиться к серверу. Проверьте подключение.");
            } else {
                setError("Произошла ошибка при загрузке статей");
            }
            
            setArticles([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchArticles();
    }, []);

    const handleCategoryChange = (categoryId) => {
        setSelectedCategory(categoryId);
        fetchArticles(categoryId);
    };

    if (loading && selectedCategory === 'all') {
        return (
            <div className="articles-loading">
                <div className="loading-spinner"></div>
                <p>Загрузка статей...</p>
            </div>
        );
    }

    if (error && selectedCategory === 'all') {
        return (
            <div className="articles-error">
                <h2>Ошибка загрузки статей</h2>
                <p>{error}</p>
                <button onClick={() => fetchArticles(selectedCategory)} className="retry-btn">
                    Попробовать снова
                </button>
            </div>
        );
    }

    return (
        <div className="articles-page">
            <div className="articles-hero">
                <div className="hero-overlay">
                    <h1 className="hero-title">Музыкальные статьи</h1>
                    <p className="hero-subtitle">
                        Интересные материалы о музыке, исполнителях и коллекционировании
                    </p>
                </div>
            </div>

            <div className="articles-container">

                {/* Фильтр по категориям */}
                <section className="categories-section">
                    <h3 className="section-subtitle">Выберите категорию:</h3>
                    <div className="categories-filter">
                        {categories.map(category => (
                            <button
                                key={category.id}
                                className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                                onClick={() => handleCategoryChange(category.id)}
                                disabled={loading}
                            >
                                {category.name}
                                {loading && selectedCategory === category.id && '...'}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Список статей */}
                <section className="articles-section">
                    <div className="section-header">
                        <h2 className="section-title">
                            <span className="title-icon">📰</span> Все статьи
                        </h2>
                        <span className="articles-count">({articles.length})</span>
                    </div>
                    
                    {loading ? (
                        <div className="articles-loading-inline">
                            <p>Загрузка статей...</p>
                        </div>
                    ) : error ? (
                        <div className="articles-error-inline">
                            <p>{error}</p>
                        </div>
                    ) : articles.length === 0 ? (
                        <div className="no-articles">
                            <p>В этой категории пока нет статей</p>
                            <p>Попробуйте выбрать другую категорию или проверьте позже</p>
                        </div>
                    ) : (
                        <div className="articles-grid">
                            {articles.map(article => (
                                <ArticleCard key={article.id} article={article} />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

const ArticleCard = ({ article }) => {
    // Функция для получения URL изображения
    const getImageUrl = (path) => {
        if (!path || path === '') {
            return 'http://music-shop/images/articles/default.jpg';
        }
        if (path.startsWith('http')) {
            return path;
        }
        return `http://music-shop/${path}`;
    };

    // Форматирование даты
    const formatDate = (dateString) => {
        if (!dateString) return '';
        if (dateString.includes('.')) {
            return dateString;
        }
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    return (
        <Link to={`/article/${article.slug}`} className="article-card">
            <div className="article-image-wrapper">
                <img 
                    src={getImageUrl(article.image_path)} 
                    alt={article.title}
                    className="article-image"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'http://music-shop/images/articles/default.jpg';
                    }}
                />
            </div>
            <div className="article-content">
                <div className="article-header">
                    <span className="article-category">{article.category || 'Без категории'}</span>
                    <span className="article-date">{formatDate(article.created_at || article.formatted_date)}</span>
                </div>
                <h3 className="article-title">{article.title}</h3>
                <p className="article-excerpt">
                    {article.excerpt || 'Нет описания'}
                </p>
                <div className="article-footer">
                    <span className="article-author">{article.author || 'Неизвестный автор'}</span>
                    <span className="article-read">Читать →</span>
                </div>
                {article.views > 0 && (
                    <div className="article-views">
                        👁️ {article.views}
                    </div>
                )}
            </div>
        </Link>
    );
};

export default Articles;