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

  it('places the composer control chips on their own row with upward menus', () => {
    const styles = readFileSync(`${process.cwd()}/src/panel/styles.css`, 'utf8')
    const controlsRule = styles.match(/\.composer-controls\s*\{([^}]*)\}/)?.[1]
    const chipRule = styles.match(/\.composer-model,\s*\n\.composer-chip\s*\{([^}]*)\}/)?.[1]
    const menuRule = styles.match(/\.composer-model-menu\s*\{([^}]*)\}/)?.[1]
    const chipMenuRule = styles.match(/\.composer-chip-menu\s*\{([^}]*)\}/)?.[1]

    // The chip row sits under the composer box and wraps on a narrow panel.
    expect(controlsRule).toBeDefined()
    expect(controlsRule).toMatch(/(?:^|\n)\s*display:\s*flex;/)
    expect(controlsRule).toMatch(/(?:^|\n)\s*flex-wrap:\s*wrap;/)
    expect(controlsRule).toMatch(/(?:^|\n)\s*margin-top:\s*8px;/)
    expect(chipRule).toBeDefined()
    expect(chipRule).toMatch(/(?:^|\n)\s*position:\s*relative;/)
    expect(menuRule).toBeDefined()
    expect(menuRule).toMatch(/(?:^|\n)\s*position:\s*absolute;/)
    expect(menuRule).toMatch(/(?:^|\n)\s*bottom:\s*calc\(100% \+ 6px\);/)
    expect(chipMenuRule).toBeDefined()
    expect(chipMenuRule).toMatch(/(?:^|\n)\s*position:\s*absolute;/)
    expect(chipMenuRule).toMatch(/(?:^|\n)\s*bottom:\s*calc\(100% \+ 6px\);/)
  })

  it('renders the slash menu inside the composer shell so it can point upward', () => {
    const styles = readFileSync(`${process.cwd()}/src/panel/styles.css`, 'utf8')
    const composerRule = styles.match(/\.composer\s*\{([^}]*)\}/)?.[1]
    const slashRule = styles.match(/\.slash-menu\s*\{([^}]*)\}/)?.[1]

    expect(composerRule).toBeDefined()
    expect(composerRule).toMatch(/(?:^|\n)\s*position:\s*relative;/)
    expect(slashRule).toBeDefined()
    expect(slashRule).toMatch(/(?:^|\n)\s*position:\s*absolute;/)
    expect(slashRule).toMatch(/(?:^|\n)\s*overscroll-behavior:\s*contain;/)
  })

  it('renders the developer-tools state inside its own switch, not as a row', () => {
    const styles = readFileSync(`${process.cwd()}/src/panel/styles.css`, 'utf8')

    // The switch keeps one settings entry, with a row wrapper only so the
    // attached state can offer a detach action beside it.
    const rowRule = styles.match(/\.settings\s+\.setting-toggle-row\s*\{([^}]*)\}/)?.[1]
    expect(rowRule).toBeDefined()
    expect(rowRule).toMatch(/(?:^|\n)\s*display:\s*flex;/)
    expect(rowRule).toMatch(/(?:^|\n)\s*padding:\s*13px;/)
    expect(rowRule).toMatch(/(?:^|\n)\s*border-bottom:\s*1px solid var\(--line\);/)

    // The inner switch must not draw a second border of its own.
    const innerLabelRule = styles.match(/\.settings\s+\.setting-toggle-row\s*>\s*label\.setting-toggle\s*\{([^}]*)\}/)?.[1]
    expect(innerLabelRule).toBeDefined()
    expect(innerLabelRule).toMatch(/(?:^|\n)\s*padding:\s*0;/)
    expect(innerLabelRule).toMatch(/(?:^|\n)\s*border-bottom:\s*0;/)

    const statusRule = styles.match(/\.settings\s+label\.setting-toggle\s+\.devtools-status\s*\{([^}]*)\}/)?.[1]
    expect(statusRule).toBeDefined()
    expect(statusRule).toMatch(/(?:^|\n)\s*font-size:\s*calc\(9\.5px \* var\(--ui-scale\)\);/)

    const errorRule = styles.match(/\.settings\s+label\.setting-toggle\s+\.devtools-status\.is-error\s*\{([^}]*)\}/)?.[1]
    expect(errorRule).toBeDefined()
    expect(errorRule).toMatch(/(?:^|\n)\s*color:\s*var\(--danger\);/)

    // An unsupported platform must not look like an enabled switch.
    const disabledRule = styles.match(/\.setting-toggle-input:disabled\s*\+\s*\.setting-toggle-control\s*\{([^}]*)\}/)?.[1]
    expect(disabledRule).toBeDefined()
    expect(disabledRule).toMatch(/(?:^|\n)\s*opacity:\s*0\.45;/)
  })
})
