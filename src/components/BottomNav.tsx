import React from 'react';
import { ActiveTab } from '../types';
import { LayoutDashboard, FileText, Calendar, Camera, Building2, Settings, FolderArchive, ShieldCheck } from 'lucide-react';
import { useOfficerAuth } from '../firebase/AuthContext';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  savedReportsCount?: number;
}

interface BottomTabItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, savedReportsCount = 0 }) => {
  const { isAdmin } = useOfficerAuth();

  const tabs: BottomTabItem[] = [
    { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: LayoutDashboard },
    { id: 'preview', label: 'HTML View', icon: FileText },
    { id: 'calendar', label: 'ক্যালেন্ডার', icon: Calendar },
    { id: 'photos', label: 'ছবি', icon: Camera },
    { id: 'samities', label: 'সমিতি', icon: Building2 },
    { id: 'archive', label: 'আর্কাইভ', icon: FolderArchive, badge: savedReportsCount },
    ...(isAdmin
      ? [{ id: 'admin' as ActiveTab, label: 'এডমিন', icon: ShieldCheck }]
      : [{ id: 'settings' as ActiveTab, label: 'তথ্য', icon: Settings }]),
  ];

  return (
    <div className="xl:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-amber-200/80 px-1 py-1 no-print shadow-lg">
      <div className={`grid ${isAdmin ? 'grid-cols-7' : 'grid-cols-7'} gap-0.5`}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition relative ${
                isActive
                  ? 'text-amber-950 bg-amber-100/80 font-bold border border-amber-200/60'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-700' : 'text-stone-400'}`} />
              <span className="text-[9px] mt-0.5 leading-none truncate max-w-full">{tab.label}</span>
              {Boolean(tab.badge && tab.badge > 0) && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-600"></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
