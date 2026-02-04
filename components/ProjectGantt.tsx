'use client';

import { format, differenceInDays } from 'date-fns';

const COLORS = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-red-500',
    'bg-emerald-500',
    'bg-cyan-500',
    'bg-violet-500',
    'bg-amber-500',
];

interface ProjectGanttProps {
    project: {
        startDate: Date | string;
        endDate: Date | string | null;
    };
    members: any[];
}

export function ProjectGantt({ project, members }: ProjectGanttProps) {
    const projectStart = new Date(project.startDate);
    // If project end is null, use today or latest assignment end date
    let projectEnd = project.endDate ? new Date(project.endDate) : new Date();

    // Check if any member has an end date further than the project end date
    members.forEach(member => {
        if (member.endDate) {
            const mEnd = new Date(member.endDate);
            if (mEnd > projectEnd) projectEnd = mEnd;
        }
    });

    const totalDays = Math.max(1, differenceInDays(projectEnd, projectStart) + 1);

    return (
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 overflow-x-auto">
            <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-8">
                Employee Assignment Timeline
            </h3>

            <div className="min-w-[900px]">
                {/* Timeline Header */}
                <div className="flex border-b border-gray-200 pb-4 mb-6">
                    <div className="w-1/4 flex-shrink-0 font-semibold text-gray-600 text-sm uppercase tracking-wider">Employee</div>
                    <div className="flex-1 relative h-6">
                        <div className="absolute left-0 top-0">
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                                {format(projectStart, 'MMM d, yyyy')}
                            </span>
                        </div>
                        <div className="absolute right-0 top-0">
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                                {format(projectEnd, 'MMM d, yyyy')}
                            </span>
                        </div>
                        {/* Mid-point marker */}
                        <div className="absolute left-1/2 -ml-px w-px h-full bg-gray-100 hidden md:block"></div>
                    </div>
                </div>

                {/* Rows */}
                <div className="space-y-6">
                    {members.map((member, index) => {
                        const mStart = new Date(member.startDate);
                        const mEnd = member.endDate ? new Date(member.endDate) : projectEnd;

                        const startOffset = differenceInDays(mStart, projectStart);
                        const duration = differenceInDays(mEnd, mStart) + 1;

                        const leftPercent = (startOffset / totalDays) * 100;
                        const widthPercent = (duration / totalDays) * 100;
                        const colorClass = COLORS[index % COLORS.length];

                        return (
                            <div key={member.id} className="group flex items-center">
                                <div className="w-1/4 flex-shrink-0 flex items-center pr-4">
                                    <div className={`w-2 h-2 rounded-full mr-3 ${colorClass}`}></div>
                                    <div className="text-sm font-semibold text-gray-700 truncate group-hover:text-blue-600 transition-colors">
                                        {member.employee.firstName} {member.employee.lastName}
                                    </div>
                                </div>
                                <div className="flex-1 relative h-10 bg-gray-50/50 rounded-lg overflow-hidden border border-gray-100/50">
                                    <div
                                        className={`absolute h-7 top-1.5 rounded-md shadow-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-md cursor-help ${colorClass} flex items-center px-3`}
                                        style={{
                                            left: `${Math.max(0, Math.min(99, leftPercent))}%`,
                                            width: `${Math.max(1, Math.min(100 - leftPercent, widthPercent))}%`
                                        }}
                                        title={`${format(mStart, 'MMM d, yyyy')} - ${member.endDate ? format(new Date(member.endDate), 'MMM d, yyyy') : 'End of Project'}`}
                                    >
                                        <span className="text-[10px] font-bold text-white uppercase tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity truncate">
                                            {member.dailyHours}h/day
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {members.length === 0 && (
                        <div className="py-12 text-center text-gray-400 italic bg-gray-50 rounded-xl border-2 border-dashed border-gray-100">
                            No team members assigned to this project yet.
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 uppercase tracking-widest font-medium">
                <div>Start: {format(projectStart, 'MMM yyyy')}</div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span>Timeline Visualization</span>
                </div>
                <div>End: {format(projectEnd, 'MMM yyyy')}</div>
            </div>
        </div>
    );
}
