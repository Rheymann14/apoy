<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Ingredient;
use App\Models\Storage;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Allowed inventory status values.
     *
     * @var list<string>
     */
    private const STATUSES = ['In Stock', 'Low Stock', 'Out of Stock'];

    /**
     * Maximum number of rows allowed in a printable status report.
     */
    private const STATUS_REPORT_LIMIT = 500;

    /**
     * Show the dashboard page.
     */
    public function index(): Response
    {
        $ingredientSummary = Ingredient::query()
            ->selectRaw('COUNT(*) as total_ingredients')
            ->selectRaw('COALESCE(SUM(quantity), 0) as total_quantity')
            ->first();

        $statusCounts = Ingredient::query()
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $statusChart = collect([
            'In Stock',
            'Low Stock',
            'Out of Stock',
        ])->map(fn (string $status) => [
            'label' => $status,
            'value' => (int) ($statusCounts[$status] ?? 0),
        ])->values();

        $counts = [
            'total_ingredients' => (int) ($ingredientSummary?->total_ingredients ?? 0),
            'total_quantity' => (int) ($ingredientSummary?->total_quantity ?? 0),
            'total_categories' => Category::query()->count(),
            'total_storages' => Storage::query()->count(),
            'total_users' => User::query()->count(),
            'in_stock' => (int) ($statusCounts['In Stock'] ?? 0),
            'low_stock' => (int) ($statusCounts['Low Stock'] ?? 0),
            'out_of_stock' => (int) ($statusCounts['Out of Stock'] ?? 0),
        ];

        $dailyAdded = $this->buildDailyAddedChart();

        $categoryChart = Category::query()
            ->leftJoin('ingredients', 'ingredients.category_id', '=', 'categories.id')
            ->select('categories.id', 'categories.name')
            ->selectRaw('COUNT(ingredients.id) as total')
            ->groupBy('categories.id', 'categories.name')
            ->orderByDesc('total')
            ->orderBy('categories.name')
            ->limit(6)
            ->get()
            ->map(fn ($category) => [
                'label' => $category->name,
                'value' => (int) $category->total,
            ])
            ->values();

        $recentIngredients = Ingredient::query()
            ->with(['category:id,name', 'storage:id,name'])
            ->select(['id', 'name', 'code', 'status', 'category_id', 'storage_id', 'created_at'])
            ->latest('created_at')
            ->limit(5)
            ->get()
            ->map(fn (Ingredient $ingredient) => [
                'id' => $ingredient->id,
                'name' => $ingredient->name,
                'code' => $ingredient->code,
                'status' => $ingredient->status,
                'category' => $ingredient->category?->name ?? 'Uncategorized',
                'storage' => $ingredient->storage?->name ?? 'Unassigned',
                'created_at_human' => $ingredient->created_at?->diffForHumans(),
            ])
            ->values();

        return Inertia::render('dashboard', [
            'counts' => $counts,
            'statusChart' => $statusChart,
            'dailyAdded' => $dailyAdded,
            'categoryChart' => $categoryChart,
            'recentIngredients' => $recentIngredients,
        ]);
    }

    /**
     * Return report rows for a single inventory status.
     */
    public function statusReport(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:'.implode(',', self::STATUSES)],
        ]);

        $itemsQuery = Ingredient::query()
            ->leftJoin('categories', 'ingredients.category_id', '=', 'categories.id')
            ->leftJoin('units', 'ingredients.unit_id', '=', 'units.id')
            ->leftJoin('storages', 'ingredients.storage_id', '=', 'storages.id')
            ->where('ingredients.status', $validated['status']);

        $totalItems = (clone $itemsQuery)->count('ingredients.id');

        if ($totalItems > self::STATUS_REPORT_LIMIT) {
            return response()->json([
                'message' => sprintf(
                    'This report includes %d items. Please narrow the status list to %d items or fewer before exporting.',
                    $totalItems,
                    self::STATUS_REPORT_LIMIT,
                ),
                'limit' => self::STATUS_REPORT_LIMIT,
                'total' => $totalItems,
            ], 422);
        }

        $items = $itemsQuery
            ->select([
                'ingredients.id',
                'ingredients.name',
                'ingredients.code',
                'ingredients.quantity',
                'ingredients.status',
            ])
            ->selectRaw('categories.name as category_name')
            ->selectRaw('units.name as unit_name')
            ->selectRaw('storages.name as storage_name')
            ->orderBy('ingredients.name')
            ->orderBy('ingredients.code')
            ->get()
            ->map(fn (object $ingredient) => [
                'id' => (int) $ingredient->id,
                'name' => $ingredient->name,
                'code' => $ingredient->code,
                'category' => $ingredient->category_name ?? 'Uncategorized',
                'quantity' => (int) $ingredient->quantity,
                'unit' => $ingredient->unit_name ?? 'N/A',
                'storage' => $ingredient->storage_name ?? 'Unassigned',
                'status' => $ingredient->status,
            ])
            ->values();

        return response()->json([
            'items' => $items,
            'total' => $totalItems,
        ]);
    }

    /**
     * Build a seven-day trend chart for recently added ingredients.
     *
     * @return \Illuminate\Support\Collection<int, array{label: string, value: int}>
     */
    private function buildDailyAddedChart()
    {
        $startDate = now()->startOfDay()->subDays(6);

        $groupedDailyCounts = Ingredient::query()
            ->selectRaw('DATE(created_at) as day, COUNT(*) as total')
            ->where('created_at', '>=', $startDate)
            ->groupBy('day')
            ->orderBy('day')
            ->pluck('total', 'day');

        return collect(range(0, 6))->map(function (int $offset) use ($startDate, $groupedDailyCounts) {
            $date = (clone $startDate)->addDays($offset);
            $dateKey = $date->toDateString();

            return [
                'label' => $date->format('M j'),
                'value' => (int) ($groupedDailyCounts[$dateKey] ?? 0),
            ];
        })->values();
    }
}
