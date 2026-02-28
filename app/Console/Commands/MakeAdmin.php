<?php

namespace App\Console\Commands;

use App\Actions\Fortify\CreateNewUser;
use App\Models\Role;
use Illuminate\Console\Command;
use Illuminate\Validation\ValidationException;

class MakeAdmin extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'make:admin';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create an admin user';

    /**
     * Execute the console command.
     */
    public function handle(CreateNewUser $createNewUser): int
    {
        $name = (string) $this->ask('Name');
        $email = (string) $this->ask('Email');
        $password = (string) $this->secret('Password');
        $passwordConfirmation = (string) $this->secret('Confirm password');

        try {
            $user = $createNewUser->create([
                'name' => $name,
                'email' => $email,
                'password' => $password,
                'password_confirmation' => $passwordConfirmation,
            ]);
        } catch (ValidationException $exception) {
            foreach ($exception->validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        $attributes = [
            'email_verified_at' => now(),
            'role_id' => Role::query()->firstOrCreate(
                ['slug' => 'admin'],
                ['name' => 'Admin'],
            )->id,
        ];

        $user->forceFill($attributes)->save();

        $this->info('Admin user created successfully.');
        $this->line("ID: {$user->id}");
        $this->line("Name: {$user->name}");
        $this->line("Email: {$user->email}");

        $this->line("Role: admin (#{$attributes['role_id']})");

        return self::SUCCESS;
    }
}
