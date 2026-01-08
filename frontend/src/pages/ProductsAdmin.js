import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';

/**
 * Компонент админ-панели.
 * Предоставляет интерфейс для управления товарами (просмотр, добавление, редактирование, удаление).
 * Доступ разрешен только пользователям с ролью 'admin'.
 */
const Admin = () => {
  const isAdmin = useSelector(state => state.user.isAdmin);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [artists, setArtists] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null); // Товар, который редактируем
  const [formData, setFormData] = useState({ // Данные для формы добавления/редактирования
    title: '',
    artist_id: '',
    category_id: '',
    year: new Date().getFullYear(),
    price: '',
    description: '',
    image: null, // Будет хранить выбранный файл
    image_preview: '', // Для предпросмотра
    image_path: 'images/products/default.jpg',
    format: 'Винил',
    stock: 10
  });

  // Состояние для добавления нового исполнителя
  const [showAddArtist, setShowAddArtist] = useState(false);
  const [newArtist, setNewArtist] = useState({
    name: '',
    country: '',
    bio: ''
  });
  const [addingArtist, setAddingArtist] = useState(false);
  const [artistSearch, setArtistSearch] = useState('');
  
  const searchInputRef = useRef(null);

  // Фильтрация исполнителей по поиску
  const filteredArtists = artists.filter(artist =>
    artist.name.toLowerCase().includes(artistSearch.toLowerCase())
  );
  
  // Добавление нового исполнителя
  const handleAddArtist = async () => {
    if (!newArtist.name.trim()) {
      alert('Введите имя исполнителя');
      return;
    }
    
    setAddingArtist(true);
    
    try {
      const response = await axios.post(
        'http://music-shop/api/create_artist.php',
        newArtist,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.status === 'success') {
        const createdArtist = response.data.artist;
        
        // Добавляем нового исполнителя в список
        setArtists(prev => [createdArtist, ...prev]);
        
        // Автоматически выбираем его в форме
        setFormData(prev => ({
          ...prev,
          artist_id: createdArtist.id.toString()
        }));
        
        // Закрываем форму добавления
        setShowAddArtist(false);
        setNewArtist({
          name: '',
          country: '',
          bio: ''
        });
        
        alert('Исполнитель успешно добавлен!');
      } else {
        alert(response.data.message || 'Ошибка при добавлении исполнителя');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert(error.response?.data?.error || 'Не удалось добавить исполнителя');
    } finally {
      setAddingArtist(false);
    }
  };
  
  // Открытие формы добавления исполнителя
  const openAddArtistForm = () => {
    setShowAddArtist(true);
    setArtistSearch(''); // Сбрасываем поиск
  };
  
  // Отмена добавления исполнителя
  const cancelAddArtist = () => {
    setShowAddArtist(false);
    setNewArtist({
      name: '',
      country: '',
      bio: ''
    });
  };
  
  // Обработчик выбора исполнителя
  const handleArtistSelect = (artistId) => {
    setFormData({ ...formData, artist_id: artistId.toString() });
    setShowAddArtist(false);
  };

  const availableFormats = [
    { value: 'Винил', label: 'Виниловая пластинка' },
    { value: 'CD', label: 'CD-диск' }
  ];

  const handleFileSelect = (e) => {
  const file = e.target.files[0];
  if (file) {
    // Проверяем тип файла
    if (!file.type.match('image.*')) {
      alert('Пожалуйста, выберите файл изображения (JPG, PNG, GIF)');
      return;
    }
    
    // Проверяем размер файла (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Файл слишком большой. Максимальный размер: 5MB');
      return;
    }
    
    // Создаем предпросмотр
    const previewUrl = URL.createObjectURL(file);
    
    setFormData({
      ...formData,
      image: file,
      image_preview: previewUrl
    });
  }
};

