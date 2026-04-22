<?php
header('Content-Type: application/json');
require_once 'db.php';

$date = isset($_GET['date']) ? $_GET['date'] : '';

if (empty($date)) {
    echo json_encode([
        "error" => "Missing date parameter"
    ]);
    $conn->close();
    exit;
}

$sql = "
    SELECT id, event_time, t, po, p
    FROM weather_data
    WHERE DATE(event_time) = ?
    ORDER BY event_time ASC
";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode([
        "error" => "Failed to prepare query",
        "details" => $conn->error
    ]);
    $conn->close();
    exit;
}

$stmt->bind_param("s", $date);
$stmt->execute();
$result = $stmt->get_result();

$data = [];

while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}

echo json_encode($data);

$stmt->close();
$conn->close();
?>