import { getProjects } from '@/app/actions/projects';
import { ProjectsContent } from '@/components/ProjectsContent';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
    const projects = await getProjects();

    return <ProjectsContent projects={projects} />;
}
