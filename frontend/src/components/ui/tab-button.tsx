// components/ui/TabButton.tsx
import React from "react";
import clsx from "clsx";

interface TabButtonProps<T extends string = string> {
  tabName: T;
  activeTab: T;
  setActiveTab: (tab: T) => void;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export const TabButton = <T extends string>({
  tabName,
  activeTab,
  setActiveTab,
  label,
  icon,
  disabled = false,
  className = "",
}: TabButtonProps<T>) => {
  const isActive = activeTab === tabName;

  return (
    <button
      onClick={() => setActiveTab(tabName)}
      disabled={disabled}
      className={clsx(
        "flex items-center gap-2 px-6 py-3 rounded-lg font-orbitron transition-all duration-300",
        isActive
          ? "bg-gradient-to-r from-[#b16cea] to-[#3beaff] text-white shadow-lg shadow-[#b16cea]/50"
          : "bg-gradient-to-r from-[#b16cea]/10 to-[#3beaff]/10 text-[#3beaff] hover:from-[#b16cea]/20 hover:to-[#3beaff]/20",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      {icon}
      {label}
    </button>
  );
};
