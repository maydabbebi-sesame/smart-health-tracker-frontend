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
import { useTranslation } from '../i18n/useTranslation'

function ProfilePage() {
  const { t } = useTranslation()

  const healthDetails = [
    { label: t('profile.details.age', 'Age'), value: t('profile.details.ageValueFallback', '29 ans') },
    { label: t('profile.details.weight', 'Poids'), value: t('profile.details.weightValueFallback', '68 kg') },
    { label: t('profile.details.height', 'Taille'), value: t('profile.details.heightValueFallback', '1.68 m') },
    { label: t('profile.details.bloodGroup', 'Groupe sanguin'), value: t('profile.details.bloodGroupValueFallback', 'O+') },
  ]

  const medicalHistory = [
    { title: t('profile.history.asthmaTitle', 'Asthme léger'), date: t('profile.history.asthmaDate', 'Diagnostiqué en 2018'), status: t('profile.history.statusStable', 'Stable') },
    { title: t('profile.history.migraineTitle', 'Migraine chronique'), date: t('profile.history.migraineDate', 'Suivi depuis 2021'), status: t('profile.history.statusSurveillance', 'Surveillance') },
    { title: t('profile.history.pollenAllergyTitle', 'Allergie pollen'), date: t('profile.history.pollenAllergyDate', 'Declaree en 2019'), status: t('profile.history.statusActive', 'Active') },
  ]

  const vaccinations = [
    { name: t('profile.vaccinations.covid', 'COVID-19'), date: t('profile.vaccinations.covidDate', 'Mars 2025'), status: t('profile.vaccinations.statusUpToDate', 'A jour') },
    { name: t('profile.vaccinations.flu', 'Grippe saisonnière'), date: t('profile.vaccinations.fluDate', 'Octobre 2025'), status: t('profile.vaccinations.statusToRenew', 'À renouveler') },
    { name: t('profile.vaccinations.tetanus', 'Tetanos'), date: t('profile.vaccinations.tetanusDate', 'Juillet 2022'), status: t('profile.vaccinations.statusUpToDate', 'A jour') },
  ]

  const tabs = [
    { id: 'information', label: t('profile.tabs.information', 'Informations') },
    { id: 'history', label: t('profile.tabs.history', 'Médecine historique') },
    { id: 'vaccinations', label: t('profile.tabs.vaccinations', 'Vaccinations') },
    { id: 'preferences', label: t('profile.tabs.preferences', 'Préférences') },
  ]

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

  const notAvailable = t('profile.details.notAvailable', 'N/R')
  const details = (profile && profile.data) ? [
    { label: t('profile.details.age', 'Age'), value: profile.data.age ? t('profile.details.ageValue', '{{age}} ans', { age: profile.data.age }) : notAvailable },
    { label: t('profile.details.weight', 'Poids'), value: profile.data.weight ? t('profile.details.weightValue', '{{weight}} kg', { weight: profile.data.weight }) : notAvailable },
    { label: t('profile.details.height', 'Taille'), value: profile.data.height ? t('profile.details.heightValue', '{{height}} m', { height: (Number(profile.data.height) / 100).toFixed(2) }) : notAvailable },
    { label: t('profile.details.bloodGroup', 'Groupe sanguin'), value: profile.data.blood_group || notAvailable },
  ] : healthDetails

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[32px] font-semibold leading-tight text-[#171d1a] dark:text-white">{t('profile.title', 'Mon Profil')}</h1>
        <p className="mt-2 text-base leading-7 text-[#3d4943]">
          {t('profile.subtitle', 'Gérez vos informations de santé et vos préférences de suivi.')}
        </p>
      </div>

      <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <article className="sht-card p-6 text-center">
          <label className="group relative mx-auto block h-28 w-28 cursor-pointer">
            <span className="grid h-28 w-28 place-items-center overflow-hidden rounded-full border-4 border-[#008560] bg-[#86f8c9]/35 text-[#00694c]">
              {profilePhoto ? (
                <img alt={t('profile.photoAlt', 'Photo de profil')} className="h-full w-full object-cover" src={profilePhoto} />
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
          <p className="mt-1 text-sm text-[#6d7a73]">{t('profile.verifiedAccount', 'Compte patient vérifié')}</p>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {[
              t('profile.tags.patientUser', 'Patient/Utilisateur'),
              t('profile.tags.completeProfile', 'Profil complet'),
              t('profile.tags.securedAccess', 'Accès sécurisé'),
            ].map((tag) => (
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
                {t('profile.actions.cancel', 'Annuler')}
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#00694c] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#008560]"
                type="button"
                onClick={() => setIsEditingProfile(false)}
              >
                <Check size={17} />
                {t('profile.actions.save', 'Enregistrer')}
              </button>
            </div>
          ) : (
            <button
              className="mt-6 w-full rounded-lg bg-[#00694c] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#008560]"
              type="button"
              onClick={() => setIsEditingProfile(true)}
            >
              {t('profile.actions.editProfile', 'Modifier le profil')}
            </button>
          )}
        </article>

        <div className="space-y-6">
          <nav aria-label={t('profile.sectionsAriaLabel', 'Sections du profil')} className="flex gap-2 overflow-x-auto rounded-xl bg-[#eaefea] p-1">
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
                  { label: t('profile.statusCards.profile', 'Profil'), value: profileStatus, icon: ShieldCheck },
                  { label: t('profile.statusCards.health', 'Santé'), value: healthProfileStatus, icon: HeartPulse },
                  { label: t('profile.statusCards.activity', 'Activité'), value: t('profile.statusCards.activityValue', 'Suivi hebdomadaire actif'), icon: Activity },
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
                      <h2 className="font-semibold text-[#171d1a] dark:text-white">{t('profile.emergencyContact.title', "Contact d'urgence")}</h2>
                      <p className="mt-1 text-sm text-[#6d7a73]">{t('profile.emergencyContact.details', 'Nom complet - Membre de la famille - Téléphone')}</p>
                    </div>
                  </div>
                  <button className="rounded-lg bg-[#eff5ef] px-4 py-2 text-sm font-semibold text-[#00694c]" type="button">
                    {t('profile.actions.modify', 'Modifier')}
                  </button>
                </div>
              </article>
            </div>
          )}

          {activeTab === 'history' && (
            <article className="sht-card p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-[#171d1a] dark:text-white">{t('profile.history.title', 'Médecine historique')}</h2>
                  <p className="mt-1 text-sm text-[#6d7a73]">
                    {t('profile.history.subtitle', 'Pathologies, allergies et suivis importants pour contextualiser les futures analyses IA.')}
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
                  <h2 className="text-xl font-semibold text-[#171d1a] dark:text-white">{t('profile.vaccinations.title', 'Vaccinations')}</h2>
                  <p className="mt-1 text-sm text-[#6d7a73]">{t('profile.vaccinations.subtitle', 'Carnet patient avec statut de chaque vaccin.')}</p>
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
                        item.status === t('profile.vaccinations.statusUpToDate', 'A jour') ? 'bg-[#86f8c9]/35 text-[#00694c]' : 'bg-[#fff3cd] text-[#8a5a00]'
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
                { title: t('profile.preferences.notificationsTitle', 'Notifications'), text: t('profile.preferences.notificationsText', 'Alertes IA, rappels de suivi et synthèses hebdomadaires actives.') },
                { title: t('profile.preferences.confidentialityTitle', 'Confidentialité'), text: t('profile.preferences.confidentialityText', 'Données patient simulées côté front, contrat backend documenté.') },
                { title: t('profile.preferences.themeTitle', 'Thème'), text: t('profile.preferences.themeText', 'Préférence de thème persistante via Zustand.') },
                { title: t('profile.preferences.languageTitle', 'Langue'), text: t('profile.preferences.languageText', 'Interface de démo préparée en français fonctionnel.') },
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
