/* js/icons.js
   화면 버튼에 쓰는 아이콘(SVG). 모두 같은 두께의 둥근 선으로 그려요.
   쓰는 법: ${icon('mail')}
*/
const ICONS = {
  mail:  '<rect x="3" y="5.5" width="18" height="13" rx="3"/><path d="M4 7.5l8 6 8-6"/>',
  scroll:'<path d="M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8"/><path d="M7 4a2 2 0 0 0-2 2v2h4V6a2 2 0 0 0-2-2z"/><path d="M8 20a2 2 0 0 1-2-2v-8"/><path d="M11 9h5M11 13h5"/>',
  swap:  '<path d="M4 9h13l-3.5-3.5"/><path d="M20 15H7l3.5 3.5"/>',
  close: '<path d="M7 7l10 10M17 7L7 17"/>',
  up:    '<path d="M6 15l6-6 6 6"/>',
  down:  '<path d="M6 9l6 6 6-6"/>',
  left:  '<path d="M15 6l-6 6 6 6"/>',
  right: '<path d="M9 6l6 6-6 6"/>',
  star:  '<path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"/>',
  hand:  '<path d="M8 13V6.5a1.5 1.5 0 0 1 3 0V12"/><path d="M11 11V5a1.5 1.5 0 0 1 3 0v6"/><path d="M14 11V6.5a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6h-.5a5.5 5.5 0 0 1-4.7-2.7L4 14a1.5 1.5 0 0 1 2.6-1.5L8 14"/>',
  flag:  '<path d="M6 21V4"/><path d="M6 4.5c4-2 7 2 11.5 0V13c-4.5 2-7.5-2-11.5 0"/>',
  note:  '<path d="M7 3.5h8l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 6 19V5a1.5 1.5 0 0 1 1-1.5z"/><path d="M14.5 3.5V8H19"/><path d="M9 12h6M9 15.5h4"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  ship:  '<path d="M3 15h18l-2.6 4.2a2 2 0 0 1-1.7.8H7.3a2 2 0 0 1-1.7-.8z"/><path d="M12 3v12"/><path d="M12 4.5l6.5 8H12"/><path d="M12 7l-4.5 5.5H12"/>',
};
const icon = (name, cls='') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
