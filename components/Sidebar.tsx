'use client';

import { logout } from '@/app/actions/auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Briefcase, TrendingUp, LogOut, Shield } from 'lucide-react';
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
        <div className="flex h-full w-72 flex-col bg-slate-900 text-slate-300 border-r border-slate-800/50">
            <div className="p-8">
                <div className="flex items-center gap-3 mb-10">
                    <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                        <Shield size={22} />
                    </div>
                    <div>
                        <h1 className="text-white font-black tracking-tight text-xl uppercase">Project Pro</h1>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-0.5">Admin Console</p>
                    </div>
                </div>

                <nav className="space-y-1.5">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={clsx(
                                    'group flex items-center gap-3 px-4 py-3.5 text-sm font-bold rounded-2xl transition-all uppercase tracking-tight',
                                    isActive
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                )}
                            >
                                <Icon size={20} className={clsx(isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400 transition-colors')} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-auto p-6 space-y-6">
                {/* Language Switcher */}
                <div className="bg-slate-800/50 p-1.5 rounded-2xl flex border border-slate-700/30">
                    <button
                        onClick={() => setLanguage('en')}
                        className={clsx(
                            "flex-1 py-1.5 text-xs font-black rounded-xl transition-all",
                            language === 'en' ? "bg-slate-700 text-white shadow-sm" : "text-slate-500 hover:text-slate-400"
                        )}
                    >
                        EN
                    </button>
                    <button
                        onClick={() => setLanguage('it')}
                        className={clsx(
                            "flex-1 py-1.5 text-xs font-black rounded-xl transition-all",
                            language === 'it' ? "bg-slate-700 text-white shadow-sm" : "text-slate-500 hover:text-slate-400"
                        )}
                    >
                        IT
                    </button>
                </div>

                <div className="flex items-center justify-between px-2">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{t('nav.loggedInAs')}</span>
                        <span className="text-xs text-slate-300 font-bold truncate">Administrator</span>
                    </div>
                    <button
                        onClick={() => logout()}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all group"
                        title={t('nav.logout')}
                    >
                        <LogOut size={20} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
}
