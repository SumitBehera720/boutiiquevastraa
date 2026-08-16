<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->alias([
            'admin' => \App\Http\Middleware\AdminMiddleware::class,
        ]);

        // Catch-all proxy forwards all non-API requests to Next.js,
        // so Laravel CSRF protection is not needed for web routes
        $middleware->validateCsrfTokens(except: [
            '*',
        ]);

        $middleware->redirectGuestsTo('/account/login');
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
