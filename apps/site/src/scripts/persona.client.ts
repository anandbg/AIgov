// ≤1KB client script — sets data-persona on <html> from (1) URL ?lens=, (2) localStorage, (3) default 'all'.
// No fetch, no eval, no third-party imports. Pure DOM mutation.

type Persona = 'exec' | 'engineer' | 'compliance' | 'all';
const KEY = 'aigov:persona' as const;
const VALID: ReadonlyArray<Persona> = ['exec', 'engineer', 'compliance', 'all'];

function applyPersona(p: Persona): void {
  document.documentElement.setAttribute('data-persona', p);
  document.querySelectorAll<HTMLElement>('[role="tab"][data-persona-value]').forEach((el) => {
    el.setAttribute('aria-selected', String(el.dataset.personaValue === p));
  });
}

function readInitial(): Persona {
  const url = new URL(window.location.href);
  const fromUrl = url.searchParams.get('lens');
  if (fromUrl && (VALID as readonly string[]).includes(fromUrl)) return fromUrl as Persona;
  try {
    const fromStorage = window.localStorage.getItem(KEY);
    if (fromStorage && (VALID as readonly string[]).includes(fromStorage)) {
      return fromStorage as Persona;
    }
  } catch {
    /* localStorage unavailable (private mode / disabled) — fall through */
  }
  return 'all';
}

function setPersona(p: Persona): void {
  applyPersona(p);
  try {
    window.localStorage.setItem(KEY, p);
  } catch {
    /* ignore — non-essential persistence */
  }
  const url = new URL(window.location.href);
  if (p === 'all') {
    url.searchParams.delete('lens');
  } else {
    url.searchParams.set('lens', p);
  }
  window.history.replaceState(null, '', url.toString());
}

applyPersona(readInitial());

document.addEventListener('click', (e) => {
  const target = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-persona-value]');
  const val = target?.dataset.personaValue;
  if (val && (VALID as readonly string[]).includes(val)) {
    setPersona(val as Persona);
  }
});

document.addEventListener('keydown', (e) => {
  const active = document.activeElement as HTMLElement | null;
  if (!active?.closest('[role="tablist"][data-persona-tablist]')) return;
  const pills = Array.from(
    document.querySelectorAll<HTMLElement>('[role="tab"][data-persona-value]'),
  );
  const idx = pills.indexOf(active);
  if (idx < 0) return;
  const last = pills.length - 1;
  let nextIdx: number | null = null;
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextIdx = (idx + 1) % pills.length;
  else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') nextIdx = idx === 0 ? last : idx - 1;
  else if (e.key === 'Home') nextIdx = 0;
  else if (e.key === 'End') nextIdx = last;
  if (nextIdx !== null) {
    e.preventDefault();
    pills[nextIdx]?.focus();
  }
});
