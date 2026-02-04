'use client';

import { logout } from '@/app/actions/auth';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Briefcase, TrendingUp } from 'lucide-react';
import clsx from 'clsx';

import { useI18n } from '@/components/I18nContext';

export function Sidebar() {
    const pathname = usePathname();
    const { language, setLanguage, t } = useI18n();

    const navItems = [
        { name: t('nav.dashboard'), href: '/admin', icon: LayoutDashboard },
        { name: t('nav.employees'), href: '/admin/employees', icon: Users },
        { name: t('nav.projects'), href: '/admin/projects', icon: Briefcase },
        { name: t('nav.projections'), href: '/admin/projections', icon: TrendingUp },
    ];

    return (
        <div className="flex h-full w-64 flex-col bg-gray-900 text-white">
            <div className="flex h-16 items-center justify-between px-4 border-b border-gray-800">
                <h1 className="text-xl font-bold">Project Pro</h1>
                <div className="flex gap-1 bg-gray-800 p-1 rounded-md">
                    <button
                        onClick={() => setLanguage('en')}
                        className={clsx(
                            'px-2 py-0.5 text-[10px] font-bold rounded transition-colors',
                            language === 'en' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                        )}
                    >
                        EN
                    </button>
                    <button
                        onClick={() => setLanguage('it')}
                        className={clsx(
                            'px-2 py-0.5 text-[10px] font-bold rounded transition-colors',
                            language === 'it' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                        )}
                    >
                        IT
                    </button>
                </div>
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
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                            {t('nav.loggedInAs')} Admin
                        </span>
                        <button
                            onClick={() => logout()}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors font-medium border border-red-900/50 px-2 py-1 rounded"
                        >
                            {t('nav.logout')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
