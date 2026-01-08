import { useState, useEffect } from 'react';
import axios from 'axios';
import './Admin.css';

const ArticlesAdmin = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingArticle, setEditingArticle] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    author: '',
    category: '',
    image: null,
    image_preview: '',
    image_path: 'images/articles/default.jpg'
  });
  const [categories, setCategories] = useState(['История', 'Подборки', 'Советы', 'Обзоры', 'Новости']);
  
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  
  // Загрузка статей
  const fetchArticles = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axios.get(`http://music-shop/api/admin_articles.php?page=${page}&limit=10`);
      
      if (response.data.articles) {
        setArticles(response.data.articles);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Ошибка загрузки статей:', error);
      alert('Не удалось загрузить статьи');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchArticles();
  }, []);
  
  // Обработчик выбора файла
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.match('image.*')) {
        alert('Пожалуйста, выберите файл изображения (JPG, PNG, GIF)');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('Файл слишком большой. Максимальный размер: 5MB');
        return;
      }
      
      const previewUrl = URL.createObjectURL(file);
      
      setFormData({
        ...formData,
        image: file,
        image_preview: previewUrl
      });
    }
  };
  
  // Очистка предпросмотра
  useEffect(() => {
    return () => {
      if (formData.image_preview) {
        URL.revokeObjectURL(formData.image_preview);
      }
    };
  }, [formData.image_preview]);
  
  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^\w\u0400-\u04FF]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };
  
  // Обработчик изменения заголовка
  const handleTitleChange = (title) => {
    setFormData({
      ...formData,
      title,
      slug: generateSlug(title)
    });
  };
  
  // Начало редактирования
  const startEdit = (article) => {
    setEditingArticle(article.id);
    setFormData({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt || '',
      content: article.content || '',
      author: article.author || '',
      category: article.category || '',
      image_path: article.image_path,
      image: null,
      image_preview: article.image_path ? `http://music-shop/${article.image_path}` : ''
    });
  };
  
  // Отмена редактирования
  const cancelEdit = () => {
    setEditingArticle(null);
    setFormData({
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      author: '',
      category: '',
      image: null,
      image_preview: '',
      image_path: 'images/articles/default.jpg'
    });
  };
  
  // Удаление статьи
  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту статью?')) return;
    
    try {
      await axios.delete(`http://music-shop/api/admin_articles.php?id=${id}`);
      alert('Статья удалена');
      fetchArticles(pagination.currentPage);
    } catch (error) {
      console.error('Ошибка удаления:', error);
      alert('Не удалось удалить статью');
    }
  };
  
  // Отправка формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.slug.trim()) {
      alert('Пожалуйста, заполните заголовок и URL статьи');
      return;
    }
    
    const formDataToSend = new FormData();
    formDataToSend.append('title', formData.title);
    formDataToSend.append('slug', formData.slug);
    formDataToSend.append('excerpt', formData.excerpt);
    formDataToSend.append('content', formData.content);
    formDataToSend.append('author', formData.author);
    formDataToSend.append('category', formData.category);
    
    if (formData.image) {
      formDataToSend.append('image', formData.image);
    }
    
    const url = editingArticle
      ? `http://music-shop/api/admin_articles.php?action=update&id=${editingArticle}`
      : 'http://music-shop/api/admin_articles.php?action=create';
    
    try {
      const response = await axios.post(url, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.status === 'success') {
        alert(editingArticle ? 'Статья обновлена!' : 'Статья создана!');
        cancelEdit();
        fetchArticles(pagination.currentPage);
      } else {
        alert(`Ошибка: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Ошибка при сохранении статьи');
    }
  };
  
  const handlePageChange = (page) => {
    fetchArticles(page);
  };
  
  return (
    <div className="admin-section">
      <h2>Управление статьями</h2>
      
      {/* Форма добавления/редактирования */}
      <section className="admin-form-section">
        <h3>{editingArticle ? 'Редактирование статьи' : 'Добавить новую статью'}</h3>
        
        <form onSubmit={handleSubmit} className="article-form">
          <div className="form-row">
            <input
              type="text"
              placeholder="Заголовок статьи"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="URL статьи (slug)"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              required
            />
          </div>
          
          <div className="form-row">
            <input
              type="text"
              placeholder="Автор"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
            />
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="">Выберите категорию</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <textarea
            placeholder="Краткое описание"
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            rows="3"
          />
          
          <textarea
            placeholder="Полное содержание статьи"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            rows="6"
          />
          
          <div className="form-group">
            <label>Изображение статьи:</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
            />
            
            {formData.image_preview && (
              <div className="image-preview">
                <img 
                  src={formData.image_preview} 
                  alt="Предпросмотр" 
                  style={{
                    maxWidth: '200px',
                    maxHeight: '150px',
                    marginTop: '10px'
                  }}
                />
              </div>
            )}
          </div>
          
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {editingArticle ? 'Сохранить изменения' : 'Добавить статью'}
            </button>
            {editingArticle && (
              <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                Отмена
              </button>
            )}
          </div>
        </form>
      </section>
      
      {/* Список статей */}
      <section className="admin-list-section">
        <h3>Список статей ({articles.length})</h3>
        
        {loading ? (
          <div className="loading">Загрузка...</div>
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Изображение</th>
                  <th>Заголовок</th>
                  <th>Категория</th>
                  <th>Автор</th>
                  <th>Просмотры</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {articles.map(article => (
                  <tr key={article.id}>
                    <td>{article.id}</td>
                    <td>
                      <img 
                        src={`http://music-shop/${article.image_path || 'images/articles/default.jpg'}`}
                        alt={article.title}
                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                      />
                    </td>
                    <td>
                      <strong>{article.title}</strong><br/>
                      <small>{article.slug}</small>
                    </td>
                    <td>{article.category}</td>
                    <td>{article.author}</td>
                    <td>{article.views || 0}</td>
                    <td className="actions">
                      <button 
                        onClick={() => startEdit(article)} 
                        className="btn-edit btn-sm"
                      >
                        Редактировать
                      </button>
                      <button 
                        onClick={() => handleDelete(article.id)} 
                        className="btn-delete btn-sm"
                      >
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Пагинация */}
            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="pagination-btn"
                >
                  Назад
                </button>
                
                <span className="pagination-info">
                  Страница {pagination.currentPage} из {pagination.totalPages}
                </span>
                
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="pagination-btn"
                >
                  Вперед
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default ArticlesAdmin;