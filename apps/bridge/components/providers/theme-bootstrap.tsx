"use client";

const THEME_BOOTSTRAP = `(function(){try{var k="powerchain.bridge.theme";var v=window.localStorage.getItem(k);var t=v==="light"||v==="dark"?v:"light";var r=document.documentElement;r.classList.toggle("dark",t==="dark");r.dataset.theme=t;r.style.colorScheme=t;var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",t==="dark"?"#050807":"#eef1ef");}catch(_){}})();`;

/** Applies the persisted theme before React hydration to avoid light/dark flashes. */
export function ThemeBootstrap() {
  return <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />;
}
