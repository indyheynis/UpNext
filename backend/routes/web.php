<?php

use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json(['service' => 'PlayerHype API', 'health' => '/api/health']));
