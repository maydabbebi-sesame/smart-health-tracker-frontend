import {
  Bell,
  BrainCircuit,
  ClipboardList,
  HeartPulse,
  LayoutDashboard,
  Settings,
  UserRound,
} from 'lucide-react'

export const navigationItems = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Symptoms',
    to: '/symptoms',
    icon: ClipboardList,
  },
  {
    label: 'Health History',
    to: '/health-history',
    icon: HeartPulse,
  },
  {
    label: 'AI Analysis',
    to: '/ai-analysis',
    icon: BrainCircuit,
  },
  {
    label: 'Notifications',
    to: '/notifications',
    icon: Bell,
  },
  {
    label: 'Profile',
    to: '/profile',
    icon: UserRound,
  },
  {
    label: 'Settings',
    to: '/settings',
    icon: Settings,
  },
]
