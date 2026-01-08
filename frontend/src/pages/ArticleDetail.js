import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './Articles.css';

const ArticleDetail = () => {
    const { slug } = useParams();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [relatedArticles, setRelatedArticles] = useState([]);
    const [loadingRelated, setLoadingRelated] = useState(false);

    useEffect(() => {
        const fetchArticleData = async () => {
            try {
                setLoading(true);
                
                // Загружаем статью
                const articleResponse = await axios.get(`http://music-shop/api/articles.php?slug=${slug}`);
                
                if (articleResponse.data.error) {
                    setError('Статья не найдена');
                } else {
                    const articleData = articleResponse.data;
                    setArticle(articleData);
                    
                    if (articleData.category) {
                        setLoadingRelated(true);
                        try {
                            const relatedResponse = await axios.get(`http://music-shop/api/articles.php?category=${articleData.category}`);
                            if (Array.isArray(relatedResponse.data)) {
                                // Фильтруем текущую статью
                                const related = relatedResponse.data
                                    .filter(item => item.slug !== slug && item.id !== articleData.id)
                                    .slice(0, 3);
                                setRelatedArticles(related);
                            }
                        } catch (err) {
                            console.error('Ошибка загрузки похожих статей:', err);
                        } finally {
                            setLoadingRelated(false);
                        }
                    }
                }
            } catch (err) {
                console.error("Ошибка загрузки статьи:", err);
                setError("Не удалось загрузить статью");
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            fetchArticleData();
        }
    }, [slug]);

    // Функция для получения URL изображения
    const getImageUrl = (path) => {
        if (!path) return 'http://music-shop/images/articles/default.jpg';
        if (path.startsWith('http')) return path;
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

    const parseContent = (content) => {
    if (!content) return <p>Содержание статьи отсутствует</p>;
    
    // Преобразуем переносы строк и абзацы в HTML
    const formattedContent = content
        .replace(/\n{2,}/g, '</p><p>') // Два и более переноса строки - новый параграф
        .replace(/\n/g, '<br />'); // Одиночный перенос строки - <br>
    
    return (
        <div 
            className="article-content-html" 
            dangerouslySetInnerHTML={{ __html: formattedContent }}
        />
    );
};

    if (loading) {
        return (
            <div className="article-detail-loading">
                <div className="loading-spinner"></div>
                <p>Загрузка статьи...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="article-detail-error">
                <h2>Ошибка</h2>
                <p>{error}</p>
                <Link to="/articles" className="back-to-articles">
                    Вернуться к статьям
                </Link>
            </div>
        );
    }

    if (!article) {
        return (
            <div className="article-not-found">
                <h2>Статья не найдена</h2>
                <p>Запрошенная статья не существует или была удалена</p>
                <Link to="/articles" className="back-to-articles">
                    Вернуться к статьям
                </Link>
            </div>
        );
    }

    return (
        <div className="article-detail-page">
            <nav className="breadcrumbs">
                <Link to="/">Главная</Link>
                <span> / </span>
                <Link to="/articles">Статьи</Link>
                <span> / </span>
                <span className="current">{article.title}</span>
            </nav>

            {/* Основное содержимое статьи */}
            <article className="article-detail">
                {/* Заголовок и мета-информация */}
                <header className="article-header">
                    <div className="article-category-badge">
                        {article.category || 'Без категории'}
                    </div>
                    <h1 className="article-title">{article.title}</h1>
                    
                    <div className="article-meta">
                        <div className="meta-item">
                            <span className="meta-icon">👤</span>
                            <span className="meta-text">{article.author || 'Неизвестный автор'}</span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-icon">📅</span>
                            <span className="meta-text">{formatDate(article.created_at || article.formatted_date)}</span>
                        </div>
                        <div className="meta-item">
                            <span className="meta-icon">👁️</span>
                            <span className="meta-text">{article.views || 0} просмотров</span>
                        </div>
                    </div>
                </header>

                {/* Главное изображение */}
                <div className="article-hero-image">
                    <img 
                        src={getImageUrl(article.image_path)} 
                        alt={article.title}
                        className="hero-image"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'http://music-shop/images/articles/default.jpg';
                        }}
                    />
                </div>

                {/* Краткое описание */}
                {article.excerpt && (
                    <div className="article-excerpt-block">
                        <p className="excerpt-text">{article.excerpt}</p>
                    </div>
                )}

                {/* Основное содержание */}
                <div className="article-content">
                    {parseContent(article.content)}
                </div>
                
                {article.tags && (
                    <div className="article-tags">
                        <strong>Теги:</strong>
                        {article.tags.split(',').map((tag, index) => (
                            <span key={index} className="article-tag">{tag.trim()}</span>
                        ))}
                    </div>
                )}
            </article>

            {/* Похожие статьи */}
            {(relatedArticles.length > 0 || loadingRelated) && (
                <section className="related-articles">
                    <h2 className="related-title">Похожие статьи</h2>
                    
                    {loadingRelated ? (
                        <div className="related-loading">
                            <p>Загрузка похожих статей...</p>
                        </div>
                    ) : (
                        <div className="related-grid">
                            {relatedArticles.map(relatedArticle => (
                                <Link 
                                    key={relatedArticle.id} 
                                    to={`/article/${relatedArticle.slug}`}
                                    className="related-card"
                                >
                                    <div className="related-image">
                                        <img 
                                            src={getImageUrl(relatedArticle.image_path)} 
                                            alt={relatedArticle.title}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'http://music-shop/images/articles/default.jpg';
                                            }}
                                        />
                                    </div>
                                    <div className="related-content">
                                        <div className="related-category">{relatedArticle.category}</div>
                                        <h3>{relatedArticle.title}</h3>
                                        <p className="related-excerpt">
                                            {relatedArticle.excerpt?.substring(0, 100)}...
                                        </p>
                                        <div className="related-meta">
                                            <span>{formatDate(relatedArticle.created_at || relatedArticle.formatted_date)}</span>
                                            <span>👁️ {relatedArticle.views || 0}</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* Навигация */}
            <div className="article-navigation">
                <Link to="/articles" className="back-to-articles-btn">
                    Вернуться ко всем статьям
                </Link>
            </div>
        </div>
    );
};

export default ArticleDetail;