'use client';

import { createEmployee } from '@/app/actions/employees';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function EmployeeForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function onSubmit(formData: FormData) {
        setLoading(true);
        const data = {
            firstName: formData.get('firstName') as string,
            lastName: formData.get('lastName') as string,
            monthlyCost: parseFloat(formData.get('monthlyCost') as string),
            vacationDays: parseInt(formData.get('vacationDays') as string) || 0,
            role: 'EMPLOYEE'
        };

        await createEmployee(data);
        setLoading(false);
        router.push('/admin/employees');
    }

    return (
        <form action={onSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <input
                        name="firstName"
                        required
                        type="text"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input
                        name="lastName"
                        required
                        type="text"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Monthly Cost ($)</label>
                    <input
                        name="monthlyCost"
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Vacation Days (Remaining)</label>
                    <input
                        name="vacationDays"
                        required
                        type="number"
                        min="0"
                        defaultValue={20}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                </div>
            </div>
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                >
                    {loading ? 'Saving...' : 'Create Employee'}
                </button>
            </div>
        </form>
    );
}
