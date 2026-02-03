import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <h1 className="text-4xl font-bold mb-8 text-gray-900">Project Cost Manager</h1>
      <p className="text-gray-600 mb-12 text-center max-w-md">
        Manage projects, track time, and analyze financial projections with ease.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        <Link href="/admin" className="group">
          <div className="bg-white p-8 rounded-xl shadow-md border hover:border-blue-500 hover:shadow-lg transition-all text-center">
            <h2 className="text-2xl font-bold mb-2 group-hover:text-blue-600">Admin Portal</h2>
            <p className="text-gray-500">Manage projects, employees, and view financial stats.</p>
          </div>
        </Link>

        <Link href="/employee" className="group">
          <div className="bg-white p-8 rounded-xl shadow-md border hover:border-green-500 hover:shadow-lg transition-all text-center">
            <h2 className="text-2xl font-bold mb-2 group-hover:text-green-600">Employee Portal</h2>
            <p className="text-gray-500">Log work hours, track vacation, and view assignments.</p>
          </div>
        </Link>
      </div>
    </main>
  );
}
