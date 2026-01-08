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

if ($_SERVER['REQUEST_METHOD'] != 'POST') {
    http_response_code(405);
    echo json_encode(["message" => "Метод не разрешен. Используйте POST"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"));

error_log("Login attempt - Email: " . ($data->email ?? 'NULL'));
error_log("Request method: " . $_SERVER['REQUEST_METHOD']);

if (empty($data->email) || empty($data->password)) {
    http_response_code(400);
    echo json_encode([
        "status" => "error", 
        "message" => "Email и пароль обязательны",
        "debug" => [
            "received_email" => $data->email ?? null,
            "received_password" => !empty($data->password) ? "[SET]" : "empty"
        ]
    ]);
    exit;
}

// Ищем пользователя
$stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
$stmt->execute([$data->email]);
$user = $stmt->fetch();

if ($user && password_verify($data->password, $user['password'])) {
    echo json_encode([
        "status" => "success", 
        "user" => [
            "id" => $user['id'],
            "username" => $user['username'],
            "email" => $user['email'],
            "role" => $user['role'],
            "full_name" => $user['full_name']
        ],
        "debug" => ["user_found" => true, "auth" => "success"]
    ]);
} else {
    http_response_code(401);
    echo json_encode([
        "status" => "error", 
        "message" => "Неверный email или пароль",
        "debug" => [
            "user_found" => $user ? "yes (id: {$user['id']})" : "no",
            "email_checked" => $data->email,
            "password_check" => $user ? "hash exists" : "no user"
        ]
    ]);
}
?>