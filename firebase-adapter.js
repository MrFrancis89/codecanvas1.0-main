/* ========== FIREBASE ADAPTER ==========
   Integração com Firebase Firestore (versão estável e limpa)
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
      const filename = FileManager.getFilename() || 'arquivo';
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
        FileManager.setFilename(data.filename);
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
    try {
      const projectId = _el('fb-project-id')?.value;
      const apiKey = _el('fb-api-key')?.value;

      if (projectId && apiKey) {
        await connect();
      }
    } catch {
      console.warn('[Firebase] AutoConnect ignorado');
    }
  };

  return {
    initPanel,
    autoConnect
  };

})();
