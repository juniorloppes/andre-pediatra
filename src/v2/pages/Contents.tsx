import { useMemo, useState, type FormEvent } from 'react'
import { FileText, Image as ImageIcon, Pencil, Plus, Search, Trash2, Video } from 'lucide-react'
import { contentsForChild } from '../domain'
import { useStore } from '../store'
import type { Content, ContentType } from '../types'
import { Artwork, Badge, Card, Empty, Field, Modal, PageHeader, Tabs } from '../ui'
import { fmtDate, normalize, TODAY, uid, youtubeEmbed } from '../utils'
import { useChild } from './FamilyHome'

const TYPE_LABEL: Record<ContentType, { label: string; icon: typeof FileText }> = {
  texto: { label: 'Texto', icon: FileText },
  imagem: { label: 'Imagem', icon: ImageIcon },
  video: { label: 'Vídeo', icon: Video },
}

export function ContentViewer({ content, onClose }: { content: Content; onClose: () => void }) {
  const embed = content.type === 'video' ? youtubeEmbed(content.url) : undefined
  return (
    <Modal wide title={content.title} onClose={onClose}>
      {embed ? (
        <div className="video-frame"><iframe src={embed} title={content.title} allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen /></div>
      ) : content.type === 'imagem' && content.url ? (
        <img className="content-img" src={content.url} alt={content.title} />
      ) : content.type !== 'texto' ? (
        <Artwork seed={content.id} kind={content.type === 'video' ? 'video' : 'image'} className="viewer-art" />
      ) : null}
      <p className="muted">{content.summary}</p>
      <div className="content-body">{content.body.split('\n').filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}</div>
      <p className="muted small">Publicado por {content.author} em {fmtDate(content.createdAt)}</p>
    </Modal>
  )
}

