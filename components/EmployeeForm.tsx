'use client';

import { createEmployee, updateEmployee } from '@/app/actions/employees';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useI18n } from '@/components/I18nContext';

interface EmployeeFormProps {
    employee?: any; // Can be Employee or Admin
}

export function EmployeeForm({ employee }: EmployeeFormProps) {
    const router = useRouter();
    const { t } = useI18n();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function onSubmit(formData: FormData) {
        setLoading(true);
        setError(null);

        const baseData = {
            firstName: formData.get('firstName') as string,
            lastName: formData.get('lastName') as string,
            monthlyCost: parseFloat(formData.get('monthlyCost') as string),
            vacationDays: parseInt(formData.get('vacationDays') as string) || 0,
            role: formData.get('role') as string || 'EMPLOYEE'
        };

        try {
            if (employee?.id) {
                await updateEmployee(employee.id, {
                    ...baseData,
                    password: formData.get('password') as string,
                });
                router.push('/admin/employees');
                router.refresh();
            } else {
                const result = await createEmployee({
                    ...baseData,
                    email: formData.get('email') as string,
                    password: formData.get('password') as string,
                });

                if (result.error) {
                    setError(result.error);
                } else {
                    router.push('/admin/employees');
                    router.refresh();
                }
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    }

    return (
        <form action={onSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow max-w-2xl">
            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
                    {error}
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('employees.firstName')}</label>
                    <input
                        name="firstName"
                        required
                        type="text"
                        defaultValue={employee?.firstName}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('employees.lastName')}</label>
                    <input
                        name="lastName"
                        required
                        type="text"
                        defaultValue={employee?.lastName}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('employees.email')}</label>
                    <input
                        name="email"
                        required={!employee}
                        type="email"
                        defaultValue={employee?.email}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('employees.password')}</label>
                    <input
                        name="password"
                        required
                        type="text"
                        defaultValue={employee?.password}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('employees.monthlyCost')}</label>
                    <input
                        name="monthlyCost"
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={employee?.monthlyCost}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('employees.vacationDays')}</label>
                    <input
                        name="vacationDays"
                        required
                        type="number"
                        min="0"
                        defaultValue={employee?.vacationDays ?? 20}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('employees.role')}</label>
                    <select
                        name="role"
                        defaultValue={employee?.role || 'EMPLOYEE'}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="EMPLOYEE">{t('employees.roleEmployee')}</option>
                        <option value="PM">{t('employees.roleManager')}</option>
                    </select>
                </div>
            </div>
            <div className="flex justify-end mt-6">
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                >
                    {loading ? t('employees.saving') : (employee ? t('employees.update') : t('employees.create'))}
                </button>
            </div>
        </form>
    );
}
