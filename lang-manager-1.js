/* ========== LANG MANAGER ==========
   Gerencia a linguagem/modo do CodeMirror e o select de linguagem.

   CORREÇÃO Problema 2:
     - _resolveCMMode() converte o valor do select para o mode spec
       correto do CodeMirror 5, pois 'json' e 'typescript' não são
       modos autônomos — usam o modo 'javascript' com flags.

   CORREÇÃO Problema 3:
     - currentResolved() exposto publicamente para que editor-manager
       possa obter o mode spec correto sem duplicar a lógica de
       resolução — evita regressão no _forceHighlight.
     - Null-guards adicionados em setMode, setInitialMode e init.
   ================================== */

const LangManager = (() => {
  let _current = AppConfig.DEFAULT_LANG;

  // Converte o valor do <select> no mode spec aceito pelo CodeMirror.
  // 'json'       → { name: 'javascript', json: true }
  // 'typescript' → { name: 'javascript', typescript: true }
  // qualquer outro → string direta (ex: 'python', 'css')
  const _resolveCMMode = (mode) => {
    if (mode === 'json')       return { name: 'javascript', json: true };
    if (mode === 'typescript') return { name: 'javascript', typescript: true };
    return mode;
  };

  const setMode = (mode) => {
    _current = mode;
    if (window._cmEditor) {
      window._cmEditor.setOption('mode', _resolveCMMode(mode));
      // Força o re-render do highlighting ao trocar de linguagem
      setTimeout(() => window._cmEditor && window._cmEditor.refresh(), 50);
    }
    const langSelect = document.getElementById('lang-select');
    const statusLang = document.getElementById('status-lang');
    if (langSelect) langSelect.value = mode;
    if (statusLang) statusLang.textContent = AppConfig.MODE_LABELS[mode] || mode;
    StorageManager.set(AppConfig.IDB_KEYS.LANG, mode);
  };

  // Retorna o valor do <select> (string interna, ex: 'typescript')
  const current = () => _current;

  // Retorna o mode spec resolvido para uso direto no CodeMirror
  // (ex: { name: 'javascript', typescript: true })
  const currentResolved = () => _resolveCMMode(_current);

  const setInitialMode = (mode) => {
    if (!mode) return;
    _current = mode;
    const langSelect = document.getElementById('lang-select');
    const statusLang = document.getElementById('status-lang');
    if (langSelect) langSelect.value = mode;
    if (statusLang) statusLang.textContent = AppConfig.MODE_LABELS[mode] || mode;
  };

  const init = () => {
    const langSelect = document.getElementById('lang-select');
    if (!langSelect) {
      console.error('[LangManager] #lang-select não encontrado no DOM');
      return;
    }
    langSelect.addEventListener('change', (e) => {
      setMode(e.target.value);
    });
  };

  return { init, setMode, setInitialMode, current, currentResolved };
})();
