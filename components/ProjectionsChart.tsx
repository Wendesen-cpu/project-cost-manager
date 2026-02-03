'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart } from 'recharts';

export function ProjectionsChart({ data }: { data: any[] }) {
    return (
        <div className="h-[400px] w-full bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-bold mb-4">Financial Projections (Next 12 Months)</h3>
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                    data={data}
                    margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill="#4f46e5" />
                    <Bar dataKey="cost" name="Cost" fill="#ef4444" />
                    <Line type="monotone" dataKey="margin" name="Margin" stroke="#10b981" strokeWidth={3} />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}
