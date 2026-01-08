<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once 'db.php';

$id = $_GET['id'] ?? 0;

if ($id) {
    $stmt = $pdo->prepare("
        SELECT p.*, a.name as artist_name, c.name as category_name 
        FROM products p
        JOIN artists a ON p.artist_id = a.id
        JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?
    ");
    $stmt->execute([$id]);
    $product = $stmt->fetch();
    
    if ($product) {
        echo json_encode($product);
    } else {
        http_response_code(404);
        echo json_encode(["message" => "Товар не найден"]);
    }
} else {
    http_response_code(400);
    echo json_encode(["message" => "Не указан ID товара"]);
}
?>