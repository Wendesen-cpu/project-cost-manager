'use client';

import { loginAdmin } from '@/app/actions/auth';
import { useActionState } from 'react';

export default function LoginPage() {
    const [state, action, pending] = useActionState(async (prev: any, formData: FormData) => {
        return await loginAdmin(formData);
    }, null);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-center mb-6">Admin Login</h2>

                {state?.error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
                        {state.error}
                    </div>
                )}

                <form action={action} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <input name="email" type="email" required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Password</label>
                        <input name="password" type="password" required className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <button
                        type="submit"
                        disabled={pending}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        {pending ? 'Logging in...' : 'Login'}
                    </button>
                    <div className="text-center mt-4 text-sm">
                        <a href="/admin/register" className="text-blue-600 hover:underline">Register new account</a>
                    </div>
                </form>
            </div>
        </div>
    );
}
