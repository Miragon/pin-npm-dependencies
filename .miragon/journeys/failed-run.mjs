export default async function showFailedRun(page) {
  await page.addStyleTag({ content: '.window .toggle { visibility: hidden; }' })
  await page.waitForFunction(() => {
    const window = document.querySelector('.window')
    const failed = window?.querySelector('.run')?.textContent?.includes('failed')
    return failed && window.querySelectorAll('.line.pending').length === 0
  }, null, { timeout: 30000 })
}
