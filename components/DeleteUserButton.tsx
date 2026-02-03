'use client';

import { deleteEmployee } from '@/app/actions/employees';

interface DeleteUserButtonProps {
    id: string;
}

export function DeleteUserButton({ id }: DeleteUserButtonProps) {
    async function handleDelete() {
        if (confirm('Are you sure you want to delete this user?')) {
            await deleteEmployee(id);
        }
    }

    return (
        <button
            onClick={handleDelete}
            className="text-red-600 hover:text-red-900 ms-3"
        >
            Delete
        </button>
    );
}
