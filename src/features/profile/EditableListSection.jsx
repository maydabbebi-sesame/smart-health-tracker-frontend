import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'

const inputClassName = 'rounded-lg border border-[#bccac1] px-3 py-2 text-sm outline-none focus:border-[#00694c] focus:ring-2 focus:ring-[#00694c]'

function emptyForm(nameField, defaultStatus) {
  return { [nameField]: '', date_label: '', status: defaultStatus || '' }
}

/**
 * Generic add/edit/delete list section for per-user records shaped like
 * { uid, [nameField], date_label, status }. Backs both the medical history
 * and vaccinations tabs on ProfilePage, which only differ in field naming,
 * copy, and status badge coloring.
 */
export function EditableListSection({
  icon: Icon,
  title,
  subtitle,
  queryKey,
  fetchFn,
  createFn,
  updateFn,
  deleteFn,
  nameField,
  nameLabel,
  dateLabel,
  statusOptions,
  getStatusClassName,
  labels,
}) {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey, queryFn: fetchFn })
  const items = data?.success ? data.data : []

  const [isAdding, setIsAdding] = useState(false)
  const [form, setForm] = useState(emptyForm(nameField, statusOptions[0]))
  const [editingUid, setEditingUid] = useState(null)
  const [editForm, setEditForm] = useState(emptyForm(nameField, statusOptions[0]))
  const [formError, setFormError] = useState('')

  function invalidate() {
    queryClient.invalidateQueries({ queryKey })
  }

  const { mutate: create, isPending: isCreating } = useMutation({
    mutationFn: createFn,
    onSuccess: (result) => {
      if (!result.success) {
        setFormError(result.error)
        return
      }
      setFormError('')
      setIsAdding(false)
      setForm(emptyForm(nameField, statusOptions[0]))
      invalidate()
    },
    onError: (error) => setFormError(error.message || labels.error),
  })

  const { mutate: update, isPending: isUpdating } = useMutation({
    mutationFn: ({ uid, payload }) => updateFn(uid, payload),
    onSuccess: (result) => {
      if (!result.success) {
        setFormError(result.error)
        return
      }
      setFormError('')
      setEditingUid(null)
      invalidate()
    },
    onError: (error) => setFormError(error.message || labels.error),
  })

  const { mutate: remove } = useMutation({
    mutationFn: (uid) => deleteFn(uid),
    onSuccess: (result) => {
      if (!result.success) {
        setFormError(result.error)
        return
      }
      invalidate()
    },
    onError: (error) => setFormError(error.message || labels.error),
  })

  function startEdit(item) {
    setEditingUid(item.uid)
    setEditForm({
      [nameField]: item[nameField] || '',
      date_label: item.date_label || '',
      status: item.status || statusOptions[0] || '',
    })
  }

  return (
    <article className="sht-card p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#171d1a] dark:text-white">{title}</h2>
          <p className="mt-1 text-sm text-[#6d7a73]">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <Icon className="text-[#00694c]" size={23} />
          <button
            className="inline-flex items-center gap-1 rounded-lg bg-[#eff5ef] px-3 py-2 text-sm font-semibold text-[#00694c] transition hover:bg-[#dff0e7]"
            type="button"
            onClick={() => {
              setFormError('')
              setIsAdding((current) => !current)
            }}
          >
            <Plus size={16} />
            {labels.add}
          </button>
        </div>
      </div>

      {formError && <p className="mt-3 text-sm font-medium text-[#ba1a1a]">{formError}</p>}

      {isAdding && (
        <div className="mt-4 grid gap-2 rounded-lg border border-[#dce5df] bg-white p-4 sm:grid-cols-3">
          <input
            className={inputClassName}
            placeholder={nameLabel}
            value={form[nameField]}
            onChange={(event) => setForm((current) => ({ ...current, [nameField]: event.target.value }))}
          />
          <input
            className={inputClassName}
            placeholder={dateLabel}
            value={form.date_label}
            onChange={(event) => setForm((current) => ({ ...current, date_label: event.target.value }))}
          />
          <select
            className={inputClassName}
            value={form.status}
            onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <div className="col-span-full flex justify-end gap-2">
            <button
              className="rounded-lg border border-[#bccac1] bg-white px-3 py-2 text-sm font-semibold text-[#3d4943] transition hover:bg-[#eff5ef]"
              type="button"
              onClick={() => setIsAdding(false)}
            >
              {labels.cancel}
            </button>
            <button
              className="rounded-lg bg-[#00694c] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#008560] disabled:opacity-60"
              disabled={isCreating || !form[nameField]}
              type="button"
              onClick={() => create(form)}
            >
              {isCreating ? labels.saving : labels.save}
            </button>
          </div>
        </div>
      )}

      <div className="mt-5 space-y-3">
        {isLoading && <p className="text-sm text-[#6d7a73]">{labels.loading}</p>}
        {!isLoading && items.length === 0 && (
          <p className="text-sm text-[#6d7a73]">{labels.empty}</p>
        )}
        {items.map((item) => (
          <div className="rounded-lg border border-[#dce5df] bg-white p-4" key={item.uid}>
            {editingUid === item.uid ? (
              <div className="grid gap-2 sm:grid-cols-3">
                <input
                  className={inputClassName}
                  value={editForm[nameField]}
                  onChange={(event) => setEditForm((current) => ({ ...current, [nameField]: event.target.value }))}
                />
                <input
                  className={inputClassName}
                  value={editForm.date_label}
                  onChange={(event) => setEditForm((current) => ({ ...current, date_label: event.target.value }))}
                />
                <select
                  className={inputClassName}
                  value={editForm.status}
                  onChange={(event) => setEditForm((current) => ({ ...current, status: event.target.value }))}
                >
                  {statusOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
                <div className="col-span-full flex justify-end gap-2">
                  <button
                    className="rounded-lg border border-[#bccac1] bg-white px-3 py-2 text-sm font-semibold text-[#3d4943] transition hover:bg-[#eff5ef]"
                    type="button"
                    onClick={() => setEditingUid(null)}
                  >
                    {labels.cancel}
                  </button>
                  <button
                    className="rounded-lg bg-[#00694c] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#008560] disabled:opacity-60"
                    disabled={isUpdating}
                    type="button"
                    onClick={() => update({ uid: item.uid, payload: editForm })}
                  >
                    {isUpdating ? labels.saving : labels.save}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[#171d1a]">{item[nameField]}</p>
                  <p className="mt-1 text-sm text-[#6d7a73]">{item.date_label}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClassName(item.status)}`}>
                    {item.status}
                  </span>
                  <button
                    aria-label={labels.edit}
                    className="rounded-lg p-2 text-[#6d7a73] transition hover:bg-[#eff5ef] hover:text-[#00694c]"
                    type="button"
                    onClick={() => startEdit(item)}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    aria-label={labels.delete}
                    className="rounded-lg p-2 text-[#6d7a73] transition hover:bg-[#ffdad6] hover:text-[#ba1a1a]"
                    type="button"
                    onClick={() => remove(item.uid)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </article>
  )
}
