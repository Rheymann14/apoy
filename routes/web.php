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
    Route::put('management/users/{user}/reset-password', [ManagementController::class, 'resetUserPassword'])
        ->name('management.users.reset-password');
    Route::delete('management/users/{user}', [ManagementController::class, 'destroyUser'])
        ->name('management.users.destroy');
    Route::post('management/categories', [ManagementController::class, 'storeCategory'])
        ->name('management.categories.store');
    Route::put('management/categories/{category}', [ManagementController::class, 'updateCategory'])
        ->name('management.categories.update');
    Route::delete('management/categories/{category}', [ManagementController::class, 'destroyCategory'])
        ->name('management.categories.destroy');
    Route::post('management/units', [ManagementController::class, 'storeUnit'])
        ->name('management.units.store');
    Route::put('management/units/{unit}', [ManagementController::class, 'updateUnit'])
        ->name('management.units.update');
    Route::delete('management/units/{unit}', [ManagementController::class, 'destroyUnit'])
        ->name('management.units.destroy');
    Route::post('management/storages', [ManagementController::class, 'storeStorage'])
        ->name('management.storages.store');
    Route::put('management/storages/{storage}', [ManagementController::class, 'updateStorage'])
        ->name('management.storages.update');
    Route::delete('management/storages/{storage}', [ManagementController::class, 'destroyStorage'])
        ->name('management.storages.destroy');
});

require __DIR__.'/settings.php';

Route::fallback(fn () => response()->view('errors.404', [], 404));
