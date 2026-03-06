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
        if (! $this->hasIndex('ingredients', 'ingredients_name_id_index')) {
            Schema::table('ingredients', function (Blueprint $table) {
                $table->index(['name', 'id'], 'ingredients_name_id_index');
            });
        }

        if (! $this->hasIndex('ingredients', 'ingredients_quantity_id_index')) {
            Schema::table('ingredients', function (Blueprint $table) {
                $table->index(['quantity', 'id'], 'ingredients_quantity_id_index');
            });
        }

        if (! $this->hasIndex('ingredient_changes', 'ingredient_changes_created_at_id_index')) {
            Schema::table('ingredient_changes', function (Blueprint $table) {
                $table->index(['created_at', 'id'], 'ingredient_changes_created_at_id_index');
            });
        }

        if (! $this->hasIndex('users', 'users_name_index')) {
            Schema::table('users', function (Blueprint $table) {
                $table->index('name', 'users_name_index');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if ($this->hasIndex('ingredients', 'ingredients_name_id_index')) {
            Schema::table('ingredients', function (Blueprint $table) {
                $table->dropIndex('ingredients_name_id_index');
            });
        }

        if ($this->hasIndex('ingredients', 'ingredients_quantity_id_index')) {
            Schema::table('ingredients', function (Blueprint $table) {
                $table->dropIndex('ingredients_quantity_id_index');
            });
        }

        if ($this->hasIndex('ingredient_changes', 'ingredient_changes_created_at_id_index')) {
            Schema::table('ingredient_changes', function (Blueprint $table) {
                $table->dropIndex('ingredient_changes_created_at_id_index');
            });
        }

        if ($this->hasIndex('users', 'users_name_index')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropIndex('users_name_index');
            });
        }
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
