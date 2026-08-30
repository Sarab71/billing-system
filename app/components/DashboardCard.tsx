import { ReactNode } from "react";

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  subtitle?: string;
  onClick?: () => void;
}

export default function DashboardCard({
  title,
  value,
  icon,
  subtitle,
  onClick,
}: DashboardCardProps) {
  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      {/* Top Section */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>

          <h3 className="mt-2 text-2xl font-bold tracking-tight text-gray-800 sm:text-3xl">
            {value}
          </h3>
        </div>

        {/* Icon */}
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 transition-transform duration-200 group-hover:scale-110">
          {icon}
        </div>
      </div>

      {/* Bottom Section */}
      {subtitle && (
        <div className="mt-5 border-t border-gray-100 pt-3">
          <p className="text-xs text-gray-400">
            {subtitle}
          </p>
        </div>
      )}
    </div>
  );
}