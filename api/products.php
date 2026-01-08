<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

$sort = $_GET['sort'] ?? 'default';
$limit = $_GET['limit'] ?? 50;

switch($sort) {
    case 'newest':
        $orderBy = "ORDER BY p.created_at DESC";
        break;
    case 'price_asc':
        $orderBy = "ORDER BY p.price ASC";
        break;
    case 'price_desc':
        $orderBy = "ORDER BY p.price DESC";
        break;
    default:
        $orderBy = "ORDER BY p.title ASC";
}

if ($method == 'GET') {
    $sql = "SELECT p.*, a.name as artist_name, c.name as category_name 
        FROM products p 
        LEFT JOIN artists a ON p.artist_id = a.id 
        LEFT JOIN categories c ON p.category_id = c.id 
        $orderBy 
        LIMIT $limit";
    $stmt = $pdo->query($sql);
    $products = $stmt->fetchAll();
    
    foreach ($products as &$product) {
        $product['image_path'] = 'http://music-shop/' . $product['image_path'];
    }
    
    echo json_encode($products);
}
?>