import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  AlertCircle,
  CalendarCheck,
  HeartPulse,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Syringe,
  UserRound,
} from 'lucide-react'

import { getPatientProfile } from '../services/profileService'
import { LoadingSkeleton } from '../shared/ui/LoadingSkeleton'

const healthDetails = [
  { label: 'Age', value: '29 ans' },
  { label: 'Poids', value: '68 kg' },
  { label: 'Taille', value: '1.68 m' },
  { label: 'Groupe sanguin', value: 'O+' },
]

const medicalHistory = [
  { title: 'Asthme leger', date: 'Diagnostique en 2018', status: 'Stable' },
  { title: 'Migraine chronique', date: 'Suivi depuis 2021', status: 'Surveillance' },
  { title: 'Allergie pollen', date: 'Declaree en 2019', status: 'Active' },
]

const vaccinations = [
  { name: 'COVID-19', date: 'Mars 2025', status: 'A jour' },
  { name: 'Grippe saisonniere', date: 'Octobre 2025', status: 'A renouveler' },
  { name: 'Tetanos', date: 'Juillet 2022', status: 'A jour' },
]

function ProfilePage() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['patient-profile'],
    queryFn: getPatientProfile,
  })

  if (isLoading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[32px] font-semibold leading-tight text-[#171d1a] dark:text-white">Mon Profil</h1>
        <p className="mt-2 text-base leading-7 text-[#3d4943]">
          Gerez vos informations de sante et vos preferences de suivi.
        </p>
      </div>

      <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <article className="sht-card p-6 text-center">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-full border-4 border-[#008560] bg-[#86f8c9]/35 text-[#00694c]">
            <UserRound size={44} />
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-[#171d1a] dark:text-white">{profile.name}</h2>
          <p className="mt-1 text-sm text-[#6d7a73]">Compte patient verifie</p>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {['Patient/User', 'Profil complet', 'Acces securise'].map((tag) => (
              <span className="rounded-full bg-[#eff5ef] px-3 py-1 text-xs font-semibold text-[#00694c]" key={tag}>
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-6 space-y-3 text-left">
            <div className="flex items-center gap-3 rounded-lg bg-[#eff5ef] p-3 text-sm text-[#3d4943]">
              <Mail size={17} className="text-[#00694c]" />
              {profile.email}
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-[#eff5ef] p-3 text-sm text-[#3d4943]">
              <MapPin size={17} className="text-[#00694c]" />
              {profile.location}
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-[#eff5ef] p-3 text-sm text-[#3d4943]">
              <Phone size={17} className="text-[#00694c]" />
              +216 22 000 000
            </div>
          </div>

          <button
            className="mt-6 w-full rounded-lg bg-[#00694c] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#008560]"
            type="button"
          >
            Modifier le profil
          </button>
        </article>

        <div className="space-y-6">
          <nav className="flex gap-2 overflow-x-auto rounded-xl bg-[#eaefea] p-1">
            {['Informations', 'Historique Medical', 'Vaccinations', 'Preferences'].map((tab, index) => (
              <button
                className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  index === 0 ? 'bg-white text-[#00694c] shadow-[0_2px_12px_rgba(0,0,0,0.06)]' : 'text-[#6d7a73]'
                }`}
                key={tab}
                type="button"
              >
                {tab}
              </button>
            ))}
          </nav>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {healthDetails.map((item) => (
              <article className="sht-card p-5" key={item.label}>
                <p className="text-sm text-[#6d7a73]">{item.label}</p>
                <p className="font-metric mt-2 text-2xl font-semibold text-[#171d1a] dark:text-white">{item.value}</p>
              </article>
            ))}
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {[
              { label: 'Profil', value: profile.profileStatus, icon: ShieldCheck },
              { label: 'Sante', value: profile.healthProfileStatus, icon: HeartPulse },
              { label: 'Activite', value: 'Suivi hebdomadaire actif', icon: Activity },
            ].map((item) => (
              <article className="sht-card p-5" key={item.label}>
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-[#86f8c9]/35 text-[#00694c]">
                  <item.icon size={22} />
                </div>
                <p className="mt-4 text-sm text-[#6d7a73]">{item.label}</p>
                <p className="mt-1 font-semibold text-[#171d1a] dark:text-white">{item.value}</p>
              </article>
            ))}
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <article className="sht-card p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-[#171d1a] dark:text-white">Historique Medical</h2>
                  <p className="mt-1 text-sm text-[#6d7a73]">Donnees mockees, pretes pour integration backend.</p>
                </div>
                <CalendarCheck className="text-[#00694c]" size={23} />
              </div>
              <div className="mt-5 space-y-3">
                {medicalHistory.map((item) => (
                  <div className="rounded-lg border border-[#dce5df] bg-white p-4" key={item.title}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[#171d1a]">{item.title}</p>
                        <p className="mt-1 text-sm text-[#6d7a73]">{item.date}</p>
                      </div>
                      <span className="rounded-full bg-[#eff5ef] px-3 py-1 text-xs font-semibold text-[#00694c]">
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="sht-card p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-[#171d1a] dark:text-white">Carnet de Vaccination</h2>
                  <p className="mt-1 text-sm text-[#6d7a73]">Synthese visible cote patient uniquement.</p>
                </div>
                <Syringe className="text-[#00694c]" size={23} />
              </div>
              <div className="mt-5 space-y-3">
                {vaccinations.map((item) => (
                  <div className="flex items-center justify-between gap-4 rounded-lg border border-[#dce5df] bg-white p-4" key={item.name}>
                    <div>
                      <p className="font-semibold text-[#171d1a]">{item.name}</p>
                      <p className="mt-1 text-sm text-[#6d7a73]">{item.date}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.status === 'A jour' ? 'bg-[#86f8c9]/35 text-[#00694c]' : 'bg-[#fff3cd] text-[#8a5a00]'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <article className="sht-card border-l-4 border-l-[#ba1a1a] p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#ffdad6] text-[#ba1a1a]">
                  <AlertCircle size={22} />
                </div>
                <div>
                  <h2 className="font-semibold text-[#171d1a] dark:text-white">Contact d'urgence</h2>
                  <p className="mt-1 text-sm text-[#6d7a73]">Sarra Ben Ali - Soeur - +216 55 000 000</p>
                </div>
              </div>
              <button className="rounded-lg bg-[#eff5ef] px-4 py-2 text-sm font-semibold text-[#00694c]" type="button">
                Modifier
              </button>
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}

export default ProfilePage
