<?php

use App\Models\Category;
use App\Models\Ingredient;
use App\Models\IngredientChange;
use App\Models\Storage;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Support\Carbon;

test('authenticated users can fetch a printable inventory change summary report filtered by date range', function () {
    $user = User::factory()->create();
    $category = Category::query()->create(['name' => 'Dry Goods', 'created_by' => $user->id]);
    $unit = Unit::query()->create(['name' => 'kg', 'created_by' => $user->id]);
    $storage = Storage::query()->create(['name' => 'Main Pantry', 'created_by' => $user->id]);

    $salt = Ingredient::query()->create([
        'name' => 'Salt',
        'code' => 'DRY-0001',
        'category_id' => $category->id,
        'quantity' => 5,
        'unit_id' => $unit->id,
        'storage_id' => $storage->id,
        'status' => 'In Stock',
        'created_by' => $user->id,
    ]);

    $sugar = Ingredient::query()->create([
        'name' => 'Sugar',
        'code' => 'DRY-0002',
        'category_id' => $category->id,
        'quantity' => 3,
        'unit_id' => $unit->id,
        'storage_id' => $storage->id,
        'status' => 'Low Stock',
        'created_by' => $user->id,
    ]);

    IngredientChange::query()->insert([
        [
            'ingredient_id' => $salt->id,
            'edited_by' => $user->id,
            'change_type' => 'added',
            'ingredient_name' => 'Salt',
            'ingredient_code' => 'DRY-0001',
            'changed_fields' => json_encode([
                ['field' => 'Name', 'from' => null, 'to' => 'Salt'],
                ['field' => 'Quantity', 'from' => null, 'to' => '5'],
            ]),
            'created_at' => Carbon::parse('2026-03-02 08:00:00'),
            'updated_at' => Carbon::parse('2026-03-02 08:00:00'),
        ],
        [
            'ingredient_id' => $sugar->id,
            'edited_by' => $user->id,
            'change_type' => 'edited',
            'ingredient_name' => 'Sugar',
            'ingredient_code' => 'DRY-0002',
            'changed_fields' => json_encode([
                ['field' => 'Quantity', 'from' => '5', 'to' => '3'],
            ]),
            'created_at' => Carbon::parse('2026-03-04 09:30:00'),
            'updated_at' => Carbon::parse('2026-03-04 09:30:00'),
        ],
        [
            'ingredient_id' => $salt->id,
            'edited_by' => $user->id,
            'change_type' => 'deleted',
            'ingredient_name' => 'Salt',
            'ingredient_code' => 'DRY-0001',
            'changed_fields' => json_encode([
                ['field' => 'Status', 'from' => 'Out of Stock', 'to' => null],
            ]),
            'created_at' => Carbon::parse('2026-02-25 07:15:00'),
            'updated_at' => Carbon::parse('2026-02-25 07:15:00'),
        ],
    ]);

    $this->actingAs($user);

    $response = $this->getJson(route('inventory.changes.report', [
        'date_from' => '2026-03-01',
        'date_to' => '2026-03-05',
    ]));

    $response->assertOk()
        ->assertJsonPath('filters.date_from', '2026-03-01')
        ->assertJsonPath('filters.date_to', '2026-03-05')
        ->assertJsonPath('summary.total_changes', 2)
        ->assertJsonPath('summary.added_count', 1)
        ->assertJsonPath('summary.edited_count', 1)
        ->assertJsonPath('summary.deleted_count', 0)
        ->assertJsonPath('summary.unique_ingredients', 2)
        ->assertJsonPath('summary.users_involved', 1)
        ->assertJsonCount(2, 'items')
        ->assertJsonFragment([
            'ingredient_name' => 'Salt',
            'change_type' => 'added',
            'change_summary' => 'Name, Quantity',
        ])
        ->assertJsonFragment([
            'ingredient_name' => 'Sugar',
            'change_type' => 'edited',
            'change_summary' => 'Quantity',
        ]);
});

test('inventory change summary reports reject oversized exports', function () {
    $user = User::factory()->create();
    $category = Category::query()->create(['name' => 'Produce', 'created_by' => $user->id]);
    $unit = Unit::query()->create(['name' => 'pcs', 'created_by' => $user->id]);
    $storage = Storage::query()->create(['name' => 'Cold Room', 'created_by' => $user->id]);
    $ingredient = Ingredient::query()->create([
        'name' => 'Tomato',
        'code' => 'PRO-0001',
        'category_id' => $category->id,
        'quantity' => 10,
        'unit_id' => $unit->id,
        'storage_id' => $storage->id,
        'status' => 'In Stock',
        'created_by' => $user->id,
    ]);

    $now = now();
    $rows = collect(range(1, 501))
        ->map(fn (int $id) => [
            'ingredient_id' => $ingredient->id,
            'edited_by' => $user->id,
            'change_type' => 'edited',
            'ingredient_name' => 'Tomato',
            'ingredient_code' => 'PRO-0001',
            'changed_fields' => json_encode([
                ['field' => 'Quantity', 'from' => (string) $id, 'to' => (string) ($id + 1)],
            ]),
            'created_at' => $now,
            'updated_at' => $now,
        ])
        ->all();

    IngredientChange::query()->insert($rows);

    $this->actingAs($user);

    $response = $this->getJson(route('inventory.changes.report'));

    $response->assertStatus(422)
        ->assertJsonPath('limit', 500)
        ->assertJsonPath('total', 501);
});
