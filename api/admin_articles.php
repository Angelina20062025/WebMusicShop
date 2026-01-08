<?php
/**
 * API для управления статьями
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

function checkAdminAuth() {
    return true;
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        checkAdminAuth();
        
        // Получение списка статей
        $page = $_GET['page'] ?? 1;
        $limit = $_GET['limit'] ?? 10;
        $offset = ($page - 1) * $limit;
        
        // Общее количество статей
        $countStmt = $pdo->query("SELECT COUNT(*) as total FROM articles");
        $total = $countStmt->fetch()['total'];
        $totalPages = ceil($total / $limit);
        
        // Получение статей
        $stmt = $pdo->prepare("SELECT * FROM articles ORDER BY created_at DESC LIMIT :limit OFFSET :offset");
        $stmt->bindValue(':limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        $articles = $stmt->fetchAll();
        
        if (isset($_GET['id'])) {
            $stmt = $pdo->prepare("SELECT * FROM articles WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            $article = $stmt->fetch();
            
            if ($article) {
                echo json_encode($article);
            } else {
                http_response_code(404);
                echo json_encode(['error' => 'Статья не найдена']);
            }
            break;
        }
        
        echo json_encode([
            'articles' => $articles,
            'pagination' => [
                'current_page' => (int)$page,
                'total_pages' => $totalPages,
                'total_items' => $total,
                'items_per_page' => (int)$limit
            ]
        ]);
        break;

    case 'POST':
        checkAdminAuth();
        
        $action = $_GET['action'] ?? '';
        
        if ($action === 'create' || $action === 'update') {
            //данные из формы
            $title = $_POST['title'] ?? '';
            $slug = $_POST['slug'] ?? '';
            $excerpt = $_POST['excerpt'] ?? '';
            $content = $_POST['content'] ?? '';
            $author = $_POST['author'] ?? '';
            $category = $_POST['category'] ?? '';
            $is_featured = isset($_POST['is_featured']) ? 1 : 0;
            
            // Обработка изображения
            $image_path = 'images/articles/default.jpg';
            if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
                $uploadDir = __DIR__ . '/../images/articles/';
                $fileName = time() . '_' . basename($_FILES['image']['name']);
                $targetPath = $uploadDir . $fileName;
                
                if (move_uploaded_file($_FILES['image']['tmp_name'], $targetPath)) {
                    $image_path = 'images/articles/' . $fileName;
                }
            }
            
            if ($action === 'create') {
                // Создание новой статьи
                $stmt = $pdo->prepare("INSERT INTO articles (title, slug, excerpt, content, image_path, author, category, is_featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                $success = $stmt->execute([$title, $slug, $excerpt, $content, $image_path, $author, $category, $is_featured]);
                
                echo json_encode([
                    'status' => $success ? 'success' : 'error',
                    'message' => $success ? 'Статья создана' : 'Ошибка при создании'
                ]);
            } 
            elseif ($action === 'update' && isset($_GET['id'])) {
                // Обновление статьи
                $id = $_GET['id'];
                
                // Путь к изображению
                $oldStmt = $pdo->prepare("SELECT image_path FROM articles WHERE id = ?");
                $oldStmt->execute([$id]);
                $oldImage = $oldStmt->fetchColumn();
                
                if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
                    $image_path = $oldImage;
                }
                
                $stmt = $pdo->prepare("UPDATE articles SET title = ?, slug = ?, excerpt = ?, content = ?, image_path = ?, author = ?, category = ?, is_featured = ?, updated_at = NOW() WHERE id = ?");
                $success = $stmt->execute([$title, $slug, $excerpt, $content, $image_path, $author, $category, $is_featured, $id]);
                
                echo json_encode([
                    'status' => $success ? 'success' : 'error',
                    'message' => $success ? 'Статья обновлена' : 'Ошибка при обновлении'
                ]);
            }
        }
        break;

    case 'DELETE':
        checkAdminAuth();
        
        $id = $_GET['id'] ?? null;
        if ($id) {
            // Путь к изображению
            $stmt = $pdo->prepare("SELECT image_path FROM articles WHERE id = ?");
            $stmt->execute([$id]);
            $image_path = $stmt->fetchColumn();
            
            // Удаление статьи
            $stmt = $pdo->prepare("DELETE FROM articles WHERE id = ?");
            $success = $stmt->execute([$id]);
            
            echo json_encode(['status' => $success ? 'success' : 'error']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Метод не разрешен']);
        break;
}
?>