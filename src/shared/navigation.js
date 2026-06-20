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
    label: 'Tableau de bord',
    to: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Profil',
    to: '/profile',
    icon: UserRound,
  },
  {
    label: 'Suivi',
    to: '/symptoms',
    icon: ClipboardList,
  },
  {
    label: 'Recommandations IA',
    to: '/ai-analysis',
    icon: BrainCircuit,
  },
  {
    label: 'Agent Médecin',
    to: '/notifications',
    icon: Stethoscope,
  },
  {
    label: 'Historique',
    to: '/health-history',
    icon: HeartPulse,
  },
  {
    label: 'Paramètres',
    to: '/settings',
    icon: Settings,
  },
]
