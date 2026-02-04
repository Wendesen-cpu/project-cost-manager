'use client';

import { deleteEmployee } from '@/app/actions/employees';
import { useI18n } from '@/components/I18nContext';

interface DeleteUserButtonProps {
    id: string;
}

export function DeleteUserButton({ id }: DeleteUserButtonProps) {
    const { t } = useI18n();

    async function handleDelete() {
        if (confirm(t('common.deleteConfirm'))) {
            await deleteEmployee(id);
        }
    }

    return (
        <button
            onClick={handleDelete}
            className="text-red-600 hover:text-red-900 ms-3"
        >
            {t('projects.delete')}
        </button>
    );
}
