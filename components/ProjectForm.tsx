'use client';

import { createProject, updateProject } from '@/app/actions/projects';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useI18n } from '@/components/I18nContext';

interface ProjectFormProps {
    project?: {
        id: string;
        name: string;
        description: string | null;
        startDate: Date;
        endDate: Date | null;
        status: string;
        paymentType: string;
        totalPrice: number | null;
        hourlyRate: number | null;
        fixedMonthlyCosts: number;
        fixedTotalCosts: number;
    };
}

export function ProjectForm({ project }: ProjectFormProps) {
    const router = useRouter();
    const { t } = useI18n();
    const [loading, setLoading] = useState(false);
    const [paymentType, setPaymentType] = useState(project?.paymentType || 'FIXED');
    const [fixedCostType, setFixedCostType] = useState<'MONTHLY' | 'TOTAL'>(
        project?.fixedMonthlyCosts && project.fixedMonthlyCosts > 0 ? 'MONTHLY' : 'TOTAL'
    );

    async function onSubmit(formData: FormData) {
        setLoading(true);

        const rawData = {
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            startDate: new Date(formData.get('startDate') as string),
            endDate: formData.get('endDate') ? new Date(formData.get('endDate') as string) : undefined,
            status: (formData.get('status') as string) || 'ACTIVE',
            paymentType: (formData.get('paymentType') as string) || 'FIXED',
            totalPrice: formData.get('totalPrice') ? parseFloat(formData.get('totalPrice') as string) : undefined,
            hourlyRate: formData.get('hourlyRate') ? parseFloat(formData.get('hourlyRate') as string) : undefined,
            fixedMonthlyCosts: fixedCostType === 'MONTHLY' && formData.get('fixedMonthlyCosts') ? parseFloat(formData.get('fixedMonthlyCosts') as string) : 0,
            fixedTotalCosts: fixedCostType === 'TOTAL' && formData.get('fixedTotalCosts') ? parseFloat(formData.get('fixedTotalCosts') as string) : 0,
        };

        if (project?.id) {
            await updateProject(project.id, rawData);
        } else {
            await createProject(rawData);
        }

        setLoading(false);
        router.push(project?.id ? `/admin/projects/${project.id}` : '/admin/projects');
        router.refresh();
    }

    return (
        <form action={onSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow max-w-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">{t('projects.name')}</label>
                    <input name="name" defaultValue={project?.name} required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">{t('projects.description')}</label>
                    <textarea name="description" defaultValue={project?.description || ''} rows={3} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('projects.startDate')}</label>
                    <input name="startDate" type="date" defaultValue={project?.startDate ? new Date(project.startDate).toISOString().split('T')[0] : ''} required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('projects.expectedEnd')}</label>
                    <input name="endDate" type="date" defaultValue={project?.endDate ? new Date(project.endDate).toISOString().split('T')[0] : ''} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('projects.status')}</label>
                    <select name="status" defaultValue={project?.status || 'ACTIVE'} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2">
                        <option value="ACTIVE">{t('projects.statusActive')}</option>
                        <option value="COMPLETED">{t('projects.statusCompleted')}</option>
                        <option value="ARCHIVED">{t('projects.statusArchived')}</option>
                        <option value="PLANNED">{t('projects.statusPlanned')}</option>
                    </select>
                </div>

                <div></div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('projects.paymentType')}</label>
                    <select
                        name="paymentType"
                        value={paymentType}
                        onChange={(e) => setPaymentType(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    >
                        <option value="FIXED">{t('projects.fixedPrice')}</option>
                        <option value="HOURLY">{t('projects.hourlyRate')}</option>
                    </select>
                </div>

                {paymentType === 'FIXED' ? (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t('projects.totalPrice')}</label>
                        <input name="totalPrice" type="number" step="0.01" defaultValue={project?.totalPrice || ''} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                    </div>
                ) : (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t('projects.hourlyRate')} (€)</label>
                        <input name="hourlyRate" type="number" step="0.01" defaultValue={project?.hourlyRate || ''} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('projects.fixedCostType')}</label>
                    <select
                        value={fixedCostType}
                        onChange={(e) => setFixedCostType(e.target.value as 'MONTHLY' | 'TOTAL')}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    >
                        <option value="MONTHLY">{t('projects.monthlyFixedCost')}</option>
                        <option value="TOTAL">{t('projects.totalFixedCost')}</option>
                    </select>
                </div>

                {fixedCostType === 'MONTHLY' ? (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t('projects.monthlyFixedCost')} (€)</label>
                        <input name="fixedMonthlyCosts" type="number" step="0.01" defaultValue={project?.fixedMonthlyCosts ?? 0} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                    </div>
                ) : (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{t('projects.totalFixedCost')} (€)</label>
                        <input name="fixedTotalCosts" type="number" step="0.01" defaultValue={project?.fixedTotalCosts ?? 0} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                    </div>
                )}

            </div>
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                >
                    {loading ? (project ? t('projects.updating') : t('projects.creating')) : (project ? t('projects.updateProject') : t('projects.createProject'))}
                </button>
            </div>
        </form>
    );
}
