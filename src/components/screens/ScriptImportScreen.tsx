import { useMemo, useState } from 'react'
import { BackButton, Button, Icon } from '../atoms'
import { ScreenFooter } from '../layouts/ScreenFooter'
import { useI18n, getRoleName } from '../../lib/i18n'
import { parseImportedScriptJson } from '../../lib/scripts/import/parse'
import { resolveImportedScript } from '../../lib/scripts/import/resolve'
import { EditableScriptDraft } from '../../lib/scripts'
import { getRole } from '../../lib/roles'

type Props = {
  playerCount: number
  onBack: () => void
  onResolved: (draft: EditableScriptDraft) => void
}

type ImportMode = 'json' | 'url'

export function ScriptImportScreen({
  playerCount,
  onBack,
  onResolved,
}: Props) {
  const { t, language } = useI18n()
  const [mode, setMode] = useState<ImportMode>('json')
  const [jsonText, setJsonText] = useState('')
  const [urlText, setUrlText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resolvedDraft, setResolvedDraft] = useState<EditableScriptDraft | null>(
    null,
  )
  const [unsupportedIds, setUnsupportedIds] = useState<string[]>([])

  const previewRoles = useMemo(
    () =>
      resolvedDraft?.roles
        .map((roleId) => getRole(roleId))
        .filter((role): role is NonNullable<typeof role> => role != null) ?? [],
    [resolvedDraft],
  )

  const handleValidate = async () => {
    setLoading(true)
    setError(null)
    setResolvedDraft(null)
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
        return
      }

      setResolvedDraft(result.resolvedScript)
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : t.scripts.importParseError,
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='min-h-app bg-gradient-to-b from-grimoire-purple via-grimoire-dark to-grimoire-darker flex flex-col'>
      <div className='sticky top-0 z-10 bg-grimoire-dark/95 backdrop-blur-sm border-b border-mystic-gold/20 px-4 py-3'>
        <div className='flex items-center gap-3 max-w-lg mx-auto'>
          <BackButton onClick={onBack} />
          <div className='flex-1'>
            <h1 className='font-tarot text-lg text-parchment-100 tracking-wider uppercase'>
              {t.scripts.importScript}
            </h1>
            <p className='text-xs text-parchment-500'>
              {t.scripts.importScriptSubtitle}
            </p>
          </div>
        </div>
      </div>

      <div className='px-4 py-3 bg-white/5 border-b border-white/10'>
        <div className='max-w-lg mx-auto flex items-center gap-2'>
          <Icon name='users' size='sm' className='text-mystic-gold/70' />
          <span className='text-sm text-parchment-300'>
            {playerCount} {t.common.players.toLowerCase()}
          </span>
        </div>
      </div>

      <div className='flex-1 px-4 py-4 max-w-lg mx-auto w-full overflow-y-auto space-y-4'>
        <div className='rounded-2xl border border-white/10 bg-white/[0.04] p-1 flex gap-1'>
          <button
            type='button'
            onClick={() => setMode('json')}
            className={`flex-1 rounded-xl px-4 py-2 text-xs uppercase tracking-[0.18em] transition-colors ${
              mode === 'json'
                ? 'bg-mystic-gold/15 text-mystic-gold border border-mystic-gold/30'
                : 'text-parchment-500'
            }`}
          >
            {t.scripts.importPasteJson}
          </button>
          <button
            type='button'
            onClick={() => setMode('url')}
            className={`flex-1 rounded-xl px-4 py-2 text-xs uppercase tracking-[0.18em] transition-colors ${
              mode === 'url'
                ? 'bg-mystic-gold/15 text-mystic-gold border border-mystic-gold/30'
                : 'text-parchment-500'
            }`}
          >
            {t.scripts.importFromUrl}
          </button>
        </div>

        <div className='rounded-2xl border border-white/10 bg-black/10 p-4 space-y-3'>
          <p className='text-sm text-parchment-400'>
            {mode === 'json'
              ? t.scripts.importPasteJsonHelp
              : t.scripts.importFromUrlHelp}
          </p>
          {mode === 'json' ? (
            <textarea
              value={jsonText}
              onChange={(event) => setJsonText(event.target.value)}
              placeholder={t.scripts.importJsonPlaceholder}
              className='w-full min-h-48 rounded-xl border border-white/10 bg-grimoire-dark/80 px-4 py-3 text-sm text-parchment-100 placeholder:text-parchment-600 focus:outline-none focus:ring-2 focus:ring-mystic-gold/30'
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
            onClick={handleValidate}
            fullWidth
            size='lg'
            variant='gold'
            disabled={
              loading ||
              (mode === 'json' ? jsonText.trim().length === 0 : urlText.trim().length === 0)
            }
          >
            <Icon
              name={loading ? 'history' : 'checkCircle'}
              size='md'
              className='mr-2'
            />
            {loading ? t.scripts.importValidating : t.scripts.importValidate}
          </Button>
        </div>

        {error && (
          <div className='rounded-2xl border border-red-500/30 bg-red-900/20 p-4'>
            <p className='text-sm text-red-200'>{error}</p>
          </div>
        )}

        {unsupportedIds.length > 0 && (
          <div className='rounded-2xl border border-red-500/30 bg-red-900/20 p-4 space-y-3'>
            <div className='flex items-center gap-2'>
              <Icon name='alertTriangle' size='md' className='text-red-300' />
              <h2 className='font-tarot text-sm uppercase tracking-[0.18em] text-red-100'>
                {t.scripts.importNotSupported}
              </h2>
            </div>
            <p className='text-sm text-red-200'>
              {t.scripts.importUnsupportedHelp}
            </p>
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

        {resolvedDraft && (
          <div className='rounded-2xl border border-mystic-gold/30 bg-mystic-gold/10 p-4 space-y-4'>
            <div className='flex items-start justify-between gap-3'>
              <div>
                <h2 className='font-tarot text-lg tracking-wider uppercase text-mystic-gold'>
                  {resolvedDraft.name}
                </h2>
                {resolvedDraft.author && (
                  <p className='text-sm text-parchment-400'>
                    {t.scripts.byAuthor.replace('{author}', resolvedDraft.author)}
                  </p>
                )}
              </div>
              <div className='rounded-full border border-mystic-gold/30 bg-black/20 px-3 py-1 text-xs uppercase tracking-[0.18em] text-mystic-gold'>
                {previewRoles.length} {t.common.roles.toLowerCase()}
              </div>
            </div>

            <div className='flex flex-wrap gap-2'>
              {previewRoles.map((role) => (
                <span
                  key={role.id}
                  className='rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-parchment-200'
                >
                  {getRoleName(role.id, language)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <ScreenFooter>
        <Button
          onClick={() => resolvedDraft && onResolved(resolvedDraft)}
          fullWidth
          size='lg'
          variant='ember'
          disabled={!resolvedDraft}
        >
          <Icon name='arrowRight' size='md' className='mr-2' />
          {t.scripts.continueToWakeOrder}
        </Button>
      </ScreenFooter>
    </div>
  )
}

