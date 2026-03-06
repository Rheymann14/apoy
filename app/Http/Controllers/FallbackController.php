<?php

namespace App\Http\Controllers;

use Illuminate\Http\Response;

class FallbackController extends Controller
{
    /**
     * Render the application 404 page.
     */
    public function __invoke(): Response
    {
        return response()
            ->view('errors.404', [], 404);
    }
}
