import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
import './styles.css'
import { getUiLocale, loadUiLocalePreference } from '../i18n.ts'
import { PANEL_COPY } from './strings.ts'

// Read the stored UI language before the first paint: rendering in the browser
// language and then swapping it would flash the wrong locale. `load...` never
// rejects (it falls back to the cached preference), so the panel always mounts.
void loadUiLocalePreference().then(() => {
  const locale = getUiLocale()
  document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en'
  document.title = PANEL_COPY[locale].documentTitle

  const root = document.getElementById('root')
  if (root === null) throw new Error('panel root missing')
  createRoot(root).render(<App />)
})
