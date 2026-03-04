<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Role;
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
     * Show the management page.
     */
    public function index(): Response
    {
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
            ->with('role:id,name,slug')
            ->select(['id', 'name', 'email', 'role_id'])
            ->orderBy('id')
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role?->name ?? 'Employee',
                'role_slug' => $user->role?->slug ?? 'employee',
            ])
            ->values();

        $categories = Category::query()
            ->with('creator:id,name')
            ->select(['id', 'name', 'created_by'])
            ->orderBy('name')
            ->get()
            ->map(fn (Category $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'created_by' => $category->created_by,
                'created_by_name' => $category->creator?->name,
            ])
            ->values();

        return Inertia::render('management', [
            'roles' => $roles,
            'users' => $users,
            'categories' => $categories,
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

        return to_route('management');
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

        return to_route('management');
    }

    /**
     * Reset a user's password from management page.
     */
    public function resetUserPassword(User $user): RedirectResponse
    {
        $user->update([
            'password' => Hash::make('apoy1234'),
        ]);

        return to_route('management');
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

        return to_route('management');
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

        return to_route('management');
    }

    /**
     * Delete a category from management page.
     */
    public function destroyCategory(Category $category): RedirectResponse
    {
        $category->delete();

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
