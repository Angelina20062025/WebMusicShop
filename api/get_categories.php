<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
require_once 'db.php';

// Функция получения списка жанров из таблицы categories
$stmt = $pdo->query("SELECT * FROM categories");
echo json_encode($stmt->fetchAll());
?>