<?php
/**
 * API для управления заказами
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, PUT, OPTIONS");
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
    
    // Получение списка заказов
    $page = $_GET['page'] ?? 1;
    $limit = $_GET['limit'] ?? 10;
    $offset = ($page - 1) * $limit;
    
    // Фильтрация по статусу
    $statusFilter = $_GET['status'] ?? '';
    
    // SQL с учетом фильтра
    $sqlParams = [];
    
    // SQL для подсчета
    $countSql = "SELECT COUNT(*) as total FROM orders";
    if ($statusFilter && $statusFilter !== 'all') {
        $countSql .= " WHERE status = ?";
        $sqlParams[] = $statusFilter;
    }
    
    // SQL для выборки
    $sql = "SELECT o.*, 
                   COUNT(oi.id) as items_count,
                   COALESCE(SUM(oi.price * oi.quantity), 0) as total_amount_calc
            FROM orders o
            LEFT JOIN order_items oi ON o.id = oi.order_id";
    
    if ($statusFilter && $statusFilter !== 'all') {
        $sql .= " WHERE o.status = ?";
    }
    
    $sql .= " GROUP BY o.id
              ORDER BY o.created_at DESC
              LIMIT ? OFFSET ?";
    
    $countStmt = $pdo->prepare($countSql);
    if (!empty($sqlParams)) {
        $countStmt->execute([$sqlParams[0]]);
    } else {
        $countStmt->execute();
    }
    $total = $countStmt->fetch()['total'];
    $totalPages = ceil($total / $limit);
    
    if ($statusFilter && $statusFilter !== 'all') {
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$statusFilter, (int)$limit, (int)$offset]);
    } else {
        $stmt = $pdo->prepare($sql);
        $stmt->execute([(int)$limit, (int)$offset]);
    }
    
    $orders = $stmt->fetchAll();
        
        //запрошен один заказ с деталями
        if (isset($_GET['id'])) {
            // Получение заказа
            $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
            $stmt->execute([$_GET['id']]);
            $order = $stmt->fetch();
            
            if (!$order) {
                http_response_code(404);
                echo json_encode(['error' => 'Заказ не найден']);
                break;
            }
            
            //получение товаров заказа
            $stmt = $pdo->prepare("
                SELECT oi.*, p.title, p.image_path, a.name as artist_name 
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                LEFT JOIN artists a ON p.artist_id = a.id
                WHERE oi.order_id = ?
            ");
            $stmt->execute([$_GET['id']]);
            $order_items = $stmt->fetchAll();
            
            echo json_encode([
                'order' => $order,
                'items' => $order_items
            ]);
            break;
        }
        
        echo json_encode([
            'orders' => $orders,
            'pagination' => [
                'current_page' => (int)$page,
                'total_pages' => $totalPages,
                'total_items' => $total,
                'items_per_page' => (int)$limit
            ]
        ]);
        break;

    case 'PUT':
        checkAdminAuth();
        
        // Обновление статуса заказа
        parse_str(file_get_contents("php://input"), $putData);
        $id = $putData['id'] ?? null;
        $status = $putData['status'] ?? null;
        
        if ($id && $status) {
            $validStatuses = ['новый', 'оплачен', 'доставлен', 'отменен'];
            
            if (!in_array($status, $validStatuses)) {
                http_response_code(400);
                echo json_encode(['error' => 'Неверный статус']);
                break;
            }
            
            $stmt = $pdo->prepare("UPDATE orders SET status = ? WHERE id = ?");
            $success = $stmt->execute([$status, $id]);
            
            echo json_encode(['status' => $success ? 'success' : 'error']);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Не указаны ID или статус']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['error' => 'Метод не разрешен']);
        break;
}
?>