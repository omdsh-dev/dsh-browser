// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getUiLocale,
  getUiLocalePreference,
  loadUiLocalePreference,
  localeFromLanguage,
  normalizeUiLocalePreference,
  resolveUiLocale,
  saveUiLocalePreference,
  setUiLocalePreference,
  watchUiLocalePreference,
} from '../src/i18n.ts'
import { PANEL_COPY } from '../src/panel/strings.ts'

afterEach(() => {
  vi.unstubAllGlobals()
  setUiLocalePreference('auto')
})

describe('browser locale selection', () => {
  it('uses Chinese for every zh locale variant', () => {
    expect(localeFromLanguage('zh')).toBe('zh')
    expect(localeFromLanguage('zh-CN')).toBe('zh')
    expect(localeFromLanguage('zh-TW')).toBe('zh')
    expect(localeFromLanguage('ZH-hant-HK')).toBe('zh')
  })

  it('defaults every non-Chinese or missing locale to English', () => {
    expect(localeFromLanguage('en-US')).toBe('en')
    expect(localeFromLanguage('ja-JP')).toBe('en')
    expect(localeFromLanguage('fr')).toBe('en')
    expect(localeFromLanguage(undefined)).toBe('en')
  })

  it('uses the browser\'s first preferred language while the preference is automatic', () => {
    vi.stubGlobal('navigator', { languages: ['zh-Hant', 'en-US'], language: 'en-US' })
    expect(getUiLocale()).toBe('zh')

    vi.stubGlobal('navigator', { languages: ['de-DE', 'zh-CN'], language: 'de-DE' })
    expect(getUiLocale()).toBe('en')
  })

  it('provides localized panel and prompt copy in both languages', () => {
    expect(PANEL_COPY.en.app.newSession).toBe('New chat')
    expect(PANEL_COPY.en.app.overviewPage).toBe('Give me an overview')
    expect(PANEL_COPY.en.approval.allowOnce).toBe('Allow once')
    expect(PANEL_COPY.en.settings.unrestrictedBrowserAccess).toBe('Allow unrestricted browser control')
    expect(PANEL_COPY.en.app.overviewPrompt).toMatch(/^First give me an overview/)
    expect(PANEL_COPY.zh.app.newSession).toBe('新对话')
    expect(PANEL_COPY.zh.app.overviewPage).toBe('先概览这个页面')
    expect(PANEL_COPY.zh.approval.allowOnce).toBe('仅允许这一次')
    expect(PANEL_COPY.zh.settings.unrestrictedBrowserAccess).toBe('允许模型完全控制浏览器')
  })
})

describe('manual UI language preference', () => {
  it('snaps unknown stored values back to automatic', () => {
    expect(normalizeUiLocalePreference('en')).toBe('en')
    expect(normalizeUiLocalePreference('zh')).toBe('zh')
    expect(normalizeUiLocalePreference('auto')).toBe('auto')
    expect(normalizeUiLocalePreference('fr')).toBe('auto')
    expect(normalizeUiLocalePreference(undefined)).toBe('auto')
    expect(normalizeUiLocalePreference(42)).toBe('auto')
  })

  it('lets an explicit choice override the browser language', () => {
    vi.stubGlobal('navigator', { languages: ['en-US'], language: 'en-US' })
    setUiLocalePreference('zh')
    expect(getUiLocale()).toBe('zh')

    vi.stubGlobal('navigator', { languages: ['zh-CN'], language: 'zh-CN' })
    expect(resolveUiLocale('en')).toBe('en')
    expect(resolveUiLocale('auto')).toBe('zh')
  })

  it('loads the persisted choice and saves the next one', async () => {
    const set = vi.fn(async () => {})
    vi.stubGlobal('chrome', {
      storage: { local: { get: vi.fn(async () => ({ dshPanelUiLocale: 'zh' })), set } },
    })

    expect(await loadUiLocalePreference()).toBe('zh')
    expect(getUiLocalePreference()).toBe('zh')
    expect(getUiLocale()).toBe('zh')

    expect(saveUiLocalePreference('en')).toBe('en')
    expect(getUiLocalePreference()).toBe('en')
    expect(set).toHaveBeenCalledWith({ dshPanelUiLocale: 'en' })
  })

  it('falls back to automatic when the stored value is unreadable', async () => {
    vi.stubGlobal('chrome', {
      storage: { local: { get: vi.fn(async () => ({})) , set: vi.fn(async () => {}) } },
    })
    expect(await loadUiLocalePreference()).toBe('auto')
  })

  it('follows changes written by another context and can stop watching', () => {
    const addListener = vi.fn()
    const removeListener = vi.fn()
    vi.stubGlobal('chrome', {
      storage: { local: {}, onChanged: { addListener, removeListener } },
    })
    const seen: string[] = []
    const stop = watchUiLocalePreference((preference) => seen.push(preference))
    expect(addListener).toHaveBeenCalledTimes(1)
    const listener = addListener.mock.calls[0]![0] as (
      changes: Record<string, { newValue?: unknown }>,
      areaName: string,
    ) => void

    listener({ dshPanelUiLocale: { newValue: 'zh' } }, 'local')
    expect(seen).toEqual(['zh'])
    expect(getUiLocale()).toBe('zh')

    listener({ dshPanelUiLocale: { newValue: 'en' } }, 'sync')
    expect(seen).toEqual(['zh'])
    listener({ dshSettings: { newValue: {} } }, 'local')
    expect(seen).toEqual(['zh'])

    stop()
    expect(removeListener).toHaveBeenCalledWith(listener)
  })
})
