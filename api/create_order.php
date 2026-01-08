<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once 'db.php'; // Подключаем базу данных

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"));

    if(
        !empty($data->customer_name) &&
        !empty($data->customer_email) &&
        !empty($data->total_amount) &&
        !empty($data->items) && // Проверяем наличие товаров
        is_array($data->items)
    ){
        
        $pdo->beginTransaction();
        
        try {
            // Создаем заказ в таблице orders
            $query = "INSERT INTO orders 
                     SET customer_name = :name, 
                         customer_email = :email, 
                         customer_phone = :phone, 
                         total_amount = :total, 
                         status = 'новый'";

            $stmt = $pdo->prepare($query);
            $stmt->bindParam(":name", $data->customer_name);
            $stmt->bindParam(":email", $data->customer_email);
            $stmt->bindParam(":phone", $data->customer_phone);
            $stmt->bindParam(":total", $data->total_amount);
            $stmt->execute();
            
            $orderId = $pdo->lastInsertId();
            
            // Добавляем товары в таблицу order_items
            if (!empty($data->items)) {
                $itemsQuery = "INSERT INTO order_items 
                              (order_id, product_id, quantity, price) 
                              VALUES (:order_id, :product_id, :quantity, :price)";
                
                $itemsStmt = $pdo->prepare($itemsQuery);
                
                foreach ($data->items as $item) {
                    // Проверяем обязательные поля товара
                    if (!empty($item->product_id) && !empty($item->quantity) && !empty($item->price)) {
                        $itemsStmt->bindParam(":order_id", $orderId);
                        $itemsStmt->bindParam(":product_id", $item->product_id);
                        $itemsStmt->bindParam(":quantity", $item->quantity);
                        $itemsStmt->bindParam(":price", $item->price);
                        $itemsStmt->execute();
                        
                        // Уменьшаем количество товара на складе
                        if (!empty($item->stock) && $item->stock > 0) {
                            $updateStockQuery = "UPDATE products SET stock = stock - :quantity WHERE id = :product_id";
                            $updateStmt = $pdo->prepare($updateStockQuery);
                            $updateStmt->bindParam(":quantity", $item->quantity);
                            $updateStmt->bindParam(":product_id", $item->product_id);
                            $updateStmt->execute();
                        }
                    }
                }
            }
            
            // Фиксируем транзакцию
            $pdo->commit();
            
            http_response_code(201);
            echo json_encode([
                "message" => "Заказ успешно создан", 
                "order_id" => $orderId,
                "items_count" => count($data->items)
            ]);
            
        } catch (Exception $e) {
            // Откатываем транзакцию при ошибке
            $pdo->rollBack();
            
            http_response_code(500);
            echo json_encode([
                "message" => "Ошибка при создании заказа",
                "error" => $e->getMessage()
            ]);
        }
        
    } else {
        http_response_code(400);
        echo json_encode([
            "message" => "Неполные данные",
            "received" => $data
        ]);
    }
}
?>