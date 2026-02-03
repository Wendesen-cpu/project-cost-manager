import { prisma } from '@/app/lib/prisma';
import { AssignEmployeeForm } from '@/components/AssignEmployeeForm';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function getProjectDetails(id: string) {
    return await prisma.project.findUnique({
        where: { id },
        include: {
            members: {
                include: {
                    employee: true
                }
            },
            workLogs: {
                include: {
                    employee: true
                }
            }
        }
    });
}

async function getAvailableEmployees() {
    return await prisma.employee.findMany();
}

export default async function ProjectDetailsPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const project = await getProjectDetails(params.id);
    const employees = await getAvailableEmployees();

    if (!project) notFound();

    // Cost Calculation
    const totalHoursLogged = project.workLogs.reduce((sum: number, log: any) => sum + log.hours, 0);

    // Labor Cost: Sum of (Log.hours * Employee.hourlyCost)
    const laborCost = project.workLogs.reduce((sum: number, log: any) => {
        const hourlyCost = log.employee.monthlyCost / 160;
        return sum + (log.hours * hourlyCost);
    }, 0);

    // Fixed Costs
    // Calculate months duration for fixed monthly costs
    // If end date is future, project costs until now? Or total duration?
    // "Costi fissi di progetto mensili o totali"
    // Usually fixed monthly applies for the duration of the project. If active, maybe until today? 
    // Let's assume duration = (EndDate or Now - StartDate)
    const endDate = project.endDate || new Date();
    const durationMonths = Math.max(1, (endDate.getTime() - project.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const totalFixedMonthlyCost = project.fixedMonthlyCosts * durationMonths;
    const totalCost = laborCost + totalFixedMonthlyCost + project.fixedTotalCosts;

    // Revenue
    let revenue = 0;
    if (project.paymentType === 'FIXED') {
        revenue = project.totalPrice || 0;
    } else {
        revenue = totalHoursLogged * (project.hourlyRate || 0);
    }

    const margin = revenue - totalCost;

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-4">
                            <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                            <Link
                                href={`/admin/projects/${project.id}/edit`}
                                className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-md transition-colors"
                            >
                                Edit Details
                            </Link>
                        </div>
                        <p className="text-gray-500 mt-1">{project.description}</p>
                    </div>
                    <span className={`px-3 py-1 text-sm rounded-full ${project.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        project.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                        {project.status}
                    </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-sm">
                    <div>
                        <span className="block text-gray-500">Start Date</span>
                        <span className="font-medium">{new Date(project.startDate).toLocaleDateString()}</span>
                    </div>
                    <div>
                        <span className="block text-gray-500">End Date</span>
                        <span className="font-medium">{project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Ongoing'}</span>
                    </div>
                    <div>
                        <span className="block text-gray-500">Payment Type</span>
                        <span className="font-medium">{project.paymentType}</span>
                    </div>
                    <div>
                        <span className="block text-gray-500">Price</span>
                        <span className="font-medium">
                            {project.paymentType === 'FIXED'
                                ? `$${project.totalPrice?.toLocaleString()}`
                                : `$${project.hourlyRate?.toLocaleString()}/hr`}
                        </span>
                    </div>
                </div>
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
                    <h3 className="text-gray-500 font-medium">Total Revenue (Est)</h3>
                    <p className="text-2xl font-bold text-gray-900 mt-1">${revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    {project.paymentType === 'HOURLY' && (
                        <p className="text-xs text-gray-400 mt-1">Based on {totalHoursLogged} hours logged</p>
                    )}
                </div>
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
                    <h3 className="text-gray-500 font-medium">Total Cost</h3>
                    <p className="text-2xl font-bold text-gray-900 mt-1">${totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    <div className="text-xs text-gray-400 mt-1 space-y-1">
                        <p>Labor: ${laborCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                        <p>Fixed (Total): ${project.fixedTotalCosts.toLocaleString()}</p>
                        <p>Fixed (Monthly): ${totalFixedMonthlyCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                    <h3 className="text-gray-500 font-medium">Margin</h3>
                    <p className={`text-2xl font-bold mt-1 ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${margin.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        ROI: {totalCost > 0 ? ((margin / totalCost) * 100).toFixed(1) : 0}%
                    </p>
                </div>
            </div>

            {/* Team Members */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4">Team</h2>
                <div className="space-y-4">
                    <AssignEmployeeForm projectId={project.id} employees={employees} />

                    <div className="mt-4">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">Name</th>
                                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">Role</th>
                                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">Monthly Cost</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {project.members.map((assignment: any) => (
                                    <tr key={assignment.id}>
                                        <td className="py-2 text-sm text-gray-900">
                                            {assignment.employee.firstName} {assignment.employee.lastName}
                                        </td>
                                        <td className="py-2 text-sm text-gray-500">{assignment.employee.role}</td>
                                        <td className="py-2 text-sm text-gray-500">${assignment.employee.monthlyCost.toLocaleString()}</td>
                                    </tr>
                                ))}
                                {project.members.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="py-4 text-center text-gray-500 text-sm">No members assigned yet.</td>
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
