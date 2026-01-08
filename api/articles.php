<?php
// articles.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$host = '127.0.0.1';
$dbname = 'music_shop';
$username = 'root';
$password = '';

try {
    $conn = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    echo json_encode(['error' => 'Ошибка подключения к БД: ' . $e->getMessage()]);
    exit;
}

if (isset($_GET['slug']) && $_GET['slug']) {
    $slug = $_GET['slug'];
    
    // Увеличение счетчика просмотров
    $stmt = $conn->prepare("UPDATE articles SET views = views + 1 WHERE slug = :slug");
    $stmt->execute([':slug' => $slug]);
    
    // Получение статьи
    $stmt = $conn->prepare("SELECT *, DATE_FORMAT(created_at, '%d.%m.%Y') as formatted_date FROM articles WHERE slug = :slug");
    $stmt->execute([':slug' => $slug]);
    $article = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($article) {
        echo json_encode($article);
    } else {
        echo json_encode(['error' => 'Статья не найдена']);
    }
    exit;
}

// фильтр по категории
if (isset($_GET['category']) && $_GET['category'] !== 'all') {
    $category = $_GET['category'];
    $stmt = $conn->prepare("SELECT *, DATE_FORMAT(created_at, '%d.%m.%Y') as formatted_date FROM articles WHERE category = :category ORDER BY created_at DESC");
    $stmt->execute([':category' => $category]);
    $articles = $stmt->fetchAll(PDO::FETCH_ASSOC);
} else {
    // все статьи
    $stmt = $conn->prepare("SELECT *, DATE_FORMAT(created_at, '%d.%m.%Y') as formatted_date FROM articles ORDER BY created_at DESC");
    $stmt->execute();
    $articles = $stmt->fetchAll(PDO::FETCH_ASSOC);
}

echo json_encode($articles);
?>