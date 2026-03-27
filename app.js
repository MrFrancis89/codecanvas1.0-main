/* ========== APP (ORQUESTRADOR PRINCIPAL) ==========
   Inicializa todos os módulos, carrega dados persistidos,
   gerencia migração do localStorage e eventos da UI.
   ================================================= */

const App = (() => {

  // Helper seguro para eventos (evita quebra se elemento não existir)
  const safeAddEvent = (id, event, handler) => {
    const el = document.getElementById(id);
    if (!el) {
      console.warn(`[App] Elemento #${id} não encontrado — evento ignorado`);
      return;
    }
    el.addEventListener(event, handler);
  };

  const _initEvents = () => {
    // Toolbar
    safeAddEvent('btn-new', 'click', () => FileManager.newFile());
    safeAddEvent('btn-open', 'click', () => FileManager.importFile());
    safeAddEvent('btn-save', 'click', () => FileManager.exportFile());
    safeAddEvent('btn-undo', 'click', () => EditorManager.getCM()?.undo());
    safeAddEvent('btn-redo', 'click', () => EditorManager.getCM()?.redo());
    safeAddEvent('btn-find', 'click', () => FindReplaceManager.toggle());
    safeAddEvent('btn-theme', 'click', () => ThemeManager.toggle());
    safeAddEvent('filename-chip', 'click', () => FileManager.renameFile());

    // Firebase panel toggle
    safeAddEvent('btn-firebase', 'click', () => {
      const panel = document.getElementById('firebase-panel');
      const findPanel = document.getElementById('find-panel');

      if (!panel) {
        console.warn('[App] #firebase-panel não encontrado');
        return;
      }

      const isOpen = panel.classList.contains('open');
      panel.classList.toggle('open', !isOpen);

      if (!isOpen && findPanel) {
        findPanel.classList.remove('open');
      }
    });

    safeAddEvent('firebase-close', 'click', () => {
      const panel = document.getElementById('firebase-panel');
      if (panel) panel.classList.remove('open');
    });

    // Atalhos globais
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

    // Touch fixes (iOS)
    const toolbar = document.getElementById('toolbar');
    const statusbar = document.getElementById('statusbar');

    if (toolbar) {
      toolbar.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    }

    if (statusbar) {
      statusbar.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    }
  };

  const init = async () => {
    ThemeManager.init();
    ModalManager.init();

    const { IDB_KEYS } = AppConfig;

    let savedData = await StorageManager.getMany([
      IDB_KEYS.CONTENT,
      IDB_KEYS.FILENAME,
      IDB_KEYS.LANG,
    ]);

    // Migração localStorage → IndexedDB
    const legacyKeys = {
      content: 'cc_content',
      filename: 'cc_filename',
      lang: 'cc_lang'
    };

    const needsMigration =
      !savedData[IDB_KEYS.CONTENT] &&
      localStorage.getItem(legacyKeys.content);

    if (needsMigration) {
      console.info('[App] Migrando dados de localStorage → IndexedDB...');

      const migratedData = {
        [IDB_KEYS.CONTENT]: localStorage.getItem(legacyKeys.content),
        [IDB_KEYS.FILENAME]: localStorage.getItem(legacyKeys.filename),
        [IDB_KEYS.LANG]: localStorage.getItem(legacyKeys.lang),
      };

      try {
        await Promise.all([
          StorageManager.set(IDB_KEYS.CONTENT, migratedData[IDB_KEYS.CONTENT]),
          StorageManager.set(IDB_KEYS.FILENAME, migratedData[IDB_KEYS.FILENAME]),
          StorageManager.set(IDB_KEYS.LANG, migratedData[IDB_KEYS.LANG]),
        ]);

        Object.values(legacyKeys).forEach(k => localStorage.removeItem(k));

        savedData = migratedData;

        console.info('[App] Migração concluída com sucesso.');
      } catch (err) {
        console.warn('[App] Falha na migração — mantendo localStorage:', err);
        savedData = migratedData;
      }
    }

    LangManager.init();
    LangManager.setInitialMode(
      savedData[IDB_KEYS.LANG] || AppConfig.DEFAULT_LANG
    );

    FileManager.init(savedData[IDB_KEYS.FILENAME]);

    // Aguarda CodeMirror
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
          rej(new Error('CodeMirror não carregou (timeout).'));
        }
      }, 50);
    }).catch(err => {
      console.error('[App] Erro crítico:', err.message);

      const loading = document.getElementById('loading-screen');

      if (loading) {
        loading.innerHTML = `
          <div style="text-align:center;padding:32px;color:#f0f0f8;font-family:sans-serif">
            <div style="font-size:48px;margin-bottom:16px">⚠️</div>
            <div style="font-size:20px;font-weight:700;margin-bottom:8px">Falha ao carregar</div>
            <div style="font-size:14px;color:#a0a0c0;margin-bottom:24px">${err.message}</div>
            <button onclick="location.reload()" style="background:#6366f1;color:white;border:none;padding:12px 28px;border-radius:10px;font-size:15px;cursor:pointer">Tentar novamente</button>
          </div>
        `;
      }

      throw err;
    });

    EditorManager.init(savedData[IDB_KEYS.CONTENT]);

    FindReplaceManager.init();

    // Firebase seguro
    try {
      if (typeof FirebaseAdapter !== 'undefined') {
        FirebaseAdapter.initPanel();
      } else {
        console.warn('[App] FirebaseAdapter não carregado');
      }
    } catch (err) {
      console.warn('[App] Erro ao inicializar Firebase:', err);
    }

    PWAManager.init();

    _initEvents();

    FileManager.setDirty(false);

    // Auto connect Firebase seguro
    try {
      if (typeof FirebaseAdapter !== 'undefined' && FirebaseAdapter.autoConnect) {
        await FirebaseAdapter.autoConnect();
      }
    } catch (err) {
      console.warn('[App] Firebase autoConnect falhou:', err);
    }

    // Loading screen
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
  };

  return { init };

})();

// Inicialização
document.addEventListener('DOMContentLoaded', () => App.init());sition = 'opacity 0.4s ease';
      setTimeout(() => loading.remove(), 500);
      EditorManager.focus();
    }, 400);
  };

  return { init };
})();

// Inicialização após o DOM estar pronto
document.addEventListener('DOMContentLoaded', () => App.init());
