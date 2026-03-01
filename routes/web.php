<?php

use Illuminate\Support\Facades\Route;

Route::redirect('/', '/login')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::inertia('inventory', 'inventory')->name('inventory');
});

require __DIR__.'/settings.php';

Route::fallback(fn () => response()->view('errors.404', [], 404));
