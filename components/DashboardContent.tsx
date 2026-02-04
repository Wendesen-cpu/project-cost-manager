'use client';

import { Users, Briefcase, TrendingUp, PlusCircle } from 'lucide-react';
import { useI18n } from '@/components/I18nContext';
import Link from 'next/link';

interface DashboardContentProps {
    stats: {
        projectCount: number;
        employeeCount: number;
        monthlyRevenue: number;
    };
}

export function DashboardContent({ stats }: DashboardContentProps) {
    const { t } = useI18n();

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{t('dashboard.title')}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center hover:shadow-md transition-shadow">
                    <div className="p-4 rounded-lg bg-blue-50 text-blue-600 mr-5">
                        <Briefcase size={28} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">{t('dashboard.activeProjects')}</h3>
                        <p className="text-3xl font-black text-gray-900 mt-1">{stats.projectCount}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center hover:shadow-md transition-shadow">
                    <div className="p-4 rounded-lg bg-emerald-50 text-emerald-600 mr-5">
                        <Users size={28} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">{t('dashboard.totalEmployees')}</h3>
                        <p className="text-3xl font-black text-gray-900 mt-1">{stats.employeeCount}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center hover:shadow-md transition-shadow">
                    <div className="p-4 rounded-lg bg-indigo-50 text-indigo-600 mr-5">
                        <TrendingUp size={28} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">{t('dashboard.monthlyRevenueEst')}</h3>
                        <p className="text-3xl font-black text-gray-900 mt-1">€{stats.monthlyRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    </div>
                </div>
            </div>

            <div className="bg-gray-50 p-8 rounded-2xl border border-gray-200/50">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                    {t('dashboard.quickActions')}
                </h3>
                <div className="flex flex-wrap gap-4">
                    <Link
                        href="/admin/projects/new"
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:scale-105 active:scale-95 text-sm"
                    >
                        <PlusCircle size={18} />
                        {t('dashboard.newProject')}
                    </Link>
                    <Link
                        href="/admin/employees/new"
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 hover:scale-105 active:scale-95 text-sm"
                    >
                        <PlusCircle size={18} />
                        {t('dashboard.newEmployee')}
                    </Link>
                </div>
            </div>
        </div>
    );
}
