<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Role;
use App\Models\Storage;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ManagementController extends Controller
{
    /**
     * Supported management tabs.
     *
     * @var list<string>
     */
    private const TABS = ['account', 'category', 'unit', 'storage'];

    /**
     * Show the management page.
     */
    public function index(Request $request): Response
    {
        $validated = $request->validate([
            'active_tab' => ['nullable', 'string', Rule::in(self::TABS)],
            'account_search' => ['nullable', 'string', 'max:100'],
            'account_per_page' => ['nullable', 'integer', Rule::in(['10', '50', '100'])],
            'category_search' => ['nullable', 'string', 'max:100'],
            'category_per_page' => ['nullable', 'integer', Rule::in(['10', '50', '100'])],
            'unit_search' => ['nullable', 'string', 'max:100'],
            'unit_per_page' => ['nullable', 'integer', Rule::in(['10', '50', '100'])],
            'storage_search' => ['nullable', 'string', 'max:100'],
            'storage_per_page' => ['nullable', 'integer', Rule::in(['10', '50', '100'])],
        ]);
        $activeTab = $validated['active_tab'] ?? 'account';
        $accountSearch = trim((string) ($validated['account_search'] ?? ''));
        $categorySearch = trim((string) ($validated['category_search'] ?? ''));
        $unitSearch = trim((string) ($validated['unit_search'] ?? ''));
        $storageSearch = trim((string) ($validated['storage_search'] ?? ''));
        $accountPerPage = (int) ($validated['account_per_page'] ?? 10);
        $categoryPerPage = (int) ($validated['category_per_page'] ?? 10);
        $unitPerPage = (int) ($validated['unit_per_page'] ?? 10);
        $storagePerPage = (int) ($validated['storage_per_page'] ?? 10);

        $roles = Role::query()
            ->whereIn('slug', ['admin', 'employee'])
            ->orderByRaw("CASE slug WHEN 'admin' THEN 0 WHEN 'employee' THEN 1 ELSE 2 END")
            ->get(['id', 'name', 'slug'])
            ->map(fn (Role $role) => [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
            ])
            ->values();

        $users = User::query()
            ->leftJoin('roles', 'users.role_id', '=', 'roles.id')
            ->select(['users.id', 'users.name', 'users.email', 'users.role_id'])
            ->selectRaw('roles.name as role_name')
            ->selectRaw('roles.slug as role_slug')
            ->when($accountSearch !== '', function ($query) use ($accountSearch) {
                $query->where(function ($innerQuery) use ($accountSearch) {
                    $innerQuery
                        ->where('users.name', 'like', "%{$accountSearch}%")
                        ->orWhere('users.email', 'like', "%{$accountSearch}%")
                        ->orWhere('roles.name', 'like', "%{$accountSearch}%")
                        ->orWhere('roles.slug', 'like', "%{$accountSearch}%");
                });
            })
            ->orderBy('users.id')
            ->paginate($accountPerPage, ['*'], 'account_page')
            ->withQueryString()
            ->through(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => (string) ($user->role_name ?? 'Employee'),
                'role_slug' => (string) ($user->role_slug ?? 'employee'),
            ]);

        $categories = Category::query()
            ->leftJoin('users as creators', 'categories.created_by', '=', 'creators.id')
            ->select(['categories.id', 'categories.name', 'categories.created_by'])
            ->selectRaw('creators.name as created_by_name')
            ->when($categorySearch !== '', function ($query) use ($categorySearch) {
                $query->where(function ($innerQuery) use ($categorySearch) {
                    $innerQuery
                        ->where('categories.name', 'like', "%{$categorySearch}%")
                        ->orWhere('creators.name', 'like', "%{$categorySearch}%");
                });
            })
            ->orderBy('categories.name')
            ->paginate($categoryPerPage, ['*'], 'category_page')
            ->withQueryString()
            ->through(fn (Category $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'created_by' => $category->created_by,
                'created_by_name' => $category->created_by_name,
            ]);

        $units = Unit::query()
            ->leftJoin('users as creators', 'units.created_by', '=', 'creators.id')
            ->select(['units.id', 'units.name', 'units.created_by'])
            ->selectRaw('creators.name as created_by_name')
            ->when($unitSearch !== '', function ($query) use ($unitSearch) {
                $query->where(function ($innerQuery) use ($unitSearch) {
                    $innerQuery
                        ->where('units.name', 'like', "%{$unitSearch}%")
                        ->orWhere('creators.name', 'like', "%{$unitSearch}%");
                });
            })
            ->orderBy('units.name')
            ->paginate($unitPerPage, ['*'], 'unit_page')
            ->withQueryString()
            ->through(fn (Unit $unit) => [
                'id' => $unit->id,
                'name' => $unit->name,
                'created_by' => $unit->created_by,
                'created_by_name' => $unit->created_by_name,
            ]);

        $storages = Storage::query()
            ->leftJoin('users as creators', 'storages.created_by', '=', 'creators.id')
            ->select(['storages.id', 'storages.name', 'storages.created_by'])
            ->selectRaw('creators.name as created_by_name')
            ->when($storageSearch !== '', function ($query) use ($storageSearch) {
                $query->where(function ($innerQuery) use ($storageSearch) {
                    $innerQuery
                        ->where('storages.name', 'like', "%{$storageSearch}%")
                        ->orWhere('creators.name', 'like', "%{$storageSearch}%");
                });
            })
            ->orderBy('storages.name')
            ->paginate($storagePerPage, ['*'], 'storage_page')
            ->withQueryString()
            ->through(fn (Storage $storage) => [
                'id' => $storage->id,
                'name' => $storage->name,
                'created_by' => $storage->created_by,
                'created_by_name' => $storage->created_by_name,
            ]);

        return Inertia::render('management', [
            'roles' => $roles,
            'users' => $users,
            'categories' => $categories,
            'units' => $units,
            'storages' => $storages,
            'filters' => [
                'active_tab' => $activeTab,
                'account_search' => $accountSearch,
                'account_per_page' => $accountPerPage,
                'category_search' => $categorySearch,
                'category_per_page' => $categoryPerPage,
                'unit_search' => $unitSearch,
                'unit_per_page' => $unitPerPage,
                'storage_search' => $storageSearch,
                'storage_per_page' => $storagePerPage,
            ],
        ]);
    }

    /**
     * Create a user from management page.
     */
    public function storeUser(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'role' => ['required', 'string', Rule::in(['admin', 'employee'])],
        ]);

        $role = Role::query()
            ->where('slug', $validated['role'])
            ->firstOrFail(['id']);

        User::query()->create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make('apoy1234'),
            'role_id' => $role->id,
        ]);

        return redirect()->back();
    }

    /**
     * Update a user from management page.
     */
    public function updateUser(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'role' => ['required', 'string', Rule::in(['admin', 'employee'])],
        ]);

        $role = Role::query()
            ->where('slug', $validated['role'])
            ->firstOrFail(['id']);

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role_id' => $role->id,
        ]);

        return redirect()->back();
    }

    /**
     * Reset a user's password from management page.
     */
    public function resetUserPassword(User $user): RedirectResponse
    {
        $user->update([
            'password' => Hash::make('apoy1234'),
        ]);

        return redirect()->back();
    }

    /**
     * Create a category from management page.
     */
    public function storeCategory(Request $request): RedirectResponse
    {
        $request->merge([
            'name' => trim((string) $request->input('name')),
        ]);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:categories,name'],
        ]);

        Category::query()->create([
            'name' => $validated['name'],
            'created_by' => $request->user()?->id,
        ]);

        return redirect()->back();
    }

    /**
     * Update a category from management page.
     */
    public function updateCategory(Request $request, Category $category): RedirectResponse
    {
        $request->merge([
            'name' => trim((string) $request->input('name')),
        ]);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('categories', 'name')->ignore($category->id),
            ],
        ]);

        $category->update([
            'name' => $validated['name'],
        ]);

        return redirect()->back();
    }

    /**
     * Delete a category from management page.
     */
    public function destroyCategory(Category $category): RedirectResponse
    {
        $category->delete();

        return redirect()->back();
    }

    /**
     * Create a unit from management page.
     */
    public function storeUnit(Request $request): RedirectResponse
    {
        $request->merge([
            'name' => trim((string) $request->input('name')),
        ]);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:units,name'],
        ]);

        Unit::query()->create([
            'name' => $validated['name'],
            'created_by' => $request->user()?->id,
        ]);

        return redirect()->back();
    }

    /**
     * Update a unit from management page.
     */
    public function updateUnit(Request $request, Unit $unit): RedirectResponse
    {
        $request->merge([
            'name' => trim((string) $request->input('name')),
        ]);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('units', 'name')->ignore($unit->id),
            ],
        ]);

        $unit->update([
            'name' => $validated['name'],
        ]);

        return redirect()->back();
    }

    /**
     * Delete a unit from management page.
     */
    public function destroyUnit(Unit $unit): RedirectResponse
    {
        $unit->delete();

        return redirect()->back();
    }

    /**
     * Create a storage from management page.
     */
    public function storeStorage(Request $request): RedirectResponse
    {
        $request->merge([
            'name' => trim((string) $request->input('name')),
        ]);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:storages,name'],
        ]);

        Storage::query()->create([
            'name' => $validated['name'],
            'created_by' => $request->user()?->id,
        ]);

        return redirect()->back();
    }

    /**
     * Update a storage from management page.
     */
    public function updateStorage(Request $request, Storage $storage): RedirectResponse
    {
        $request->merge([
            'name' => trim((string) $request->input('name')),
        ]);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('storages', 'name')->ignore($storage->id),
            ],
        ]);

        $storage->update([
            'name' => $validated['name'],
        ]);

        return redirect()->back();
    }

    /**
     * Delete a storage from management page.
     */
    public function destroyStorage(Storage $storage): RedirectResponse
    {
        $storage->delete();

        return to_route('management');
    }

    /**
     * Delete a user from management page.
     */
    public function destroyUser(Request $request, User $user): RedirectResponse
    {
        if ($request->user()->is($user)) {
            return back()->withErrors([
                'account' => 'You cannot delete your own account.',
            ]);
        }

        $user->delete();

        return to_route('management');
    }
}
