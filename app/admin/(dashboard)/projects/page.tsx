import { getProjects } from '@/app/actions/projects';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
    const projects = await getProjects();

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Projects</h2>
                <Link
                    href="/admin/projects/new"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                    New Project
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.length === 0 ? (
                    <p className="text-gray-500 col-span-3 text-center py-10">No projects found. Create one to get started.</p>
                ) : (
                    projects.map((project: any) => (
                        <Link href={`/admin/projects/${project.id}`} key={project.id} className="block group">
                            <div className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600">
                                        {project.name}
                                    </h3>
                                    <span className={`px-2 py-1 text-xs rounded-full ${project.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                        project.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {project.status}
                                    </span>
                                </div>
                                <p className="text-gray-500 text-sm mb-4 line-clamp-2">{project.description}</p>

                                <div className="border-t border-gray-100 pt-4 mt-4 text-sm text-gray-600 space-y-1">
                                    <div className="flex justify-between">
                                        <span>Start:</span>
                                        <span>{new Date(project.startDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Type:</span>
                                        <span>{project.paymentType}</span>
                                    </div>
                                    <div className="flex justify-between font-medium">
                                        <span>{project.paymentType === 'FIXED' ? 'Total Price:' : 'Hourly Rate:'}</span>
                                        <span>${project.paymentType === 'FIXED' ? project.totalPrice?.toLocaleString() : project.hourlyRate}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                                        <span>Members: {project.members.length}</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
