import { useMemo, useState } from 'react'
import { BackButton, Button, Icon } from '../atoms'
import { useI18n, getRoleName } from '../../lib/i18n'
import { parseImportedScriptJson } from '../../lib/scripts/import/parse'
import { resolveImportedScript } from '../../lib/scripts/import/resolve'
import {
  deleteSavedScript,
  getSavedScripts,
  saveScript,
  type EditableScriptDraft,
  type SavedScriptDefinition,
} from '../../lib/scripts'
import { getRole } from '../../lib/roles'
import { generateId } from '../../lib/types'

type Props = {
  onBack: () => void
}

type ImportMode = 'json' | 'url'
type Notice = { type: 'success' | 'error'; message: string } | null

function toSavedScript(draft: EditableScriptDraft): SavedScriptDefinition {
  return {
    id: draft.id ?? `script_${generateId()}`,
    source: draft.source,
    name: draft.name,
    author: draft.author,
    icon: draft.icon,
    roles: draft.roles,
    enforceDistribution: draft.enforceDistribution,
    wakeOrder: draft.wakeOrder,
    isOfficial: false,
  }
}

export function ScriptLibraryScreen({ onBack }: Props) {
  const { language } = useI18n()
  const [scripts, setScripts] = useState(() => getSavedScripts())
  const [mode, setMode] = useState<ImportMode>('json')
  const [jsonText, setJsonText] = useState('')
  const [urlText, setUrlText] = useState('')
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)
  const [unsupportedIds, setUnsupportedIds] = useState<string[]>([])

  const savedRoleCount = useMemo(
    () => scripts.reduce((total, script) => total + script.roles.length, 0),
    [scripts],
  )

  const refreshScripts = () => setScripts(getSavedScripts())

  const handleImport = async () => {
    setLoading(true)
    setNotice(null)
    setUnsupportedIds([])

    try {
      const rawJson =
        mode === 'json'
          ? jsonText
          : await fetch(urlText.trim()).then(async (response) => {
            if (!response.ok) {
              throw new Error(`Request failed (${response.status})`)
            }
            return response.text()
          })

      const payload = parseImportedScriptJson(rawJson)
      const result = resolveImportedScript(payload)

      if (!result.supported) {
        setUnsupportedIds(
          result.unsupportedCharacters.map((character) => character.inputId),
        )
        setNotice({
          type: 'error',
          message: 'This script includes roles that are not supported yet.',
        })
        return
      }

      const savedScript = toSavedScript(result.resolvedScript)
      saveScript(savedScript)
      refreshScripts()
      setJsonText('')
      setUrlText('')
      setNotice({
        type: 'success',
        message: `${savedScript.name} is saved for future games on this device.`,
      })
    } catch (caught) {
      setNotice({
        type: 'error',
        message:
          caught instanceof Error ? caught.message : 'Could not import script.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (scriptId: string) => {
    deleteSavedScript(scriptId)
    refreshScripts()
    setNotice({ type: 'success', message: 'Script removed from this device.' })
  }

  return (
    <div className='min-h-app bg-gradient-to-b from-grimoire-purple via-grimoire-dark to-grimoire-darker flex flex-col'>
      <div className='sticky top-0 z-10 bg-grimoire-dark/95 backdrop-blur-sm border-b border-mystic-gold/20 px-4 py-3'>
        <div className='flex items-center gap-3 max-w-3xl mx-auto'>
          <BackButton onClick={onBack} />
          <div className='flex-1'>
            <h1 className='font-tarot text-lg text-parchment-100 tracking-wider uppercase'>
              Script Library
            </h1>
            <p className='text-xs text-parchment-500'>
              Save imported scripts locally and reuse them in future games.
            </p>
          </div>
        </div>
      </div>

      <div className='flex-1 w-full max-w-3xl mx-auto px-4 py-5 space-y-5 overflow-y-auto'>
        <section className='grid grid-cols-3 gap-3'>
          <div className='rounded-xl border border-mystic-gold/20 bg-mystic-gold/10 p-4'>
            <div className='text-2xl font-tarot text-mystic-gold'>
              {scripts.length}
            </div>
            <div className='text-[11px] uppercase tracking-[0.18em] text-parchment-500'>
              Scripts
            </div>
          </div>
          <div className='rounded-xl border border-white/10 bg-white/[0.04] p-4'>
            <div className='text-2xl font-tarot text-parchment-100'>
              {savedRoleCount}
            </div>
            <div className='text-[11px] uppercase tracking-[0.18em] text-parchment-500'>
              Roles
            </div>
          </div>
          <div className='rounded-xl border border-white/10 bg-white/[0.04] p-4'>
            <div className='text-2xl font-tarot text-parchment-100'>Local</div>
            <div className='text-[11px] uppercase tracking-[0.18em] text-parchment-500'>
              Storage
            </div>
          </div>
        </section>

        <section className='rounded-2xl border border-white/10 bg-black/10 p-4 space-y-4'>
          <div className='flex items-center justify-between gap-3'>
            <div>
              <h2 className='font-tarot text-base tracking-wider uppercase text-mystic-gold'>
                Import Script
              </h2>
              <p className='text-xs text-parchment-500'>
                Paste Blood on the Clocktower JSON or import it from a raw URL.
              </p>
            </div>
            <Icon name='scrollText' size='lg' className='text-mystic-gold/70' />
          </div>

          <div className='rounded-xl border border-white/10 bg-white/[0.04] p-1 flex gap-1'>
            <button
              type='button'
              onClick={() => setMode('json')}
              className={`flex-1 rounded-lg px-3 py-2 text-xs uppercase tracking-[0.18em] transition-colors ${
                mode === 'json'
                  ? 'bg-mystic-gold/15 text-mystic-gold border border-mystic-gold/30'
                  : 'text-parchment-500'
              }`}
            >
              Paste JSON
            </button>
            <button
              type='button'
              onClick={() => setMode('url')}
              className={`flex-1 rounded-lg px-3 py-2 text-xs uppercase tracking-[0.18em] transition-colors ${
                mode === 'url'
                  ? 'bg-mystic-gold/15 text-mystic-gold border border-mystic-gold/30'
                  : 'text-parchment-500'
              }`}
            >
              From URL
            </button>
          </div>

          {mode === 'json' ? (
            <textarea
              value={jsonText}
              onChange={(event) => setJsonText(event.target.value)}
              placeholder='[{"id":"_meta","name":"My Script"},{"id":"washerwoman"}]'
              className='w-full min-h-44 rounded-xl border border-white/10 bg-grimoire-dark/80 px-4 py-3 text-sm text-parchment-100 placeholder:text-parchment-600 focus:outline-none focus:ring-2 focus:ring-mystic-gold/30'
            />
          ) : (
            <input
              type='url'
              value={urlText}
              onChange={(event) => setUrlText(event.target.value)}
              placeholder='https://...'
              className='w-full rounded-xl border border-white/10 bg-grimoire-dark/80 px-4 py-3 text-sm text-parchment-100 placeholder:text-parchment-600 focus:outline-none focus:ring-2 focus:ring-mystic-gold/30'
            />
          )}

          <Button
            onClick={handleImport}
            fullWidth
            size='lg'
            variant='gold'
            disabled={
              loading ||
              (mode === 'json'
                ? jsonText.trim().length === 0
                : urlText.trim().length === 0)
            }
          >
            <Icon
              name={loading ? 'history' : 'checkCircle'}
              size='md'
              className='mr-2'
            />
            {loading ? 'Importing...' : 'Save to Library'}
          </Button>
        </section>

        {notice && (
          <div
            className={`rounded-xl border p-4 text-sm ${
              notice.type === 'success'
                ? 'border-mystic-gold/30 bg-mystic-gold/10 text-parchment-200'
                : 'border-red-500/30 bg-red-900/20 text-red-200'
            }`}
          >
            {notice.message}
          </div>
        )}

        {unsupportedIds.length > 0 && (
          <div className='rounded-xl border border-red-500/30 bg-red-900/20 p-4 space-y-3'>
            <div className='flex items-center gap-2 text-red-200'>
              <Icon name='alertTriangle' size='md' />
              <span className='font-tarot text-sm uppercase tracking-[0.18em]'>
                Unsupported roles
              </span>
            </div>
            <div className='flex flex-wrap gap-2'>
              {unsupportedIds.map((id) => (
                <span
                  key={id}
                  className='rounded-full border border-red-400/30 bg-red-950/50 px-3 py-1 text-xs uppercase tracking-[0.14em] text-red-100'
                >
                  {id}
                </span>
              ))}
            </div>
          </div>
        )}

        <section className='space-y-3'>
          <div className='flex items-center gap-2 px-1'>
            <Icon name='bookMarked' size='sm' className='text-parchment-300' />
            <h2 className='font-tarot text-sm tracking-wider uppercase text-parchment-100'>
              Saved Scripts
            </h2>
          </div>

          {scripts.length === 0 ? (
            <div className='rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-parchment-400'>
              Your library is empty. Import a script once and it will appear in
              the New Game script picker on this device.
            </div>
          ) : (
            scripts.map((script) => {
              const previewRoles = script.roles
                .map((roleId) => getRole(roleId))
                .filter((role): role is NonNullable<typeof role> => role != null)

              return (
                <article
                  key={script.id}
                  className='rounded-2xl border border-white/10 bg-white/[0.04] p-4 space-y-3'
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div className='min-w-0'>
                      <h3 className='font-tarot text-base tracking-wider uppercase text-mystic-gold'>
                        {script.name}
                      </h3>
                      <p className='text-xs text-parchment-500'>
                        {script.author ? `By ${script.author} - ` : ''}
                        {script.roles.length} roles
                      </p>
                    </div>
                    <button
                      type='button'
                      onClick={() => handleDelete(script.id)}
                      className='w-10 h-10 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-parchment-300 hover:text-red-200 hover:border-red-400/30 transition-colors'
                      aria-label={`Delete ${script.name}`}
                    >
                      <Icon name='trash' size='sm' />
                    </button>
                  </div>

                  <div className='flex flex-wrap gap-2'>
                    {previewRoles.map((role) => (
                      <span
                        key={role.id}
                        className='rounded-full border border-white/10 bg-black/10 px-3 py-1 text-xs text-parchment-200'
                      >
                        {getRoleName(role.id, language)}
                      </span>
                    ))}
                  </div>
                </article>
              )
            })
          )}
        </section>
      </div>
    </div>
  )
}
