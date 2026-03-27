/* ========== APP (ORQUESTRADOR PRINCIPAL) ========== */

const App = (() => {

  const safeAddEvent = (id, event, handler) => {
    const el = document.getElementById(id);
    if (!el) {
      console.warn(`[App] Elemento #${id} não encontrado`);
      return;
    }
    el.addEventListener(event, handler);
  };

  const _initEvents = () => {
    safeAddEvent('btn-new', 'click', () => FileManager.newFile());
    safeAddEvent('btn-open', 'click', () => FileManager.importFile());
    safeAddEvent('btn-save', 'click', () => FileManager.exportFile());
    safeAddEvent('btn-undo', 'click', () => EditorManager.getCM()?.undo());
    safeAddEvent('btn-redo', 'click', () => EditorManager.getCM()?.redo());
    safeAddEvent('btn-find', 'click', () => FindReplaceManager.toggle());
    safeAddEvent('btn-theme', 'click', () => ThemeManager.toggle());
    safeAddEvent('filename-chip', 'click', () => FileManager.renameFile());

    safeAddEvent('btn-firebase', 'click', () => {
      const panel = document.getElementById('firebase-panel');
      const findPanel = document.getElementById('find-panel');

      if (!panel) return;

      const isOpen = panel.classList.contains('open');
      panel.classList.toggle('open', !isOpen);

      if (!isOpen && findPanel) {
        findPanel.classList.remove('open');
      }
    });

    safeAddEvent('firebase-close', 'click', () => {
      document.getElementById('firebase-panel')?.classList.remove('open');
    });

    document.addEventListener('keydown', (e) => {
      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key === 's') {
        e.preventDefault();
        FileManager.exportFile();
      }

      if (ctrl && e.key === 'o') {
        e.preventDefault();
        FileManager.importFile();
      }

      if (ctrl && e.key === 'h') {
        e.preventDefault();
        FindReplaceManager.toggle();
      }
    });
  };

  const init = async () => {
    try {
      ThemeManager.init();
      ModalManager.init();

      const { IDB_KEYS } = AppConfig;

      const savedData = await StorageManager.getMany([
        IDB_KEYS.CONTENT,
        IDB_KEYS.FILENAME,
        IDB_KEYS.LANG,
      ]);

      LangManager.init();
      LangManager.setInitialMode(
        savedData[IDB_KEYS.LANG] || AppConfig.DEFAULT_LANG
      );

      FileManager.init(savedData[IDB_KEYS.FILENAME]);

      await new Promise((res, rej) => {
        if (window.CodeMirror) return res();

        let elapsed = 0;
        const check = setInterval(() => {
          elapsed += 50;

          if (window.CodeMirror) {
            clearInterval(check);
            res();
          } else if (elapsed >= 10000) {
            clearInterval(check);
            rej(new Error('CodeMirror não carregou'));
          }
        }, 50);
      });

      EditorManager.init(savedData[IDB_KEYS.CONTENT]);
      FindReplaceManager.init();

      if (typeof FirebaseAdapter !== 'undefined') {
        FirebaseAdapter.initPanel();
      }

      _initEvents();

      FileManager.setDirty(false);

      const loading = document.getElementById('loading-screen');
      const appEl = document.getElementById('app');

      setTimeout(() => {
        if (loading) {
          loading.classList.add('fade');
          setTimeout(() => loading.remove(), 500);
        }

        if (appEl) {
          appEl.style.opacity = '1';
          appEl.style.transition = 'opacity 0.4s ease';
        }

        EditorManager.focus();
      }, 400);

    } catch (err) {
      console.error('[App] ERRO CRÍTICO:', err);

      const loading = document.getElementById('loading-screen');
      if (loading) {
        loading.innerHTML = `
          <div style="text-align:center;padding:32px;color:#fff">
            <h2>Erro ao carregar</h2>
            <p>${err.message}</p>
            <button onclick="location.reload()">Recarregar</button>
          </div>
        `;
      }
    }
  };

  return { init };

})();

document.addEventListener('DOMContentLoaded', () => App.init());
