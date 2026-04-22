<?php
header('Content-Type: application/json');
require_once 'db.php';

$sql = "SELECT DATE(MAX(event_time)) AS latest_date FROM weather_data";
$result = $conn->query($sql);

if (!$result) {
    echo json_encode([
        "error" => "Query failed",
        "details" => $conn->error
    ]);
    $conn->close();
    exit;
}

$row = $result->fetch_assoc();

if (!$row || empty($row['latest_date'])) {
    echo json_encode([
        "error" => "No data found"
    ]);
    $conn->close();
    exit;
}

echo json_encode([
    "latest_date" => $row['latest_date']
]);

$conn->close();
?>