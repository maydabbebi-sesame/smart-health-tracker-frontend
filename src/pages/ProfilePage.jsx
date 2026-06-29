import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
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

import { EditableListSection } from '../features/profile/EditableListSection'
import { getPatientProfile, resolveAssetUrl, updateUserProfile, uploadProfilePicture } from '../services/profileService'
import { getMedicalHistory, createMedicalHistoryEntry, updateMedicalHistoryEntry, deleteMedicalHistoryEntry } from '../services/medicalHistoryService'
import { getVaccinations, createVaccination, updateVaccination, deleteVaccination } from '../services/vaccinationsService'
import { LoadingSkeleton } from '../shared/ui/LoadingSkeleton'
import { LanguageSwitcher } from '../shared/ui/LanguageSwitcher'
import { ThemeToggle } from '../shared/ui/ThemeToggle'
import { useTranslation } from '../i18n/useTranslation'

function ProfilePage() {
  const { t, localeTag } = useTranslation()

  const healthDetails = [
    { label: t('profile.details.age', 'Age'), value: t('profile.details.ageValueFallback', '29 ans') },
    { label: t('profile.details.weight', 'Poids'), value: t('profile.details.weightValueFallback', '68 kg') },
    { label: t('profile.details.height', 'Taille'), value: t('profile.details.heightValueFallback', '1.68 m') },
    { label: t('profile.details.bloodGroup', 'Groupe sanguin'), value: t('profile.details.bloodGroupValueFallback', 'O+') },
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
  const [saveError, setSaveError] = useState('')
  const [photoError, setPhotoError] = useState('')
  const [isEditingHealth, setIsEditingHealth] = useState(false)
  const [editableHealth, setEditableHealth] = useState({ age: '', weight: '', height: '', blood_group: '' })
  const [healthError, setHealthError] = useState('')
  const [isEditingEmergency, setIsEditingEmergency] = useState(false)
  const [editableEmergencyContact, setEditableEmergencyContact] = useState('')
  const [emergencyError, setEmergencyError] = useState('')
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [notificationsError, setNotificationsError] = useState('')
  const queryClient = useQueryClient()
  const { data: profile, isLoading } = useQuery({
    queryKey: ['patient-profile'],
    queryFn: getPatientProfile,
  })

  function invalidateProfile() {
    queryClient.invalidateQueries({ queryKey: ['patient-profile'] })
  }

  const { mutate: updateProfile, isPending: isSavingProfile } = useMutation({
    mutationFn: (payload) => updateUserProfile(payload),
  })

  const { mutate: savePhoto, isPending: isSavingPhoto } = useMutation({
    mutationFn: (file) => uploadProfilePicture(file),
    onSuccess: (result) => {
      if (!result.success) {
        setPhotoError(result.error)
        return
      }
      setPhotoError('')
      invalidateProfile()
    },
    onError: (error) => {
      setPhotoError(error.message || t('profile.photoError', 'Impossible de mettre à jour la photo de profil'))
    },
  })

  useEffect(() => {
    if (profile && profile.data) {
      const p = profile.data
      setEditableProfile((current) => ({
        ...current,
        name: p.first_name || p.name || current.name,
        email: p.email || current.email,
        location: p.location || p.city || p.address || current.location,
        phone: p.phone || current.phone,
      }))
      setEditableHealth((current) => ({
        age: p.age ?? current.age,
        weight: p.weight ?? current.weight,
        height: p.height ?? current.height,
        blood_group: p.blood_group || current.blood_group,
      }))
      setEditableEmergencyContact((current) => p.emergency_contact ?? current)
      setNotificationsEnabled(p.notifications_enabled ?? true)
      if (p.profile_picture) {
        setProfilePhoto(resolveAssetUrl(p.profile_picture))
      }
    }
  }, [profile])

  if (isLoading) {
    return <LoadingSkeleton />
  }

  const profileData = profile?.data
  const profileStatus = profileData && profileData.name && profileData.email && profileData.phone && (profileData.address || profileData.city || profileData.location)
    ? t('profile.statusCards.complete', 'Complet')
    : t('profile.statusCards.incomplete', 'Incomplet')
  const healthProfileStatus = profileData && profileData.age && profileData.weight && profileData.height && profileData.blood_group
    ? t('profile.statusCards.complete', 'Complet')
    : t('profile.statusCards.incomplete', 'Incomplet')
  const rawCreatedAt = profileData?.created_at || profileData?.registration_date || profileData?.date_joined || profileData?.joined_at
  const memberSince = rawCreatedAt
    ? new Date(rawCreatedAt).toLocaleDateString(localeTag, { month: 'long', year: 'numeric' })
    : t('profile.details.notAvailable', 'N/R')

  function handlePhotoChange(event) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setProfilePhoto(URL.createObjectURL(file))
    savePhoto(file)
  }

  function updateEditableProfile(field, value) {
    setEditableProfile((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function updateEditableHealth(field, value) {
    setEditableHealth((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function handleSaveProfile() {
    updateProfile(
      {
        name: editableProfile.name,
        email: editableProfile.email,
        address: editableProfile.location,
        phone: editableProfile.phone,
      },
      {
        onSuccess: (result) => {
          if (!result.success) {
            setSaveError(result.error)
            return
          }
          setSaveError('')
          setIsEditingProfile(false)
          invalidateProfile()
        },
        onError: (error) => {
          setSaveError(error.message || t('profile.saveError', 'Impossible de mettre à jour le profil'))
        },
      },
    )
  }

  function handleSaveHealth() {
    updateProfile(
      {
        age: editableHealth.age || null,
        weight: editableHealth.weight || null,
        height: editableHealth.height || null,
        blood_group: editableHealth.blood_group || null,
      },
      {
        onSuccess: (result) => {
          if (!result.success) {
            setHealthError(result.error)
            return
          }
          setHealthError('')
          setIsEditingHealth(false)
          invalidateProfile()
        },
        onError: (error) => {
          setHealthError(error.message || t('profile.details.saveError', 'Impossible de mettre à jour les détails de santé'))
        },
      },
    )
  }

  function handleSaveEmergencyContact() {
    updateProfile(
      { emergency_contact: editableEmergencyContact },
      {
        onSuccess: (result) => {
          if (!result.success) {
            setEmergencyError(result.error)
            return
          }
          setEmergencyError('')
          setIsEditingEmergency(false)
          invalidateProfile()
        },
        onError: (error) => {
          setEmergencyError(error.message || t('profile.emergencyContact.saveError', "Impossible de mettre à jour le contact d'urgence"))
        },
      },
    )
  }

  function handleToggleNotifications(checked) {
    setNotificationsEnabled(checked)
    updateProfile(
      { notifications_enabled: checked },
      {
        onSuccess: (result) => {
          if (!result.success) {
            setNotificationsEnabled(!checked)
            setNotificationsError(result.error)
            return
          }
          setNotificationsError('')
          invalidateProfile()
        },
        onError: (error) => {
          setNotificationsEnabled(!checked)
          setNotificationsError(error.message || t('profile.preferences.notificationsError', 'Impossible de mettre à jour les notifications'))
        },
      },
    )
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
            <input accept="image/*" className="sr-only" disabled={isSavingPhoto} type="file" onChange={handlePhotoChange} />
          </label>
          {isSavingPhoto && (
            <p className="mt-2 text-xs text-[#6d7a73]">{t('profile.photoUploading', 'Téléchargement…')}</p>
          )}
          {photoError && (
            <p className="mt-2 text-xs font-medium text-[#ba1a1a]">{photoError}</p>
          )}

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
            <div className="mt-6 space-y-3">
              {saveError && (
                <p className="text-sm font-medium text-[#ba1a1a]">{saveError}</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#bccac1] bg-white px-4 py-3 text-sm font-semibold text-[#3d4943] transition hover:bg-[#eff5ef] disabled:opacity-60"
                  disabled={isSavingProfile}
                  type="button"
                  onClick={() => {
                    setSaveError('')
                    setIsEditingProfile(false)
                  }}
                >
                  <X size={17} />
                  {t('profile.actions.cancel', 'Annuler')}
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#00694c] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#008560] disabled:opacity-60"
                  disabled={isSavingProfile}
                  type="button"
                  onClick={handleSaveProfile}
                >
                  <Check size={17} />
                  {isSavingProfile
                    ? t('profile.actions.saving', 'Enregistrement…')
                    : t('profile.actions.save', 'Enregistrer')}
                </button>
              </div>
            </div>
          ) : (
            <button
              className="mt-6 w-full rounded-lg bg-[#00694c] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#008560]"
              type="button"
              onClick={() => {
                setSaveError('')
                setIsEditingProfile(true)
              }}
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
              <div>
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-sm font-semibold text-[#171d1a] dark:text-white">{t('profile.details.sectionTitle', 'Détails de santé')}</h2>
                  {isEditingHealth ? (
                    <div className="flex gap-2">
                      <button
                        className="rounded-lg border border-[#bccac1] bg-white px-3 py-2 text-xs font-semibold text-[#3d4943] transition hover:bg-[#eff5ef] disabled:opacity-60"
                        disabled={isSavingProfile}
                        type="button"
                        onClick={() => {
                          setHealthError('')
                          setIsEditingHealth(false)
                        }}
                      >
                        {t('profile.actions.cancel', 'Annuler')}
                      </button>
                      <button
                        className="rounded-lg bg-[#00694c] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#008560] disabled:opacity-60"
                        disabled={isSavingProfile}
                        type="button"
                        onClick={handleSaveHealth}
                      >
                        {isSavingProfile ? t('profile.actions.saving', 'Enregistrement…') : t('profile.actions.save', 'Enregistrer')}
                      </button>
                    </div>
                  ) : (
                    <button
                      className="rounded-lg bg-[#eff5ef] px-3 py-2 text-xs font-semibold text-[#00694c] transition hover:bg-[#dff0e7]"
                      type="button"
                      onClick={() => {
                        setHealthError('')
                        setIsEditingHealth(true)
                      }}
                    >
                      {t('profile.actions.modify', 'Modifier')}
                    </button>
                  )}
                </div>
                {healthError && (
                  <p className="mt-2 text-sm font-medium text-[#ba1a1a]">{healthError}</p>
                )}
                <section className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {isEditingHealth ? (
                    <>
                      <article className="sht-card p-5">
                        <p className="text-sm text-[#6d7a73]">{t('profile.details.age', 'Age')}</p>
                        <input
                          className="font-metric mt-2 w-full rounded-lg border border-[#bccac1] px-2 py-1 text-xl font-semibold outline-none focus:border-[#00694c] focus:ring-2 focus:ring-[#00694c]"
                          type="number"
                          value={editableHealth.age ?? ''}
                          onChange={(event) => updateEditableHealth('age', event.target.value)}
                        />
                      </article>
                      <article className="sht-card p-5">
                        <p className="text-sm text-[#6d7a73]">{t('profile.details.weight', 'Poids')}</p>
                        <input
                          className="font-metric mt-2 w-full rounded-lg border border-[#bccac1] px-2 py-1 text-xl font-semibold outline-none focus:border-[#00694c] focus:ring-2 focus:ring-[#00694c]"
                          type="number"
                          value={editableHealth.weight ?? ''}
                          onChange={(event) => updateEditableHealth('weight', event.target.value)}
                        />
                      </article>
                      <article className="sht-card p-5">
                        <p className="text-sm text-[#6d7a73]">{t('profile.details.height', 'Taille')} (cm)</p>
                        <input
                          className="font-metric mt-2 w-full rounded-lg border border-[#bccac1] px-2 py-1 text-xl font-semibold outline-none focus:border-[#00694c] focus:ring-2 focus:ring-[#00694c]"
                          type="number"
                          value={editableHealth.height ?? ''}
                          onChange={(event) => updateEditableHealth('height', event.target.value)}
                        />
                      </article>
                      <article className="sht-card p-5">
                        <p className="text-sm text-[#6d7a73]">{t('profile.details.bloodGroup', 'Groupe sanguin')}</p>
                        <select
                          className="font-metric mt-2 w-full rounded-lg border border-[#bccac1] px-2 py-1 text-xl font-semibold outline-none focus:border-[#00694c] focus:ring-2 focus:ring-[#00694c]"
                          value={editableHealth.blood_group || ''}
                          onChange={(event) => updateEditableHealth('blood_group', event.target.value)}
                        >
                          <option value="">{notAvailable}</option>
                          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => (
                            <option key={group} value={group}>{group}</option>
                          ))}
                        </select>
                      </article>
                    </>
                  ) : (
                    details.map((item) => (
                      <article className="sht-card p-5" key={item.label}>
                        <p className="text-sm text-[#6d7a73]">{item.label}</p>
                        <p className="font-metric mt-2 text-2xl font-semibold text-[#171d1a] dark:text-white">
                          {item.value}
                        </p>
                      </article>
                    ))
                  )}
                </section>
              </div>

              <section className="grid gap-4 md:grid-cols-3">
                {[
                  { label: t('profile.statusCards.profile', 'Profil'), value: profileStatus, icon: ShieldCheck },
                  { label: t('profile.statusCards.health', 'Santé'), value: healthProfileStatus, icon: HeartPulse },
                  { label: t('profile.statusCards.memberSince', 'Membre depuis'), value: memberSince, icon: CalendarCheck },
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
                  <div className="flex flex-1 gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#ffdad6] text-[#ba1a1a]">
                      <AlertCircle size={22} />
                    </div>
                    <div className="flex-1">
                      <h2 className="font-semibold text-[#171d1a] dark:text-white">{t('profile.emergencyContact.title', "Contact d'urgence")}</h2>
                      {isEditingEmergency ? (
                        <input
                          className="mt-2 w-full rounded-lg border border-[#bccac1] bg-white px-3 py-2 text-sm outline-none focus:border-[#00694c] focus:ring-2 focus:ring-[#00694c]"
                          placeholder={t('profile.emergencyContact.details', 'Nom complet - Membre de la famille - Téléphone')}
                          value={editableEmergencyContact}
                          onChange={(event) => setEditableEmergencyContact(event.target.value)}
                        />
                      ) : (
                        <p className="mt-1 text-sm text-[#6d7a73]">
                          {editableEmergencyContact || t('profile.emergencyContact.details', 'Nom complet - Membre de la famille - Téléphone')}
                        </p>
                      )}
                      {emergencyError && (
                        <p className="mt-1 text-xs font-medium text-[#ba1a1a]">{emergencyError}</p>
                      )}
                    </div>
                  </div>
                  {isEditingEmergency ? (
                    <div className="flex gap-2">
                      <button
                        className="rounded-lg border border-[#bccac1] bg-white px-4 py-2 text-sm font-semibold text-[#3d4943] transition hover:bg-[#eff5ef] disabled:opacity-60"
                        disabled={isSavingProfile}
                        type="button"
                        onClick={() => {
                          setEmergencyError('')
                          setIsEditingEmergency(false)
                        }}
                      >
                        {t('profile.actions.cancel', 'Annuler')}
                      </button>
                      <button
                        className="rounded-lg bg-[#00694c] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#008560] disabled:opacity-60"
                        disabled={isSavingProfile}
                        type="button"
                        onClick={handleSaveEmergencyContact}
                      >
                        {isSavingProfile ? t('profile.actions.saving', 'Enregistrement…') : t('profile.actions.save', 'Enregistrer')}
                      </button>
                    </div>
                  ) : (
                    <button
                      className="rounded-lg bg-[#eff5ef] px-4 py-2 text-sm font-semibold text-[#00694c] transition hover:bg-[#dff0e7]"
                      type="button"
                      onClick={() => {
                        setEmergencyError('')
                        setIsEditingEmergency(true)
                      }}
                    >
                      {t('profile.actions.modify', 'Modifier')}
                    </button>
                  )}
                </div>
              </article>
            </div>
          )}

          {activeTab === 'history' && (
            <EditableListSection
              createFn={createMedicalHistoryEntry}
              dateLabel={t('profile.history.dateLabel', 'Date')}
              deleteFn={deleteMedicalHistoryEntry}
              fetchFn={getMedicalHistory}
              getStatusClassName={() => 'bg-[#eff5ef] text-[#00694c]'}
              icon={CalendarCheck}
              labels={{
                add: t('profile.actions.add', 'Ajouter'),
                save: t('profile.actions.save', 'Enregistrer'),
                saving: t('profile.actions.saving', 'Enregistrement…'),
                cancel: t('profile.actions.cancel', 'Annuler'),
                edit: t('profile.actions.modify', 'Modifier'),
                delete: t('profile.actions.delete', 'Supprimer'),
                loading: t('profile.history.loading', 'Chargement…'),
                empty: t('profile.history.empty', 'Aucun antécédent médical enregistré.'),
                error: t('profile.history.error', 'Impossible de mettre à jour les antécédents médicaux'),
              }}
              nameField="title"
              nameLabel={t('profile.history.titleLabel', 'Titre')}
              queryKey={['medical-history']}
              statusOptions={[
                t('profile.history.statusStable', 'Stable'),
                t('profile.history.statusSurveillance', 'Surveillance'),
                t('profile.history.statusActive', 'Active'),
              ]}
              subtitle={t('profile.history.subtitle', 'Pathologies, allergies et suivis importants pour contextualiser les futures analyses IA.')}
              title={t('profile.history.title', 'Médecine historique')}
              updateFn={updateMedicalHistoryEntry}
            />
          )}

          {activeTab === 'vaccinations' && (
            <EditableListSection
              createFn={createVaccination}
              dateLabel={t('profile.vaccinations.dateLabel', 'Date')}
              deleteFn={deleteVaccination}
              fetchFn={getVaccinations}
              getStatusClassName={(status) =>
                status === t('profile.vaccinations.statusUpToDate', 'A jour')
                  ? 'bg-[#86f8c9]/35 text-[#00694c]'
                  : 'bg-[#fff3cd] text-[#8a5a00]'
              }
              icon={Syringe}
              labels={{
                add: t('profile.actions.add', 'Ajouter'),
                save: t('profile.actions.save', 'Enregistrer'),
                saving: t('profile.actions.saving', 'Enregistrement…'),
                cancel: t('profile.actions.cancel', 'Annuler'),
                edit: t('profile.actions.modify', 'Modifier'),
                delete: t('profile.actions.delete', 'Supprimer'),
                loading: t('profile.vaccinations.loading', 'Chargement…'),
                empty: t('profile.vaccinations.empty', 'Aucune vaccination enregistrée.'),
                error: t('profile.vaccinations.error', 'Impossible de mettre à jour les vaccinations'),
              }}
              nameField="name"
              nameLabel={t('profile.vaccinations.nameLabel', 'Vaccin')}
              queryKey={['vaccinations']}
              statusOptions={[
                t('profile.vaccinations.statusUpToDate', 'A jour'),
                t('profile.vaccinations.statusToRenew', 'À renouveler'),
              ]}
              subtitle={t('profile.vaccinations.subtitle', 'Carnet patient avec statut de chaque vaccin.')}
              title={t('profile.vaccinations.title', 'Vaccinations')}
              updateFn={updateVaccination}
            />
          )}

          {activeTab === 'preferences' && (
            <section className="grid gap-4 md:grid-cols-2">
              <article className="sht-card p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-semibold text-[#171d1a] dark:text-white">{t('profile.preferences.notificationsTitle', 'Notifications')}</h2>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      checked={notificationsEnabled}
                      className="peer sr-only"
                      type="checkbox"
                      onChange={(event) => handleToggleNotifications(event.target.checked)}
                    />
                    <span className="h-6 w-11 rounded-full bg-[#dce5df] transition peer-checked:bg-[#00694c] peer-focus-visible:ring-2 peer-focus-visible:ring-[#00694c]" />
                    <span className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition peer-checked:translate-x-5" />
                  </label>
                </div>
                <p className="mt-2 text-sm leading-6 text-[#6d7a73]">
                  {t('profile.preferences.notificationsText', 'Alertes IA, rappels de suivi et synthèses hebdomadaires actives.')}
                </p>
                {notificationsError && (
                  <p className="mt-2 text-xs font-medium text-[#ba1a1a]">{notificationsError}</p>
                )}
              </article>

              <article className="sht-card p-5">
                <h2 className="font-semibold text-[#171d1a] dark:text-white">{t('profile.preferences.healthSummaryTitle', 'Résumé santé')}</h2>
                <p className="mt-2 text-sm leading-6 text-[#6d7a73]">
                  {profile?.data?.weight && profile?.data?.height
                    ? t(
                        'profile.preferences.healthSummaryText',
                        'IMC estimé : {{bmi}} - Groupe sanguin : {{bloodGroup}}.',
                        {
                          bmi: (profile.data.weight / (Number(profile.data.height) / 100) ** 2).toFixed(1),
                          bloodGroup: profile.data.blood_group || notAvailable,
                        },
                      )
                    : t('profile.preferences.healthSummaryEmpty', 'Complétez votre poids et votre taille pour afficher votre IMC.')}
                </p>
              </article>

              <article className="sht-card p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-semibold text-[#171d1a] dark:text-white">{t('profile.preferences.themeTitle', 'Thème')}</h2>
                  <ThemeToggle />
                </div>
                <p className="mt-2 text-sm leading-6 text-[#6d7a73]">
                  {t('profile.preferences.themeText', 'Préférence de thème persistante via Zustand.')}
                </p>
              </article>

              <article className="sht-card p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-semibold text-[#171d1a] dark:text-white">{t('profile.preferences.languageTitle', 'Langue')}</h2>
                  <LanguageSwitcher />
                </div>
                <p className="mt-2 text-sm leading-6 text-[#6d7a73]">
                  {t('profile.preferences.languageText', 'Interface de démo préparée en français et en anglais.')}
                </p>
              </article>
            </section>
          )}
        </div>
      </section>
    </div>
  )
}

export default ProfilePage
