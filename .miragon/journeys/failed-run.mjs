const CARD = { width: 1000, height: 500, scale: 3 }

export default async function showFailedRun(page) {
  await page.addStyleTag({ content: '.window .toggle { visibility: hidden; }' })
  await page.waitForFunction(() => {
    const window = document.querySelector('.window')
    const failed = window?.querySelector('.run')?.textContent?.includes('failed')
    return failed && window.querySelectorAll('.line.pending').length === 0
  }, null, { timeout: 30000 })
  await page.evaluate(({ width, height, scale }) => {
    Object.assign(document.querySelector('.window').style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: `${width}px`,
      height: `${height}px`,
      transform: `scale(${scale})`,
      transformOrigin: '0 0',
      zIndex: '1000'
    })
  }, CARD)
}
