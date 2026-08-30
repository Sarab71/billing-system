import { CalendarDays } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="w-full border-b border-gray-200 bg-white lg:min-h-[calc(100vh-64px)] lg:w-72 lg:border-r lg:border-b-0">
      {/* Header */}
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="text-base font-semibold text-gray-800">
          Today&apos;s Due
        </h2>
      </div>

      {/* Content */}
      <div className="flex min-h-56 flex-col items-center justify-center px-5 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
          <CalendarDays size={25} className="text-blue-600" />
        </div>

        <p className="mt-4 text-sm font-medium text-gray-700">
          No due bills today
        </p>

        <p className="mt-1 max-w-48 text-xs leading-5 text-gray-400">
          Upcoming payments and due bills will appear here.
        </p>
      </div>
    </aside>
  );
}