export function Contents() {
  const { state, update, toast } = useStore()
  const [type, setType] = useState<'all' | ContentType>('all')
  const [programId, setProgramId] = useState('all')
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<Content | 'new' | null>(null)
  const [viewing, setViewing] = useState<Content | null>(null)

  const list = useMemo(() => state.contents
    .filter((c) => (type === 'all' || c.type === type) && (programId === 'all' || c.programId === programId) && normalize(c.title + c.summary).includes(normalize(q)))
    .sort((a, b) => a.programId.localeCompare(b.programId) || a.step - b.step), [state.contents, type, programId, q])

  const programName = (id: string) => (id === 'all' ? 'Todos os programas' : (() => { const p = state.programs.find((x) => x.id === id); return p ? `${p.name} ${p.ageLabel}` : '—' })())

  const remove = (c: Content) => {
    if (!confirm(`Excluir "${c.title}"?`)) return
    update((s) => ({ ...s, contents: s.contents.filter((x) => x.id !== c.id) }))
    toast('Conteúdo excluído')
  }

  return (
    <>
      <PageHeader title="Conteúdos" subtitle="Textos, imagens e vídeos liberados para as famílias conforme a fase/etapa do programa."
        actions={<button className="btn btn-primary" onClick={() => setEditing('new')}><Plus size={16} /> Novo conteúdo</button>} />
      <Card>
        <div className="toolbar">
          <Tabs value={type} onChange={setType} items={[{ id: 'all', label: 'Todos' }, { id: 'texto', label: 'Texto' }, { id: 'imagem', label: 'Imagem' }, { id: 'video', label: 'Vídeo' }]} />
          <span className="toolbar-right">
            <select value={programId} onChange={(e) => setProgramId(e.target.value)} aria-label="Programa">
              <option value="all">Todos os programas</option>
              {state.programs.map((p) => <option key={p.id} value={p.id}>{p.name} {p.ageLabel}</option>)}
            </select>
            <label className="search"><Search size={16} /><input placeholder="Buscar" value={q} onChange={(e) => setQ(e.target.value)} /></label>
          </span>
        </div>
        {list.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Conteúdo</th><th>Tipo</th><th>Programa</th><th>Etapa</th><th>Status</th><th /></tr></thead>
              <tbody>
                {list.map((c) => {
                  const T = TYPE_LABEL[c.type]
                  return (
                    <tr key={c.id}>
                      <td><button className="plain left" onClick={() => setViewing(c)}><strong>{c.title}</strong><small className="block muted">{c.summary}</small></button></td>
                      <td><span className="type-chip"><T.icon size={14} /> {T.label}</span></td>
                      <td>{programName(c.programId)}</td>
                      <td>{c.step ? `Passo ${c.step}` : 'Todas'}</td>
                      <td>{c.published ? <Badge tone="green">Publicado</Badge> : <Badge>Rascunho</Badge>}</td>
                      <td className="row-actions">
                        <button className="icon-btn" aria-label="Editar" onClick={() => setEditing(c)}><Pencil size={15} /></button>
                        <button className="icon-btn" aria-label="Excluir" onClick={() => remove(c)}><Trash2 size={15} /></button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : <Empty title="Nenhum conteúdo encontrado" />}
      </Card>
      {editing && <ContentForm content={editing === 'new' ? undefined : editing} onClose={() => setEditing(null)} />}
      {viewing && <ContentViewer content={viewing} onClose={() => setViewing(null)} />}
    </>
  )
}

function ContentForm({ content, onClose }: { content?: Content; onClose: () => void }) {
  const { state, update, toast, user } = useStore()
  const [f, setF] = useState({
    type: content?.type ?? ('texto' as ContentType), title: content?.title ?? '', summary: content?.summary ?? '', body: content?.body ?? '',
    url: content?.url ?? '', programId: content?.programId ?? state.programs[0]?.id ?? 'all', step: String(content?.step ?? 1), published: content?.published ?? true,
  })
  const [error, setError] = useState('')
  const program = state.programs.find((p) => p.id === f.programId)
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value })

  const onFile = (file?: File) => {
    if (!file) return
    if (file.size > 1_500_000) return setError('Imagem muito grande para a demonstração (máx. 1,5 MB).')
    const reader = new FileReader()
    reader.onload = () => setF((x) => ({ ...x, url: String(reader.result) }))
    reader.readAsDataURL(file)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!f.title.trim()) return setError('Informe o título.')
    if (f.type === 'video' && f.url && !youtubeEmbed(f.url)) return setError('Use um link do YouTube para vídeos.')
    const data: Content = {
      id: content?.id ?? uid(), type: f.type, title: f.title.trim(), summary: f.summary, body: f.body, url: f.url || undefined,
      programId: f.programId, step: f.programId === 'all' ? 0 : Number(f.step), createdAt: content?.createdAt ?? TODAY, author: content?.author ?? user?.name ?? '', published: f.published,
    }
    update((s) => ({ ...s, contents: content ? s.contents.map((c) => (c.id === content.id ? data : c)) : [...s.contents, data] }))
    toast(content ? 'Conteúdo atualizado' : 'Conteúdo criado')
    onClose()
  }

  return (
    <Modal wide title={content ? 'Editar conteúdo' : 'Novo conteúdo'} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancelar</button><button className="btn btn-primary" form="content-form">Salvar</button></>}>
      <form id="content-form" className="form-grid" onSubmit={submit}>
        <Field label="Tipo">
          <select value={f.type} onChange={set('type')}><option value="texto">Texto</option><option value="imagem">Imagem</option><option value="video">Vídeo</option></select>
        </Field>
        <Field label="Título"><input value={f.title} onChange={set('title')} autoFocus /></Field>
        <Field label="Programa">
          <select value={f.programId} onChange={set('programId')}>
            <option value="all">Todos os programas (geral)</option>
            {state.programs.map((p) => <option key={p.id} value={p.id}>{p.name} {p.ageLabel}</option>)}
          </select>
        </Field>
        <Field label="Fase / etapa">
          <select value={f.step} onChange={set('step')} disabled={f.programId === 'all'}>
            {program?.steps.map((s) => <option key={s.n} value={s.n}>Passo {s.n} — {s.title}</option>)}
          </select>
        </Field>
        <Field label="Resumo" full><input value={f.summary} onChange={set('summary')} /></Field>
        {f.type === 'video' && <Field label="Link do vídeo (YouTube)" full><input value={f.url} onChange={set('url')} placeholder="https://www.youtube.com/watch?v=…" /></Field>}
        {f.type === 'imagem' && (
          <Field label="Imagem" full hint="Envie um arquivo ou cole um link.">
            <span className="inline-add">
              <input value={f.url.startsWith('data:') ? '(arquivo enviado)' : f.url} onChange={set('url')} placeholder="https://…" />
              <input type="file" accept="image/*" onChange={(e) => onFile(e.target.files?.[0])} />
            </span>
          </Field>
        )}
        <Field label="Texto" full><textarea rows={6} value={f.body} onChange={set('body')} /></Field>
        <label className="check field-full"><input type="checkbox" checked={f.published} onChange={(e) => setF({ ...f, published: e.target.checked })} /> Publicado (visível para as famílias da etapa)</label>
        {error && <p className="form-error field-full">{error}</p>}
      </form>
    </Modal>
  )
}

/* ------------------------------------------------------------------ */
/* Materiais — visão da família                                        */
/* ------------------------------------------------------------------ */

export function Materials() {
  const { state, route, go } = useStore()
  const child = useChild()
  const [type, setType] = useState<'all' | ContentType>('all')
  if (!child) return null
  const allowed = contentsForChild(state, child)
  const list = allowed.filter((c) => type === 'all' || c.type === type)
  const viewing = allowed.find((c) => c.id === route.id)

  return (
    <>
      <PageHeader title="Materiais" subtitle="Conteúdos liberados para a fase atual e as anteriores." />
      <Tabs value={type} onChange={setType} items={[{ id: 'all', label: 'Todos' }, { id: 'texto', label: 'Textos' }, { id: 'imagem', label: 'Imagens' }, { id: 'video', label: 'Vídeos' }]} />
      {list.length ? (
        <div className="media-grid wide mt">
          {list.map((m) => (
            <button key={m.id} className="media-card" onClick={() => go('materials', m.id)}>
              <Artwork seed={m.id} kind={m.type === 'video' ? 'video' : m.type === 'imagem' ? 'image' : 'baby'} />
              {m.current && <span className="badge badge-green floating">Fase atual</span>}
              <strong>{m.title}</strong>
              <small>{m.summary}</small>
              <small className="muted">{m.step ? `Passo ${m.step}` : 'Geral'} · {TYPE_LABEL[m.type].label}</small>
            </button>
          ))}
        </div>
      ) : <Empty title="Nenhum material disponível" />}
      {viewing && <ContentViewer content={viewing} onClose={() => go('materials')} />}
    </>
  )
}
