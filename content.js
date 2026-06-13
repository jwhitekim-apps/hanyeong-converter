(() => {
  "use strict";
  const VER = '3.0.0';
  const log = (...a) => console.log('%c[한영타-CS]', 'color:#39f', ...a);
  log('content script 로드됨 v' + VER + ' @ ' + location.host);

  /* ===== 한↔영 변환 로직 (검증 완료) ===== */
  const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  const JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
  const JONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  const JAMO_TO_ENG = {'ㄱ':'r','ㄲ':'R','ㄴ':'s','ㄷ':'e','ㄸ':'E','ㄹ':'f','ㅁ':'a','ㅂ':'q','ㅃ':'Q','ㅅ':'t','ㅆ':'T','ㅇ':'d','ㅈ':'w','ㅉ':'W','ㅊ':'c','ㅋ':'z','ㅌ':'x','ㅍ':'v','ㅎ':'g','ㅏ':'k','ㅐ':'o','ㅑ':'i','ㅒ':'O','ㅓ':'j','ㅔ':'p','ㅕ':'u','ㅖ':'P','ㅗ':'h','ㅛ':'y','ㅜ':'n','ㅠ':'b','ㅡ':'m','ㅣ':'l'};
  const COMPLEX = {'ㅘ':'ㅗㅏ','ㅙ':'ㅗㅐ','ㅚ':'ㅗㅣ','ㅝ':'ㅜㅓ','ㅞ':'ㅜㅔ','ㅟ':'ㅜㅣ','ㅢ':'ㅡㅣ','ㄳ':'ㄱㅅ','ㄵ':'ㄴㅈ','ㄶ':'ㄴㅎ','ㄺ':'ㄹㄱ','ㄻ':'ㄹㅁ','ㄼ':'ㄹㅂ','ㄽ':'ㄹㅅ','ㄾ':'ㄹㅌ','ㄿ':'ㄹㅍ','ㅀ':'ㄹㅎ','ㅄ':'ㅂㅅ'};
  const JUNG_COMBINE = {'ㅗㅏ':'ㅘ','ㅗㅐ':'ㅙ','ㅗㅣ':'ㅚ','ㅜㅓ':'ㅝ','ㅜㅔ':'ㅞ','ㅜㅣ':'ㅟ','ㅡㅣ':'ㅢ'};
  const JONG_COMBINE = {'ㄱㅅ':'ㄳ','ㄴㅈ':'ㄵ','ㄴㅎ':'ㄶ','ㄹㄱ':'ㄺ','ㄹㅁ':'ㄻ','ㄹㅂ':'ㄼ','ㄹㅅ':'ㄽ','ㄹㅌ':'ㄾ','ㄹㅍ':'ㄿ','ㄹㅎ':'ㅀ','ㅂㅅ':'ㅄ'};
  const JONG_SPLIT = {}; for (const k in JONG_COMBINE) JONG_SPLIT[JONG_COMBINE[k]] = [k[0], k[1]];
  const ENG_TO_JAMO = {}; for (const [j, e] of Object.entries(JAMO_TO_ENG)) ENG_TO_JAMO[e] = j;

  function jamoToEng(j) {
    if (COMPLEX[j]) { const p = COMPLEX[j].split(''); return (JAMO_TO_ENG[p[0]]||'') + (JAMO_TO_ENG[p[1]]||''); }
    return JAMO_TO_ENG[j] || j;
  }
  function engToKor(text) {
    let out = ''; let cho = null, jung = null, jong = null;
    const isV = c => JUNG.includes(c), validJong = c => JONG.includes(c) && c !== '';
    function commit() {
      if (cho !== null && jung !== null) {
        const ci = CHO.indexOf(cho), ji = JUNG.indexOf(jung), ki = jong ? JONG.indexOf(jong) : 0;
        out += String.fromCharCode(0xAC00 + (ci*21 + ji)*28 + ki);
      } else { if (cho) out += cho; if (jung) out += jung; if (jong) out += jong; }
      cho = jung = jong = null;
    }
    for (const rc of text) {
      const j = ENG_TO_JAMO[rc];
      if (j === undefined) { commit(); out += rc; continue; }
      if (isV(j)) {
        if (jung === null) jung = j;
        else if (jong === null) { const c = JUNG_COMBINE[jung+j]; if (c) jung = c; else { commit(); jung = j; } }
        else { const sp = JONG_SPLIT[jong]; if (sp) { jong = sp[0]; commit(); cho = sp[1]; jung = j; } else { const mv = jong; jong = null; commit(); cho = mv; jung = j; } }
      } else {
        if (cho === null && jung === null) cho = j;
        else if (jung === null) { commit(); cho = j; }
        else if (jong === null) { if (cho !== null && validJong(j)) jong = j; else { commit(); cho = j; } }
        else { const c = JONG_COMBINE[jong+j]; if (c) jong = c; else { commit(); cho = j; } }
      }
    }
    commit(); return out;
  }
  function korToEng(text) {
    let out = '';
    for (const ch of text) {
      const code = ch.charCodeAt(0);
      if (code >= 0xAC00 && code <= 0xD7A3) {
        const s = code - 0xAC00, ci = Math.floor(s/(21*28)), ji = Math.floor((s%(21*28))/28), ki = s%28;
        out += jamoToEng(CHO[ci]) + jamoToEng(JUNG[ji]) + (ki ? jamoToEng(JONG[ki]) : '');
      } else if (JAMO_TO_ENG[ch] || COMPLEX[ch]) out += jamoToEng(ch);
      else out += ch;
    }
    return out;
  }
  function convertAuto(text) {
    return /[\u3131-\u318E\uAC00-\uD7A3]/.test(text) ? korToEng(text) : engToKor(text);
  }

  /* ===== 삽입 ===== */
  let selfInserting = false; // 내가 일으킨 입력은 차단하지 않기 위한 플래그

  function insertViaExecCommand(text) {
    selfInserting = true;
    let ok = false;
    try { ok = document.execCommand('insertText', false, text); } catch (e) { log('execCommand 예외', e); }
    selfInserting = false;
    return ok;
  }

  function setNativeValue(el, value) {
    const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    const d = Object.getOwnPropertyDescriptor(proto, 'value');
    if (d && d.set) d.set.call(el, value); else el.value = value;
  }
  function isEditableInput(el) {
    if (!el) return false;
    if (el.tagName === 'TEXTAREA') return true;
    if (el.tagName === 'INPUT') return /^(text|search|url|email|tel|password|number|)$/i.test(el.type || 'text');
    return false;
  }
  function isInEditableContext(sel) {
    let n = sel.anchorNode; n = (n && n.nodeType === 3) ? n.parentElement : n;
    return !!(n && n.closest && n.closest('[contenteditable=""],[contenteditable="true"]'));
  }
  async function copyToClipboard(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) { log('클립보드 실패', e); return false; }
  }

  /* ===== 진입점 ===== */
  async function run(source) {
    log('run() 시작 — 트리거:', source);
    const active = document.activeElement;
    const sel = window.getSelection();
    const selText = sel ? sel.toString() : '';
    log('activeElement:', active && active.tagName, active && (active.type || ''), '| 선택:', JSON.stringify(selText.slice(0, 40)));

    // 1) input / textarea
    if (isEditableInput(active) && active.selectionStart !== active.selectionEnd) {
      const s = active.selectionStart, e = active.selectionEnd;
      const original = active.value.slice(s, e);
      const converted = convertAuto(original);
      log('input 경로:', original, '→', converted);
      active.focus();
      if (insertViaExecCommand(converted)) { toast(original + ' → ' + converted); return; }
      // fallback (React 호환)
      setNativeValue(active, active.value.slice(0, s) + converted + active.value.slice(e));
      active.dispatchEvent(new Event('input', { bubbles: true }));
      try { active.setSelectionRange(s, s + converted.length); } catch (_) {}
      toast(original + ' → ' + converted); return;
    }

    // 2) contenteditable / 일반 선택
    if (sel && sel.rangeCount && !sel.isCollapsed && selText) {
      const converted = convertAuto(selText);
      if (isInEditableContext(sel)) {
        log('contenteditable 경로:', selText, '→', converted);
        if (insertViaExecCommand(converted)) { toast(selText + ' → ' + converted); return; }
        // fallback: range 직접 교체
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const node = document.createTextNode(converted);
        range.insertNode(node);
        toast(selText + ' → ' + converted); return;
      }
      // 편집 불가 → 클립보드
      log('편집불가 경로 → 클립보드:', selText, '→', converted);
      if (await copyToClipboard(converted)) toast('변환 결과 복사됨: ' + converted);
      else toast('복사 실패', false);
      return;
    }

    log('선택된 텍스트 없음');
    toast('먼저 텍스트를 드래그하세요', false);
  }

  /* ===== 토스트 ===== */
  function toast(msg, ok = true) {
    const t = document.createElement('div');
    t.textContent = msg;
    Object.assign(t.style, { position: 'fixed', zIndex: 2147483647, left: '50%', bottom: '40px',
      transform: 'translateX(-50%)', padding: '10px 16px', borderRadius: '10px',
      font: '13px/1.4 -apple-system, system-ui, sans-serif', color: '#fff',
      background: ok ? 'rgba(20,20,22,.92)' : 'rgba(150,40,40,.92)',
      boxShadow: '0 4px 16px rgba(0,0,0,.25)', pointerEvents: 'none', opacity: '0', transition: 'opacity .15s' });
    document.documentElement.appendChild(t);
    requestAnimationFrame(() => { t.style.opacity = '1'; });
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 200); }, 1500);
  }

  /* ===== 트리거: 우클릭 메시지 ===== */
  chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
    log('메시지 수신:', req && req.type);
    if (req && req.type === 'CONVERT_TYPO') { run('contextmenu'); sendResponse({ ok: true }); }
    return true;
  });

  /* ===== 트리거: 단축키 Option+Shift+Z (페이지 직접 감지) ===== */
  let suppress = false;

  window.addEventListener('keydown', (e) => {
    const isMac = navigator.platform.toUpperCase().includes('MAC');

    const isShortcut = isMac
      ? e.metaKey && e.shiftKey && !e.ctrlKey && !e.altKey && e.code === 'Digit0'
      : e.ctrlKey && e.shiftKey && !e.metaKey && !e.altKey && e.code === 'Digit0';

    if (isShortcut) {
      e.preventDefault();
      e.stopPropagation();

      suppress = true;
      run('shortcut');

      setTimeout(() => {
        suppress = false;
      }, 100);
    }
  }, true);

  window.addEventListener('beforeinput', (e) => {
    if (suppress && !selfInserting) {
      e.preventDefault();
      e.stopPropagation();
      suppress = false;
    }
  }, true);

  window.addEventListener('keypress', (e) => {
    if (suppress && !selfInserting) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  log('초기화 완료 — 우클릭 메뉴 또는 Ctrl+Shift+0 / Command+Shift+0 사용');
})();
