import { getEmployeeDashboardData } from '@/app/actions/worklogs';
import { LogTimeForm } from '@/components/LogTimeForm';
import { LogVacationForm } from '@/components/LogVacationForm';
import { notFound, redirect } from 'next/navigation';
import { getEmployeeSession, logoutEmployee } from '@/app/lib/auth';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function EmployeeDashboardPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await getEmployeeSession();

    // Safety: Ensure employee can only see THEIR OWN dashboard
    if (!session || session.id !== params.id) {
        redirect('/employee/login');
    }

    const employee = await getEmployeeDashboardData(params.id);

    if (!employee) notFound();

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Welcome, {employee.firstName}</h1>
                        <p className="text-gray-500">Employee Dashboard</p>
                    </div>
                    <div className="flex gap-4 items-center">
                        <form action={async () => {
                            'use server';
                            await logoutEmployee();
                            redirect('/employee/login');
                        }}>
                            <button
                                type="submit"
                                className="text-sm text-red-600 hover:underline"
                            >
                                Logout
                            </button>
                        </form>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Stats */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">My Stats</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <span className="block text-sm text-blue-600">Vacation Remaining</span>
                                <span className="text-2xl font-bold text-blue-900">{employee.vacationDays} Days</span>
                            </div>
                            <div className="p-4 bg-green-50 rounded-lg">
                                <span className="block text-sm text-green-600">Assigned Projects</span>
                                <span className="text-2xl font-bold text-green-900">{employee.projects.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Log Activity</h3>
                        <div className="space-y-4">
                            <details className="group">
                                <summary className="flex justify-between items-center font-medium cursor-pointer list-none bg-blue-50 p-3 rounded-lg text-blue-900">
                                    <span>Log Work Hours</span>
                                    <span className="transition group-open:rotate-180">
                                        <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                                    </span>
                                </summary>
                                <div className="text-neutral-600 mt-3 group-open:animate-fadeIn">
                                    <LogTimeForm employeeId={employee.id} projects={employee.projects} />
                                </div>
                            </details>

                            <details className="group">
                                <summary className="flex justify-between items-center font-medium cursor-pointer list-none bg-green-50 p-3 rounded-lg text-green-900">
                                    <span>Log Vacation</span>
                                    <span className="transition group-open:rotate-180">
                                        <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                                    </span>
                                </summary>
                                <div className="text-neutral-600 mt-3 group-open:animate-fadeIn">
                                    <LogVacationForm employeeId={employee.id} />
                                </div>
                            </details>
                        </div>
                    </div>
                </div>

                {/* Recent History */}
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                        {employee.workLogs.map((log: any) => (
                            <div key={log.id} className="flex justify-between border-b pb-2">
                                <div>
                                    <p className="font-medium text-gray-900">{log.project.name}</p>
                                    <p className="text-xs text-gray-500">{new Date(log.date).toLocaleDateString()}</p>
                                </div>
                                <span className="font-bold text-gray-700">{log.hours} hrs</span>
                            </div>
                        ))}
                        {employee.vacations.map((vac: any) => (
                            <div key={vac.id} className="flex justify-between border-b pb-2 bg-yellow-50 p-2 rounded">
                                <div>
                                    <p className="font-medium text-yellow-800">Vacation</p>
                                    <p className="text-xs text-yellow-600">{new Date(vac.date).toLocaleDateString()}</p>
                                </div>
                                <span className="font-bold text-yellow-800">-1 Day</span>
                            </div>
                        ))}
                        {employee.workLogs.length === 0 && employee.vacations.length === 0 && (
                            <p className="text-gray-500 text-sm">No recent activity.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
