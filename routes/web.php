<?php

use App\Http\Controllers\ManagementController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/login')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
    Route::inertia('inventory', 'inventory')->name('inventory');
    Route::get('management', [ManagementController::class, 'index'])
        ->name('management');
    Route::post('management/users', [ManagementController::class, 'storeUser'])
        ->name('management.users.store');
    Route::put('management/users/{user}', [ManagementController::class, 'updateUser'])
        ->name('management.users.update');
    Route::delete('management/users/{user}', [ManagementController::class, 'destroyUser'])
        ->name('management.users.destroy');
});

require __DIR__.'/settings.php';

Route::fallback(fn () => response()->view('errors.404', [], 404));
