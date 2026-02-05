'use client';

import { LogTimeForm } from '@/components/LogTimeForm';
import { LogVacationForm } from '@/components/LogVacationForm';
import { useI18n } from '@/components/I18nContext';
import { logoutEmployee } from '@/app/actions/employee-auth';
import { useRouter } from 'next/navigation';
import {
    Calendar,
    Clock,
    Briefcase,
    LogOut,
    ChevronDown,
    CheckCircle2,
    Palmtree,
    Activity,
    PlusCircle
} from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

interface EmployeeDashboardContentProps {
    employee: any;
}

export function EmployeeDashboardContent({ employee }: EmployeeDashboardContentProps) {
    const { t, language, setLanguage } = useI18n();
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        await logoutEmployee();
        router.push('/employee/login');
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] pb-12">
            {/* Top Navigation / Header */}
            <div className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-slate-200">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                            P
                        </div>
                        <span className="font-bold text-slate-800 tracking-tight">Project Pro</span>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Language Switcher */}
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button
                                onClick={() => setLanguage('en')}
                                className={clsx(
                                    "px-3 py-1 text-xs font-bold rounded-md transition-all",
                                    language === 'en' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                EN
                            </button>
                            <button
                                onClick={() => setLanguage('it')}
                                className={clsx(
                                    "px-3 py-1 text-xs font-bold rounded-md transition-all",
                                    language === 'it' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                IT
                            </button>
                        </div>

                        <button
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-red-600 transition-colors disabled:opacity-50"
                        >
                            <LogOut size={16} />
                            <span>{isLoggingOut ? '...' : t('nav.logout')}</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 pt-8 space-y-8">
                {/* Hero / Welcome */}
                <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 rounded-3xl p-8 md:p-12 text-white shadow-2xl shadow-blue-900/20">
                    <div className="relative z-10">
                        <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-400/20 inline-flex items-center gap-2 px-3 py-1 rounded-full text-blue-200 text-xs font-medium mb-6 uppercase tracking-wider">
                            <Activity size={14} />
                            {t('employeeDashboard.title')}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
                            {t('employeeDashboard.welcome')}, <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">{employee.firstName}</span>
                        </h1>
                        <p className="text-slate-300 text-lg max-w-xl leading-relaxed font-medium">
                            {t('employeeDashboard.subtitle')}
                        </p>
                    </div>
                    {/* Abstract Shapes */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Stats and Actions */}
                    <div className="lg:col-span-1 space-y-8">
                        {/* Stats Cards */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                                <Activity size={14} />
                                {t('employeeDashboard.myStats')}
                            </h3>
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 flex items-center justify-between group hover:border-blue-300 transition-colors cursor-default">
                                <div>
                                    <span className="block text-slate-500 text-xs font-semibold mb-1 uppercase tracking-wider">{t('employeeDashboard.vacationRemaining')}</span>
                                    <span className="text-3xl font-black text-slate-900">{employee.vacationDays} <span className="text-lg font-bold text-slate-400 uppercase">{t('employeeDashboard.days')}</span></span>
                                </div>
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                                    <Palmtree size={24} />
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 flex items-center justify-between group hover:border-emerald-300 transition-colors cursor-default">
                                <div>
                                    <span className="block text-slate-500 text-xs font-semibold mb-1 uppercase tracking-wider">{t('employeeDashboard.assignedProjects')}</span>
                                    <span className="text-3xl font-black text-slate-900">{employee.projects.length}</span>
                                </div>
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all">
                                    <Briefcase size={24} />
                                </div>
                            </div>
                        </div>

                        {/* Actions Accordion */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                                <PlusCircle size={14} />
                                {t('employeeDashboard.logActivity')}
                            </h3>

                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
                                <details className="group border-b border-slate-100 last:border-0" open>
                                    <summary className="flex justify-between items-center px-6 py-4 font-black uppercase tracking-tight text-xs cursor-pointer list-none text-slate-700 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                <Clock size={18} />
                                            </div>
                                            <span>{t('employeeDashboard.logWorkHours')}</span>
                                        </div>
                                        <ChevronDown size={18} className="text-slate-400 transition-transform group-open:rotate-180" />
                                    </summary>
                                    <div className="px-6 pb-6 pt-2">
                                        <LogTimeForm employeeId={employee.id} projects={employee.projects} />
                                    </div>
                                </details>

                                <details className="group border-b border-slate-100 last:border-0">
                                    <summary className="flex justify-between items-center px-6 py-4 font-black uppercase tracking-tight text-xs cursor-pointer list-none text-slate-700 hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                                <Palmtree size={18} />
                                            </div>
                                            <span>{t('employeeDashboard.logVacation')}</span>
                                        </div>
                                        <ChevronDown size={18} className="text-slate-400 transition-transform group-open:rotate-180" />
                                    </summary>
                                    <div className="px-6 pb-6 pt-2">
                                        <LogVacationForm employeeId={employee.id} />
                                    </div>
                                </details>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Recent Activity */}
                    <div className="lg:col-span-2 space-y-4">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
                            <Clock size={14} />
                            {t('employeeDashboard.recentActivity')}
                        </h3>

                        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 overflow-hidden">
                            <div className="p-2">
                                <div className="space-y-1">
                                    {(() => {
                                        const groups: { [key: string]: { monthIndex: number, monthName: string, year: number, items: any[], workHours: number, vacationHours: number, totalHours: number } } = {};

                                        // Process Work Logs
                                        employee.workLogs.forEach((log: any) => {
                                            const date = new Date(log.date);
                                            const monthKey = `${date.getMonth()}-${date.getFullYear()}`;
                                            if (!groups[monthKey]) {
                                                groups[monthKey] = {
                                                    monthIndex: date.getMonth(),
                                                    monthName: date.toLocaleString(language === 'it' ? 'it-IT' : 'en-US', { month: 'long' }),
                                                    year: date.getFullYear(),
                                                    items: [],
                                                    workHours: 0,
                                                    vacationHours: 0,
                                                    totalHours: 0
                                                };
                                            }
                                            groups[monthKey].items.push({ ...log, type: 'work' });
                                            groups[monthKey].workHours += log.hours;
                                            groups[monthKey].totalHours += log.hours;
                                        });

                                        // Process Vacations
                                        employee.vacations.forEach((vac: any) => {
                                            const date = new Date(vac.date);
                                            const monthKey = `${date.getMonth()}-${date.getFullYear()}`;
                                            if (!groups[monthKey]) {
                                                groups[monthKey] = {
                                                    monthIndex: date.getMonth(),
                                                    monthName: date.toLocaleString(language === 'it' ? 'it-IT' : 'en-US', { month: 'long' }),
                                                    year: date.getFullYear(),
                                                    items: [],
                                                    workHours: 0,
                                                    vacationHours: 0,
                                                    totalHours: 0
                                                };
                                            }
                                            groups[monthKey].items.push({ ...vac, type: 'vacation' });
                                            // 1 vacation day = 8 hours for the total
                                            groups[monthKey].vacationHours += 8;
                                            groups[monthKey].totalHours += 8;
                                        });

                                        const sortedGroups = Object.values(groups).sort((a, b) => {
                                            if (a.year !== b.year) return b.year - a.year;
                                            return b.monthIndex - a.monthIndex;
                                        });

                                        if (sortedGroups.length === 0) {
                                            return (
                                                <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                                                    <Activity size={48} className="mb-4 opacity-20" />
                                                    <p className="text-sm font-bold uppercase tracking-widest">{t('employeeDashboard.noActivity')}</p>
                                                </div>
                                            );
                                        }

                                        return sortedGroups.map((group) => (
                                            <details key={`${group.monthName}-${group.year}`} className="group border-b border-slate-100 last:border-0" open={false}>
                                                <summary className="flex justify-between items-center px-6 py-4 font-black uppercase tracking-tight text-xs cursor-pointer list-none text-slate-700 hover:bg-slate-50 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                            <Calendar size={18} />
                                                        </div>
                                                        <span className="text-sm font-black">{group.monthName} {group.year}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right mr-4 flex flex-col items-end">
                                                            <div>
                                                                <span className="text-lg font-black text-slate-900">{group.totalHours}</span>
                                                                <span className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">{t('employeeDashboard.hrs')}</span>
                                                            </div>
                                                            <div className="text-[9px] text-slate-400 font-bold flex gap-2">
                                                                <span className="text-blue-500">{group.workHours}h {t('employeeDashboard.logWorKHoursInShort')}</span>
                                                                <span className="text-orange-500">{group.vacationHours}h {t('employeeDashboard.vacation')}</span>
                                                            </div>
                                                        </div>
                                                        <ChevronDown size={18} className="text-slate-400 transition-transform group-open:rotate-180" />
                                                    </div>
                                                </summary>
                                                <div className="px-2 pb-4">
                                                    <div className="space-y-1">
                                                        {group.items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((item: any) => (
                                                            item.type === 'work' ? (
                                                                <div key={item.id} className="group/item flex items-center gap-6 p-4 hover:bg-slate-50/80 transition-all rounded-[1.2rem]">
                                                                    <div className="w-10 h-10 flex-shrink-0 bg-white border border-slate-100 text-blue-600 rounded-xl flex items-center justify-center group-hover/item:scale-110 transition-transform shadow-sm">
                                                                        <CheckCircle2 size={20} />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-bold text-slate-900 truncate uppercase tracking-tight text-xs mb-0.5">{item.project.name}</p>
                                                                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                                            <span className="flex items-center gap-1">
                                                                                <Calendar size={10} />
                                                                                {new Date(item.date).toLocaleDateString()}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <span className="text-lg font-black text-slate-900">{item.hours}</span>
                                                                        <span className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">{t('employeeDashboard.hrs')}</span>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div key={item.id} className="group/item flex items-center gap-6 p-4 hover:bg-orange-50/30 transition-all bg-orange-50/20 rounded-[1.2rem]">
                                                                    <div className="w-10 h-10 flex-shrink-0 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center group-hover/item:scale-110 transition-transform">
                                                                        <Palmtree size={20} />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-bold text-orange-900 truncate uppercase tracking-tight text-xs mb-0.5">{t('employeeDashboard.vacation')}</p>
                                                                        <div className="flex items-center gap-2 text-[10px] text-orange-400 font-bold uppercase tracking-wider">
                                                                            <span className="flex items-center gap-1">
                                                                                <Calendar size={10} />
                                                                                {new Date(item.date).toLocaleDateString()}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <span className="text-sm font-black text-orange-600">{t('employeeDashboard.dayDeducted')}</span>
                                                                    </div>
                                                                </div>
                                                            )
                                                        ))}
                                                    </div>
                                                </div>
                                            </details>
                                        ));
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
