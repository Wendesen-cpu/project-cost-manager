import { getEmployeeSession } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';

export async function GET(req: Request) {
    try {
        const session = await getEmployeeSession();

        if (!session || typeof session.id !== 'string') {
            return new Response('Unauthorized', { status: 401 });
        }

        const employee = await prisma.employee.findUnique({
            where: { id: session.id },
            include: {
                projects: {
                    include: {
                        project: true
                    }
                }
            }
        });

        if (!employee) {
            return new Response('Employee not found', { status: 404 });
        }

        const projects = employee.projects.map(p => ({
            id: p.project.id,
            name: p.project.name
        }));

        return Response.json({ projects });
    } catch (error: any) {
        console.error('Error fetching projects:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
