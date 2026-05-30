const timers = new Map();

export function copyWithAutoClear(text, onSuccess, onError, clearMs = 30000) {
  navigator.clipboard.writeText(text)
    .then(() => {
      const prev = timers.get('clip');
      if (prev) clearTimeout(prev);
      timers.set('clip', setTimeout(() => {
        navigator.clipboard.writeText('').catch(() => {});
        timers.delete('clip');
      }, clearMs));
      onSuccess?.();
    })
    .catch(() => onError?.());
}
