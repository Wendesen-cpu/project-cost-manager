import { prisma } from '@/app/lib/prisma';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export default async function GanttPage() {
    const projects = await prisma.project.findMany({
        where: { status: 'ACTIVE' },
        include: {
            owner: true,
            members: {
                include: {
                    employee: true
                }
            }
        },
        orderBy: { startDate: 'asc' }
    });

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Project Timeline (Gantt View)</h2>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project Owner</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Team</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {projects.map((project: any) => (
                            <tr key={project.id}>
                                <td className="px-6 py-4">
                                    <div className="text-sm font-bold text-gray-900">{project.name}</div>
                                    <div className="text-xs text-gray-500">{project.description}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                        {format(new Date(project.startDate), 'MMM d, yyyy')} - {project.endDate ? format(new Date(project.endDate), 'MMM d, yyyy') : 'Ongoing'}
                                    </div>
                                    {project.endDate && (
                                        <div className="mt-1 w-32 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full"
                                                style={{ width: '50%' }} // Placeholder for progress
                                            ></div>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {project.owner?.email || 'N/A'}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-2">
                                        {project.members.map((m: any) => (
                                            <span key={m.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {m.employee.firstName} {m.employee.lastName}
                                            </span>
                                        ))}
                                        {project.members.length === 0 && <span className="text-xs text-gray-400">No members</span>}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
