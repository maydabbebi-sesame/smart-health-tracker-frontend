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
    labelKey: 'nav.dashboard',
    to: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Profil',
    labelKey: 'nav.profile',
    to: '/profile',
    icon: UserRound,
  },
  {
    label: 'Suivi',
    labelKey: 'nav.tracking',
    to: '/symptoms',
    icon: ClipboardList,
  },
  {
    label: 'Recommandations IA',
    labelKey: 'nav.aiRecommendations',
    to: '/ai-analysis',
    icon: BrainCircuit,
  },
  {
    label: 'Agent Médecin',
    labelKey: 'nav.doctorAgent',
    to: '/notifications',
    icon: Stethoscope,
  },
  {
    label: 'Historique',
    labelKey: 'nav.history',
    to: '/health-history',
    icon: HeartPulse,
  },
  {
    label: 'Paramètres',
    labelKey: 'nav.settings',
    to: '/settings',
    icon: Settings,
  },
]
