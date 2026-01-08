<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Получение отзывов для товара
            if (isset($_GET['product_id'])) {
                $product_id = intval($_GET['product_id']);
                
                $stmt = $pdo->prepare("
                    SELECT r.*, u.username as user_username 
                    FROM reviews r
                    LEFT JOIN users u ON r.user_id = u.id
                    WHERE r.product_id = ?
                    ORDER BY r.created_at DESC
                ");
                $stmt->execute([$product_id]);
                $reviews = $stmt->fetchAll();
                
                // Статистика по рейтингам
                $statsStmt = $pdo->prepare("
                    SELECT 
                        COUNT(*) as total_reviews,
                        AVG(rating) as average_rating,
                        SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as rating_5,
                        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as rating_4,
                        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as rating_3,
                        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as rating_2,
                        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as rating_1
                    FROM reviews 
                    WHERE product_id = ?
                ");
                $statsStmt->execute([$product_id]);
                $stats = $statsStmt->fetch();
                
                echo json_encode([
                    'reviews' => $reviews,
                    'stats' => $stats
                ]);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Не указан product_id']);
            }
            break;

        case 'POST':
            // Добавление нового отзыва
            $data = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($data['product_id']) || !isset($data['user_name']) || !isset($data['rating'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Не указаны обязательные поля']);
                exit;
            }
            
            $product_id = intval($data['product_id']);
            $user_id = isset($data['user_id']) ? intval($data['user_id']) : null;
            $user_name = trim($data['user_name']);
            $rating = intval($data['rating']);
            $comment = isset($data['comment']) ? trim($data['comment']) : '';
            
            // Проверяем рейтинг
            if ($rating < 1 || $rating > 5) {
                http_response_code(400);
                echo json_encode(['error' => 'Рейтинг должен быть от 1 до 5']);
                exit;
            }
            
            // Проверяем длину имени
            if (strlen($user_name) < 2 || strlen($user_name) > 100) {
                http_response_code(400);
                echo json_encode(['error' => 'Имя должно быть от 2 до 100 символов']);
                exit;
            }
            
            // Проверяем длину комментария
            if (strlen($comment) > 1000) {
                http_response_code(400);
                echo json_encode(['error' => 'Комментарий не должен превышать 1000 символов']);
                exit;
            }
            
            // Добавляем отзыв
            $stmt = $pdo->prepare("
                INSERT INTO reviews (product_id, user_id, user_name, rating, comment) 
                VALUES (?, ?, ?, ?, ?)
            ");
            
            $success = $stmt->execute([$product_id, $user_id, $user_name, $rating, $comment]);
            
            if ($success) {
                $review_id = $pdo->lastInsertId();
                
                // Получаем созданный отзыв
                $stmt = $pdo->prepare("
                    SELECT r.*, u.username as user_username 
                    FROM reviews r
                    LEFT JOIN users u ON r.user_id = u.id
                    WHERE r.id = ?
                ");
                $stmt->execute([$review_id]);
                $new_review = $stmt->fetch();
                
                echo json_encode([
                    'status' => 'success',
                    'message' => 'Отзыв добавлен',
                    'review' => $new_review
                ]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Ошибка при добавлении отзыва']);
            }
            break;

        case 'DELETE':
            // Удаление отзыва (только для админа)
            $id = isset($_GET['id']) ? intval($_GET['id']) : null;
            
            if (!$id) {
                http_response_code(400);
                echo json_encode(['error' => 'Не указан ID отзыва']);
                exit;
            }
            
            $stmt = $pdo->prepare("DELETE FROM reviews WHERE id = ?");
            $success = $stmt->execute([$id]);
            
            echo json_encode([
                'status' => $success ? 'success' : 'error',
                'message' => $success ? 'Отзыв удален' : 'Ошибка при удалении'
            ]);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Метод не разрешен']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Ошибка сервера',
        'message' => $e->getMessage()
    ]);
}
?>