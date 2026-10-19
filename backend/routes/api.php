<?php

use App\Http\Controllers\RemoveBackgroundController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json(['service' => 'PlayerHype', 'status' => 'ok']));
Route::post('/background/remove', RemoveBackgroundController::class)->middleware('throttle:cutouts');
