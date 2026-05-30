// Content script — runs on every page, handles form detection and auto-fill

function findUsernameField() {
  const candidates = [
    'input[autocomplete="username"]',
    'input[autocomplete="email"]',
    'input[type="email"]',
    'input[type="text"][name*="user" i]',
    'input[type="text"][name*="email" i]',
    'input[type="text"][id*="user" i]',
    'input[type="text"][id*="email" i]',
    'input[type="text"][placeholder*="user" i]',
    'input[type="text"][placeholder*="email" i]',
  ];
  for (const sel of candidates) {
    const el = document.querySelector(sel);
    if (el && isVisible(el)) return el;
  }
  // fallback: first visible text input before a password field
  const passField = findPasswordField();
  if (passField) {
    const inputs = Array.from(document.querySelectorAll('input[type="text"], input[type="email"]'));
    return inputs.find(el => isVisible(el) && el.compareDocumentPosition(passField) & Node.DOCUMENT_POSITION_FOLLOWING) || null;
  }
  return null;
}

function findPasswordField() {
  const fields = Array.from(document.querySelectorAll('input[type="password"]'));
  return fields.find(isVisible) || null;
}

function isVisible(el) {
  return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
}

function simulateInput(el, value) {
  el.focus();
  const nativeInputSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  nativeInputSetter.call(el, value);
  el.dispatchEvent(new Event('input',  { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'FILL') {
    const userField = findUsernameField();
    const passField = findPasswordField();
    if (userField && msg.username) simulateInput(userField, msg.username);
    if (passField && msg.password) simulateInput(passField, msg.password);
    sendResponse({ ok: true });
    return true;
  }

  if (msg.type === 'GET_FIELDS') {
    const userField = findUsernameField();
    const passField = findPasswordField();
    sendResponse({
      username:  userField?.value || '',
      password:  passField?.value || '',
      hasFields: !!(userField || passField),
    });
    return true;
  }
});
