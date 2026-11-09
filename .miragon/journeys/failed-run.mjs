export default async function showFailedRun(page) {
  await page.addStyleTag({ content: '.window .toggle { visibility: hidden; }' })
  await page.waitForFunction(() => {
    const window = document.querySelector('.window')
    const failed = window?.querySelector('.run')?.textContent?.includes('failed')
    return failed && window.querySelectorAll('.line.pending').length === 0
  }, null, { timeout: 30000 })
  await page.evaluate(() => {
    const window = document.querySelector('.window')
    const { width } = window.getBoundingClientRect()
    Object.assign(window.style, { position: 'fixed', top: '0', left: '0', width: `${width}px`, transform: 'scale(2)', transformOrigin: '0 0', zIndex: '1000' })
  })
}
