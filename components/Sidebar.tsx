'use client';

import { logout } from '@/app/actions/auth';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Briefcase, TrendingUp } from 'lucide-react';
import clsx from 'clsx';

const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Employees', href: '/admin/employees', icon: Users },
    { name: 'Projects', href: '/admin/projects', icon: Briefcase },
    { name: 'Projections', href: '/admin/projections', icon: TrendingUp },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-full w-64 flex-col bg-gray-900 text-white">
            <div className="flex h-16 items-center justify-center border-b border-gray-800">
                <h1 className="text-xl font-bold">Project Pro</h1>
            </div>
            <nav className="flex-1 space-y-1 px-2 py-4">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={clsx(
                                'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                                isActive
                                    ? 'bg-gray-800 text-white'
                                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                            )}
                        >
                            <Icon className="mr-3 h-6 w-6 flex-shrink-0" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
            <div className="p-4 border-t border-gray-800">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Logged in as Admin</span>
                    <button
                        onClick={() => logout()}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
}
