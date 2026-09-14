// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('panel layout styles', () => {
  it('keeps the settings view within the viewport so overflowing content scrolls', () => {
    const styles = readFileSync(`${process.cwd()}/src/panel/styles.css`, 'utf8')
    const settingsRule = styles.match(/\.settings\s*\{([^}]*)\}/)?.[1]

    expect(settingsRule).toBeDefined()
    expect(settingsRule).toMatch(/(?:^|\n)\s*height:\s*100vh;/)
    expect(settingsRule).toMatch(/(?:^|\n)\s*height:\s*100dvh;/)
    expect(settingsRule).toMatch(/(?:^|\n)\s*overflow-y:\s*auto;/)
    expect(settingsRule).toMatch(/(?:^|\n)\s*overscroll-behavior:\s*contain;/)
  })

  it('keeps settings sections at their natural height so the view can overflow', () => {
    const styles = readFileSync(`${process.cwd()}/src/panel/styles.css`, 'utf8')
    const settingsChildrenRule = styles.match(/\.settings\s*>\s*\*\s*\{([^}]*)\}/)?.[1]

    expect(settingsChildrenRule).toBeDefined()
    expect(settingsChildrenRule).toMatch(/(?:^|\n)\s*flex-shrink:\s*0;/)
  })

  it('floats a scroll-to-bottom control over the conversation pane', () => {
    const styles = readFileSync(`${process.cwd()}/src/panel/styles.css`, 'utf8')
    const paneRule = styles.match(/\.messages-pane\s*\{([^}]*)\}/)?.[1]
    const buttonRule = styles.match(/\.scroll-to-bottom\s*\{([^}]*)\}/)?.[1]

    expect(paneRule).toBeDefined()
    expect(paneRule).toMatch(/(?:^|\n)\s*position:\s*relative;/)
    expect(paneRule).toMatch(/(?:^|\n)\s*flex:\s*1;/)
    expect(buttonRule).toBeDefined()
    expect(buttonRule).toMatch(/(?:^|\n)\s*position:\s*absolute;/)
    expect(buttonRule).toMatch(/(?:^|\n)\s*right:\s*16px;/)
    expect(buttonRule).toMatch(/(?:^|\n)\s*bottom:\s*12px;/)
  })
})
