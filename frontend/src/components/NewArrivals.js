import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './NewArrivals.css';

const NewArrivals = () => {
    const [newProducts, setNewProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
    axios.get('http://music-shop/api/products.php?sort=newest&limit=6')
        .then(res => {
            setNewProducts(res.data);
            setLoading(false);
        })
        .catch(err => {
            console.error("Ошибка:", err);
            setLoading(false);
        });
}, []);

    if (loading) {
        return <div className="loading-section">Загрузка новинок...</div>;
    }

    return (
        <section id="new-arrivals" className="new-arrivals-section">
            <div className="container">
                <p className="section-subtitle">Свежие поступления в нашем магазине</p>

                <div className="products-grid">
                    {newProducts.slice(0, 6).map(product => (
                        <div key={product.id} className="product-card">
                            <Link to={`/product/${product.id}`} className="product-link">
                                <div className="product-image-wrapper">
                                    <img 
                                        src={product.image_path 
                                            ? (product.image_path.startsWith('http') 
                                                ? product.image_path 
                                                : `http://music-shop/${product.image_path}`)
                                            : 'http://music-shop/images/products/default.jpg'
                                        } 
                                        alt={product.title}
                                        className="product-image"
                                    />
                                    <span className="new-badge">NEW</span>
                                </div>
                                <div className="product-info">
                                    <h3 className="product-title">{product.title}</h3>
                                    <p className="product-artist">{product.artist_name}</p>
                                    <div className="product-meta">
                                        <span className="product-format">{product.format}</span>
                                    </div>
                                    <div className="product-price">{product.price} ₽</div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default NewArrivals;