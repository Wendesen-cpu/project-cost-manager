'use client';

import { logVacation } from '@/app/actions/worklogs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function LogVacationForm({ employeeId }: { employeeId: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function onSubmit(formData: FormData) {
        setLoading(true);
        await logVacation({
            employeeId,
            date: new Date(formData.get('date') as string),
        });
        setLoading(false);
        router.refresh();
    }

    return (
        <form action={onSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input name="date" type="date" required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2" />
            </div>
            <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-green-300"
            >
                {loading ? 'Logging...' : 'Log Vacation Day'}
            </button>
            <p className="text-xs text-gray-500 mt-2">Note: This will deduct 1 day from your balance.</p>
        </form>
    );
}
