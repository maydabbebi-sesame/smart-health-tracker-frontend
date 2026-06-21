import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ban, KeyRound, Search, ShieldCheck, Trash2, UserCheck, X } from 'lucide-react'
import { useMemo, useState } from 'react'

import {
  deleteUser,
  getUsers,
  regenerateUserToken,
  updateUserRole,
  updateUserStatus,
} from '../../services/adminService'
import { useTranslation } from '../../i18n/useTranslation'

const ROLES = ['user', 'doctor', 'admin']

const CONFIRM_COPY = {
  enable: {
    title: 'Activer ce compte ?',
    body: "L'utilisateur pourra de nouveau se connecter à l'application.",
    confirmLabel: 'Activer',
  },
  disable: {
    title: 'Désactiver ce compte ?',
    body: 'L\'utilisateur sera immédiatement déconnecté et ne pourra plus se connecter jusqu\'à réactivation.',
    confirmLabel: 'Désactiver',
  },
  'regenerate-token': {
    title: 'Régénérer le jeton de session ?',
    body: 'Toutes les sessions actives de cet utilisateur seront invalidées. Il devra se reconnecter.',
    confirmLabel: 'Régénérer',
  },
  'change-role': {
    title: 'Changer le rôle ?',
    body: "Cela modifie immédiatement les permissions de l'utilisateur dans l'application.",
    confirmLabel: 'Confirmer',
  },
  delete: {
    title: 'Supprimer ce compte ?',
    body: 'Cette action est définitive et supprime toutes les données associées à ce compte.',
    confirmLabel: 'Supprimer',
  },
}

const inputClassName =
  'w-full rounded-lg border border-[#bccac1] bg-white px-9 py-2 text-sm text-[#171d1a] placeholder:text-[#6d7a73] outline-none focus:border-[#00694c] focus:ring-2 focus:ring-[#00694c] dark:focus:ring-0'
const selectClassName =
  'rounded-lg border border-[#bccac1] bg-white px-3 py-2 text-sm text-[#171d1a] outline-none focus:border-[#00694c]'
const iconButtonClassName =
  'grid h-8 w-8 place-items-center rounded-lg text-[#3d4943] transition hover:bg-[#eff5ef] disabled:opacity-50 dark:text-slate-300 dark:hover:bg-white/10'

