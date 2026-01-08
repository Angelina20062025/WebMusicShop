<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $name = trim($data['name'] ?? '');
    $country = trim($data['country'] ?? '');
    $bio = trim($data['bio'] ?? '');
    
    if (empty($name)) {
        http_response_code(400);
        echo json_encode(['error' => 'Имя исполнителя обязательно']);
        exit;
    }
    
    try {
        $checkStmt = $pdo->prepare("SELECT id FROM artists WHERE name = ?");
        $checkStmt->execute([$name]);
        
        if ($checkStmt->fetch()) {
            echo json_encode([
                'status' => 'error',
                'message' => 'Исполнитель с таким именем уже существует'
            ]);
            exit;
        }
        
        // Добавляем нового исполнителя
        $stmt = $pdo->prepare("
            INSERT INTO artists (name, country, bio) 
            VALUES (?, ?, ?)
        ");
        
        $success = $stmt->execute([$name, $country, $bio]);
        
        if ($success) {
            $newArtistId = $pdo->lastInsertId();
            
            // Получаем созданного исполнителя
            $stmt = $pdo->prepare("SELECT * FROM artists WHERE id = ?");
            $stmt->execute([$newArtistId]);
            $newArtist = $stmt->fetch(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'status' => 'success',
                'message' => 'Исполнитель добавлен',
                'artist' => $newArtist
            ]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Ошибка при добавлении исполнителя']);
        }
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => $e->getMessage()]);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Метод не разрешен']);
}
?>