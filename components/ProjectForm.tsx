'use client';

import { createProject } from '@/app/actions/projects';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ProjectForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [paymentType, setPaymentType] = useState('FIXED');

    async function onSubmit(formData: FormData) {
        setLoading(true);

        const rawData = {
            name: formData.get('name') as string,
            description: formData.get('description') as string,
            startDate: new Date(formData.get('startDate') as string),
            endDate: formData.get('endDate') ? new Date(formData.get('endDate') as string) : undefined,
            status: formData.get('status') as string,
            paymentType: formData.get('paymentType') as string,
            totalPrice: formData.get('totalPrice') ? parseFloat(formData.get('totalPrice') as string) : undefined,
            hourlyRate: formData.get('hourlyRate') ? parseFloat(formData.get('hourlyRate') as string) : undefined,
            fixedMonthlyCosts: formData.get('fixedMonthlyCosts') ? parseFloat(formData.get('fixedMonthlyCosts') as string) : 0,
            fixedTotalCosts: formData.get('fixedTotalCosts') ? parseFloat(formData.get('fixedTotalCosts') as string) : 0,
        };

        await createProject(rawData);
        setLoading(false);
        router.push('/admin/projects');
    }

    return (
        <form action={onSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow max-w-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Project Name</label>
                    <input name="name" required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea name="description" rows={3} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <input name="startDate" type="date" required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">End Date (Expected)</label>
                    <input name="endDate" type="date" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select name="status" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2">
                        <option value="ACTIVE">Active</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="ARCHIVED">Archived</option>
                        <option value="PLANNED">Planned</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Type</label>
                    <select
                        name="paymentType"
                        value={paymentType}
                        onChange={(e) => setPaymentType(e.target.value)}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                    >
                        <option value="FIXED">Fixed Price</option>
                        <option value="HOURLY">Hourly Rate</option>
                    </select>
                </div>

                {paymentType === 'FIXED' ? (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Total Project Price ($)</label>
                        <input name="totalPrice" type="number" step="0.01" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                    </div>
                ) : (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Hourly Rate ($)</label>
                        <input name="hourlyRate" type="number" step="0.01" className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700">Fixed Monthly Costs ($)</label>
                    <input name="fixedMonthlyCosts" type="number" step="0.01" defaultValue={0} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Fixed Total Costs ($)</label>
                    <input name="fixedTotalCosts" type="number" step="0.01" defaultValue={0} className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
                </div>

            </div>
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400"
                >
                    {loading ? 'Creating...' : 'Create Project'}
                </button>
            </div>
        </form>
    );
}
