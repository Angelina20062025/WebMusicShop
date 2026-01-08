import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomeSlider.css';

const HomeSlider = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const navigate = useNavigate();
    
    // Данные для слайдера
    const slides = [
        {
            id: 1,
            image: 'http://music-shop/images/banners/banner0.jpg',
            title: 'Новинки Винила',
            link: '#new-arrivals', // якорь на секцию новинок
            description: 'Свежие поступления виниловых пластинок',
            bgColor: '#2c3e50',
            type: 'anchor'
        },
        {
            id: 2,
            image: 'http://music-shop/images/banners/banner.jpg',
            title: 'Новинки поп-музыки',
            link: '/?category_id=2', // Фильтр по категории
            description: 'Посмотрите свежие новинки раздела',
            bgColor: '#4a6491',
            type: 'filter'
        },
        {
            id: 3,
            image: 'http://music-shop/images/banners/banner3.jpg',
            title: 'Музыкальные статьи',
            link: '/articles', // Обычная ссылка
            description: 'Читайте интересные материалы о музыке',
            bgColor: '#3498db'
        }
    ];

    // Функция обработки клика по слайду
    const handleSlideClick = (link) => {
        console.log('Кликнули по ссылке:', link);
        
        if (typeof link === 'string' && link.startsWith('#')) {
            // Якорная ссылка
            const element = document.querySelector(link);
            if (element) {
                element.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        } else if (typeof link === 'string') {
            navigate(link);
        }
    };

    const goToSlide = (index) => {
        setCurrentIndex(index);
    };

    const goToPrev = () => {
        const isFirstSlide = currentIndex === 0;
        const newIndex = isFirstSlide ? slides.length - 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
    };

    const goToNext = () => {
        const isLastSlide = currentIndex === slides.length - 1;
        const newIndex = isLastSlide ? 0 : currentIndex + 1;
        setCurrentIndex(newIndex);
    };

    // Автопрокрутка
    useEffect(() => {
        const interval = setInterval(() => {
            goToNext();
        }, 5000);
        
        return () => clearInterval(interval);
    }, [currentIndex]);

    const currentSlide = slides[currentIndex];

    return (
        <div className="slider-container">
            <div className="slider">
                <div 
                    className="slider-link"
                    onClick={() => handleSlideClick(currentSlide.link)}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="slide">
                        <img 
                            src={currentSlide.image} 
                            alt={currentSlide.title}
                            className="slide-image"
                        />
                        <div className="slide-overlay">
                            <h2 className="slide-title">{currentSlide.title}</h2>
                            <p className="slide-description">{currentSlide.description}</p>
                            <button 
                                className="slide-button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSlideClick(currentSlide.link);
                                }}
                            >
                                Подробнее
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Стрелки и точки */}
            <button className="slider-arrow left" onClick={goToPrev}>‹</button>
            <button className="slider-arrow right" onClick={goToNext}>›</button>
            
            <div className="slider-dots">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        className={`dot ${index === currentIndex ? 'active' : ''}`}
                        onClick={() => setCurrentIndex(index)}
                    />
                ))}
            </div>
        </div>
    );
};

export default HomeSlider;