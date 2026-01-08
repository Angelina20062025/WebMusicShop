<?php
/**
 * API для административных действий.
 * Обрабатывает создание, чтение, обновление и удаление товаров (CRUD).
 * Также обрабатывает аутентификацию администратора.
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

$action = $_GET['action'] ?? '';

// Обработка загрузки файла
if ($action === 'create' || $action === 'update') {
    // Получаем данные из формы
    $title = $_POST['title'] ?? '';
    $artist_id = $_POST['artist_id'] ?? '';
    $category_id = $_POST['category_id'] ?? '';
    $year = $_POST['year'] ?? date('Y');
    $price = $_POST['price'] ?? 0;
    $description = $_POST['description'] ?? '';
    $stock = $_POST['stock'] ?? 10;
    $format = $_POST['format'] ?? 'Винил';
    
    $image_path = 'images/products/default.jpg'; // Путь по умолчанию

    if (isset($_FILES['image']) && is_uploaded_file($_FILES['image']['tmp_name'])) {
    $file_name = basename($_FILES['image']['name']);
    move_uploaded_file($_FILES['image']['tmp_name'], "images/products/$file_name");
    $image_path = "images/products/$file_name";
}
    
    if ($action === 'create') {
        // Создание нового товара
        $stmt = $pdo->prepare("INSERT INTO products (title, artist_id, category_id, year, price, description, image_path, stock, format) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $success = $stmt->execute([$title, $artist_id, $category_id, $year, $price, $description, $image_path, $stock, $format]);
        
        echo json_encode([
            "status" => $success ? "success" : "error",
            "message" => $success ? "Товар добавлен" : "Ошибка при добавлении",
            "image_path" => $image_path
        ]);
    } 
    elseif ($action === 'update' && isset($_GET['id'])) {
        // Обновление существующего товара
        $id = $_GET['id'];
        
        // Получаем старый путь к изображению
        $old_stmt = $pdo->prepare("SELECT image_path FROM products WHERE id = ?");
        $old_stmt->execute([$id]);
        $old_image = $old_stmt->fetchColumn();
        
        // Если не загружено новое изображение, оставляем старое
        if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
            $image_path = $old_image;
        }
        
        $stmt = $pdo->prepare("UPDATE products SET title = ?, artist_id = ?, category_id = ?, year = ?, price = ?, description = ?, image_path = ?, stock = ?, format = ? WHERE id = ?");
        $success = $stmt->execute([$title, $artist_id, $category_id, $year, $price, $description, $image_path, $stock, $format, $id]);
        
        echo json_encode([
            "status" => $success ? "success" : "error",
            "message" => $success ? "Товар обновлен" : "Ошибка при обновлении"
        ]);
    }
}

$method = $_SERVER['REQUEST_METHOD'];

// Обработка запроса в зависимости от метода
switch ($method) {
    case 'GET':
        // Получение списка товаров
        $stmt = $pdo->query("SELECT * FROM products");
        echo json_encode($stmt->fetchAll());
        break;

    case 'POST':
        $action = $_GET['action'] ?? 'login';
        
        if ($action === 'login') {
            $data = json_decode(file_get_contents("php://input"));
            $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
            $stmt->execute([$data->email]);
            $user = $stmt->fetch();
            
            if ($user && password_verify($data->password, $user['password'])) {
                echo json_encode(["status" => "success", "user" => $user]);
            } else {
                http_response_code(401);
                echo json_encode(["status" => "error", "message" => "Неверный email или пароль"]);
            }
        } 
        elseif ($action === 'create') {
            $data = json_decode(file_get_contents("php://input"));
            $stmt = $pdo->prepare("INSERT INTO products (title, artist_id, category_id, year, price, description, image_path, stock, format) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $success = $stmt->execute([
                $data->title,
                $data->artist_id,
                $data->category_id,
                $data->year,
                $data->price,
                $data->description,
                $data->image_path,
                $data->stock,
                $data->format
            ]);
            echo json_encode(["status" => $success ? "success" : "error"]);
        }
        elseif ($action === 'update') {
            $id = $_GET['id'];
            $data = json_decode(file_get_contents("php://input"));
            $stmt = $pdo->prepare("UPDATE products SET title = ?, artist_id = ?, category_id = ?, year = ?, price = ?, description = ?, image_path = ?, stock = ?, format = ? WHERE id = ?");
            $success = $stmt->execute([
                $data->title,
                $data->artist_id,
                $data->category_id,
                $data->year,
                $data->price,
                $data->description,
                $data->image_path,
                $data->stock,
                $data->format,
                $id
            ]);
            echo json_encode(["status" => $success ? "success" : "error"]);
        }
        break;

    case 'DELETE':
        $id = $_GET['id'];
        $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
        $success = $stmt->execute([$id]);
        echo json_encode(["status" => $success ? "success" : "error"]);
        break;

    default:
        http_response_code(405);
        echo json_encode(["message" => "Метод не разрешен"]);
        break;
}
?>