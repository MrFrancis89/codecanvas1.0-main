/* ========== FIREBASE ADAPTER ==========
   Integração real com Firebase Firestore
   ===================================== */

const FirebaseAdapter = (() => {

  let _app = null;
  let _db = null;
  let _connected = false;

  const _el = (id) => document.getElementById(id);

  const _setStatus = (connected) => {
    _connected = connected;

    const dot = _el('fb-dot');
    const text = _el('fb-status-text');
    const btnSave = _el('fb-save-cloud');
    const btnLoad = _el('fb-load-cloud');

    if (dot) {
      dot.classList.toggle('connected', connected);
      dot.classList.toggle('disconnected', !connected);
    }

    if (text) {
      text.textContent = connected ? 'Conectado' : 'Não conectado';
    }

    if (btnSave) btnSave.disabled = !connected;
    if (btnLoad) btnLoad.disabled = !connected;
  };

  const _getConfig = () => {
    const projectId = _el('fb-project-id')?.value.trim();
    const apiKey = _el('fb-api-key')?.value.trim();

    if (!projectId || !apiKey) {
      throw new Error('Preencha Project ID e API Key');
    }

    return {
      apiKey,
      authDomain: `${projectId}.firebaseapp.com`,
      projectId
    };
  };

  const connect = async () => {
    try {
      if (typeof firebase === 'undefined') {
        throw new Error('Firebase SDK não carregado');
      }

      const config = _getConfig();

      if (!_app) {
        _app = firebase.initializeApp(config);
        _db = firebase.firestore();
      }

      _setStatus(true);
      ToastManager.show('Conectado ao Firebase 🚀');

    } catch (err) {
      console.error('[Firebase]', err);
      ToastManager.show('Erro ao conectar Firebase ❌');
      _setStatus(false);
    }
  };

  const saveToCloud = async () => {
    if (!_connected || !_db) return;

    try {
      const content = EditorManager.getValue();
      const filename = FileManager.getFilename?.() || 'arquivo';
      const docName = _el('fb-doc-name')?.value || 'default';

      await _db.collection('codecanvas').doc(docName).set({
        content,
        filename,
        updatedAt: new Date().toISOString()
      });

      ToastManager.show('Salvo na nuvem ☁️');

    } catch (err) {
      console.error('[Firebase]', err);
      ToastManager.show('Erro ao salvar ❌');
    }
  };

  const loadFromCloud = async () => {
    if (!_connected || !_db) return;

    try {
      const docName = _el('fb-doc-name')?.value || 'default';

      const doc = await _db.collection('codecanvas').doc(docName).get();

      if (!doc.exists) {
        ToastManager.show('Arquivo não encontrado ☁️');
        return;
      }

      const data = doc.data();

      if (data.content) {
        EditorManager.setValue(data.content);
      }

      if (data.filename) {
        FileManager.setFilename?.(data.filename);
      }

      ToastManager.show('Carregado da nuvem 📥');

    } catch (err) {
      console.error('[Firebase]', err);
      ToastManager.show('Erro ao carregar ❌');
    }
  };

  const initPanel = () => {
    const btnConnect = _el('fb-connect');
    const btnSave = _el('fb-save-cloud');
    const btnLoad = _el('fb-load-cloud');

    if (btnConnect) btnConnect.addEventListener('click', connect);
    if (btnSave) btnSave.addEventListener('click', saveToCloud);
    if (btnLoad) btnLoad.addEventListener('click', loadFromCloud);

    _setStatus(false);
  };

  const autoConnect = async () => {
    // opcional: conectar automaticamente se config estiver preenchido
    try {
      const projectId = _el('fb-project-id')?.value;
      const apiKey = _el('fb-api-key')?.value;

      if (projectId && apiKey) {
        await connect();
      }
    } catch (e) {
      console.warn('[Firebase] AutoConnect ignorado');
    }
  };

  return {
    initPanel,
    autoConnect
  };

})();se.initializeApp({
        apiKey:     config.apiKey,
        authDomain: `${config.projectId}.firebaseapp.com`,
        projectId:  config.projectId,
      });

      _db = firebase.firestore(app);

      // Teste de conectividade real: lê uma coleção para confirmar acesso
      await _db.collection('projects').limit(1).get();

      _isConnected = true;
      _setStatus('connected', `Conectado: ${config.projectId}`);

      // ✅ Persiste apenas o projectId — apiKey fica só na memória
      localStorage.setItem(AppConfig.LS_KEYS.FB_PROJECT, config.projectId);

      // Limpa o campo de apiKey da UI após conexão bem-sucedida
      const apiKeyInput = document.getElementById('fb-api-key');
      if (apiKeyInput) apiKeyInput.value = '';

      ToastManager.show('Firebase conectado!', 'success');

    } catch (err) {
      _isConnected = false;
      _db = null;

      const { label, type } = _classifyError(err);
      console.error(`[FirebaseAdapter] Erro de conexão (${type}):`, err);
      _setStatus('error', `Erro: ${label}`);
      ToastManager.show(`Falha ao conectar: ${label}`, 'error');
    }
  };

  /** Salva o projeto no Firestore. */
  const saveProject = async (docName, content, filename, lang) => {
    if (!_db) {
      ToastManager.show('Conecte ao Firebase primeiro', 'warning');
      return false;
    }
    try {
      await _db.collection('projects').doc(docName).set({
        content,
        filename,
        lang,
        updatedAt:  new Date().toISOString(),
        appVersion: AppConfig.VERSION,
      });
      ToastManager.show(`"${docName}" salvo na nuvem`, 'success');
      FileManager.setDirty(false);
      return true;
    } catch (err) {
      const { label } = _classifyError(err);
      console.error('[FirebaseAdapter] Erro ao salvar:', err);
      ToastManager.show(`Erro ao salvar: ${label}`, 'error');
      return false;
    }
  };

  /** Carrega o projeto do Firestore. */
  const loadProject = async (docName) => {
    if (!_db) {
      ToastManager.show('Conecte ao Firebase primeiro', 'warning');
      return null;
    }
    try {
      const snap = await _db.collection('projects').doc(docName).get();
      if (!snap.exists) {
        ToastManager.show('Projeto não encontrado', 'warning');
        return null;
      }
      ToastManager.show(`"${docName}" carregado da nuvem`, 'success');
      return snap.data();
    } catch (err) {
      const { label } = _classifyError(err);
      console.error('[FirebaseAdapter] Erro ao carregar:', err);
      ToastManager.show(`Erro ao carregar: ${label}`, 'error');
      return null;
    }
  };

  const isConnected = () => _isConnected;

  /** Inicializa os listeners do painel de Firebase na UI. */
  const initPanel = () => {
    // ✅ Só pré-preenche projectId — apiKey nunca é recuperada do storage
    const savedProjectId = localStorage.getItem(AppConfig.LS_KEYS.FB_PROJECT);
    if (savedProjectId) {
      const projectInput = document.getElementById('fb-project-id');
      if (projectInput) projectInput.value = savedProjectId;
    }

    document.getElementById('fb-connect').addEventListener('click', async () => {
      const projectId = document.getElementById('fb-project-id').value.trim();
      const apiKey    = document.getElementById('fb-api-key').value.trim();
      if (!projectId || !apiKey) {
        ToastManager.show('Preencha Project ID e API Key', 'warning');
        return;
      }
      await connect({ projectId, apiKey });
    });

    document.getElementById('fb-save-cloud').addEventListener('click', async () => {
      let docName = document.getElementById('fb-doc-name').value.trim();
      if (!docName) docName = FileManager.getFilename();
      if (!docName) {
        ToastManager.show('Defina um nome para o projeto', 'warning');
        return;
      }
      await saveProject(
        docName,
        EditorManager.getValue(),
        FileManager.getFilename(),
        LangManager.current()
      );
    });

    document.getElementById('fb-load-cloud').addEventListener('click', async () => {
      const docName = document.getElementById('fb-doc-name').value.trim();
      if (!docName) {
        ToastManager.show('Digite o nome do projeto', 'warning');
        return;
      }

      const confirmed = await ModalManager.confirm(
        'Carregar da nuvem?',
        'O conteúdo atual do editor será substituído pelo projeto da nuvem.'
      );
      if (!confirmed) return;

      const data = await loadProject(docName);
      if (data) {
        EditorManager.setValue(data.content || '');
        if (data.filename) FileManager.setFilename(data.filename);
        if (data.lang)     LangManager.setMode(data.lang);
        FileManager.setDirty(false);
      }
    });
  };

  /**
   * Tenta conexão automática se FIREBASE_CONFIG tiver AMBOS os campos preenchidos.
   * ✅ Valida apiKey antes de tentar — evita erro silencioso com projectId preenchido
   *    mas apiKey vazia.
   */
  const autoConnect = async () => {
    const { projectId, apiKey, defaultDocName } = FIREBASE_CONFIG;

    // ✅ Ambos são obrigatórios para uma conexão válida
    if (!projectId || !apiKey) return;

    const projectInput = document.getElementById('fb-project-id');
    if (projectInput) projectInput.value = projectId;

    const docNameInput = document.getElementById('fb-doc-name');
    if (docNameInput && defaultDocName) docNameInput.value = defaultDocName;

    await connect({ projectId, apiKey });
  };

  return { connect, saveProject, loadProject, isConnected, initPanel, autoConnect };
})();
