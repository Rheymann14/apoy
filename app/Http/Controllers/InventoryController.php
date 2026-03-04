<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Ingredient;
use App\Models\Storage;
use App\Models\Unit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    /**
     * Allowed inventory status values.
     *
     * @var list<string>
     */
    private const STATUSES = ['In Stock', 'Low Stock', 'Out of Stock'];

    /**
     * Show the inventory page.
     */
    public function index(): Response
    {
        $categories = Category::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Category $category) => [
                'id' => $category->id,
                'name' => $category->name,
            ])
            ->values();

        $units = Unit::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Unit $unit) => [
                'id' => $unit->id,
                'name' => $unit->name,
            ])
            ->values();

        $storages = Storage::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Storage $storage) => [
                'id' => $storage->id,
                'name' => $storage->name,
            ])
            ->values();

        $ingredients = Ingredient::query()
            ->with([
                'category:id,name',
                'unit:id,name',
                'storage:id,name',
            ])
            ->select([
                'id',
                'name',
                'code',
                'category_id',
                'quantity',
                'unit_id',
                'storage_id',
                'status',
            ])
            ->orderByDesc('id')
            ->get()
            ->map(fn (Ingredient $ingredient) => [
                'id' => $ingredient->id,
                'name' => $ingredient->name,
                'code' => $ingredient->code,
                'category_id' => $ingredient->category_id,
                'category' => $ingredient->category?->name ?? '',
                'quantity' => $ingredient->quantity,
                'unit_id' => $ingredient->unit_id,
                'unit' => $ingredient->unit?->name ?? '',
                'storage_id' => $ingredient->storage_id,
                'storage' => $ingredient->storage?->name ?? '',
                'status' => $ingredient->status,
            ])
            ->values();

        return Inertia::render('inventory', [
            'categories' => $categories,
            'units' => $units,
            'storages' => $storages,
            'ingredients' => $ingredients,
        ]);
    }

    /**
     * Create an ingredient from inventory page.
     */
    public function storeIngredient(Request $request): RedirectResponse
    {
        $validated = $this->validateIngredient($request);

        $category = Category::query()
            ->findOrFail($validated['category_id'], ['id', 'name']);

        $ingredient = Ingredient::query()->create([
            'name' => $this->normalizeName($validated['name']),
            'code' => '',
            'category_id' => $category->id,
            'quantity' => $validated['quantity'],
            'unit_id' => $validated['unit_id'],
            'storage_id' => $validated['storage_id'],
            'status' => $validated['status'],
            'created_by' => $request->user()?->id,
        ]);

        $ingredient->update([
            'code' => $this->buildIngredientCode($category->name, $ingredient->id),
        ]);

        return to_route('inventory');
    }

    /**
     * Update an ingredient from inventory page.
     */
    public function updateIngredient(Request $request, Ingredient $ingredient): RedirectResponse
    {
        $validated = $this->validateIngredient($request);

        $category = Category::query()
            ->findOrFail($validated['category_id'], ['id', 'name']);

        $ingredient->update([
            'name' => $this->normalizeName($validated['name']),
            'code' => $this->buildIngredientCode($category->name, $ingredient->id),
            'category_id' => $category->id,
            'quantity' => $validated['quantity'],
            'unit_id' => $validated['unit_id'],
            'storage_id' => $validated['storage_id'],
            'status' => $validated['status'],
        ]);

        return to_route('inventory');
    }

    /**
     * Delete an ingredient from inventory page.
     */
    public function destroyIngredient(Ingredient $ingredient): RedirectResponse
    {
        $ingredient->delete();

        return to_route('inventory');
    }

    /**
     * Validate ingredient payload.
     *
     * @return array<string, mixed>
     */
    private function validateIngredient(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'category_id' => ['required', 'integer', Rule::exists('categories', 'id')],
            'quantity' => ['required', 'integer', 'min:0'],
            'unit_id' => ['required', 'integer', Rule::exists('units', 'id')],
            'storage_id' => ['required', 'integer', Rule::exists('storages', 'id')],
            'status' => ['required', 'string', Rule::in(self::STATUSES)],
        ]);
    }

    /**
     * Normalize ingredient names before persistence.
     */
    private function normalizeName(string $name): string
    {
        /** @var string $normalized */
        $normalized = preg_replace('/\s+/', ' ', trim($name)) ?? trim($name);

        return $normalized;
    }

    /**
     * Build inventory code using category prefix and ingredient id.
     */
    private function buildIngredientCode(string $category, int $id): string
    {
        $prefix = strtoupper((string) preg_replace('/[^A-Z]/', '', strtoupper($category)));
        $prefix = str_pad(substr($prefix, 0, 3), 3, 'X');

        return sprintf('%s-%04d', $prefix, $id);
    }
}
