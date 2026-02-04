'use client';

import Link from 'next/link';
import { useI18n } from '@/components/I18nContext';
import { PlusCircle, Search, Calendar, Briefcase, Users } from 'lucide-react';
import { useState } from 'react';

interface ProjectsContentProps {
    projects: any[];
}

export function ProjectsContent({ projects }: ProjectsContentProps) {
    const { t } = useI18n();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{t('projects.title')}</h2>
                    <p className="text-gray-500 mt-1">Manage and track company active projects</p>
                </div>
                <Link
                    href="/admin/projects/new"
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 hover:scale-105 active:scale-95 text-sm"
                >
                    <PlusCircle size={20} />
                    {t('projects.addNew')}
                </Link>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder={t('projects.search')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white rounded-2xl border-2 border-dashed border-gray-100">
                        <div className="p-4 bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                            <Briefcase className="text-gray-300" size={32} />
                        </div>
                        <p className="text-gray-500 font-medium">No projects found. Create one to get started.</p>
                    </div>
                ) : (
                    filteredProjects.map((project: any) => (
                        <Link href={`/admin/projects/${project.id}`} key={project.id} className="block group">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 h-full flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                        {project.name}
                                    </h3>
                                    <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md ${project.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                            project.status === 'COMPLETED' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                                'bg-gray-50 text-gray-700 border border-gray-100'
                                        }`}>
                                        {project.status}
                                    </span>
                                </div>
                                <p className="text-gray-500 text-sm mb-6 line-clamp-2 leading-relaxed flex-grow">
                                    {project.description}
                                </p>

                                <div className="space-y-3 pt-6 border-t border-gray-50">
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <div className="flex items-center gap-1.5 uppercase font-bold tracking-tighter">
                                            <Calendar size={14} className="text-gray-400" />
                                            Start
                                        </div>
                                        <span className="font-semibold text-gray-900">{new Date(project.startDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <div className="flex items-center gap-1.5 uppercase font-bold tracking-tighter">
                                            <Briefcase size={14} className="text-gray-400" />
                                            Type
                                        </div>
                                        <span className="font-semibold text-gray-900">{project.paymentType}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <div className="flex items-center gap-1.5 uppercase font-bold tracking-tighter">
                                            <Users size={14} className="text-gray-400" />
                                            {t('projects.members')}
                                        </div>
                                        <span className="font-semibold text-gray-900">{project.members.length}</span>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                                    <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{t('projects.view')} Details</span>
                                    <div className="text-sm font-black text-gray-900">
                                        €{project.paymentType === 'FIXED' ? project.totalPrice?.toLocaleString() : project.hourlyRate}
                                        {project.paymentType === 'HOURLY' && <span className="text-[10px] font-bold text-gray-400 ml-1">/HR</span>}
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
