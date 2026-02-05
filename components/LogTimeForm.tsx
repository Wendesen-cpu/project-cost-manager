'use client';

import { logWork } from '@/app/actions/worklogs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useI18n } from '@/components/I18nContext';

export function LogTimeForm({ employeeId, projects, onSuccess }: { employeeId: string; projects: any[]; onSuccess?: () => void }) {
    const router = useRouter();
    const { t } = useI18n();
    const [loading, setLoading] = useState(false);

    async function onSubmit(formData: FormData) {
        setLoading(true);
        await logWork({
            employeeId,
            projectId: formData.get('projectId') as string,
            date: new Date(formData.get('date') as string),
            hours: parseFloat(formData.get('hours') as string)
        });
        setLoading(false);
        if (onSuccess) {
            onSuccess();
        } else {
            router.refresh();
        }
    }

    return (
        <form action={onSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">{t('common.date')}</label>
                <input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">{t('common.project')}</label>
                <select name="projectId" required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2">
                    <option value="">{t('common.selectProject')}</option>
                    {projects.map(p => (
                        <option key={p.project.id} value={p.project.id}>{p.project.name}</option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">{t('common.hours')}</label>
                <input name="hours" type="number" step="0.5" required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
            </div>
            <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
            >
                {loading ? t('common.logging') : t('common.logHours')}
            </button>
        </form>
    );
}
