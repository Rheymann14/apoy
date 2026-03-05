<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('ingredient_changes')) {
            return;
        }

        if (! Schema::hasColumn('ingredient_changes', 'change_type')) {
            Schema::table('ingredient_changes', function (Blueprint $table) {
                $table->string('change_type')->default('edited')->after('edited_by');
            });
        }

        if (! Schema::hasColumn('ingredient_changes', 'ingredient_name')) {
            Schema::table('ingredient_changes', function (Blueprint $table) {
                $table->string('ingredient_name')->default('Deleted Ingredient')->after('change_type');
            });
        }

        if (! Schema::hasColumn('ingredient_changes', 'ingredient_code')) {
            Schema::table('ingredient_changes', function (Blueprint $table) {
                $table->string('ingredient_code')->default('N/A')->after('ingredient_name');
            });
        }

        Schema::table('ingredient_changes', function (Blueprint $table) {
            try {
                $table->dropForeign(['ingredient_id']);
            } catch (Throwable) {
                // Ignore when foreign key does not exist.
            }
        });

        Schema::table('ingredient_changes', function (Blueprint $table) {
            $table->unsignedBigInteger('ingredient_id')->nullable()->change();
        });

        Schema::table('ingredient_changes', function (Blueprint $table) {
            $table->foreign('ingredient_id')
                ->references('id')
                ->on('ingredients')
                ->cascadeOnUpdate()
                ->nullOnDelete();
        });

        $changes = DB::table('ingredient_changes')
            ->select(['id', 'ingredient_id', 'change_type', 'ingredient_name', 'ingredient_code'])
            ->orderBy('id')
            ->get();

        foreach ($changes as $change) {
            $ingredient = null;

            if ($change->ingredient_id !== null) {
                $ingredient = DB::table('ingredients')
                    ->where('id', $change->ingredient_id)
                    ->first(['name', 'code']);
            }

            DB::table('ingredient_changes')
                ->where('id', $change->id)
                ->update([
                    'change_type' => $change->change_type ?: 'edited',
                    'ingredient_name' => $change->ingredient_name ?: ($ingredient?->name ?? 'Deleted Ingredient'),
                    'ingredient_code' => $change->ingredient_code ?: ($ingredient?->code ?? 'N/A'),
                ]);
        }

        if (! $this->hasIndex('ingredient_changes', 'ingredient_changes_ingredient_code_created_at_index')) {
            Schema::table('ingredient_changes', function (Blueprint $table) {
                $table->index(['ingredient_code', 'created_at']);
            });
        }

        if (! $this->hasIndex('ingredient_changes', 'ingredient_changes_change_type_created_at_index')) {
            Schema::table('ingredient_changes', function (Blueprint $table) {
                $table->index(['change_type', 'created_at']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Keep forward-only structural changes.
    }

    /**
     * Determine if an index already exists in the current schema.
     */
    private function hasIndex(string $table, string $indexName): bool
    {
        $connection = Schema::getConnection();
        $driver = $connection->getDriverName();
        $databaseName = $connection->getDatabaseName();

        if ($driver === 'mysql') {
            $result = DB::selectOne(
                'SELECT 1 FROM information_schema.statistics WHERE table_schema = ? AND table_name = ? AND index_name = ? LIMIT 1',
                [$databaseName, $table, $indexName],
            );

            return $result !== null;
        }

        if ($driver === 'sqlite') {
            $result = DB::selectOne(
                "SELECT 1 FROM sqlite_master WHERE type = 'index' AND tbl_name = ? AND name = ? LIMIT 1",
                [$table, $indexName],
            );

            return $result !== null;
        }

        return false;
    }
};
