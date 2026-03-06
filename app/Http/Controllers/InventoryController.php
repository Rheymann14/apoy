<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Ingredient;
use App\Models\IngredientChange;
use App\Models\Storage;
use App\Models\Unit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
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
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'sort' => ['nullable', 'string', Rule::in(['name', 'code', 'category', 'quantity', 'unit', 'storage', 'status'])],
            'direction' => ['nullable', 'string', Rule::in(['asc', 'desc'])],
            'per_page' => ['nullable', 'integer', Rule::in(['10', '50', '100'])],
        ]);
        $search = trim((string) ($validated['search'] ?? ''));
        $sort = $validated['sort'] ?? null;
        $direction = $validated['direction'] ?? 'asc';
        $perPage = (int) ($validated['per_page'] ?? 10);
        $numericSearch = $search !== '' && ctype_digit($search);

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

        $sortColumn = match ($sort) {
            'name' => 'ingredients.name',
            'code' => 'ingredients.code',
            'category' => 'categories.name',
            'quantity' => 'ingredients.quantity',
            'unit' => 'units.name',
            'storage' => 'storages.name',
            'status' => 'ingredients.status',
            default => null,
        };

        $ingredients = Ingredient::query()
            ->leftJoin('categories', 'ingredients.category_id', '=', 'categories.id')
            ->leftJoin('units', 'ingredients.unit_id', '=', 'units.id')
            ->leftJoin('storages', 'ingredients.storage_id', '=', 'storages.id')
            ->leftJoin('users as creators', 'ingredients.created_by', '=', 'creators.id')
            ->select([
                'ingredients.id',
                'ingredients.name',
                'ingredients.code',
                'ingredients.category_id',
                'ingredients.quantity',
                'ingredients.unit_id',
                'ingredients.storage_id',
                'ingredients.status',
                'ingredients.created_by',
            ])
            ->selectRaw('categories.name as category_name')
            ->selectRaw('units.name as unit_name')
            ->selectRaw('storages.name as storage_name')
            ->selectRaw('creators.name as created_by_name')
            ->when($search !== '', function ($query) use ($search, $numericSearch) {
                $query->where(function ($innerQuery) use ($search, $numericSearch) {
                    $innerQuery
                        ->where('ingredients.name', 'like', "%{$search}%")
                        ->orWhere('ingredients.code', 'like', "%{$search}%")
                        ->orWhere('categories.name', 'like', "%{$search}%")
                        ->orWhere('units.name', 'like', "%{$search}%")
                        ->orWhere('storages.name', 'like', "%{$search}%")
                        ->orWhere('ingredients.status', 'like', "%{$search}%");

                    if ($numericSearch) {
                        $innerQuery->orWhere('ingredients.quantity', (int) $search);
                    }
                });
            })
            ->when(
                $sortColumn !== null,
                fn ($query) => $query
                    ->orderBy($sortColumn, $direction)
                    ->orderBy('ingredients.id'),
                fn ($query) => $query->orderByDesc('ingredients.id'),
            )
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Ingredient $ingredient) => [
                'id' => $ingredient->id,
                'name' => $ingredient->name,
                'code' => $ingredient->code,
                'category_id' => $ingredient->category_id,
                'category' => (string) ($ingredient->category_name ?? ''),
                'quantity' => (int) $ingredient->quantity,
                'unit_id' => $ingredient->unit_id,
                'unit' => (string) ($ingredient->unit_name ?? ''),
                'storage_id' => $ingredient->storage_id,
                'storage' => (string) ($ingredient->storage_name ?? ''),
                'status' => $ingredient->status,
                'created_by_name' => $ingredient->created_by_name,
            ]);

        return Inertia::render('inventory', [
            'categories' => $categories,
            'units' => $units,
            'storages' => $storages,
            'ingredients' => $ingredients,
            'filters' => [
                'search' => $search,
                'sort' => $sort,
                'direction' => $direction,
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Show inventory change history.
     */
    public function changes(Request $request): Response
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'per_page' => ['nullable', 'integer', Rule::in(['10', '50', '100'])],
        ]);

        $search = trim((string) ($validated['search'] ?? ''));
        $dateFrom = $validated['date_from'] ?? null;
        $dateTo = $validated['date_to'] ?? null;
        $perPage = (int) ($validated['per_page'] ?? 10);
        $dateRangeStart = $dateFrom ? Carbon::parse($dateFrom)->startOfDay() : null;
        $dateRangeEnd = $dateTo ? Carbon::parse($dateTo)->endOfDay() : null;

        $changesQuery = IngredientChange::query()
            ->with([
                'ingredient:id,name,code',
                'editor:id,name',
            ])
            ->when($search !== '', fn ($query) => $query->where('ingredient_code', 'like', "%{$search}%"))
            ->when($dateRangeStart, fn ($query, $value) => $query->where('created_at', '>=', $value))
            ->when($dateRangeEnd, fn ($query, $value) => $query->where('created_at', '<=', $value))
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        $changes = $changesQuery
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (IngredientChange $change) => [
                'id' => $change->id,
                'change_type' => (string) ($change->change_type ?: 'edited'),
                'ingredient_name' => $change->ingredient_name ?: ($change->ingredient?->name ?? 'Deleted Ingredient'),
                'ingredient_code' => $change->ingredient_code ?: ($change->ingredient?->code ?? 'N/A'),
                'edited_by_name' => $change->editor?->name ?? 'System',
                'changed_fields' => collect($change->changed_fields ?? [])
                    ->map(fn (array $field) => [
                        'field' => (string) ($field['field'] ?? ''),
                        'from' => isset($field['from']) ? (string) $field['from'] : null,
                        'to' => isset($field['to']) ? (string) $field['to'] : null,
                    ])
                    ->filter(fn (array $field) => $field['field'] !== '')
                    ->values(),
                'changed_at' => $change->created_at?->format('M d, Y h:i A'),
            ]);

        return Inertia::render('inventory-changes', [
            'changes' => $changes,
            'filters' => [
                'search' => $search,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Create an ingredient from inventory page.
     */
    public function storeIngredient(Request $request): RedirectResponse
    {
        $validated = $this->validateIngredient($request);
        $normalizedName = $this->normalizeName($validated['name']);

        $category = Category::query()
            ->findOrFail($validated['category_id'], ['id', 'name']);
        $unit = Unit::query()
            ->findOrFail($validated['unit_id'], ['id', 'name']);
        $storage = Storage::query()
            ->findOrFail($validated['storage_id'], ['id', 'name']);
        $quantity = (int) $validated['quantity'];
        $status = (string) $validated['status'];

        $ingredient = Ingredient::query()->create([
            'name' => $normalizedName,
            'code' => '',
            'category_id' => $category->id,
            'quantity' => $quantity,
            'unit_id' => $unit->id,
            'storage_id' => $storage->id,
            'status' => $status,
            'created_by' => $request->user()?->id,
        ]);

        $code = $this->buildIngredientCode($category->name, $ingredient->id);
        $ingredient->update(['code' => $code]);

        IngredientChange::query()->create([
            'ingredient_id' => $ingredient->id,
            'edited_by' => $request->user()?->id,
            'change_type' => 'added',
            'ingredient_name' => $normalizedName,
            'ingredient_code' => $code,
            'changed_fields' => [
                [
                    'field' => 'Name',
                    'from' => null,
                    'to' => $normalizedName,
                ],
                [
                    'field' => 'Category',
                    'from' => null,
                    'to' => $category->name,
                ],
                [
                    'field' => 'Quantity',
                    'from' => null,
                    'to' => (string) $quantity,
                ],
                [
                    'field' => 'Unit',
                    'from' => null,
                    'to' => $unit->name,
                ],
                [
                    'field' => 'Storage',
                    'from' => null,
                    'to' => $storage->name,
                ],
                [
                    'field' => 'Status',
                    'from' => null,
                    'to' => $status,
                ],
            ],
        ]);

        return redirect()->back();
    }

    /**
     * Update an ingredient from inventory page.
     */
    public function updateIngredient(Request $request, Ingredient $ingredient): RedirectResponse
    {
        $validated = $this->validateIngredient($request);
        $ingredient->loadMissing([
            'category:id,name',
            'unit:id,name',
            'storage:id,name',
        ]);

        $normalizedName = $this->normalizeName($validated['name']);
        $newCategory = Category::query()
            ->findOrFail($validated['category_id'], ['id', 'name']);
        $newUnit = Unit::query()
            ->findOrFail($validated['unit_id'], ['id', 'name']);
        $newStorage = Storage::query()
            ->findOrFail($validated['storage_id'], ['id', 'name']);
        $newQuantity = (int) $validated['quantity'];
        $newStatus = (string) $validated['status'];
        $newCode = $this->buildIngredientCode($newCategory->name, $ingredient->id);

        $changedFields = [];

        if ($ingredient->name !== $normalizedName) {
            $changedFields[] = [
                'field' => 'Name',
                'from' => $ingredient->name,
                'to' => $normalizedName,
            ];
        }

        if ((int) $ingredient->category_id !== (int) $newCategory->id) {
            $changedFields[] = [
                'field' => 'Category',
                'from' => $ingredient->category?->name ?? '',
                'to' => $newCategory->name,
            ];
        }

        if ((int) $ingredient->quantity !== $newQuantity) {
            $changedFields[] = [
                'field' => 'Quantity',
                'from' => (string) $ingredient->quantity,
                'to' => (string) $newQuantity,
            ];
        }

        if ((int) $ingredient->unit_id !== (int) $newUnit->id) {
            $changedFields[] = [
                'field' => 'Unit',
                'from' => $ingredient->unit?->name ?? '',
                'to' => $newUnit->name,
            ];
        }

        if ((int) $ingredient->storage_id !== (int) $newStorage->id) {
            $changedFields[] = [
                'field' => 'Storage',
                'from' => $ingredient->storage?->name ?? '',
                'to' => $newStorage->name,
            ];
        }

        if ((string) $ingredient->status !== $newStatus) {
            $changedFields[] = [
                'field' => 'Status',
                'from' => $ingredient->status,
                'to' => $newStatus,
            ];
        }

        $ingredient->update([
            'name' => $normalizedName,
            'code' => $newCode,
            'category_id' => $newCategory->id,
            'quantity' => $newQuantity,
            'unit_id' => $newUnit->id,
            'storage_id' => $newStorage->id,
            'status' => $newStatus,
        ]);

        if ($changedFields !== []) {
            IngredientChange::query()->create([
                'ingredient_id' => $ingredient->id,
                'edited_by' => $request->user()?->id,
                'change_type' => 'edited',
                'ingredient_name' => $normalizedName,
                'ingredient_code' => $newCode,
                'changed_fields' => $changedFields,
            ]);
        }

        return redirect()->back();
    }

    /**
     * Delete an ingredient from inventory page.
     */
    public function destroyIngredient(Request $request, Ingredient $ingredient): RedirectResponse
    {
        $ingredient->loadMissing([
            'category:id,name',
            'unit:id,name',
            'storage:id,name',
        ]);

        IngredientChange::query()->create([
            'ingredient_id' => $ingredient->id,
            'edited_by' => $request->user()?->id,
            'change_type' => 'deleted',
            'ingredient_name' => $ingredient->name,
            'ingredient_code' => $ingredient->code,
            'changed_fields' => [
                [
                    'field' => 'Name',
                    'from' => $ingredient->name,
                    'to' => null,
                ],
                [
                    'field' => 'Category',
                    'from' => $ingredient->category?->name ?? null,
                    'to' => null,
                ],
                [
                    'field' => 'Quantity',
                    'from' => (string) $ingredient->quantity,
                    'to' => null,
                ],
                [
                    'field' => 'Unit',
                    'from' => $ingredient->unit?->name ?? null,
                    'to' => null,
                ],
                [
                    'field' => 'Storage',
                    'from' => $ingredient->storage?->name ?? null,
                    'to' => null,
                ],
                [
                    'field' => 'Status',
                    'from' => $ingredient->status,
                    'to' => null,
                ],
            ],
        ]);

        $ingredient->delete();

        return redirect()->back();
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
