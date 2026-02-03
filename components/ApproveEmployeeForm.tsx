'use client';

import { approveEmployee } from '@/app/actions/employee-auth';
import { useState } from 'react';

export function ApproveEmployeeForm({ employeeId }: { employeeId: string }) {
    const [approved, setApproved] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleApprove = async () => {
        setLoading(true);
        const res = await approveEmployee(employeeId);
        setLoading(false);
        if (res.success) {
            setApproved(true);
            window.location.reload();
        } else {
            alert('Error: ' + res.error);
        }
    };

    if (approved) return <span className="text-green-600 font-medium">Approved</span>;

    return (
        <button
            onClick={handleApprove}
            disabled={loading}
            className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm disabled:opacity-50"
        >
            {loading ? 'Approving...' : 'Approve'}
        </button>
    );
}
