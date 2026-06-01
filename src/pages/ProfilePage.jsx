import { useQuery } from '@tanstack/react-query'
import { HeartPulse, Mail, MapPin, ShieldCheck, UserRound } from 'lucide-react'

import { getPatientProfile } from '../services/profileService'
import { LoadingSkeleton } from '../shared/ui/LoadingSkeleton'

function ProfilePage() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['patient-profile'],
    queryFn: getPatientProfile,
  })

  if (isLoading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Profile</h1>
        <p className="mt-1 text-sm text-slate-600">Manage your personal health account details.</p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-teal-600 text-white">
            <UserRound size={30} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-950">{profile.name}</h2>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2">
                <Mail size={16} />
                {profile.email}
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin size={16} />
                {profile.location}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {[
          { label: 'Profile status', value: profile.profileStatus, icon: ShieldCheck },
          { label: 'Health profile', value: profile.healthProfileStatus, icon: HeartPulse },
        ].map((item) => (
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={item.label}>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-teal-50 text-teal-700">
              <item.icon size={20} />
            </div>
            <p className="mt-4 text-sm text-slate-500">{item.label}</p>
            <p className="mt-1 font-semibold text-slate-950">{item.value}</p>
          </article>
        ))}
      </section>
    </div>
  )
}

export default ProfilePage
