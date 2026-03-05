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
        Schema::create('ingredient_changes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ingredient_id')
                ->nullable()
                ->constrained('ingredients')
                ->cascadeOnUpdate()
                ->nullOnDelete();
            $table->foreignId('edited_by')
                ->nullable()
                ->constrained('users')
                ->cascadeOnUpdate()
                ->nullOnDelete();
            $table->string('change_type');
            $table->string('ingredient_name');
            $table->string('ingredient_code');
            $table->json('changed_fields');
            $table->index(['ingredient_code', 'created_at']);
            $table->index(['change_type', 'created_at']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ingredient_changes');
    }
};
