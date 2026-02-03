'use client';

import { requestApprovalOtp, approveAdmin } from '@/app/actions/auth';
import { useState } from 'react';

export function ApproveForm({ adminId }: { adminId: string }) {
    const [askedOtp, setAskedOtp] = useState(false);
    const [otp, setOtp] = useState('');
    const [message, setMessage] = useState('');

    const handleRequest = async () => {
        await requestApprovalOtp();
        setAskedOtp(true);
        setMessage('OTP sent to Super Admin email (console in dev).');
    };

    const handleApprove = async () => {
        const res = await approveAdmin(adminId, otp);
        if (res.success) {
            setMessage('Approved! Reloading...');
            window.location.reload();
        } else {
            setMessage(res.error || 'Error');
        }
    };

    if (!askedOtp) {
        return (
            <button
                onClick={handleRequest}
                className="text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
            >
                Approve
            </button>
        );
    }

    return (
        <div className="flex gap-2 items-center">
            <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="border rounded px-2 py-1 text-sm w-24"
            />
            <button
                onClick={handleApprove}
                className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
            >
                Verify
            </button>
            <span className="text-xs text-gray-500 block absolute mt-8">{message}</span>
        </div>
    );
}
