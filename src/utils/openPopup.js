export function openPopup(url, name, width, height) {
  const left = (window.screen.width / 2) - (width / 2)
  const top = (window.screen.height / 2) - (height / 2)
  const popup = window.open(url, name, `width=${width},height=${height},top=${top},left=${left}`)
  if (popup) {
    popup.focus()
  } else {
    alert('Popup blocked! Please allow popups for this website.')
  }
};