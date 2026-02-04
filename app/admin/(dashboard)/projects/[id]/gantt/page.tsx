import { prisma } from '@/app/lib/prisma';
import { ProjectGantt } from '@/components/ProjectGantt';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ProjectGanttPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const project = await prisma.project.findUnique({
        where: { id: params.id },
        include: {
            members: {
                include: {
                    employee: true
                }
            }
        }
    });

    if (!project) notFound();

    return (
        <div className="max-w-7xl mx-auto space-y-8 px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <Link href="/admin/projects" className="hover:text-blue-600 transition-colors">Projects</Link>
                        <span>/</span>
                        <Link href={`/admin/projects/${project.id}`} className="hover:text-blue-600 transition-colors">{project.name}</Link>
                        <span>/</span>
                        <span className="text-gray-900 font-medium">Gantt Chart</span>
                    </div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
                        {project.name}
                    </h1>
                    <p className="text-gray-500 mt-2 text-lg">{project.description}</p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href={`/admin/projects/${project.id}`}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Details
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                <ProjectGantt project={project} members={project.members} />

                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 flex items-start gap-4">
                    <div className="p-3 bg-indigo-100 rounded-lg">
                        <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-1">Gantt View Info</h4>
                        <p className="text-indigo-700 text-sm leading-relaxed">
                            This chart visualizes when each team member is active on the project.
                            Hover over a bar to see the exact assignment dates and daily hours.
                            The colors help distinguish between different employees at a glance.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
