import { ButtonIcon, Tooltip, TooltipTrigger } from '@backstage/ui';
import { RiCheckLine, RiLinkM } from '@remixicon/react';
import { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * The element id of the item a link names. The link itself names the item
 * as its fragment, e.g. `/errors#cityhub-dev-43ae`; the prefix keeps the
 * element ids apart from the others on the page.
 */
export const deepLinkId = (target: string) => `link-${target}`;

/**
 * The page's choices that a link carries along, like the period, also those
 * only remembered in local storage; undefined leaves one out
 */
export const DeepLinkParams = createContext<Record<string, string | undefined>>(
  {},
);

/** A link to this page as it is now, scrolled to the item `target` */
export function deepLinkUrl(
  target: string,
  params: Record<string, string | undefined> = {},
): string {
  const url = new URL(window.location.href);
  for (const [name, value] of Object.entries(params)) {
    if (value === undefined || value === '') url.searchParams.delete(name);
    else url.searchParams.set(name, value);
  }
  url.hash = target;
  return url.toString();
}

const targetOf = (hash: string) => {
  if (hash.length < 2) return undefined;
  try {
    return decodeURIComponent(hash.slice(1));
  } catch {
    return hash.slice(1);
  }
};

/**
 * The item the page's link names, so a list can unfold to show it or a row
 * can open its details
 */
export function useDeepLinkTarget(): string | undefined {
  return targetOf(useLocation().hash);
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // Without the clipboard API, e.g. over plain http
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  }
}

/** A small button that copies a link to the item `target` to share */
export const CopyLinkButton = ({
  target,
  label,
}: {
  target: string;
  /** What the link is to, for screen readers, e.g. the project's name */
  label: string;
}) => {
  const params = useContext(DeepLinkParams);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);
  return (
    <TooltipTrigger delay={300}>
      <ButtonIcon
        size="small"
        variant="tertiary"
        aria-label={`Copy link to ${label}`}
        icon={copied ? <RiCheckLine /> : <RiLinkM />}
        onPress={async () => {
          await copy(deepLinkUrl(target, params));
          setCopied(true);
        }}
      />
      <Tooltip>{copied ? 'Link copied' : 'Copy link to share'}</Tooltip>
    </TooltipTrigger>
  );
};

const STYLE_ID = 'deep-link-style';

// An outline that fades out on a card, a background on a table row, in the
// accent colour
const STYLE = `
@keyframes deep-link-outline {
  from { outline-color: var(--bui-accent-bg); }
  to { outline-color: transparent; }
}
@keyframes deep-link-row {
  from { background-color: color-mix(in srgb, var(--bui-accent-bg) 20%, transparent); }
  to { background-color: transparent; }
}
.deep-link-target:not(tr) {
  outline: 2px solid transparent;
  outline-offset: 4px;
  border-radius: 8px;
  animation: deep-link-outline 3s ease-in 0.5s;
}
tr.deep-link-target > td {
  animation: deep-link-row 3s ease-in 0.5s;
}
`;

function highlight(element: HTMLElement) {
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = STYLE;
    document.head.appendChild(style);
  }
  element.classList.remove('deep-link-target');
  // Restarts the animation when the same item is linked to again
  void element.offsetWidth;
  element.classList.add('deep-link-target');
}

// How long the page may take to load before the item is given up on
const WAIT_MS = 20_000;

/**
 * Scrolls to the item the page's link names and makes it light up. The item
 * may only appear once its data is in, and what loads above it pushes it
 * down, so it keeps the item in view until the viewer scrolls or clicks.
 */
export function useDeepLinkScroll() {
  const { hash } = useLocation();
  useEffect(() => {
    const target = targetOf(hash);
    if (!target) return undefined;
    const id = deepLinkId(target);
    let shown: HTMLElement | null = null;
    let pending: ReturnType<typeof setTimeout> | undefined;

    const place = () => {
      const element = document.getElementById(id);
      if (!element) return;
      if (element !== shown) {
        shown = element;
        highlight(element);
      }
      // The window only: scrollIntoView also scrolls the app's own layout
      // boxes, which shifts the whole page on a short one
      const box = element.getBoundingClientRect();
      const offset =
        element.tagName === 'TR'
          ? Math.max(16, (window.innerHeight - box.height) / 2)
          : 16;
      window.scrollTo({ top: window.scrollY + box.top - offset });
    };
    // A timer, not an animation frame: those wait while the tab is hidden,
    // e.g. a link opened in a background tab
    const schedule = () => {
      clearTimeout(pending);
      pending = setTimeout(place, 50);
    };

    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    const events = ['wheel', 'touchstart', 'keydown', 'mousedown'];
    const timer = setTimeout(stop, WAIT_MS);
    function stop() {
      observer.disconnect();
      clearTimeout(pending);
      clearTimeout(timer);
      events.forEach(e => window.removeEventListener(e, stop));
    }
    events.forEach(e => window.addEventListener(e, stop, { passive: true }));
    schedule();
    return stop;
  }, [hash]);
}
