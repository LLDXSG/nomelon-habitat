const privateNoteForm = document.querySelector('#message-form');
const noteStatus = document.querySelector('#send-status');
const noteButton = privateNoteForm?.querySelector('.send-button');
window.NOMELON_NOTE_ENDPOINT ||= 'https://script.google.com/macros/s/AKfycbwVtys7RU7jm6405ZFRUeW6drw15AtHowMiDwlEjgBBp-uIUzgZh6NK7oZwGBYZN2CF/exec';
const encodeFile = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve({ name:file.name, type:file.type, content:String(reader.result).split(',')[1] });
  reader.onerror = reject;
  reader.readAsDataURL(file);
});
// A simple cross-site form request works without CORS.  Unlike a hidden iframe,
// fetch is not discarded by Safari or in-app mobile browsers when the page updates.
const handoffToGoogleScript = (endpoint, payload) => fetch(endpoint, {
  method: 'POST',
  mode: 'no-cors',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
  body: new URLSearchParams({ payload: JSON.stringify(payload) }).toString()
});

document.addEventListener('submit', async event => {
  if (event.target !== privateNoteForm) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const endpoint = window.NOMELON_NOTE_ENDPOINT;
  const image = document.querySelector('#image-upload')?.files[0];
  if (!endpoint) { noteStatus.textContent = 'Private notes are being prepared. Please try again soon.'; return; }
  try {
    noteButton.disabled = true;
    noteStatus.textContent = 'Sending your private note…';
    const attachments = [];
    if (image) attachments.push(await encodeFile(image));
    if (typeof voiceBlob !== 'undefined' && voiceBlob) attachments.push(await encodeFile(new File([voiceBlob], 'voice-note.webm', { type:voiceBlob.type || 'audio/webm' })));
    if (attachments.some(file => Math.ceil(file.content.length * 0.75) > 4 * 1024 * 1024)) throw new Error('Each image or voice note must be under 4 MB.');
    await handoffToGoogleScript(endpoint, { message:document.querySelector('#message-text').value, attachments, website:'' });
    privateNoteForm.reset();
    if (typeof voiceBlob !== 'undefined') voiceBlob = null;
    document.querySelector('#file-status').textContent = '';
    noteStatus.textContent = 'Your private note has been submitted. Thank you.';
  } catch (error) {
    noteStatus.textContent = error.message || 'Unable to send this note.';
  } finally {
    noteButton.disabled = false;
  }
}, true);
