'use client';

import Link from 'next/link';
import { AssignEmployeeForm } from '@/components/AssignEmployeeForm';
import { useI18n } from '@/components/I18nContext';

interface ProjectDetailsContentProps {
    project: any;
    employees: any[];
    revenue: number;
    laborCost: number;
    totalCost: number;
    margin: number;
    estimatedLaborCost: number;
    estimatedTotalCost: number;
    totalFixedMonthlyCost: number;
    totalHoursLogged: number;
    formattedDuration: string;
    canManage: boolean;
}

export function ProjectDetailsContent({
    project,
    employees,
    revenue,
    laborCost,
    totalCost,
    margin,
    estimatedLaborCost,
    estimatedTotalCost,
    totalFixedMonthlyCost,
    totalHoursLogged,
    formattedDuration,
    canManage
}: ProjectDetailsContentProps) {
    const { t } = useI18n();

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                            {canManage && (
                                <div className="flex gap-2">
                                    <Link
                                        href={`/admin/projects/${project.id}/edit`}
                                        className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-md transition-colors"
                                    >
                                        {t('projects.editDetails')}
                                    </Link>
                                    <Link
                                        href={`/admin/projects/${project.id}/gantt`}
                                        className="text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium px-3 py-1 rounded-md transition-colors flex items-center gap-1"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                        {t('projects.ganttView')}
                                    </Link>
                                </div>
                            )}
                        </div>
                        <p className="text-gray-500 mt-1">{project.description}</p>
                    </div>
                    <span className={`px-3 py-1 text-sm rounded-full ${project.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        project.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                        {project.status === 'ACTIVE' ? t('projects.statusActive') :
                            project.status === 'COMPLETED' ? t('projects.statusCompleted') :
                                project.status === 'ARCHIVED' ? t('projects.statusArchived') : t('projects.statusPlanned')}
                    </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-sm">
                    <div>
                        <span className="block text-gray-500">{t('projects.startDate')}</span>
                        <span className="font-medium">{new Date(project.startDate).toLocaleDateString()}</span>
                    </div>
                    <div>
                        <span className="block text-gray-500">{t('projects.endDate')}</span>
                        <span className="font-medium">{project.endDate ? new Date(project.endDate).toLocaleDateString() : t('projects.ongoing')}</span>
                    </div>
                    <div>
                        <span className="block text-gray-500">{t('projects.duration')}</span>
                        <span className="font-medium">{formattedDuration}</span>
                    </div>
                    <div>
                        <span className="block text-gray-500">{t('projects.paymentType')}</span>
                        <span className="font-medium">{project.paymentType === 'FIXED' ? t('projects.fixedPrice') : t('projects.hourlyRate')}</span>
                    </div>
                    <div>
                        <span className="block text-gray-500">{t('projects.price')}</span>
                        <span className="font-medium">
                            {project.paymentType === 'FIXED'
                                ? `€${project.totalPrice?.toLocaleString()}`
                                : `€${project.hourlyRate?.toLocaleString()}${t('projects.perHr')}`}
                        </span>
                    </div>
                    <div>
                        <span className="block text-gray-500">{t('projects.owner')}</span>
                        <span className="font-medium text-gray-900">{project.owner?.email}</span>
                    </div>
                </div>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                    <h3 className="text-gray-500 font-medium">{t('projects.revenueEst')}</h3>
                    <p className="text-2xl font-bold text-gray-900 mt-1">€{revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    {project.paymentType === 'HOURLY' && (
                        <p className="text-xs text-gray-400 mt-1">{t('projects.basedOnHours').replace('{hours}', totalHoursLogged.toString())}</p>
                    )}
                </div>
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
                    <h3 className="text-gray-500 font-medium">{t('projects.projectCosts')}</h3>
                    <div className="mt-2 space-y-4">
                        <div>
                            <p className="text-xs text-gray-400">{t('projects.actualTotalCost')}</p>
                            <p className="text-2xl font-bold text-gray-900">€{totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                            <div className="text-xs text-gray-400 mt-1 space-y-1">
                                <p>{t('projects.laborWorkLogs')}: €{laborCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                            </div>
                        </div>
                        <div className="border-t pt-2">
                            <p className="text-xs text-gray-400">{t('projects.estimatedTotalCost')}</p>
                            <p className="text-xl font-bold text-gray-800">€{estimatedTotalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                            <p className="text-xs text-gray-400 mt-1">{t('projects.laborAssignedHrs')}: €{estimatedLaborCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                        </div>
                        <div className="border-t pt-2 text-xs text-gray-400 space-y-1">
                            {project.fixedTotalCosts > 0 && <p>{t('projects.fixedTotal')}: €{project.fixedTotalCosts.toLocaleString()}</p>}
                            {project.fixedMonthlyCosts > 0 && <p>{t('projects.fixedMonthly')}: €{project.fixedMonthlyCosts.toLocaleString(undefined, { maximumFractionDigits: 0 })}{t('projects.perMo')}</p>}
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                    <h3 className="text-gray-500 font-medium">{t('projects.margin')}</h3>
                    <p className={`text-2xl font-bold mt-1 ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        €{margin.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        {t('projects.roi')}: {totalCost > 0 ? ((margin / totalCost) * 100).toFixed(1) : 0}%
                    </p>
                </div>
            </div>

            {/* Team Members */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">{t('projects.team')}</h2>
                <div className="space-y-4">
                    {canManage && (
                        <AssignEmployeeForm projectId={project.id} employees={employees} />
                    )}

                    <div className="mt-4">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">{t('common.name')}</th>
                                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">{t('employees.role')}</th>
                                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">{t('projects.period')}</th>
                                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">{t('projects.dailyHrs')}</th>
                                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">{t('projects.monthlyCost')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {project.members.map((assignment: any) => (
                                    <tr key={assignment.id}>
                                        <td className="py-2 text-sm text-gray-900">
                                            {assignment.employee.firstName} {assignment.employee.lastName}
                                        </td>
                                        <td className="py-2 text-sm text-gray-500">{assignment.employee.role}</td>
                                        <td className="py-2 text-sm text-gray-500">
                                            {new Date(assignment.startDate).toLocaleDateString()} - {assignment.endDate ? new Date(assignment.endDate).toLocaleDateString() : t('projects.endOfProject')}
                                        </td>
                                        <td className="py-2 text-sm text-gray-500">{assignment.dailyHours}h</td>
                                        <td className="py-2 text-sm text-gray-500">€{assignment.employee.monthlyCost.toLocaleString()}</td>
                                    </tr>
                                ))}
                                {project.members.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-4 text-center text-gray-500 text-sm">{t('projects.noMembers')}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
