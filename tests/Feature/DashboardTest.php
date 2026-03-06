<?php

use App\Models\Category;
use App\Models\Ingredient;
use App\Models\Storage;
use App\Models\Unit;
use App\Models\User;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

test('authenticated users can fetch a printable status report', function () {
    $user = User::factory()->create();
    $category = Category::query()->create(['name' => 'Dry Goods', 'created_by' => $user->id]);
    $unit = Unit::query()->create(['name' => 'kg', 'created_by' => $user->id]);
    $storage = Storage::query()->create(['name' => 'Pantry', 'created_by' => $user->id]);

    Ingredient::query()->create([
        'name' => 'Salt',
        'code' => 'DRY-0001',
        'category_id' => $category->id,
        'quantity' => 10,
        'unit_id' => $unit->id,
        'storage_id' => $storage->id,
        'status' => 'In Stock',
        'created_by' => $user->id,
    ]);

    $this->actingAs($user);

    $response = $this->getJson(route('dashboard.reports.status', [
        'status' => 'In Stock',
    ]));

    $response->assertOk()
        ->assertJsonPath('total', 1)
        ->assertJsonCount(1, 'items')
        ->assertJsonPath('items.0.name', 'Salt')
        ->assertJsonPath('items.0.category', 'Dry Goods')
        ->assertJsonPath('items.0.unit', 'kg')
        ->assertJsonPath('items.0.storage', 'Pantry');
});

test('status reports reject oversized exports', function () {
    $user = User::factory()->create();
    $category = Category::query()->create(['name' => 'Produce', 'created_by' => $user->id]);
    $unit = Unit::query()->create(['name' => 'pcs', 'created_by' => $user->id]);
    $storage = Storage::query()->create(['name' => 'Cold Room', 'created_by' => $user->id]);

    $now = now();
    $rows = collect(range(1, 501))
        ->map(fn (int $id) => [
            'name' => sprintf('Item %03d', $id),
            'code' => sprintf('PRD-%04d', $id),
            'category_id' => $category->id,
            'quantity' => 1,
            'unit_id' => $unit->id,
            'storage_id' => $storage->id,
            'status' => 'Low Stock',
            'created_by' => $user->id,
            'created_at' => $now,
            'updated_at' => $now,
        ])
        ->all();

    Ingredient::query()->insert($rows);

    $this->actingAs($user);

    $response = $this->getJson(route('dashboard.reports.status', [
        'status' => 'Low Stock',
    ]));

    $response->assertStatus(422)
        ->assertJsonPath('limit', 500)
        ->assertJsonPath('total', 501);
});
