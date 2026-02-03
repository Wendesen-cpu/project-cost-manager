import { Sidebar } from '@/components/Sidebar';
import { getSession } from '@/app/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session) {
        redirect('/admin/login');
    }

    if (session.status === 'PENDING') {
        // Ideally show a "Pending" page, but for now redirect or show error
        // redirect('/admin/pending'); 
        // For simplicity, just redirect to register with error param or let them login again to see message
    }

    return (
        <div className="flex h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
