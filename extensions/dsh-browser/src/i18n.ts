/**
 * Extension UI language model.
 *
 * The browser language is only the default: whatever Chrome is set to decides
 * the panel the first time it opens. The user can override that with an
 * explicit language, which must survive panel reloads and also reach the
 * background worker that formats approval notifications and tool errors.
 *
 * The preference is therefore a small `chrome.storage.local` value owned by
 * the panel (like the text scale), mirrored into a module-level cache so the
 * synchronous call sites keep working. The background watches the same key and
 * refreshes its cache when a panel writes it.
 *
 * @module
 */

/** Languages supported by the extension UI. */
export type UiLocale = 'en' | 'zh'

/** What the user picked in Settings; `auto` follows the browser language. */
export type UiLocalePreference = 'auto' | UiLocale

/** `chrome.storage.local` key holding the persisted preference. */
export const UI_LOCALE_STORAGE_KEY = 'dshPanelUiLocale'

/**
 * Chinese browser locales use Chinese; every other locale deliberately falls
 * back to English so an untranslated third language never leaks into the UI.
 */
export function localeFromLanguage(language: string | null | undefined): UiLocale {
  const normalized = language?.trim().toLowerCase() ?? ''
  return normalized === 'zh' || normalized.startsWith('zh-') ? 'zh' : 'en'
}

/** Snap a stored or user-supplied value onto a supported preference. */
export function normalizeUiLocalePreference(value: unknown): UiLocalePreference {
  return value === 'en' || value === 'zh' ? value : 'auto'
}

/** Read the browser's first preferred language, with the extension UI locale as a fallback. */
export function browserLanguage(): string | undefined {
  let language: string | undefined
  if (typeof navigator !== 'undefined') {
    const preferred = navigator.languages?.find((candidate) => candidate.trim() !== '') ?? navigator.language
    language = preferred?.trim() === '' ? undefined : preferred
  }
  if (language === undefined && typeof chrome !== 'undefined' && chrome.i18n?.getUILanguage !== undefined) {
    try {
      language = chrome.i18n.getUILanguage()
    } catch {
      // A partially mocked or stale extension context may expose an unusable API.
    }
  }
  return language
}

/**
 * Resolve the preference to the locale text is rendered in. An explicit choice
 * wins outright; `auto` keeps the browser-derived behavior.
 */
export function resolveUiLocale(
  preference: unknown,
  language: string | null | undefined = browserLanguage(),
): UiLocale {
  const normalized = normalizeUiLocalePreference(preference)
  return normalized === 'auto' ? localeFromLanguage(language) : normalized
}

/** Latest preference loaded by this context; `auto` until storage says otherwise. */
let cachedPreference: UiLocalePreference = 'auto'

/** Update the in-memory cache without touching storage. */
export function setUiLocalePreference(value: unknown): UiLocalePreference {
  cachedPreference = normalizeUiLocalePreference(value)
  return cachedPreference
}

/** The preference currently in effect, as opposed to the resolved locale. */
export function getUiLocalePreference(): UiLocalePreference {
  return cachedPreference
}

/** Locale for text generated right now; the manual choice beats the browser language. */
export function getUiLocale(): UiLocale {
  return resolveUiLocale(cachedPreference)
}

/** Load the persisted preference into the cache; falls back to the cache on failure. */
export async function loadUiLocalePreference(): Promise<UiLocalePreference> {
  try {
    if (typeof chrome === 'undefined' || chrome.storage?.local === undefined) return cachedPreference
    const stored = await chrome.storage.local.get(UI_LOCALE_STORAGE_KEY)
    return setUiLocalePreference(stored[UI_LOCALE_STORAGE_KEY])
  } catch {
    return cachedPreference
  }
}

/** Persist a choice and apply it to this context immediately. */
export function saveUiLocalePreference(value: unknown): UiLocalePreference {
  const preference = setUiLocalePreference(value)
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local !== undefined) {
      void chrome.storage.local.set({ [UI_LOCALE_STORAGE_KEY]: preference }).catch(() => {})
    }
  } catch {
    // A storage failure must not break the in-memory switch.
  }
  return preference
}

/**
 * Follow preference changes made by another context (a second side panel, or a
 * panel writing while the background worker formats a message). Returns an
 * unsubscribe function; a context without `storage.onChanged` gets a no-op.
 */
export function watchUiLocalePreference(onChange?: (preference: UiLocalePreference) => void): () => void {
  if (typeof chrome === 'undefined' || chrome.storage?.onChanged === undefined) return () => {}
  const listener = (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: string,
  ): void => {
    if (areaName !== 'local') return
    const change = changes[UI_LOCALE_STORAGE_KEY]
    if (change === undefined) return
    const preference = setUiLocalePreference(change.newValue)
    onChange?.(preference)
  }
  try {
    chrome.storage.onChanged.addListener(listener)
  } catch {
    return () => {}
  }
  return () => {
    try {
      chrome.storage.onChanged.removeListener(listener)
    } catch {
      // The context may already be torn down; there is nothing left to detach.
    }
  }
}
