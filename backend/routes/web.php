<?php

use Illuminate\Support\Facades\Route;

$nextUrl = 'http://localhost:3099';

Route::any('/{path?}', function ($path = '') use ($nextUrl) {
    // Skip API routes — handled by routes/api.php
    if (str_starts_with($path, 'api/')) {
        return response()->json(['error' => 'Not found'], 404);
    }

    $uri = $path ? '/' . $path : '/';
    $qs = request()->getQueryString();
    $url = $nextUrl . $uri . ($qs ? '?' . $qs : '');

    $method = request()->method();
    $body = request()->getContent();
    $headers = getallheaders();

    $headerLines = [];
    foreach ($headers as $k => $v) {
        $headerLines[] = "$k: $v";
    }
    $headerLines[] = 'X-Forwarded-For: ' . ($_SERVER['REMOTE_ADDR'] ?? '127.0.0.1');
    $headerLines[] = 'X-Forwarded-Host: ' . ($_SERVER['HTTP_HOST'] ?? 'localhost');
    $headerLines[] = 'X-Forwarded-Proto: ' . (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'https' : 'http');

    $opts = [
        'http' => [
            'method' => $method,
            'header' => implode("\r\n", $headerLines),
            'content' => in_array($method, ['POST', 'PUT', 'PATCH']) && $body ? $body : null,
            'protocol_version' => '1.1',
            'ignore_errors' => true,
            'follow_location' => 0,
        ],
        'ssl' => ['verify_peer' => false, 'verify_peer_name' => false],
    ];

    $context = stream_context_create($opts);
    $response = @file_get_contents($url, false, $context);

    if ($response === false) {
        $response = '<html><body><h1>Frontend server unavailable</h1><p>Please try again later.</p></body></html>';
        $httpCode = 502;
        return response($response, $httpCode);
    }

    $httpCode = 200;
    $location = null;

    if (isset($http_response_header)) {
        foreach ($http_response_header as $h) {
            if (stripos($h, 'HTTP/') === 0) {
                $parts = explode(' ', $h);
                $httpCode = (int)($parts[1] ?? 200);
            } elseif (preg_match('/^Location:\s*(.+)$/i', $h, $m)) {
                $location = trim($m[1]);
            }
        }

        // For redirects (3xx), return a proper redirect response
        if ($httpCode >= 300 && $httpCode < 400 && $location) {
            return response('', $httpCode, ['Location' => $location]);
        }
    }

    if (isset($http_response_header)) {
        foreach ($http_response_header as $h) {
            if (stripos($h, 'HTTP/') === 0) continue;
            if (preg_match('/^Transfer-Encoding:\s*chunked/i', $h)) continue;
            if (preg_match('/^Content-Encoding:/i', $h)) continue;
            if (preg_match('/^Location:/i', $h)) continue;
            try {
                header($h, false);
            } catch (\Throwable $e) {
                // Skip problematic headers
            }
        }
    }

    return response($response, $httpCode);
})->where('path', '.*');
