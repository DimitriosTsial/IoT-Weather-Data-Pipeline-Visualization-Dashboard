<?php
$host = "localhost";
$user = "root";
$pass = "stuttgart123!@#A";
$dbname = "db2";

$conn = new mysqli($host, $user, $pass, $dbname);

if ($conn->connect_error) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        "error" => "Database connection failed",
        "details" => $conn->connect_error
    ]);
    exit;
}

$conn->set_charset("utf8");
?>