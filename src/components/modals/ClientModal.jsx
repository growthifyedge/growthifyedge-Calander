import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui'
import { Field, Input, Textarea } from '../ui/Form'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'

const blank = (i = {}) => ({ company: '', contact: '', email: '', phone: '', whatsapp: '', notes: '', ...i })

export default function ClientModal({ open, onClose, record }) {
  const { create, update } = useData()
  const { toast } = useToast()
  const [form, setForm] = useState(blank())
  const isEdit = Boolean(record)

  useEffect(() => {
    if (open) setForm(record ? blank(record) : blank())
  }, [open, record])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const save = async () => {
    if (!form.company.trim()) return toast('Company name is required', 'error')
    if (isEdit) await update('clients', record.id, form)
    else await create('clients', form)
    toast(isEdit ? 'Client updated' : 'Client added')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit client' : 'New client'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>{isEdit ? 'Save changes' : 'Add client'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Company name" required>
          <Input value={form.company} onChange={set('company')} placeholder="e.g. Lumen Coffee Co." autoFocus />
        </Field>
        <Field label="Contact person">
          <Input value={form.contact} onChange={set('contact')} placeholder="e.g. Sarah Bennett" />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Email">
            <Input type="email" value={form.email} onChange={set('email')} placeholder="name@company.com" />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={set('phone')} placeholder="+1 …" />
          </Field>
        </div>
        <Field label="WhatsApp">
          <Input value={form.whatsapp} onChange={set('whatsapp')} placeholder="+1 …" />
        </Field>
        <Field label="Notes">
          <Textarea value={form.notes} onChange={set('notes')} placeholder="Context, preferences, scope…" />
        </Field>
      </div>
    </Modal>
  )
}