// Очистка предпросмотра при размонтировании
useEffect(() => {
  return () => {
    if (formData.image_preview) {
      URL.revokeObjectURL(formData.image_preview);
    }
  };
}, [formData.image_preview]);

  /**
   * Функция для загрузки данных с сервера при монтировании компонента.
   * Выполняет параллельные запросы для получения товаров, категорий и исполнителей.
   */
  const fetchData = async () => {
    try {
      const [prodRes, catRes, artRes] = await Promise.all([
        axios.get('http://music-shop/api/products.php'),
        axios.get('http://music-shop/api/get_categories.php'),
        axios.get('http://music-shop/api/get_artists.php')
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
      setArtists(artRes.data);
    } catch (error) {
      console.error("Ошибка загрузки данных:", error);
      alert("Не удалось загрузить данные.");
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  /**
   * Функция для удаления товара.
   * Отправляет DELETE-запрос на сервер и обновляет список.
   * @param {number} id - ID товара для удаления.
   */
  const handleDelete = async (id) => {
    if (!window.confirm("Вы уверены, что хотите удалить этот товар?")) return;
    try {
      await axios.delete(`http://music-shop/api/admin_actions.php?id=${id}`);
      alert("Товар удален");
      fetchData(); // Перезагружаем список
    } catch (error) {
      console.error("Ошибка удаления:", error);
      alert("Не удалось удалить товар.");
    }
  };

  /**
   * Функция для начала редактирования товара.
   * Заполняет форму данными выбранного товара.
   * @param {Object} product - Объект товара.
   */
  const startEdit = (product) => {
    setEditingProduct(product.id);
    setFormData({
      title: product.title,
      artist_id: product.artist_id,
      category_id: product.category_id,
      year: product.year,
      price: product.price,
      description: product.description || '',
      image_path: product.image_path,
      format: product.format || 'Винил',
      stock: product.stock
    });
  };

  /**
   * Функция-обработчик отправки формы.
   * Отправляет данные товара на сервер для создания или обновления.
   * @param {Event} e - Событие формы.
   */
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  // Валидация
  if (parseFloat(formData.price) < 0) {
    alert('Цена не может быть отрицательной.');
    setLoading(false);
    return;
  }
  
  if (!formData.title.trim() || !formData.artist_id || !formData.category_id || !formData.price || !formData.year) {
    alert('Пожалуйста, заполните все обязательные поля.');
    setLoading(false);
    return;
  }
  
  const formDataToSend = new FormData();
  formDataToSend.append('title', formData.title);
  formDataToSend.append('artist_id', formData.artist_id);
  formDataToSend.append('category_id', formData.category_id);
  formDataToSend.append('year', formData.year);
  formDataToSend.append('price', formData.price);
  formDataToSend.append('description', formData.description);
  formDataToSend.append('stock', formData.stock);
  formDataToSend.append('format', formData.format);

  if (formData.image) {
    formDataToSend.append('image', formData.image);
  }
  
  const url = editingProduct
    ? `http://music-shop/api/admin_actions.php?action=update&id=${editingProduct}`
    : 'http://music-shop/api/admin_actions.php?action=create';
  
  try {
    const response = await axios.post(url, formDataToSend, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    console.log('Ответ сервера:', response.data);
    
    if (!response.data.error) {
      alert(editingProduct ? 'Товар обновлен!' : 'Товар добавлен!');
      
      // Очищаем форму
      setEditingProduct(null);
      setFormData({
        title: '',
        artist_id: '',
        category_id: '',
        year: new Date().getFullYear(),
        price: '',
        description: '',
        image: null,
        image_preview: '',
        image_path: 'images/products/default.jpg',
        stock: 10
      });
      
      if (formData.image_preview) {
        URL.revokeObjectURL(formData.image_preview);
      }
      
      // Обновляем список
      await fetchData();
    } else {
      alert(`Ошибка: ${response.data.error}`);
    }
    
  } catch (error) {
    console.error("Ошибка:", error);
    
    // Показываем понятное сообщение
    if (error.response?.data?.error) {
      alert(`Ошибка сервера: ${error.response.data.error}`);
    } else if (error.response?.status === 500) {
      alert('Внутренняя ошибка сервера');
    } else if (error.request) {
      alert('Не удалось подключиться к серверу');
    } else {
      alert('Ошибка при отправке данных');
    }
  } finally {
    setLoading(false);
  }
};

  // Проверка прав доступа
  if (!isAdmin) {
    return (
      <div className="container">
        <h2 style={{ color: '#e74c3c' }}>Доступ запрещен.</h2>
        <p>Эта страница доступна только администраторам.</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h2>Управление товарами</h2>
      {/* Форма добавления/редактирования товара */}
      <section className="admin-form">
        <h2>{editingProduct ? 'Редактировать товар' : 'Добавить новый товар'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <input
              type="text"
              placeholder="Название альбома"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              required
            />
            <input
              type="number"
              placeholder="Год выпуска"
              value={formData.year}
              onChange={e => setFormData({ ...formData, year: e.target.value })}
            />
          </div>
          <div className="form-row">
            <select
              value={formData.category_id}
              onChange={e => setFormData({ ...formData, category_id: e.target.value })}
              required
            >
              <option value="">Выберите категорию</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Блок выбора исполнителя с поиском */}
          <div className="form-group">
            <label>Исполнитель</label>
            
            {!showAddArtist ? (
              <div className="artist-select-container">
                <div className="artist-search-container">
                  <input
                    type="text"
                    placeholder="Поиск исполнителя..."
                    value={artistSearch}
                    onChange={(e) => setArtistSearch(e.target.value)}
                    className="artist-search-input"
                  />
                  <button
                    type="button"
                    onClick={openAddArtistForm}
                    className="btn-add-artist"
                  >
                    Добавить нового
                  </button>
                </div>
                
                <div className="artist-list-container">
                  {filteredArtists.length > 0 ? (
                    <div className="artist-list">
                      {filteredArtists.map(artist => (
                        <div
                          key={artist.id}
                          className={`artist-option ${formData.artist_id === artist.id.toString() ? 'selected' : ''}`}
                          onClick={() => handleArtistSelect(artist.id)}
                        >
                          <span className="artist-name">{artist.name}</span>
                          {artist.country && (
                            <span className="artist-country">({artist.country})</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-artists-found">
                      <p>Исполнитель не найден</p>
                      <button
                        type="button"
                        onClick={openAddArtistForm}
                        className="btn-add-artist-inline"
                      >
                        Добавить "{artistSearch}"
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Скрытое поле для формы */}
                <input
                  type="hidden"
                  name="artist_id"
                  value={formData.artist_id}
                  required
                />
                
                {/* Отображение выбранного исполнителя */}
                {formData.artist_id && (
                  <div className="selected-artist">
                    Выбран: {artists.find(a => a.id.toString() === formData.artist_id)?.name}
                  </div>
                )}
              </div>
            ) : (
              /* Форма добавления нового исполнителя */
              <div className="add-artist-form">
                <div className="form-header">
                  <h4>Добавить нового исполнителя</h4>
                  <button
                    type="button"
                    onClick={cancelAddArtist}
                    className="btn-close-form"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="form-fields">
                  <input
                    type="text"
                    placeholder="Имя исполнителя *"
                    value={newArtist.name}
                    onChange={(e) => setNewArtist({...newArtist, name: e.target.value})}
                    required
                    autoFocus
                  />
                  
                  <input
                    type="text"
                    placeholder="Страна (необязательно)"
                    value={newArtist.country}
                    onChange={(e) => setNewArtist({...newArtist, country: e.target.value})}
                  />
                  
                  <textarea
                    placeholder="Биография (необязательно)"
                    value={newArtist.bio}
                    onChange={(e) => setNewArtist({...newArtist, bio: e.target.value})}
                    rows="3"
                  />
                  
                  <div className="form-actions">
                    <button
                      type="button"
                      onClick={handleAddArtist}
                      className="btn-save-artist"
                      disabled={addingArtist || !newArtist.name.trim()}
                    >
                      {addingArtist ? 'Сохранение...' : 'Сохранить исполнителя'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelAddArtist}
                      className="btn-cancel-artist"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="form-row">
            <input
              type="number"
              step="0.01"
              placeholder="Цена (руб.)"
              value={formData.price}
              onChange={e => setFormData({ ...formData, price: e.target.value })}
              required
            />
            <input
              type="number"
              placeholder="Количество на складе"
              value={formData.stock}
              onChange={e => setFormData({ ...formData, stock: e.target.value })}
            />
          </div>
          {/*Формат товара */}
          <div className="form-group">
            <label>Формат товара:</label>
            <div className="format-options">
              {availableFormats.map(format => (
                <label key={format.value} className="format-option">
                  <input
                    type="radio"
                    name="format"
                    value={format.value}
                    checked={formData.format === format.value}
                    onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                  />
                  <span className="format-label">{format.label}</span>
                </label>
              ))}
            </div>
          </div>
          <textarea
            placeholder="Описание товара"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            rows="4"
          />
          <div className="form-group">
  <label>Изображение товара:</label>
  
  {/* Кнопка для выбора файла */}
  <div style={{ marginBottom: '10px' }}>
    <input
      type="file"
      id="image-upload"
      accept="image/*"
      onChange={handleFileSelect}
      style={{ display: 'none' }}
    />
    <label htmlFor="image-upload" className="btn-upload">
      <span>📁 Выбрать файл</span>
    </label>
    {formData.image && (
      <span style={{ marginLeft: '10px', color: 'green' }}>
        Выбран: {formData.image.name}
      </span>
    )}
  </div>
  
  {/* Предпросмотр изображения */}
  {formData.image_preview && (
    <div className="image-preview">
      <h4>Предпросмотр:</h4>
      <img 
        src={formData.image_preview} 
        alt="Предпросмотр" 
        style={{
          maxWidth: '200px',
          maxHeight: '200px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          marginTop: '10px'
        }}
      />
    </div>
  )}
  
  {/* Информация о поддерживаемых форматах */}
  <small style={{ display: 'block', color: '#666', marginTop: '5px' }}>
    Поддерживаемые форматы: JPG, PNG. Максимальный размер: 5MB
  </small>
</div>
         <button 
  type="submit" 
  className="btn btn-primary"
  disabled={loading}
>
  {loading ? (
    <>
      <span className="spinner"></span>
      Сохранение...
    </>
  ) : editingProduct ? 'Сохранить изменения' : 'Добавить товар'}
</button>
          {editingProduct && (
            <button type="button" className="btn btn-secondary" onClick={() => { setEditingProduct(null); setFormData({ title: '', artist_id: '', category_id: '', year: new Date().getFullYear(), price: '', description: '', image_path: 'images/products/default.jpg', stock: 10 }); }}>
              Отмена
            </button>
          )}
        </form>
      </section>

      {/* Список всех товаров с возможностью управления */}
      <section className="product-list">
        <h2>Список товаров ({products.length})</h2>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Изображение</th>
              <th>Название</th>
              <th>Исполнитель</th>
              <th>Формат</th>
              <th>Цена</th>
              <th>На складе</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td><img src={product.image_path} alt={product.title} style={{ width: '50px', height: '50px', objectFit: 'cover' }} /></td>
                <td>{product.title}</td>
                <td>{product.artist_name}</td>
                <td>{product.format}</td>
                <td>{product.price} ₽</td>
                <td>{product.stock}</td>
                <td className="actions">
                  <button onClick={() => startEdit(product)} className="btn-edit">Редактировать</button>
                  <button onClick={() => handleDelete(product.id)} className="btn-delete">Удалить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default Admin;