import { prisma } from '@/app/lib/prisma';
import { ProjectForm } from '@/components/ProjectForm';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function getProject(id: string) {
    return await prisma.project.findUnique({
        where: { id },
    });
}

export default async function EditProjectPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const project = await getProject(params.id);

    if (!project) notFound();

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6">Edit Project: {project.name}</h2>
            <ProjectForm project={project} />
        </div>
    );
}
