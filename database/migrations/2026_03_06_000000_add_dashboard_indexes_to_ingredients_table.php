<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('ingredients', function (Blueprint $table) {
            $table->index(
                ['status', 'name', 'code'],
                'ingredients_status_name_code_index',
            );
            $table->index('created_at', 'ingredients_created_at_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ingredients', function (Blueprint $table) {
            $table->dropIndex('ingredients_status_name_code_index');
            $table->dropIndex('ingredients_created_at_index');
        });
    }
};
