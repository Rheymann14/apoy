import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-slate-50 p-6 md:p-10 dark:bg-neutral-950">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-200/35 blur-3xl dark:bg-emerald-500/20" />
                <div className="absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-cyan-200/35 blur-3xl dark:bg-cyan-500/10" />
            </div>
            <div className="relative w-full max-w-md">
                <div className="rounded-3xl border border-black/5 bg-white/90 p-8 shadow-[0_20px_60px_-24px_rgba(15,23,42,0.28)] backdrop-blur-sm dark:border-white/10 dark:bg-neutral-900/85 md:p-10">
                    <div className="mb-8 flex flex-col items-center gap-4">
                        <Link
                            href={home()}
                            className="flex flex-col items-center gap-2 font-medium"
                        >
                            <div className="mb-2 flex h-24 w-24 items-center justify-center rounded-xl">
                                <AppLogoIcon className="size-24 object-contain" />
                            </div>
                            <span className="sr-only">{title}</span>
                        </Link>

                        <div className="space-y-2 text-center">
                            <h1 className="text-2xl font-semibold tracking-tight">
                                {title}
                            </h1>
                            <p className="text-sm text-balance text-muted-foreground">
                                {description}
                            </p>
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
