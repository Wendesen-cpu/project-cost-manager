import { prisma } from '@/app/lib/prisma';
import { getSession } from '@/app/lib/auth';
import { redirect } from 'next/navigation';
import { ApproveForm } from '@/components/ApproveForm';
import { ApproveEmployeeForm } from '@/components/ApproveEmployeeForm';

export const dynamic = 'force-dynamic';

export default async function ApprovalPage() {
    const session = await getSession();

    if (!session) {
        redirect('/admin/login');
    }

    const pendingAdmins = await prisma.admin.findMany({
        where: { status: 'PENDING' },
    });

    const pendingEmployees = await prisma.employee.findMany({
        where: { status: 'PENDING' },
    });

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto space-y-12">

                {/* Admin Approvals (Super Admin Only) */}
                {session.role === 'SUPER_ADMIN' && (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold">Pending Admin Approvals</h2>
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {pendingAdmins.map((admin: any) => (
                                        <tr key={admin.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{admin.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(admin.createdAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <ApproveForm adminId={admin.id} />
                                            </td>
                                        </tr>
                                    ))}
                                    {pendingAdmins.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">No pending admin approvals</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Employee Approvals (All Admins) */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold">Pending Employee Approvals</h2>
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {pendingEmployees.map((emp: any) => (
                                    <tr key={emp.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{emp.firstName} {emp.lastName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(emp.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <ApproveEmployeeForm employeeId={emp.id} />
                                        </td>
                                    </tr>
                                ))}
                                {pendingEmployees.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">No pending employee approvals</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
