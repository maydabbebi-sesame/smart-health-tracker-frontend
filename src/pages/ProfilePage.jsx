import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  AlertCircle,
  Camera,
  CalendarCheck,
  Check,
  HeartPulse,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Syringe,
  UserRound,
  X,
} from 'lucide-react'
import { useState, useEffect } from 'react'

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

const tabs = [
  { id: 'information', label: 'Informations' },
  { id: 'history', label: 'Medecine historique' },
  { id: 'vaccinations', label: 'Vaccinations' },
  { id: 'preferences', label: 'Preferences' },
]

function ProfilePage() {
  const [activeTab, setActiveTab] = useState('information')
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profilePhoto, setProfilePhoto] = useState('')
  const [editableProfile, setEditableProfile] = useState({
    name: '',
    email: '',
    location: '',
    phone: '',
  })
  const { data: profile, isLoading } = useQuery({
    queryKey: ['patient-profile'],
    queryFn: getPatientProfile,
  })

  useEffect(() => {
    if (profile && profile.data) {
      const p = profile.data
      setEditableProfile((current) => ({
        ...current,
        name: p.first_name || p.name || current.name,
        email: p.email || current.email,
        location: p.location || p.city || current.location,
        phone: p.phone || current.phone,
      }))
    }
  }, [profile])

  if (isLoading) {
    return <LoadingSkeleton />
  }

  const profileStatus = profile?.profileStatus
  const healthProfileStatus = profile?.healthProfileStatus

  function handlePhotoChange(event) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setProfilePhoto(URL.createObjectURL(file))
  }

  function updateEditableProfile(field, value) {
    setEditableProfile((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const details = (profile && profile.data) ? [
    { label: 'Age', value: profile.data.age ? `${profile.data.age} ans` : 'N/R' },
    { label: 'Poids', value: profile.data.weight ? `${profile.data.weight} kg` : 'N/R' },
    { label: 'Taille', value: profile.data.height ? `${(Number(profile.data.height) / 100).toFixed(2)} m` : 'N/R' },
    { label: 'Groupe sanguin', value: profile.data.blood_group || 'N/R' },
  ] : healthDetails

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
          <label className="group relative mx-auto block h-28 w-28 cursor-pointer">
            <span className="grid h-28 w-28 place-items-center overflow-hidden rounded-full border-4 border-[#008560] bg-[#86f8c9]/35 text-[#00694c]">
              {profilePhoto ? (
                <img alt="Photo de profil" className="h-full w-full object-cover" src={profilePhoto} />
              ) : (
                <UserRound size={48} />
              )}
            </span>
            <span className="absolute bottom-1 right-1 grid h-9 w-9 place-items-center rounded-full bg-[#00694c] text-white shadow-lg transition group-hover:bg-[#008560]">
              <Camera size={17} />
            </span>
            <input accept="image/*" className="sr-only" type="file" onChange={handlePhotoChange} />
          </label>

          {isEditingProfile ? (
            <input
              className="mx-auto mt-5 h-11 w-full rounded-lg border border-[#bccac1] bg-white px-3 text-center text-xl font-semibold outline-none transition focus:border-[#00694c] focus:ring-2 focus:ring-[#00694c]"
              value={editableProfile.name}
              onChange={(event) => updateEditableProfile('name', event.target.value)}
            />
          ) : (
            <h2 className="mt-5 text-2xl font-semibold text-[#171d1a] dark:text-white">{editableProfile.name}</h2>
          )}
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
              {isEditingProfile ? (
                <input
                  className="w-full bg-transparent outline-none"
                  value={editableProfile.email}
                  onChange={(event) => updateEditableProfile('email', event.target.value)}
                />
              ) : (
                editableProfile.email
              )}
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-[#eff5ef] p-3 text-sm text-[#3d4943]">
              <MapPin size={17} className="text-[#00694c]" />
              {isEditingProfile ? (
                <input
                  className="w-full bg-transparent outline-none"
                  value={editableProfile.location}
                  onChange={(event) => updateEditableProfile('location', event.target.value)}
                />
              ) : (
                editableProfile.location
              )}
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-[#eff5ef] p-3 text-sm text-[#3d4943]">
              <Phone size={17} className="text-[#00694c]" />
              {isEditingProfile ? (
                <input
                  className="w-full bg-transparent outline-none"
                  value={editableProfile.phone}
                  onChange={(event) => updateEditableProfile('phone', event.target.value)}
                />
              ) : (
                editableProfile.phone
              )}
            </div>
          </div>

          {isEditingProfile ? (
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#bccac1] bg-white px-4 py-3 text-sm font-semibold text-[#3d4943] transition hover:bg-[#eff5ef]"
                type="button"
                onClick={() => setIsEditingProfile(false)}
              >
                <X size={17} />
                Annuler
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#00694c] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#008560]"
                type="button"
                onClick={() => setIsEditingProfile(false)}
              >
                <Check size={17} />
                Enregistrer
              </button>
            </div>
          ) : (
            <button
              className="mt-6 w-full rounded-lg bg-[#00694c] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#008560]"
              type="button"
              onClick={() => setIsEditingProfile(true)}
            >
              Modifier le profil
            </button>
          )}
        </article>

        <div className="space-y-6">
          <nav aria-label="Sections du profil" className="flex gap-2 overflow-x-auto rounded-xl bg-[#eaefea] p-1">
            {tabs.map((tab) => (
              <button
                aria-pressed={activeTab === tab.id}
                className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-white text-[#00694c] shadow-[0_2px_12px_rgba(0,0,0,0.06)]'
                    : 'text-[#6d7a73] hover:bg-white/55 hover:text-[#171d1a]'
                }`}
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {activeTab === 'information' && (
            <div className="space-y-6">
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {details.map((item) => (
                  <article className="sht-card p-5" key={item.label}>
                    <p className="text-sm text-[#6d7a73]">{item.label}</p>
                    <p className="font-metric mt-2 text-2xl font-semibold text-[#171d1a] dark:text-white">
                      {item.value}
                    </p>
                  </article>
                ))}
              </section>

              <section className="grid gap-4 md:grid-cols-3">
                {[
                  { label: 'Profil', value: profileStatus, icon: ShieldCheck },
                  { label: 'Sante', value: healthProfileStatus, icon: HeartPulse },
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
          )}

          {activeTab === 'history' && (
            <article className="sht-card p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-[#171d1a] dark:text-white">Medecine historique</h2>
                  <p className="mt-1 text-sm text-[#6d7a73]">
                    Pathologies, allergies et suivis importants pour contextualiser les futures analyses IA.
                  </p>
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
          )}

          {activeTab === 'vaccinations' && (
            <article className="sht-card p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-[#171d1a] dark:text-white">Vaccinations</h2>
                  <p className="mt-1 text-sm text-[#6d7a73]">Carnet patient avec statut de chaque vaccin.</p>
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
          )}

          {activeTab === 'preferences' && (
            <section className="grid gap-4 md:grid-cols-2">
              {[
                { title: 'Notifications', text: 'Alertes IA, rappels de suivi et syntheses hebdomadaires actives.' },
                { title: 'Confidentialite', text: 'Donnees patient mockees cote front, contrat backend documente.' },
                { title: 'Theme', text: 'Preference de theme persistante via Zustand.' },
                { title: 'Langue', text: 'Interface de demo preparee en francais fonctionnel.' },
              ].map((item) => (
                <article className="sht-card p-5" key={item.title}>
                  <h2 className="font-semibold text-[#171d1a] dark:text-white">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#6d7a73]">{item.text}</p>
                </article>
              ))}
            </section>
          )}
        </div>
      </section>
    </div>
  )
}

export default ProfilePage
