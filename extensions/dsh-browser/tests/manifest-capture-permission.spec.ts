// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * `chrome.tabs.captureVisibleTab` requires `<all_urls>` or a granted
 * `activeTab`, and `activeTab` is only granted by a user gesture on one tab.
 * Declaring the http and https host patterns is NOT sufficient: capture fails
 * on an ordinary https page with "Either the '<all_urls>' or 'activeTab'
 * permission is required."
 *
 * Measured against Chromium 1223 with this extension: without `<all_urls>` the
 * capture was refused, and with it the same page produced a 12.5 kB PNG. Keep
 * that requirement in the manifest rather than rediscovering it from a failing
 * screenshot.
 */

interface Manifest {
  host_permissions?: readonly string[]
  content_scripts?: readonly { matches?: readonly string[] }[]
}

function manifest(name: string): Manifest {
  return JSON.parse(readFileSync(join(import.meta.dirname, '..', name), 'utf8')) as Manifest
}

describe('capture host permission', () => {
  it.each([['chrome', 'manifest.json'], ['firefox', 'manifest.firefox.json']])(
    'grants %s the permission captureVisibleTab needs',
    (_target, file) => {
      expect(manifest(file).host_permissions).toContain('<all_urls>')
    },
  )

  it('keeps content scripts off non-web schemes', () => {
    // Widening capture must not also widen where the extension injects into
    // pages: <all_urls> would otherwise pull file:// documents into scope.
    expect(manifest('manifest.json').content_scripts?.[0]?.matches)
      .toEqual(['http://*/*', 'https://*/*'])
  })
})
