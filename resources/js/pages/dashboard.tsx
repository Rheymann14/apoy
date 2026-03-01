import { Head, Link } from '@inertiajs/react';
import {
    ArrowUpRight,
    Boxes,
    PackageCheck,
    RefreshCw,
    TriangleAlert,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
    },
];

const stats: {
    title: string;
    value: string;
    trend: string;
    icon: LucideIcon;
}[] = [
    {
        title: 'Total Items',
        value: '2,486',
        trend: '+8.2% this month',
        icon: Boxes,
    },
    {
        title: 'Checked Out',
        value: '324',
        trend: '+12 today',
        icon: PackageCheck,
    },
    {
        title: 'Active Employees',
        value: '41',
        trend: '2 new this week',
        icon: Users,
    },
    {
        title: 'Low Stock Alerts',
        value: '9',
        trend: '3 require urgent action',
        icon: TriangleAlert,
    },
];

const activities = [
    {
        title: 'Laptop inventory synced',
        subtitle: 'Warehouse A',
        time: '2 min ago',
    },
    {
        title: 'Barcode batch imported',
        subtitle: '1,120 records',
        time: '18 min ago',
    },
    {
        title: 'Employee access updated',
        subtitle: 'HR Team',
        time: '45 min ago',
    },
    {
        title: 'Stock reconciliation complete',
        subtitle: 'Shelf Group C',
        time: '1 hr ago',
    },
];

export default function Dashboard() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
                <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Inventory Overview
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Real-time status of stock movement and operations.
                        </p>
                    </div>
                    <Badge
                        variant="secondary"
                        className="w-fit rounded-full px-3 py-1 text-xs"
                    >
                        Live
                    </Badge>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {stats.map((item, index) => (
                        <Card
                            key={item.title}
                            className="border-border/70 bg-card/90 py-5 shadow-sm"
                            style={{ animationDelay: `${index * 70}ms` }}
                        >
                            <CardHeader className="px-5 pb-2">
                                <div className="flex items-center justify-between">
                                    <CardDescription>
                                        {item.title}
                                    </CardDescription>
                                    <item.icon className="size-4 text-muted-foreground" />
                                </div>
                            </CardHeader>
                            <CardContent className="px-5">
                                <p className="text-2xl font-semibold tracking-tight">
                                    {item.value}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {item.trend}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                    <Card className="lg:col-span-2">
                        <CardHeader className="flex flex-row items-start justify-between space-y-0">
                            <div>
                                <CardTitle>Recent Activity</CardTitle>
                                <CardDescription>
                                    Latest inventory and account updates
                                </CardDescription>
                            </div>
                            <Button variant="outline" size="sm" className="gap-2">
                                <RefreshCw className="size-3.5" />
                                Refresh
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {activities.map((activity) => (
                                <div
                                    key={activity.title}
                                    className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2.5"
                                >
                                    <div>
                                        <p className="text-sm font-medium">
                                            {activity.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {activity.subtitle}
                                        </p>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {activity.time}
                                    </span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                            <CardDescription>
                                Common tasks to keep workflows fast
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2.5">
                            <Button
                                asChild
                                variant="outline"
                                className="w-full justify-between"
                            >
                                <Link href={dashboard()}>
                                    Open Dashboard
                                    <ArrowUpRight className="size-4" />
                                </Link>
                            </Button>
                            <Button variant="outline" className="w-full">
                                Add Inventory Item
                            </Button>
                            <Button variant="outline" className="w-full">
                                Export Report
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
