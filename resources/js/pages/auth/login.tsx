import { Form, Head } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { store } from '@/routes/login';

type Props = {
    status?: string;
};

export default function Login({ status }: Props) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <AuthLayout
            title="Log in to your account"
            description="Enter your email and password below to log in"
        >
            <Head title="Log in" />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        {status && (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                                {status}
                            </div>
                        )}

                        <div className="grid gap-5">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="email"
                                    className="text-sm font-medium"
                                >
                                    Email address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                    className="h-11 rounded-xl border-slate-200 bg-white/70 px-4 dark:border-neutral-800 dark:bg-neutral-900/70"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="space-y-2">
                                <Label
                                    htmlFor="password"
                                    className="text-sm font-medium"
                                >
                                    Password
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={
                                            showPassword ? 'text' : 'password'
                                        }
                                        name="password"
                                        required
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        placeholder="Password"
                                        className="h-11 rounded-xl border-slate-200 bg-white/70 pr-11 pl-4 dark:border-neutral-800 dark:bg-neutral-900/70"
                                    />
                                    <button
                                        type="button"
                                        aria-label={
                                            showPassword
                                                ? 'Hide password'
                                                : 'Show password'
                                        }
                                        onClick={() =>
                                            setShowPassword((prev) => !prev)
                                        }
                                        className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-800 dark:text-neutral-400 dark:hover:text-white"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <Eye className="h-4 w-4" />
                                        ) : (
                                            <EyeOff  className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                <InputError message={errors.password} />
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 h-11 w-full rounded-xl text-sm font-medium"
                                tabIndex={3}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Log in
                            </Button>
                        </div>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
