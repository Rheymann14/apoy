<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Ingredient;
use App\Models\Storage;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Show the dashboard page.
     */
    public function index(): Response
    {
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
            'total_ingredients' => Ingredient::query()->count(),
            'total_quantity' => (int) Ingredient::query()->sum('quantity'),
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
