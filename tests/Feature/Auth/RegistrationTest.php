<?php

test('registration routes are disabled', function () {
    expect(app('router')->has('register'))->toBeFalse()
        ->and(app('router')->has('register.store'))->toBeFalse();
});
