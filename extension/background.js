// Background service worker — handles API calls from popup

const API = 'https://cognisafe-541n.onrender.com';

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'API') {
    handleApi(msg).then(sendResponse).catch(err => sendResponse({ __error: err.message }));
    return true;
  }
});

async function handleApi({ path, method = 'GET', body, token }) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(API + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
