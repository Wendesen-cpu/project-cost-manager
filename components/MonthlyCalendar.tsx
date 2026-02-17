'use client';

import { useState } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    isToday
} from 'date-fns';
import { it, enUS } from 'date-fns/locale';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Clock,
    Palmtree,
    X
} from 'lucide-react';
import { useI18n } from '@/components/I18nContext';
import clsx from 'clsx';
import { LogTimeForm } from './LogTimeForm';
import { LogVacationForm } from './LogVacationForm';
import { deleteWorkLog, deleteVacationLog } from '@/app/actions/worklogs';

interface MonthlyCalendarProps {
    employeeId: string;
    projects: any[];
    workLogs: any[];
    vacations: any[];
    onSuccess: () => void;
}

export function MonthlyCalendar({ employeeId, projects, workLogs, vacations, onSuccess }: MonthlyCalendarProps) {
    const { t, language } = useI18n();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [logType, setLogType] = useState<'work' | 'vacation' | null>(null);

    const locale = language === 'it' ? it : enUS;

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate,
    });

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const handleDayClick = (day: Date) => {
        setSelectedDate(day);
        setShowModal(true);
        setLogType(null);
    };

    const getDayData = (day: Date) => {
        const dayWorkLogs = workLogs.filter(log => isSameDay(new Date(log.date), day));
        const dayVacations = vacations.filter(vac => isSameDay(new Date(vac.date), day));
        const totalHours = dayWorkLogs.reduce((acc, log) => acc + log.hours, 0);

        return {
            workLogs: dayWorkLogs,
            vacations: dayVacations,
            totalHours
        };
    };

    const handleDeleteWorkLog = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm(t('common.confirmDelete') || 'Are you sure you want to delete this log?')) {
            await deleteWorkLog(id, employeeId);
            onSuccess();
        }
    };

    const handleDeleteVacation = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm(t('common.confirmDelete') || 'Are you sure you want to delete this vacation?')) {
            await deleteVacationLog(id, employeeId);
            onSuccess();
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
            {/* Calendar Header */}
            <div className="p-6 flex items-center justify-between border-b border-slate-100">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                    {format(currentMonth, 'MMMM yyyy', { locale })}
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={prevMonth}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={() => setCurrentMonth(new Date())}
                        className="px-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                    >
                        {t('common.today') || 'Today'}
                    </button>
                    <button
                        onClick={nextMonth}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
                {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => (
                    <div key={day} className="py-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {t(`common.days.${day}`) || day}
                    </div>
                ))}
            </div>



            <div className="grid grid-cols-7">
                {calendarDays.map((day, idx) => {
                    const { workLogs: dayWork, vacations: dayVac, totalHours } = getDayData(day);
                    const isCurrentMonth = isSameMonth(day, monthStart);

                    return (
                        <div
                            key={day.toISOString()}
                            className={clsx(
                                "min-h-[100px] p-2 border-r border-b border-slate-100 last:border-r-0 transition-all hover:bg-slate-50/50 group relative",
                                !isCurrentMonth && "bg-slate-50/30 opacity-40"
                            )}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={clsx(
                                    "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-colors",
                                    isToday(day) ? "bg-blue-600 text-white" : "text-slate-500"
                                )}>
                                    {format(day, 'd')}
                                </span>
                                <div className="flex items-center gap-1">
                                    {totalHours > 0 && (
                                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md">
                                            {totalHours}h
                                        </span>
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDayClick(day);
                                        }}
                                        className="p-0.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors opacity-0 group-hover:opacity-100"
                                        title={t('common.add') || 'Add'}
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1 mt-1 overflow-hidden">
                                {dayWork.map(log => (
                                    <div
                                        key={log.id}
                                        className="text-[9px] leading-tight px-1 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-100/50 truncate flex justify-between items-center gap-1 group/item hover:border-blue-300 transition-colors"
                                        title={`${log.project.name}: ${log.hours}h`}
                                    >
                                        <span className="truncate">{log.project.name}</span>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <span className="font-black">{log.hours}h</span>
                                            <button
                                                onClick={(e) => handleDeleteWorkLog(e, log.id)}
                                                className="text-blue-400 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                            >
                                                <X size={10} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {dayVac.length > 0 && dayVac.map(vac => (
                                    <div
                                        key={vac.id}
                                        className="flex justify-between items-center gap-1 text-[9px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-md border border-orange-100/50 group/item hover:border-orange-300 transition-colors"
                                    >
                                        <div className="flex items-center gap-1">
                                            <Palmtree size={10} />
                                            <span>{t('employeeDashboard.vacation') || 'VAC'}</span>
                                        </div>
                                        <button
                                            onClick={(e) => handleDeleteVacation(e, vac.id)}
                                            className="text-orange-400 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                        >
                                            <X size={10} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal */}
            {showModal && selectedDate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h4 className="text-xl font-black text-slate-800 tracking-tight">
                                    {format(selectedDate, 'EEEE d MMMM', { locale })}
                                </h4>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    {t('employeeDashboard.logActivity')}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-red-500"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            {!logType ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={() => setLogType('work')}
                                        className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50/50 transition-all group"
                                    >
                                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                                            <Clock size={24} />
                                        </div>
                                        <span className="font-bold text-slate-700">{t('employeeDashboard.logWorkHoursShort') || 'Work Hours'}</span>
                                    </button>
                                    <button
                                        onClick={() => setLogType('vacation')}
                                        className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-slate-100 hover:border-orange-500 hover:bg-orange-50/50 transition-all group"
                                    >
                                        <div className="p-3 bg-orange-50 text-orange-600 rounded-xl group-hover:bg-orange-600 group-hover:text-white transition-all">
                                            <Palmtree size={24} />
                                        </div>
                                        <span className="font-bold text-slate-700">{t('employeeDashboard.vacation') || 'Vacation'}</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <button
                                        onClick={() => setLogType(null)}
                                        className="text-xs font-bold text-blue-600 hover:underline mb-2 flex items-center gap-1"
                                    >
                                        <ChevronLeft size={12} />
                                        {t('common.back') || 'Back'}
                                    </button>

                                    {logType === 'work' ? (
                                        <LogTimeForm
                                            employeeId={employeeId}
                                            projects={projects}
                                            initialDate={selectedDate}
                                            onSuccess={() => {
                                                setShowModal(false);
                                                onSuccess();
                                            }}
                                        />
                                    ) : (
                                        <LogVacationForm
                                            employeeId={employeeId}
                                            initialDate={selectedDate}
                                            onSuccess={() => {
                                                setShowModal(false);
                                                onSuccess();
                                            }}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
