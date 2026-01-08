<?php
/**
 * API для получения списка исполнителей.
 * Используется в админ-панели для выбора исполнителя при добавлении/редактировании товара.
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
require_once 'db.php';

$stmt = $pdo->query("SELECT id, name FROM artists ORDER BY name");
echo json_encode($stmt->fetchAll());
?>