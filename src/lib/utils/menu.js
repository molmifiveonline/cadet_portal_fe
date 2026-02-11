import {
  LayoutDashboard,
  Users,
  UserCheck,
  Calendar,
  CalendarDays,
  FileText,
  Receipt,
  Activity,
  FolderKanban,
  BookOpen,
  GraduationCap,
  Settings,
  FileBadge,
  ChevronDown,
  ChevronRight,
  School,
  ListChecks,
  ClipboardCheck,
} from 'lucide-react';

export const MenuItems = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    url: '/dashboard',
    allowedRoles: ['admin', 'SuperAdmin'],
  },
  {
    title: 'Institutes',
    icon: School,
    url: '/institutes',
    allowedRoles: ['admin', 'SuperAdmin'],
  },
  {
    title: 'Cadet Management',
    icon: Users,
    url: '/cadets',
    allowedRoles: ['admin', 'SuperAdmin'],
  },
  {
    title: 'Screening',
    icon: ClipboardCheck,
    url: '/screening',
    allowedRoles: ['admin', 'SuperAdmin'],
  },
  {
    title: 'Tests & Interviews',
    icon: ListChecks,
    url: '/tests',
    allowedRoles: ['admin', 'SuperAdmin'],
  },
  {
    title: 'Medical & Docs',
    icon: FileBadge,
    url: '/medical',
    allowedRoles: ['admin', 'SuperAdmin'],
  },
];