function StatusBadge({ isActive, t }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        isActive
          ? 'bg-[#86f8c9]/40 text-[#00694c] dark:bg-emerald-500/15 dark:text-emerald-300'
          : 'bg-[#ffdad6] text-[#ba1a1a] dark:bg-rose-500/15 dark:text-rose-300'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-[#00694c] dark:bg-emerald-400' : 'bg-[#ba1a1a] dark:bg-rose-400'}`}
      />
      {isActive ? t('admin.users.status.active', 'Actif') : t('admin.users.status.disabled', 'Désactivé')}
    </span>
  )
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function AdminUsersPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null)
  const [actionError, setActionError] = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-users'],
    queryFn: getUsers,
  })

  function invalidateUsers() {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] })
  }

  const { mutate: toggleStatus, isPending: isTogglingStatus } = useMutation({
    mutationFn: ({ uid, isActive }) => updateUserStatus(uid, isActive),
  })
  const { mutate: regenerateToken, isPending: isRegeneratingToken } = useMutation({
    mutationFn: (uid) => regenerateUserToken(uid),
  })
  const { mutate: changeRole, isPending: isChangingRole } = useMutation({
    mutationFn: ({ uid, role }) => updateUserRole(uid, role),
  })
  const { mutate: removeUser, isPending: isDeleting } = useMutation({
    mutationFn: (uid) => deleteUser(uid),
  })

  const isActionPending = isTogglingStatus || isRegeneratingToken || isChangingRole || isDeleting

  const filteredUsers = useMemo(() => {
    const users = data?.success ? data.data : []
    const term = search.trim().toLowerCase()
    return users.filter((user) => {
      const matchesSearch =
        !term || user.name?.toLowerCase().includes(term) || user.email?.toLowerCase().includes(term)
      const matchesRole = roleFilter === 'all' || user.role === roleFilter
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && user.is_active) ||
        (statusFilter === 'disabled' && !user.is_active)
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [data, search, roleFilter, statusFilter])

  function closeConfirm() {
    setConfirmAction(null)
  }

  function handleConfirm() {
    if (!confirmAction) return
    const { type, user, role } = confirmAction
    setActionError('')

    function onSettled(result) {
      if (!result?.success) {
        setActionError(result?.error || t('admin.users.actionError', "L'action a échoué"))
        return
      }
      invalidateUsers()
      closeConfirm()
      setSelectedUser((current) => (current?.uid === user.uid ? null : current))
    }

    if (type === 'enable' || type === 'disable') {
      toggleStatus({ uid: user.uid, isActive: type === 'enable' }, { onSuccess: onSettled })
    } else if (type === 'regenerate-token') {
      regenerateToken(user.uid, { onSuccess: onSettled })
    } else if (type === 'change-role') {
      changeRole({ uid: user.uid, role }, { onSuccess: onSettled })
    } else if (type === 'delete') {
      removeUser(user.uid, { onSuccess: onSettled })
    }
  }

  const confirmCopy = confirmAction ? CONFIRM_COPY[confirmAction.type] : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#171d1a] dark:text-white">
          {t('admin.users.title', 'Gestion des utilisateurs')}
        </h1>
        <p className="mt-1 text-sm text-[#6d7a73] dark:text-slate-400">
          {t(
            'admin.users.subtitle',
            "Activez, désactivez, changez le rôle ou forcez la reconnexion d'un compte utilisateur.",
          )}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6d7a73] dark:text-slate-500" />
          <input
            className={inputClassName}
            placeholder={t('admin.users.searchPlaceholder', 'Rechercher par nom ou email')}
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select className={selectClassName} value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <option value="all">{t('admin.users.allRoles', 'Tous les rôles')}</option>
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <select
            className={selectClassName}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="all">{t('admin.users.allStatuses', 'Tous les statuts')}</option>
            <option value="active">{t('admin.users.status.active', 'Actif')}</option>
            <option value="disabled">{t('admin.users.status.disabled', 'Désactivé')}</option>
          </select>
        </div>
      </div>

      {actionError && (
        <p className="rounded-lg border border-[#ffb4ab] bg-[#ffdad6]/60 px-4 py-2 text-sm font-medium text-[#ba1a1a] dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">
          {actionError}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-[#dee4de] dark:border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#eff5ef] text-xs uppercase tracking-wider text-[#6d7a73] dark:bg-white/5 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3">{t('admin.users.columns.user', 'Utilisateur')}</th>
              <th className="px-4 py-3">{t('admin.users.columns.role', 'Rôle')}</th>
              <th className="px-4 py-3">{t('admin.users.columns.status', 'Statut')}</th>
              <th className="px-4 py-3">{t('admin.users.columns.createdAt', 'Créé le')}</th>
              <th className="px-4 py-3 text-right">{t('admin.users.columns.actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#dee4de] dark:divide-white/10">
            {isLoading && (
              <tr>
                <td className="px-4 py-6 text-center text-[#6d7a73] dark:text-slate-400" colSpan={5}>
                  {t('admin.users.loading', 'Chargement des utilisateurs…')}
                </td>
              </tr>
            )}
            {isError && (
              <tr>
                <td className="px-4 py-6 text-center text-[#ba1a1a] dark:text-rose-300" colSpan={5}>
                  {t('admin.users.loadError', 'Impossible de récupérer les utilisateurs')}
                </td>
              </tr>
            )}
            {!isLoading && !isError && filteredUsers.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-[#6d7a73] dark:text-slate-400" colSpan={5}>
                  {t('admin.users.empty', 'Aucun utilisateur ne correspond à ces critères.')}
                </td>
              </tr>
            )}
            {filteredUsers.map((user) => (
              <tr className="hover:bg-[#eff5ef] dark:hover:bg-white/5" key={user.uid}>
                <td className="px-4 py-3">
                  <button
                    className="text-left font-medium text-[#171d1a] hover:text-[#00694c] dark:text-white dark:hover:text-teal-300"
                    type="button"
                    onClick={() => setSelectedUser(user)}
                  >
                    {user.name}
                  </button>
                  <p className="text-xs text-[#6d7a73] dark:text-slate-400">{user.email}</p>
                </td>
                <td className="px-4 py-3">
                  <select
                    className={`${selectClassName} px-2 py-1 text-xs disabled:opacity-50`}
                    disabled={isActionPending}
                    value={user.role}
                    onChange={(event) =>
                      setConfirmAction({ type: 'change-role', user, role: event.target.value })
                    }
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge isActive={user.is_active} t={t} />
                </td>
                <td className="px-4 py-3 text-[#6d7a73] dark:text-slate-400">{formatDate(user.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      className={iconButtonClassName}
                      disabled={isActionPending}
                      title={
                        user.is_active
                          ? t('admin.users.actions.disable', 'Désactiver')
                          : t('admin.users.actions.enable', 'Activer')
                      }
                      type="button"
                      onClick={() => setConfirmAction({ type: user.is_active ? 'disable' : 'enable', user })}
                    >
                      {user.is_active ? <Ban size={16} /> : <UserCheck size={16} />}
                    </button>
                    <button
                      className={iconButtonClassName}
                      disabled={isActionPending}
                      title={t('admin.users.actions.regenerateToken', 'Régénérer le jeton')}
                      type="button"
                      onClick={() => setConfirmAction({ type: 'regenerate-token', user })}
                    >
                      <KeyRound size={16} />
                    </button>
                    <button
                      className="grid h-8 w-8 place-items-center rounded-lg text-[#ba1a1a] transition hover:bg-[#ffdad6]/60 disabled:opacity-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
                      disabled={isActionPending}
                      title={t('admin.users.actions.delete', 'Supprimer')}
                      type="button"
                      onClick={() => setConfirmAction({ type: 'delete', user })}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/60" role="dialog" aria-modal="true">
          <div className="h-full w-full max-w-md overflow-y-auto border-l border-[#dee4de] bg-white p-6 dark:border-white/10 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#171d1a] dark:text-white">
                {t('admin.users.detail.title', "Détails de l'utilisateur")}
              </h2>
              <button
                aria-label={t('admin.users.detail.close', 'Fermer')}
                className="grid h-8 w-8 place-items-center rounded-lg text-[#3d4943] hover:bg-[#eff5ef] dark:text-slate-300 dark:hover:bg-white/10"
                type="button"
                onClick={() => setSelectedUser(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-[#eff5ef] text-[#00694c] dark:bg-teal-500/15 dark:text-teal-300">
                <ShieldCheck size={22} />
              </div>
              <div>
                <p className="font-semibold text-[#171d1a] dark:text-white">{selectedUser.name}</p>
                <p className="text-sm text-[#6d7a73] dark:text-slate-400">{selectedUser.email}</p>
              </div>
            </div>

            <dl className="mt-6 space-y-3 text-sm">
              {[
                [t('admin.users.detail.role', 'Rôle'), selectedUser.role],
                [
                  t('admin.users.detail.status', 'Statut'),
                  selectedUser.is_active
                    ? t('admin.users.status.active', 'Actif')
                    : t('admin.users.status.disabled', 'Désactivé'),
                ],
                [
                  t('admin.users.detail.verified', 'Email vérifié'),
                  selectedUser.is_verified ? t('admin.users.yes', 'Oui') : t('admin.users.no', 'Non'),
                ],
                [
                  t('admin.users.detail.mfa', 'Double authentification'),
                  selectedUser.mfa_enabled ? t('admin.users.yes', 'Oui') : t('admin.users.no', 'Non'),
                ],
                [t('admin.users.detail.phone', 'Téléphone'), selectedUser.phone || '—'],
                [t('admin.users.detail.address', 'Adresse'), selectedUser.address || '—'],
                [t('admin.users.detail.gender', 'Genre'), selectedUser.gender || '—'],
                [t('admin.users.detail.createdAt', 'Créé le'), formatDate(selectedUser.created_at)],
              ].map(([label, value]) => (
                <div
                  className="flex items-center justify-between gap-4 border-b border-[#dee4de] pb-2 dark:border-white/5"
                  key={label}
                >
                  <dt className="text-[#6d7a73] dark:text-slate-400">{label}</dt>
                  <dd className="font-medium text-[#171d1a] dark:text-white">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}

      {confirmAction && confirmCopy && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/70 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-xl border border-[#dee4de] bg-white p-6 dark:border-white/10 dark:bg-slate-900">
            <h2 className="text-lg font-semibold text-[#171d1a] dark:text-white">
              {t(`admin.users.confirm.${confirmAction.type}.title`, confirmCopy.title)}
            </h2>
            <p className="mt-2 text-sm text-[#6d7a73] dark:text-slate-400">
              {t(`admin.users.confirm.${confirmAction.type}.body`, confirmCopy.body)}
            </p>
            <p className="mt-3 text-sm font-medium text-[#171d1a] dark:text-white">{confirmAction.user.name}</p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-lg border border-[#bccac1] px-4 py-2 text-sm font-semibold text-[#3d4943] transition hover:bg-[#eff5ef] disabled:opacity-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
                disabled={isActionPending}
                type="button"
                onClick={closeConfirm}
              >
                {t('admin.users.actions.cancel', 'Annuler')}
              </button>
              <button
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-50 ${
                  confirmAction.type === 'delete' || confirmAction.type === 'disable'
                    ? 'bg-[#ba1a1a] hover:bg-[#a3140f] dark:bg-rose-600 dark:hover:bg-rose-500'
                    : 'bg-[#00694c] hover:bg-[#008560] dark:bg-teal-600 dark:hover:bg-teal-500'
                }`}
                disabled={isActionPending}
                type="button"
                onClick={handleConfirm}
              >
                {isActionPending
                  ? t('admin.users.actions.processing', 'Traitement…')
                  : t(`admin.users.confirm.${confirmAction.type}.confirmLabel`, confirmCopy.confirmLabel)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUsersPage
