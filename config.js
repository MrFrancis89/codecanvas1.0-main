/* ========== CONFIGURAÇÕES GLOBAIS ==========
   ⚠️  SEGURANÇA — LEIA ANTES DE USAR:
   ─────────────────────────────────────────
   NUNCA coloque credenciais reais neste arquivo se o código for
   versionado (Git, GitHub, etc.). Qualquer chave aqui fica
   exposta no histórico de commits para sempre.

   Opções seguras:
     1. Deixe os campos vazios (padrão abaixo) e insira as
        credenciais apenas pelo painel Firebase em tempo de execução.
     2. Use um arquivo .env + variáveis de build (Vite, Webpack…)
        e adicione config.js ao .gitignore.
     3. Use Firebase App Check + regras Firestore restritivas para
        limitar o uso de chaves mesmo que sejam expostas.
   ─────────────────────────────────────────

   CORREÇÃO (Problema 2):
     - EXT_TO_MODE: .ts/.tsx/.jsx agora mapeiam para 'typescript'
       (antes mapeavam para 'javascript', ignorando o modo TypeScript).
       .json agora mapeia para 'json' (antes 'javascript').
     - MODE_LABELS: adicionados 'json' e 'typescript' para que a
       barra de status exiba o nome correto em vez de undefined.
*/

// Deixe VAZIO em produção — use o painel Firebase para conectar.
const FIREBASE_CONFIG = {
  projectId: '',      // ex: "meu-app-12345"
  apiKey: '',         // ex: "AIzaSyD..." — NUNCA commite este valor
  defaultDocName: ''  // opcional: nome padrão para os documentos
};

// Configuração principal da aplicação
const AppConfig = Object.freeze({
  APP_NAME: 'CodeCanvas',
  VERSION: '1.1.0',
  DEFAULT_FILENAME: 'sem_titulo.js',
  DEFAULT_LANG: 'javascript',
  INDENT_SIZE: 2,

  // Chaves do localStorage (tema — apiKey nunca é persistida)
  LS_KEYS: {
    THEME: 'cc_theme',
    FB_PROJECT: 'cc_firebase_project', // só projectId, não a apiKey
  },

  // Chaves do IndexedDB (conteúdo, nome do arquivo, linguagem)
  IDB_KEYS: {
    CONTENT:  'cc_content',
    FILENAME: 'cc_filename',
    LANG:     'cc_lang',
  },

  // Mapeamento extensão → valor do <select> de linguagem
  // CORREÇÃO: ts/tsx/jsx → 'typescript' | json → 'json'
  EXT_TO_MODE: {
    js:   'javascript', mjs: 'javascript', cjs: 'javascript',
    ts:   'typescript', tsx: 'typescript', jsx: 'typescript',
    html: 'htmlmixed',  htm: 'htmlmixed',
    css:  'css',        scss: 'css',       less: 'css',
    xml:  'xml',        svg: 'xml',
    py:   'python',
    md:   'markdown',   mdx: 'markdown',
    sql:  'sql',
    sh:   'shell',      bash: 'shell',     zsh: 'shell',
    c:    'clike',      cpp: 'clike',      h: 'clike',
    java: 'clike',      cs: 'clike',
    php:  'php',
    rb:   'ruby',
    rs:   'rust',
    go:   'go',
    yml:  'yaml',       yaml: 'yaml',
    json: 'json',
    dart: 'clike',
  },

  // Mapeamento valor do <select> → nome amigável para a status bar
  // CORREÇÃO: adicionados 'json' e 'typescript'
  MODE_LABELS: {
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    htmlmixed:  'HTML',
    css:        'CSS',
    python:     'Python',
    xml:        'XML/SVG',
    markdown:   'Markdown',
    sql:        'SQL',
    shell:      'Shell',
    clike:      'C/C++/Java',
    php:        'PHP',
    ruby:       'Ruby',
    rust:       'Rust',
    go:         'Go',
    yaml:       'YAML',
    json:       'JSON',
  },
});
