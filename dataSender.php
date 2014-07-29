<?php 
header("Access-Control-Allow-Origin: *");
header('content-type: application/xml; charset=utf-8');
$phraseTests = file_get_contents("phraseTests.xml");
echo $phraseTests;
?>