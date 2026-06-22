import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Activity,
  AlertCircle,
  Camera,
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
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'

import {
  getPatientProfile,
  updateUserProfile,
  uploadProfilePicture,
} from '../services/profileService'
import { getVitals } from '../services/vitalsService'
import { getCurrentUser } from '../services/authService'
import { LoadingSkeleton } from '../shared/ui/LoadingSkeleton'

const tabs = [
  { id: 'information', label: 'Informations' },
  { id: 'history', label: 'Historique medical' },
  { id: 'vaccinations', label: 'Vaccinations' },
  { id: 'preferences', label: 'Preferences' },
]

const emptyProfile = {
  name: '',
  email: '',
  address: '',
  phone: '',
  date_of_birth: '',
  gender: '',
  emergency_contact: '',
}

function getAssetUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//.test(path)) return path

  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5002'
  return `${apiBase.replace(/\/$/, '')}${path}`
}

function formatDate(value) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

function splitValues(value) {
  if (!value) return []
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function EmptyState({ children, icon: Icon }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-[#bccac1] bg-[#f5fbf5] p-6 text-center">
      <Icon className="text-[#00694c]" size={28} />
      <p className="mt-3 max-w-md text-sm leading-6 text-[#6d7a73]">{children}</p>
    </div>
  )
}

function ProfilePage() {
  const queryClient = useQueryClient()
  const currentUserUid = getCurrentUser()?.uid || 'anonymous'
  const [activeTab, setActiveTab] = useState('information')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [form, setForm] = useState(emptyProfile)

  const profileQuery = useQuery({
    queryKey: ['patient-profile', currentUserUid],
    queryFn: getPatientProfile,
  })
  const vitalsQuery = useQuery({
    queryKey: ['patient-vitals', currentUserUid],
    queryFn: () => getVitals(),
  })

  const profile = profileQuery.data?.success ? profileQuery.data.data : null
  const vitals = vitalsQuery.data?.success && Array.isArray(vitalsQuery.data.data)
    ? vitalsQuery.data.data
    : []
  const latestVital = vitals[0] || null

  useEffect(() => {
    if (!profile) return
    setForm({
      name: profile.name || '',
      email: profile.email || '',
      address: profile.address || '',
      phone: profile.phone || '',
      date_of_birth: formatDate(profile.date_of_birth),
      gender: profile.gender || '',
      emergency_contact: profile.emergency_contact || '',
    })
  }, [profile])

  const medicalItems = useMemo(() => {
    if (!latestVital) return []

    return [
      ...splitValues(latestVital.health_issues_history).map((title) => ({
        title,
        category: 'Antecedent',
      })),
      ...splitValues(latestVital.drug_allergies).map((title) => ({
        title,
        category: 'Allergie',
      })),
      ...splitValues(latestVital.family_health_issues).map((title) => ({
        title,
        category: 'Historique familial',
      })),
      ...splitValues(latestVital.current_treatments).map((title) => ({
        title,
        category: 'Traitement',
      })),
    ]
  }, [latestVital])

  const details = [
    { label: 'Age', value: latestVital?.age ? `${latestVital.age} ans` : 'Non renseigne' },
    { label: 'Poids', value: latestVital?.weight ? `${latestVital.weight} kg` : 'Non renseigne' },
    {
      label: 'Taille',
      value: latestVital?.height ? `${(Number(latestVital.height) / 100).toFixed(2)} m` : 'Non renseigne',
    },
    { label: 'Sexe', value: latestVital?.gender || profile?.gender || 'Non renseigne' },
  ]

  const completedFields = [
    profile?.name,
    profile?.email,
    profile?.phone,
    profile?.address,
    profile?.date_of_birth,
    profile?.gender,
    profile?.emergency_contact,
  ].filter(Boolean).length
  const profileCompletion = Math.round((completedFields / 7) * 100)

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function cancelEditing() {
    setForm({
      name: profile?.name || '',
      email: profile?.email || '',
      address: profile?.address || '',
      phone: profile?.phone || '',
      date_of_birth: formatDate(profile?.date_of_birth),
      gender: profile?.gender || '',
      emergency_contact: profile?.emergency_contact || '',
    })
    setIsEditing(false)
  }

  async function saveProfile() {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error('Le nom et l adresse e-mail sont obligatoires.')
      return
    }

    setIsSaving(true)
    const result = await updateUserProfile({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      date_of_birth: form.date_of_birth || null,
      gender: form.gender || null,
      emergency_contact: form.emergency_contact.trim() || null,
    })
    setIsSaving(false)

    if (!result.success) {
      toast.error(result.error || 'Impossible de mettre a jour le profil.')
      return
    }

    await queryClient.invalidateQueries({ queryKey: ['patient-profile', currentUserUid] })
    await queryClient.invalidateQueries({ queryKey: ['profile'] })
    setIsEditing(false)
    toast.success('Profil mis a jour.')
  }

  async function handlePhotoChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La photo ne doit pas depasser 5 Mo.')
      return
    }

    setIsUploading(true)
    const result = await uploadProfilePicture(file)
    setIsUploading(false)

    if (!result.success) {
      toast.error(result.error || 'Impossible de charger la photo.')
      return
    }

    await queryClient.invalidateQueries({ queryKey: ['patient-profile', currentUserUid] })
    toast.success('Photo de profil mise a jour.')
  }

  if (profileQuery.isLoading || vitalsQuery.isLoading) {
    return <LoadingSkeleton />
  }

  if (!profileQuery.data?.success) {
    return (
      <EmptyState icon={AlertCircle}>
        {profileQuery.data?.error || 'Impossible de charger le profil depuis le backend.'}
      </EmptyState>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[32px] font-semibold leading-tight text-[#171d1a] dark:text-white">Mon Profil</h1>
        <p className="mt-2 text-base leading-7 text-[#3d4943]">
          Gerez les informations enregistrees dans votre compte patient.
        </p>
      </div>

      <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <article className="sht-card p-6 text-center">
          <label className={`group relative mx-auto block h-28 w-28 ${isUploading ? 'cursor-wait' : 'cursor-pointer'}`}>
            <span className="grid h-28 w-28 place-items-center overflow-hidden rounded-full border-4 border-[#008560] bg-[#86f8c9]/35 text-[#00694c]">
              {profile?.profile_picture ? (
                <img
                  alt="Photo de profil"
                  className="h-full w-full object-cover"
                  src={`${getAssetUrl(profile.profile_picture)}?v=${encodeURIComponent(profile.profile_picture)}`}
                />
              ) : (
                <UserRound size={48} />
              )}
            </span>
            <span className="absolute bottom-1 right-1 grid h-9 w-9 place-items-center rounded-full bg-[#00694c] text-white shadow-lg transition group-hover:bg-[#008560]">
              <Camera size={17} />
            </span>
            <input
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              disabled={isUploading}
              type="file"
              onChange={handlePhotoChange}
            />
          </label>

          {isEditing ? (
            <input
              className="mx-auto mt-5 h-11 w-full rounded-lg border border-[#bccac1] bg-white px-3 text-center text-xl font-semibold outline-none focus:border-[#00694c] focus:ring-2 focus:ring-[#00694c]"
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
            />
          ) : (
            <h2 className="mt-5 text-2xl font-semibold text-[#171d1a] dark:text-white">{profile.name}</h2>
          )}
          <p className="mt-1 text-sm text-[#6d7a73]">
            {profile.is_verified ? 'Compte patient verifie' : 'Compte en attente de verification'}
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <span className="rounded-full bg-[#eff5ef] px-3 py-1 text-xs font-semibold text-[#00694c]">
              {profile.role === 'admin' ? 'Admin' : 'Patient/User'}
            </span>
            <span className="rounded-full bg-[#eff5ef] px-3 py-1 text-xs font-semibold text-[#00694c]">
              Profil {profileCompletion}%
            </span>
          </div>

          <div className="mt-6 space-y-3 text-left">
            {[
              { field: 'email', icon: Mail, type: 'email', placeholder: 'Adresse e-mail' },
              { field: 'address', icon: MapPin, type: 'text', placeholder: 'Adresse' },
              { field: 'phone', icon: Phone, type: 'tel', placeholder: 'Telephone' },
            ].map(({ field, icon: Icon, type, placeholder }) => (
              <div className="flex min-h-12 items-center gap-3 rounded-lg bg-[#eff5ef] p-3 text-sm text-[#3d4943]" key={field}>
                <Icon className="shrink-0 text-[#00694c]" size={17} />
                {isEditing ? (
                  <input
                    className="w-full bg-transparent outline-none"
                    placeholder={placeholder}
                    type={type}
                    value={form[field]}
                    onChange={(event) => updateField(field, event.target.value)}
                  />
                ) : (
                  <span>{profile[field] || 'Non renseigne'}</span>
                )}
              </div>
            ))}
          </div>

          {isEditing ? (
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#bccac1] bg-white px-4 py-3 text-sm font-semibold text-[#3d4943] hover:bg-[#eff5ef]"
                disabled={isSaving}
                type="button"
                onClick={cancelEditing}
              >
                <X size={17} />
                Annuler
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#00694c] px-4 py-3 text-sm font-semibold text-white hover:bg-[#008560] disabled:opacity-60"
                disabled={isSaving}
                type="button"
                onClick={saveProfile}
              >
                <Check size={17} />
                {isSaving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          ) : (
            <button
              className="mt-6 w-full rounded-lg bg-[#00694c] px-4 py-3 text-sm font-semibold text-white hover:bg-[#008560]"
              type="button"
              onClick={() => setIsEditing(true)}
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
                    <p className="font-metric mt-2 text-xl font-semibold text-[#171d1a] dark:text-white">
                      {item.value}
                    </p>
                  </article>
                ))}
              </section>

              <section className="grid gap-4 md:grid-cols-3">
                {[
                  { label: 'Profil', value: `${profileCompletion}% complete`, icon: ShieldCheck },
                  { label: 'Sante', value: latestVital ? 'Donnees synchronisees' : 'Aucune mesure', icon: HeartPulse },
                  { label: 'Activite', value: `${vitals.length} saisie(s)`, icon: Activity },
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
                      {isEditing ? (
                        <input
                          className="mt-2 w-full rounded-lg border border-[#bccac1] bg-white px-3 py-2 text-sm outline-none focus:border-[#00694c]"
                          placeholder="Nom, relation et telephone"
                          value={form.emergency_contact}
                          onChange={(event) => updateField('emergency_contact', event.target.value)}
                        />
                      ) : (
                        <p className="mt-1 text-sm text-[#6d7a73]">
                          {profile.emergency_contact || 'Aucun contact renseigne'}
                        </p>
                      )}
                    </div>
                  </div>
                  {!isEditing && (
                    <button
                      className="rounded-lg bg-[#eff5ef] px-4 py-2 text-sm font-semibold text-[#00694c]"
                      type="button"
                      onClick={() => setIsEditing(true)}
                    >
                      Modifier
                    </button>
                  )}
                </div>
              </article>

              {isEditing && (
                <article className="sht-card grid gap-4 p-5 sm:grid-cols-2">
                  <label>
                    <span className="text-sm font-medium text-[#3d4943]">Date de naissance</span>
                    <input
                      className="mt-2 w-full rounded-lg border border-[#bccac1] bg-white px-3 py-3 text-sm outline-none focus:border-[#00694c]"
                      type="date"
                      value={form.date_of_birth}
                      onChange={(event) => updateField('date_of_birth', event.target.value)}
                    />
                  </label>
                  <label>
                    <span className="text-sm font-medium text-[#3d4943]">Genre</span>
                    <select
                      className="mt-2 w-full rounded-lg border border-[#bccac1] bg-white px-3 py-3 text-sm outline-none focus:border-[#00694c]"
                      value={form.gender}
                      onChange={(event) => updateField('gender', event.target.value)}
                    >
                      <option value="">Non renseigne</option>
                      <option value="F">Femme</option>
                      <option value="M">Homme</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </label>
                </article>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <article className="sht-card p-6">
              <h2 className="text-xl font-semibold text-[#171d1a] dark:text-white">Historique medical</h2>
              <p className="mt-1 text-sm text-[#6d7a73]">
                Informations issues de votre derniere saisie de symptomes.
              </p>
              <div className="mt-5">
                {medicalItems.length ? (
                  <div className="space-y-3">
                    {medicalItems.map((item, index) => (
                      <div className="rounded-lg border border-[#dce5df] bg-white p-4" key={`${item.category}-${item.title}-${index}`}>
                        <p className="text-xs font-semibold uppercase text-[#00694c]">{item.category}</p>
                        <p className="mt-1 font-semibold text-[#171d1a]">{item.title}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={HeartPulse}>
                    Aucun antecedent, traitement ou allergie n est encore disponible dans vos saisies.
                  </EmptyState>
                )}
              </div>
            </article>
          )}

          {activeTab === 'vaccinations' && (
            <article className="sht-card p-6">
              <h2 className="text-xl font-semibold text-[#171d1a] dark:text-white">Vaccinations</h2>
              <div className="mt-5">
                <EmptyState icon={Syringe}>
                  Le backend ne fournit pas encore d endpoint de vaccination. Aucun vaccin fictif n est affiche.
                </EmptyState>
              </div>
            </article>
          )}

          {activeTab === 'preferences' && (
            <section className="grid gap-4 md:grid-cols-2">
              {[
                { title: 'Notifications', text: 'Les alertes sont recuperees depuis le service backend.' },
                { title: 'Confidentialite', text: 'Les informations du profil sont protegees par authentification JWT.' },
                { title: 'Theme', text: 'La preference claire ou sombre est conservee localement.' },
                { title: 'Langue', text: 'Interface patient en francais.' },
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
