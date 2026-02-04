'use client';

import { ProjectionsChart } from '@/components/ProjectionsChart';
import { useI18n } from '@/components/I18nContext';

export function ProjectionsContent({ data }: { data: any[] }) {
    const { t } = useI18n();

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">{t('projections.title')}</h2>
            <ProjectionsChart data={data} />

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('projections.month')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('projections.revenue')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('projections.cost')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('projections.margin')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.map((row) => (
                            <tr key={row.month}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.month}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">€{row.revenue.toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">€{row.cost.toLocaleString()}</td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${row.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    €{row.margin.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
