import {
  BrainCircuit,
  ClipboardList,
  HeartPulse,
  LayoutDashboard,
  Settings,
  Stethoscope,
  UserRound,
} from 'lucide-react'

export const navigationItems = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Profile',
    to: '/profile',
    icon: UserRound,
  },
  {
    label: 'Suivi',
    to: '/symptoms',
    icon: ClipboardList,
  },
  {
    label: 'AI Recommendations',
    to: '/ai-analysis',
    icon: BrainCircuit,
  },
  {
    label: 'Doctor Agent',
    to: '/notifications',
    icon: Stethoscope,
  },
  {
    label: 'Historique',
    to: '/health-history',
    icon: HeartPulse,
  },
  {
    label: 'Settings',
    to: '/settings',
    icon: Settings,
  },
]
