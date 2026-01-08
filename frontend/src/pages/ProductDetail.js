import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ProductDetail.css';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../store/store';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [reviewStats, setReviewStats] = useState(null);
    const [addingToCart, setAddingToCart] = useState(false);
    const [loadingReviews, setLoadingReviews] = useState(true);
    
    // Форма отзыва
    const [reviewForm, setReviewForm] = useState({
        user_name: '',
        rating: 5,
        comment: '',
        submitting: false
    });
    
    // Получение текущего пользователя
    const currentUser = useSelector(state => state.user);
    
    useEffect(() => {
        loadProductData();
        loadReviews();
    }, [id]);
    
    // Автозаполнение имени пользователя
    useEffect(() => {
        if (currentUser.username) {
            setReviewForm(prev => ({
                ...prev,
                user_name: currentUser.username
            }));
        }
    }, [currentUser.username]);
    
    const loadProductData = async () => {
        try {
            const res = await axios.get(`http://music-shop/api/product_get.php?id=${id}`);
            setProduct(res.data);
        } catch (err) {
            console.error("Ошибка загрузки товара:", err);
        }
    };
    
    const loadReviews = async () => {
        try {
            setLoadingReviews(true);
            const response = await axios.get(`http://music-shop/api/reviews.php?product_id=${id}`);
            setReviews(response.data.reviews);
            setReviewStats(response.data.stats);
        } catch (error) {
            console.error("Ошибка загрузки отзывов:", error);
        } finally {
            setLoadingReviews(false);
        }
    };
    
    // Добавление в корзину
    const handleAddToCart = () => {
        if (!product) return;
        
        const getFullImageUrl = (path) => {
            if (!path) return 'http://music-shop/images/products/default.jpg';
            if (path.startsWith('http')) return path;
            return `http://music-shop/${path}`;
        };
        
        const cartItem = {
            id: product.id,
            title: product.title,
            artist_name: product.artist_name,
            price: product.price,
            image_path: getFullImageUrl(product.image_path),
            category_name: product.category_name,
            format: product.format,
            year: product.year
        };
        
        dispatch(addToCart(cartItem));
        alert(`"${product.title}" добавлен в корзину!`);
    };
    
    // Отправка отзыва
    const handleSubmitReview = async (e) => {
        e.preventDefault();
        
        if (!reviewForm.user_name.trim()) {
            alert('Пожалуйста, введите ваше имя');
            return;
        }
        
        if (reviewForm.comment && reviewForm.comment.length > 1000) {
            alert('Комментарий не должен превышать 1000 символов');
            return;
        }
        
        setReviewForm({ ...reviewForm, submitting: true });
        
        try {
            const reviewData = {
                product_id: parseInt(id),
                user_id: currentUser?.id || null,
                user_name: reviewForm.user_name.trim(),
                rating: reviewForm.rating,
                comment: reviewForm.comment.trim()
            };
            
            const response = await axios.post('http://music-shop/api/reviews.php', reviewData);
            
            if (response.data.status === 'success') {
                // Добавляем новый отзыв в список
                setReviews([response.data.review, ...reviews]);
                
                // Обновляем статистику
                if (reviewStats) {
                    setReviewStats({
                        ...reviewStats,
                        total_reviews: reviewStats.total_reviews + 1,
                        average_rating: ((reviewStats.average_rating * reviewStats.total_reviews) + reviewForm.rating) / (reviewStats.total_reviews + 1),
                        [`rating_${reviewForm.rating}`]: reviewStats[`rating_${reviewForm.rating}`] + 1
                    });
                }
                
                // Очищаем форму
                setReviewForm({
                    user_name: currentUser?.username || '',
                    rating: 5,
                    comment: '',
                    submitting: false
                });
                
                alert('Спасибо за ваш отзыв!');
            }
        } catch (error) {
            console.error("Ошибка при отправке отзыва:", error);
            alert(error.response?.data?.error || 'Ошибка при отправке отзыва');
        } finally {
            setReviewForm({ ...reviewForm, submitting: false });
        }
    };
    
    // Удаление отзыва (для админа)
    const handleDeleteReview = async (reviewId) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот отзыв?')) return;
        
        try {
            await axios.delete(`http://music-shop/api/reviews.php?id=${reviewId}`);
            
            // Удаляем отзыв из списка
            setReviews(reviews.filter(review => review.id !== reviewId));
            
            // Обновляем статистику
            if (reviewStats) {
                const deletedReview = reviews.find(r => r.id === reviewId);
                if (deletedReview) {
                    const newTotal = reviewStats.total_reviews - 1;
                    const newAvg = newTotal > 0 
                        ? ((reviewStats.average_rating * reviewStats.total_reviews) - deletedReview.rating) / newTotal
                        : 0;
                    
                    setReviewStats({
                        ...reviewStats,
                        total_reviews: newTotal,
                        average_rating: newAvg,
                        [`rating_${deletedReview.rating}`]: Math.max(0, reviewStats[`rating_${deletedReview.rating}`] - 1)
                    });
                }
            }
            
            alert('Отзыв удален');
        } catch (error) {
            console.error("Ошибка при удалении отзыва:", error);
            alert('Не удалось удалить отзыв');
        }
    };
    
    // Форматирование даты
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };
    
    const renderRatingStars = (rating) => {
        const numericRating = parseFloat(rating);
        return (
            <div className="rating-stars">
                {[1, 2, 3, 4, 5].map(star => (
                    <span 
                        key={star} 
                        className={`star ${star <= numericRating ? 'filled' : 'empty'}`}
                    >
                        ★
                    </span>
                ))}
            </div>
        );
    };
    
    if (!product) {
        return <div className="loading">Загрузка товара...</div>;
    }
    
    const getImageUrl = (path) => {
        if (!path) return 'http://music-shop/images/products/default.jpg';
        return path.startsWith('http') ? path : `http://music-shop/${path}`;
    };
    
    const averageRating = reviewStats?.average_rating ? parseFloat(reviewStats.average_rating).toFixed(1) : '0.0';
    
    return (
        <div className="product-detail-container">
            {/* Основная информация о товаре */}
            <div className="product-main-section">
                <div className="product-image-container">
                    <img 
                        src={getImageUrl(product.image_path)} 
                        alt={product.title}
                        className="product-main-image"
                    />
                </div>
                
                <div className="product-info-container">
                    <h1 className="product-title">{product.title}</h1>
                    <h2 className="product-artist">{product.artist_name}</h2>
                    
                    <div className="product-meta">
                        <span className="meta-item category">{product.category_name}</span>
                        <span className="meta-item year">{product.year}</span>
                        <span className="meta-item format">{product.format}</span>
                        <span className="meta-item stock">
                            {product.stock > 0 
                                ? `${product.stock} шт. в наличии` 
                                : 'Нет в наличии'}
                        </span>
                    </div>
                    
                    <div className="product-price">{parseFloat(product.price).toFixed(2)} ₽</div>
                    
                    <div className="product-description">
                        <h3>Описание</h3>
                        <p>{product.description || 'Описание товара отсутствует.'}</p>
                    </div>
                    
                    <button 
                        className="add-to-cart-button" 
                        onClick={handleAddToCart}
                        disabled={addingToCart || product.stock <= 0}
                    >
                        {product.stock > 0 ? 'Добавить в корзину' : 'Товар закончился'}
                    </button>
                </div>
            </div>
            
            {/* Секция отзывов */}
            <div className="reviews-section">
                <h2 className="section-title">Отзывы о товаре</h2>
                
                {/* Статистика отзывов */}
                {reviewStats && reviewStats.total_reviews > 0 && (
                    <div className="reviews-stats">
                        <div className="stats-main">
                            <div className="average-rating">
                                <span className="rating-number">{averageRating}</span>
                                {renderRatingStars(averageRating)}
                                <span className="total-reviews">
                                    {reviewStats.total_reviews} отзывов
                                </span>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Форма добавления отзыва */}
                <div className="add-review-form">
                    <h3>Оставить отзыв</h3>
                    <form onSubmit={handleSubmitReview}>
                        <div className="form-group">
                            <label htmlFor="user_name">Ваше имя *</label>
                            <input
                                type="text"
                                id="user_name"
                                value={reviewForm.user_name}
                                onChange={(e) => setReviewForm({...reviewForm, user_name: e.target.value})}
                                required
                                maxLength={100}
                                placeholder="Введите ваше имя"
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Ваша оценка *</label>
                            <div className="rating-select">
                                {[1, 2, 3, 4, 5].map(rating => (
                                    <button
                                        key={rating}
                                        type="button"
                                        className={`rating-option ${reviewForm.rating === rating ? 'selected' : ''}`}
                                        onClick={() => setReviewForm({...reviewForm, rating})}
                                    >
                                        <span className="star">★</span> {rating}
                                    </button>
                                ))}
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="comment">Комментарий (необязательно)</label>
                            <textarea
                                id="comment"
                                value={reviewForm.comment}
                                onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                                rows="4"
                                maxLength={1000}
                                placeholder="Поделитесь вашим мнением о товаре..."
                            />
                            <div className="char-count">
                                {reviewForm.comment.length}/1000 символов
                            </div>
                        </div>
                        
                        <button 
                            type="submit" 
                            className="submit-review-btn"
                            disabled={reviewForm.submitting}
                        >
                            {reviewForm.submitting ? 'Отправка...' : 'Отправить отзыв'}
                        </button>
                    </form>
                </div>
                
                {/* Список отзывов */}
                <div className="reviews-list">
                    {loadingReviews ? (
                        <div className="loading">Загрузка отзывов...</div>
                    ) : reviews.length === 0 ? (
                        <div className="no-reviews">
                            <p>Пока нет отзывов. Будьте первым!</p>
                        </div>
                    ) : (
                        reviews.map(review => (
                            <div key={review.id} className="review-item">
                                <div className="review-header">
                                    <div className="reviewer-info">
                                        <span className="reviewer-name">{review.user_name}</span>
                                        {review.user_username && (
                                            <span className="reviewer-username">@{review.user_username}</span>
                                        )}
                                    </div>
                                    <div className="review-meta">
                                        <div className="review-rating">
                                            {renderRatingStars(review.rating)}
                                        </div>
                                        <span className="review-date">{formatDate(review.created_at)}</span>
                                    </div>
                                </div>
                                
                                {review.comment && (
                                    <div className="review-comment">
                                        <p>{review.comment}</p>
                                    </div>
                                )}
                                
                                {currentUser.isAdmin && (
                                    <button
                                        className="delete-review-btn"
                                        onClick={() => handleDeleteReview(review.id)}
                                    >
                                        Удалить
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
            
            {/* Кнопка назад */}
            <div className="navigation-buttons">
                <button 
                    onClick={() => navigate(-1)}
                    className="back-button"
                >
                    Назад к каталогу
                </button>
            </div>
        </div>
    );
};

export default ProductDetail;