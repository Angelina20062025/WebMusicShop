import React from 'react';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-column">
                    <h3 className="footer-title">О магазине</h3>
                    <p className="footer-text">
                        Music Shop - магазин CD-дисков и виниловых пластинок с 2025 года. 
                        Продаём винил и CD.
                    </p>
                </div>
                
                <div className="footer-column">
                    <h3 className="footer-title">Контакты</h3>
                    <ul className="footer-list">
                        <li className="footer-item">
                            <span>Телефон: +7 (930) 123-45-67</span>
                        </li>
                        <li className="footer-item">
                            <span>Email: info@MusicShop.ru</span>
                        </li>
                        <li className="footer-item">
                            <span>Адрес: г. Муром, ул. Советская, д. 1</span>
                        </li>
                    </ul>
                </div>
                
                <div className="footer-column">
                    <h3 className="footer-title">Часы работы</h3>
                    <ul className="footer-list">
                        <li className="footer-item">Пн-Пт: 10:00 - 20:00</li>
                        <li className="footer-item">Сб-Вс: 11:00 - 19:00</li>
                    </ul>
                </div>
            </div>
            
            <div className="footer-bottom">
                <div className="footer-copyright">
                    © 2025 Музыкальный магазин Music Shop. Все права защищены.
                </div>
            </div>
        </footer>
    );
};

export default Footer;