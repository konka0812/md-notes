'use strict';

/* =========================================================================
   纸墨 · 离线 Markdown 笔记 —— 应用逻辑
   ========================================================================= */

/* ---------------- 图标（SVG / Lucide 风格，非 emoji） ---------------- */
const ICONS = {
  plus: '<path d="M12 5v14M5 12h14"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
  more: '<circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5"/><path d="M3 12a9 3 0 0 0 18 0"/>',
  'file-text': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  bold: '<path d="M6 4h8a4 4 0 0 1 0 8H6z"/><path d="M6 12h9a4 4 0 0 1 0 8H6z"/>',
  italic: '<line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/>',
  'heading-1': '<path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="m17 12 3-2v8"/>',
  'heading-2': '<path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1"/>',
  'heading-3': '<path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M17.5 10.5c1.7-1 3.5 0 3.5 1.5a2 2 0 0 1-2 2"/><path d="M17 17.5c2 1.5 4 .3 4-1.5a2 2 0 0 0-2-2"/>',
  quote: '<path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>',
  list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
  'list-ordered': '<line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>',
  'check-square': '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
  code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
  'code-block': '<path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  minus: '<path d="M5 12h14"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  table: '<path d="M12 3v18"/><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/>',
  pin: '<path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>',
  restore: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  tag: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/>',
  palette: '<path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/><circle cx="7.5" cy="11.5" r=".5" fill="currentColor"/><circle cx="10.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="14.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>'
};

function icon(name, size = 20) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

/* ---------------- DOM ---------------- */
const $ = (s) => document.querySelector(s);
const listView = $('#list-view');
const editorView = $('#editor-view');
const noteList = $('#note-list');
const emptyState = $('#empty-state');
const searchInput = $('#search');
const titleInput = $('#note-title');
const editor = $('#editor');
const preview = $('#preview');
const toolbar = $('#toolbar');
const saveState = $('#save-state');
const wordCount = $('#word-count');
const btnEditMode = $('#btn-edit-mode');
const btnPreviewMode = $('#btn-preview-mode');
const btnTheme = $('#btn-theme');
const sheet = $('#sheet');
const sheetBackdrop = $('#sheet-backdrop');
const sheetTitle = $('#sheet-title');
const sheetItems = $('#sheet-items');
const sheetCancel = $('#sheet-cancel');
const dialog = $('#dialog');
const dialogBackdrop = $('#dialog-backdrop');
const dialogMessage = $('#dialog-message');
const dialogCancel = $('#dialog-cancel');
const dialogConfirm = $('#dialog-confirm');
const toastEl = $('#toast');
const fileMd = $('#file-md');
const fileJson = $('#file-json');
const fileImage = $('#file-image');
const fileSync = $('#file-sync');
const sourceBar = $('#source-bar');
const sourceNameEl = $('#source-name');
const sourceStateEl = $('#source-state');
const btnSourceSync = $('#btn-source-sync');
const btnSourceWrite = $('#btn-source-write');
const filterBar = $('#filter-bar');
const printArea = $('#print-area');
const quickbar = $('#quickbar');
const appNameEl = $('#app-name');
const appSubEl = $('#app-sub');
const btnTrashBack = $('#btn-trash-back');
const APP_VERSION = 'v13';

/* ---------------- 状态 ---------------- */
let db = null;
let notes = [];
let currentId = null;
let currentCreatedAt = null;
let saveTimer = null;
let isPreview = false;
let isTrashMode = false;
let currentPinned = false;
let currentTags = [];
let currentTag = null;      // 当前按标签筛选
const isTouch = window.matchMedia('(pointer: coarse)').matches;

/* 能力检测：仅 Chromium 支持文件句柄 */
const canUseFileHandles = typeof window.showOpenFilePicker === 'function' &&
                          typeof window.showSaveFilePicker === 'function';
let currentSource = null;      // 当前笔记的来源记录
let pendingSyncSource = null;  // 等待用户选文件的同步目标

/* 安装完成提示（通过浏览器菜单安装后触发） */
window.addEventListener('appinstalled', () => { toast('已安装到主屏幕 ✓'); });

/* ---------------- IndexedDB ---------------- */
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('zhimo-notes', 3);
    req.onupgradeneeded = () => {
      const dbx = req.result;
      if (!dbx.objectStoreNames.contains('notes')) {
        const store = dbx.createObjectStore('notes', { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt');
      }
      if (!dbx.objectStoreNames.contains('images')) {
        dbx.createObjectStore('images', { keyPath: 'id' });
      }
      if (!dbx.objectStoreNames.contains('sources')) {
        dbx.createObjectStore('sources', { keyPath: 'noteId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
function getAllNotes() {
  return new Promise((resolve, reject) => {
    const req = db.transaction('notes', 'readonly').objectStore('notes').getAll();
    req.onsuccess = () => resolve((req.result || []).sort((a, b) => b.updatedAt - a.updatedAt));
    req.onerror = () => reject(req.error);
  });
}
function getNote(id) {
  return new Promise((resolve, reject) => {
    const req = db.transaction('notes', 'readonly').objectStore('notes').get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
function putNote(note) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('notes', 'readwrite');
    tx.objectStore('notes').put(note);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
function deleteNote(id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('notes', 'readwrite');
    tx.objectStore('notes').delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
function clearAllNotes() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('notes', 'readwrite');
    tx.objectStore('notes').clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* ---------------- 来源关联（导入的本地文件） ---------------- */
function getSource(noteId) {
  return new Promise((resolve, reject) => {
    const req = db.transaction('sources', 'readonly').objectStore('sources').get(noteId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}
function getAllSources() {
  return new Promise((resolve, reject) => {
    const req = db.transaction('sources', 'readonly').objectStore('sources').getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
function putSource(src) {
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction('sources', 'readwrite');
      tx.objectStore('sources').put(src);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new DOMException('事务被中止', 'AbortError'));
    } catch (e) {
      reject(e); // 句柄不可结构化克隆时会同步抛错
    }
  });
}
/* 句柄不可结构化克隆时（DataCloneError）降级为不含句柄保存。
   返回 true 表示句柄已随记录保存，false 表示已降级为无句柄。 */
async function saveSource(src) {
  try {
    await putSource(src);
    return true;
  } catch (e) {
    if (src && src.handle && e && e.name === 'DataCloneError') {
      const copy = Object.assign({}, src);
      delete copy.handle;
      await putSource(copy);
      return false;
    }
    throw e;
  }
}
function deleteSource(noteId) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sources', 'readwrite');
    tx.objectStore('sources').delete(noteId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new DOMException('事务被中止', 'AbortError'));
  });
}
function clearAllSources() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sources', 'readwrite');
    tx.objectStore('sources').clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new DOMException('事务被中止', 'AbortError'));
  });
}
/* 把文件当前状态记为已同步基线（写入成功后才更新传入对象） */
async function markFileAsBaseline(src, file, content) {
  const next = Object.assign({}, src, {
    lastModified: file.lastModified,
    size: file.size,
    contentHash: hashString(content),
    syncedAt: Date.now()
  });
  await saveSource(next);
  Object.assign(src, next);
  return src;
}
/* 备份用：剔除不可序列化的 handle */
async function sourcesForBackup() {
  const all = await getAllSources();
  return all.map((s) => ({
    noteId: s.noteId, name: s.name, lastModified: s.lastModified,
    size: s.size, contentHash: s.contentHash, syncedAt: s.syncedAt
  }));
}

/* 活跃笔记：未删除，置顶优先、再按更新时间倒序 */
async function getActiveNotes() {
  const all = await getAllNotes();
  return all
    .filter((n) => !n.deletedAt)
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.updatedAt - a.updatedAt);
}
/* 回收站：已删除，按删除时间倒序 */
async function getTrashedNotes() {
  const all = await getAllNotes();
  return all.filter((n) => n.deletedAt).sort((a, b) => b.deletedAt - a.deletedAt);
}
/* 软删除（移入回收站） */
async function softDelete(id) {
  const n = await getNote(id);
  if (n) { n.deletedAt = Date.now(); await putNote(n); }
}
/* 从回收站恢复 */
async function restoreNote(id) {
  const n = await getNote(id);
  if (n) { n.deletedAt = null; n.updatedAt = Date.now(); await putNote(n); }
}
/* 清空回收站（彻底删除） */
async function emptyTrash() {
  const all = await getAllNotes();
  const tx = db.transaction('notes', 'readwrite');
  const store = tx.objectStore('notes');
  all.filter((n) => n.deletedAt).forEach((n) => store.delete(n.id));
  return new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
}
/* 自动清理：删除超过 30 天的笔记彻底清除 */
async function purgeOldTrash() {
  const all = await getAllNotes();
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const tx = db.transaction('notes', 'readwrite');
  const store = tx.objectStore('notes');
  all.filter((n) => n.deletedAt && n.deletedAt < cutoff).forEach((n) => store.delete(n.id));
  return new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
}

/* ---------------- 图片存储（正文只存 zhimo://id 短标记，图片单独存） ---------------- */
const imageCache = {};
function putImage(id, dataUrl) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('images', 'readwrite');
    tx.objectStore('images').put({ id, dataUrl });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
function getAllImages() {
  return new Promise((resolve, reject) => {
    const req = db.transaction('images', 'readonly').objectStore('images').getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
function clearAllImages() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('images', 'readwrite');
    tx.objectStore('images').clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function loadImageCache() {
  const imgs = await getAllImages();
  imgs.forEach((img) => { imageCache[img.id] = img.dataUrl; });
}

/* ---------------- 工具 ---------------- */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
/* 轻量字符串哈希（FNV-1a），用于判断文件内容是否变化 */
function hashString(str) {
  let h = 2166136261;
  const s = String(str || '');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}
function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
function sanitizeFilename(title) {
  const t = (title || '').replace(/[\\/:*?"<>|]/g, ' ').trim();
  return t || 'untitled';
}
function relativeTime(ts) {
  const diff = Date.now() - ts;
  const m = 60e3, h = 60 * m, d = 24 * h;
  if (diff < m) return '刚刚';
  if (diff < h) return Math.floor(diff / m) + ' 分钟前';
  if (diff < d) return Math.floor(diff / h) + ' 小时前';
  if (diff < 30 * d) return Math.floor(diff / d) + ' 天前';
  return new Date(ts).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' });
}
function countWords(text) {
  const cjk = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || []).length;
  const latin = (text.replace(/[\u4e00-\u9fff\u3400-\u4dbf]/g, ' ').match(/[A-Za-z0-9]+/g) || []).length;
  return cjk + latin;
}
function snippet(md, len = 120) {
  const s = String(md || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/[*_~#>|-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return s.length > len ? s.slice(0, len) + '…' : s;
}
/* 搜索关键词高亮（先转义，再大小写不敏感地包 <mark>） */
function highlightText(text, q) {
  const escaped = escapeHTML(String(text || ''));
  if (!q) return escaped;
  const eq = escapeHTML(q);
  if (!eq) return escaped;
  const lower = escaped.toLowerCase();
  const lq = eq.toLowerCase();
  let out = '', i = 0, idx;
  while ((idx = lower.indexOf(lq, i)) !== -1) {
    out += escaped.slice(i, idx) + '<mark>' + escaped.slice(idx, idx + eq.length) + '</mark>';
    i = idx + eq.length;
  }
  return out + escaped.slice(i);
}
function download(filename, text, mime = 'text/markdown;charset=utf-8') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

let toastTimer = null;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.hidden = true; }, 2200);
}

/* ---------------- Markdown 渲染 ---------------- */
marked.setOptions({ gfm: true, breaks: true });
function renderMarkdown(md) {
  let html = marked.parse(md || '');
  html = html.replace(/src="zhimo:\/\/([A-Za-z0-9]+)"/g, (m, id) => imageCache[id] ? 'src="' + imageCache[id] + '"' : '');
  return DOMPurify.sanitize(html);
}
/* 导出时把图片短标记还原为内嵌 base64，保证 .md 可移植 */
function resolveImagesInText(text) {
  return String(text || '').replace(/zhimo:\/\/([A-Za-z0-9]+)/g, (m, id) => imageCache[id] || m);
}

/* ---------------- 列表页 ---------------- */
async function renderList() {
  notes = isTrashMode ? await getTrashedNotes() : await getActiveNotes();
  const f = searchInput.value.trim().toLowerCase();
  let filtered = notes;
  if (!isTrashMode && currentTag) filtered = filtered.filter((n) => (n.tags || []).includes(currentTag));
  if (f) filtered = filtered.filter((n) => (n.title + ' ' + n.content).toLowerCase().includes(f));
  updateFilterBar();

  noteList.innerHTML = '';

  if (notes.length === 0) {
    emptyState.hidden = false;
    emptyState.querySelector('.empty-title').textContent = isTrashMode ? '回收站是空的' : '还没有笔记';
    emptyState.querySelector('.empty-hint').innerHTML = isTrashMode
      ? '删除的笔记会在这里保留 30 天'
      : '点右下角 <b>＋</b> 开始写第一篇';
    return;
  }
  if (filtered.length === 0) {
    emptyState.hidden = false;
    emptyState.querySelector('.empty-title').textContent = '无匹配结果';
    emptyState.querySelector('.empty-hint').innerHTML = '换个关键词试试';
    return;
  }
  emptyState.hidden = true;

  filtered.forEach((n) => noteList.appendChild(buildItem(n, f)));
}

function updateFilterBar() {
  if (!isTrashMode && currentTag) {
    filterBar.hidden = false;
    filterBar.innerHTML = '<span class="filter-label">标签：</span><span class="filter-chip">' + escapeHTML(currentTag) + '</span>';
    const clear = document.createElement('button');
    clear.className = 'filter-clear';
    clear.setAttribute('aria-label', '清除标签筛选');
    clear.innerHTML = icon('x', 15);
    clear.addEventListener('click', () => { currentTag = null; renderList(); });
    filterBar.appendChild(clear);
  } else {
    filterBar.hidden = true;
  }
}

function buildItem(n, query) {
  const li = document.createElement('li');
  const title = n.title || '';
  const snip = snippet(n.content);

  const main = document.createElement('button');
  main.type = 'button';
  main.className = 'note-item';

  if (isTrashMode) {
    main.classList.add('note-item-trash');
    main.innerHTML = `
      <p class="note-item-title ${title ? '' : 'is-untitled'}">${highlightText(title || '无标题', query)}</p>
      <p class="note-item-snippet">${highlightText(snip, query) || '&nbsp;'}</p>
      <div class="note-item-meta"><span>删除于 ${relativeTime(n.deletedAt)}</span><span>${countWords(n.content)} 字</span></div>`;
    main.addEventListener('click', async () => {
      await restoreNote(n.id);
      toast('已恢复');
      await renderList();
    });

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'note-item-del icon-btn';
    del.setAttribute('aria-label', '彻底删除');
    del.innerHTML = icon('trash', 18);
    del.addEventListener('click', (e) => {
      e.stopPropagation();
      confirmDialog({
        message: `彻底删除「${n.title || '无标题'}」？此操作不可恢复。`,
        confirmLabel: '彻底删除', danger: true,
        onConfirm: async () => {
          await deleteNote(n.id);
          toast('已彻底删除');
          await renderList();
        }
      });
    });
    li.appendChild(main);
    li.appendChild(del);
    return li;
  }

  /* ---- 正常模式：左滑露出 置顶 / 删除 ---- */
  const pin = n.pinned ? '<span class="note-item-pin">' + icon('pin', 15) + '</span>' : '';
  main.innerHTML = `
    <p class="note-item-title ${title ? '' : 'is-untitled'}">${pin}${highlightText(title || '无标题', query)}</p>
    <p class="note-item-snippet">${highlightText(snip, query) || '&nbsp;'}</p>
    <div class="note-item-meta"><span>${relativeTime(n.updatedAt)}</span><span>${countWords(n.content)} 字</span></div>`;
  main.addEventListener('click', () => {
    if (openSwipeEl === li) { closeOpenSwipe(null); return; }
    openNote(n.id);
  });

  const tags = n.tags || [];
  if (tags.length) {
    const tagRow = document.createElement('div');
    tagRow.className = 'note-item-tags';
    tags.forEach((t) => {
      const chip = document.createElement('span');
      chip.className = 'tag-chip';
      chip.textContent = t;
      chip.setAttribute('role', 'button');
      chip.setAttribute('tabindex', '0');
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        currentTag = t;
        searchInput.value = '';
        renderList();
      });
      tagRow.appendChild(chip);
    });
    main.appendChild(tagRow);
  }

  li.className = 'note-swipe';
  const actions = document.createElement('div');
  actions.className = 'note-swipe-actions';

  const pinBtn = document.createElement('button');
  pinBtn.type = 'button';
  pinBtn.className = 'swipe-btn';
  pinBtn.innerHTML = icon('pin', 18) + '<span>' + (n.pinned ? '取消置顶' : '置顶') + '</span>';
  pinBtn.addEventListener('click', (e) => { e.stopPropagation(); togglePinFromList(n); });

  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.className = 'swipe-btn swipe-btn-danger';
  delBtn.innerHTML = icon('trash', 18) + '<span>删除</span>';
  delBtn.addEventListener('click', (e) => { e.stopPropagation(); confirmDeleteFromList(n); });

  actions.appendChild(pinBtn);
  actions.appendChild(delBtn);
  li.appendChild(actions);
  li.appendChild(main);
  attachSwipe(main, actions, li);
  return li;
}

/* ---------------- 左滑手势 ---------------- */
let openSwipeEl = null;

async function togglePinFromList(n) {
  n.pinned = !n.pinned;
  await putNote(n);
  const idx = notes.findIndex((x) => x.id === n.id);
  if (idx >= 0) notes[idx] = n;
  toast(n.pinned ? '已置顶' : '已取消置顶');
  await renderList();
}

function confirmDeleteFromList(n) {
  confirmDialog({
    message: `删除「${n.title || '无标题'}」？将移入回收站，30 天内可恢复。`,
    confirmLabel: '删除', danger: true,
    onConfirm: async () => {
      await softDelete(n.id);
      if (currentId === n.id) { currentId = null; clearTimeout(saveTimer); }
      toast('已移入回收站');
      await renderList();
    }
  });
}

function closeOpenSwipe(except) {
  if (openSwipeEl && openSwipeEl !== except) {
    const f = openSwipeEl.querySelector('.note-item');
    if (f) f.style.transform = 'translateX(0)';
  }
  if (openSwipeEl !== except) openSwipeEl = null;
}

function attachSwipe(front, actions, li) {
  let startX = 0, startY = 0, baseX = 0, dragging = false;
  const getW = () => actions.offsetWidth || 148;

  front.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    startX = t.clientX; startY = t.clientY;
    baseX = openSwipeEl === li ? -getW() : 0;
    dragging = false;
  }, { passive: true });

  front.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    if (!dragging && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
      dragging = true;
      closeOpenSwipe(li);
      front.classList.add('swiping');
    }
    if (!dragging) return;
    const W = getW();
    let x = baseX + dx;
    x = Math.max(-W, Math.min(0, x));
    front.style.transform = 'translateX(' + x + 'px)';
    if (e.cancelable) e.preventDefault();
  }, { passive: false });

  front.addEventListener('touchend', () => {
    if (!dragging) return;
    front.classList.remove('swiping');
    const W = getW();
    const cur = parseFloat(front.style.transform.replace(/[^-\d.]/g, '')) || 0;
    if (cur < -W / 2) {
      front.style.transform = 'translateX(-' + W + 'px)';
      openSwipeEl = li;
    } else {
      front.style.transform = 'translateX(0)';
      openSwipeEl = null;
    }
  });
}

/* 进入 / 退出回收站 */
function enterTrash() {
  isTrashMode = true;
  currentTag = null;
  btnTrashBack.hidden = false;
  appNameEl.textContent = '回收站';
  appSubEl.innerHTML = '删除的笔记保留 30 天 <span class="app-version">' + APP_VERSION + '</span>';
  $('#btn-new').style.display = 'none';
  searchInput.value = '';
  renderList();
}
function exitTrash() {
  isTrashMode = false;
  btnTrashBack.hidden = true;
  appNameEl.textContent = '纸墨';
  appSubEl.innerHTML = '离线 Markdown 笔记 <span class="app-version">' + APP_VERSION + '</span>';
  $('#btn-new').style.display = '';
  searchInput.value = '';
  renderList();
}

/* ---------------- 编辑器 ---------------- */
/* ---------------- 来源条 ---------------- */
async function refreshSourceBar(noteId) {
  if (!noteId || noteId !== currentId) return;
  let src = null;
  try {
    src = await getSource(noteId);
  } catch (e) {
    src = null;
  }
  if (noteId !== currentId) return;   // 期间已切换到别的笔记，丢弃本次结果
  currentSource = src;
  if (!src) {
    sourceBar.hidden = true;
    btnSourceWrite.hidden = true;
    return;
  }
  sourceBar.hidden = false;
  sourceNameEl.textContent = src.name || '未命名文件';
  sourceStateEl.textContent = '已同步';
  btnSourceWrite.hidden = !(canUseFileHandles && src.handle);
}

async function openNote(id) {
  const note = await getNote(id);
  if (!note) return;
  currentId = note.id;
  currentCreatedAt = note.createdAt;
  currentPinned = note.pinned || false;
  currentTags = note.tags || [];
  titleInput.value = note.title || '';
  editor.value = note.content || '';
  setMode('edit');
  updateWordCount();
  setSaveState('saved');
  listView.classList.remove('active');
  editorView.classList.add('active');
  window.scrollTo(0, 0);
  requestAnimationFrame(() => { (note.title ? editor : titleInput).focus(); });
  await refreshSourceBar(note.id);
}

async function newNote() {
  const note = { id: uid(), title: '', content: '', createdAt: Date.now(), updatedAt: Date.now() };
  await putNote(note);
  await openNote(note.id);
}

async function saveNow() {
  if (!currentId) return;
  setSaveState('saving');
  const note = {
    id: currentId,
    title: titleInput.value.trim(),
    content: editor.value,
    createdAt: currentCreatedAt || Date.now(),
    updatedAt: Date.now(),
    pinned: currentPinned,
    tags: currentTags
  };
  await putNote(note);
  const idx = notes.findIndex((n) => n.id === currentId);
  if (idx >= 0) notes[idx] = note; else notes.unshift(note);
  setSaveState('saved');
}

function scheduleSave() {
  setSaveState('saving');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 500);
}

async function exitToNotes() {
  currentId = null;
  currentSource = null;
  sourceBar.hidden = true;
  currentCreatedAt = null;
  clearTimeout(saveTimer);
  isPreview = false;
  isFocusMode = false;
  editor.value = '';
  titleInput.value = '';
  editorView.classList.remove('active', 'immersive');
  listView.classList.add('active');
  window.scrollTo(0, 0);
  await renderList();
}

async function closeEditor() {
  if (currentId) {
    if (!titleInput.value.trim() && !editor.value.trim()) {
      await deleteNote(currentId); // 丢弃空笔记
    } else {
      await saveNow();
    }
  }
  await exitToNotes();
}

function confirmDeleteCurrent() {
  const id = currentId;
  if (!id) return;
  confirmDialog({
    message: '删除这篇笔记？将移入回收站，30 天内可恢复。',
    confirmLabel: '删除', danger: true,
    onConfirm: async () => {
      await softDelete(id);
      toast('已移入回收站');
      await exitToNotes();
    }
  });
}

function setSaveState(s) {
  saveState.dataset.state = s;
  saveState.textContent = s === 'saving' ? '保存中…' : '已保存';
}

function updateWordCount() {
  wordCount.textContent = countWords(editor.value) + ' 字';
}

function setMode(mode) {
  isPreview = (mode === 'preview');
  if (isPreview) {
    updatePreview();
    editor.hidden = true;
    preview.hidden = false;
    toolbar.style.display = 'none';
    quickbar.hidden = true;
    editorView.classList.remove('immersive');
    isFocusMode = false;
    btnEditMode.setAttribute('aria-selected', 'false');
    btnPreviewMode.setAttribute('aria-selected', 'true');
    editor.blur();
  } else {
    editor.hidden = false;
    preview.hidden = true;
    toolbar.style.display = '';
    quickbar.hidden = false;
    btnEditMode.setAttribute('aria-selected', 'true');
    btnPreviewMode.setAttribute('aria-selected', 'false');
    editor.focus();
  }
}

function updatePreview() {
  preview.innerHTML = renderMarkdown(editor.value);
  preview.scrollTop = 0;
}

/* ---------------- 工具栏 ---------------- */
const TOOLBAR = [
  { icon: 'bold', label: '加粗', action: 'wrap', before: '**', after: '**', ph: '加粗文字' },
  { icon: 'italic', label: '斜体', action: 'wrap', before: '*', after: '*', ph: '斜体文字' },
  { sep: true },
  { icon: 'heading-1', label: '一级标题', action: 'heading', level: 1 },
  { icon: 'heading-2', label: '二级标题', action: 'heading', level: 2 },
  { icon: 'heading-3', label: '三级标题', action: 'heading', level: 3 },
  { sep: true },
  { icon: 'list', label: '无序列表', action: 'prefix', prefix: '- ' },
  { icon: 'list-ordered', label: '有序列表', action: 'prefix', prefix: '1. ' },
  { icon: 'check-square', label: '任务清单', action: 'prefix', prefix: '- [ ] ' },
  { sep: true },
  { icon: 'quote', label: '引用', action: 'prefix', prefix: '> ' },
  { icon: 'code', label: '行内代码', action: 'wrap', before: '`', after: '`', ph: 'code' },
  { icon: 'code-block', label: '代码块', action: 'block' },
  { sep: true },
  { icon: 'link', label: '链接', action: 'link' },
  { icon: 'image', label: '图片', action: 'image' },
  { icon: 'minus', label: '分割线', action: 'insert', text: '\n---\n' },
  { icon: 'table', label: '表格', action: 'insert', text: '\n| 列1 | 列2 |\n| --- | --- |\n|  |  |\n' }
];

function renderToolbar() {
  toolbar.innerHTML = '';
  TOOLBAR.forEach((item) => {
    if (item.sep) {
      const s = document.createElement('div');
      s.className = 'tool-sep';
      toolbar.appendChild(s);
      return;
    }
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tool-btn';
    b.setAttribute('aria-label', item.label);
    b.title = item.label;
    b.innerHTML = icon(item.icon, 19);
    b.addEventListener('click', () => applyAction(item));
    toolbar.appendChild(b);
  });
}

function getSel() {
  return { start: editor.selectionStart, end: editor.selectionEnd, value: editor.value };
}
function replaceSelection(text, start, end, focusOffset) {
  const v = editor.value;
  editor.value = v.slice(0, start) + text + v.slice(end);
  const pos = focusOffset != null ? start + focusOffset : start + text.length;
  editor.focus();
  editor.setSelectionRange(pos, pos);
  scheduleSave();
}

function applyAction(item) {
  switch (item.action) {
    case 'wrap': {
      const s = getSel();
      const sel = s.value.slice(s.start, s.end) || item.ph;
      replaceSelection(item.before + sel + item.after, s.start, s.end);
      editor.setSelectionRange(s.start + item.before.length, s.start + item.before.length + sel.length);
      break;
    }
    case 'heading': {
      const s = getSel();
      const e = expandToLines(s);
      const prefix = '#'.repeat(item.level) + ' ';
      const out = s.value.slice(e.start, e.end).split('\n').map((l) => prefix + l.replace(/^#{1,6}\s+/, '')).join('\n');
      replaceSelection(out, e.start, e.end);
      break;
    }
    case 'prefix': {
      const s = getSel();
      const e = expandToLines(s);
      const out = s.value.slice(e.start, e.end).split('\n').map((l) => item.prefix + l).join('\n');
      replaceSelection(out, e.start, e.end);
      break;
    }
    case 'block': {
      const s = getSel();
      const sel = s.value.slice(s.start, s.end) || 'code';
      replaceSelection('```\n' + sel + '\n```', s.start, s.end);
      break;
    }
    case 'link': {
      const s = getSel();
      const sel = s.value.slice(s.start, s.end) || '链接文字';
      const text = '[' + sel + '](https://)';
      replaceSelection(text, s.start, s.end);
      editor.setSelectionRange(s.start + text.indexOf('https://') + 8, s.start + text.indexOf('https://') + 8);
      break;
    }
    case 'image': {
      const s = getSel();
      const sel = s.value.slice(s.start, s.end) || '图片描述';
      const text = '![' + sel + '](https://)';
      replaceSelection(text, s.start, s.end);
      editor.setSelectionRange(s.start + text.indexOf('https://') + 8, s.start + text.indexOf('https://') + 8);
      break;
    }
    case 'insert': {
      const s = getSel();
      replaceSelection(item.text, s.start, s.end);
      break;
    }
  }
}

function expandToLines(s) {
  let start = s.start, end = s.end;
  const v = s.value;
  while (start > 0 && v[start - 1] !== '\n') start--;
  while (end < v.length && v[end] !== '\n') end++;
  return { start, end };
}

/* ---------------- 键盘上方快捷符号栏 ---------------- */
const QUICKBAR = [
  { label: '#', insert: '# ', cursor: 2 },
  { label: '##', insert: '## ', cursor: 3 },
  { label: '**', insert: '****', cursor: 2 },
  { label: '`', insert: '``', cursor: 1 },
  { label: '[]()', insert: '[]()', cursor: 1 },
  { label: '![]()', insert: '![]()', cursor: 2 },
  { label: '-', insert: '- ', cursor: 2 },
  { label: '[ ]', insert: '- [ ] ', cursor: 6 },
  { label: '>', insert: '> ', cursor: 2 },
  { label: '|', insert: '| ', cursor: 2 },
  { label: '---', insert: '\n---\n', cursor: 5 },
  { label: '~~', insert: '~~~~', cursor: 2 }
];

function renderQuickbar() {
  quickbar.innerHTML = '';
  QUICKBAR.forEach((item) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'quickbar-btn';
    b.textContent = item.label;
    b.setAttribute('aria-label', '插入 ' + item.label);
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault(); // 保持输入框焦点
      insertQuick(item);
    });
    quickbar.appendChild(b);
  });
}

function insertQuick(item) {
  const s = getSel();
  replaceSelection(item.insert, s.start, s.end);
  const pos = s.start + (item.cursor != null ? item.cursor : item.insert.length);
  editor.setSelectionRange(pos, pos);
}

/* 专注模式：手动开关，收起工具栏/快捷栏/底栏 */
let isFocusMode = false;
function toggleFocusMode() {
  isFocusMode = !isFocusMode;
  if (isFocusMode) {
    editorView.classList.add('immersive');
    toast('已进入专注模式，点右上角「⋯」退出');
  } else {
    editorView.classList.remove('immersive');
  }
}

/* ---------------- 底部面板 / 对话框 ---------------- */
function showSheet(title, items) {
  sheetTitle.textContent = title;
  sheetItems.innerHTML = '';
  items.forEach((it) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sheet-item' + (it.danger ? ' is-danger' : '');
    b.innerHTML = icon(it.icon) + '<span>' + it.label + '</span>';
    b.addEventListener('click', () => { hideSheet(); it.action && it.action(); });
    sheetItems.appendChild(b);
  });
  sheet.hidden = false;
  sheetBackdrop.hidden = false;
}
function hideSheet() {
  sheet.hidden = true;
  sheetBackdrop.hidden = true;
}

function confirmDialog({ message, confirmLabel = '确定', cancelLabel = '取消', danger = false, onConfirm }) {
  dialogMessage.textContent = message;
  dialogConfirm.textContent = confirmLabel;
  dialogConfirm.className = 'btn ' + (danger ? 'btn-danger' : 'btn-primary');
  dialogCancel.textContent = cancelLabel;
  dialogCancel.hidden = !cancelLabel;
  dialogConfirm.onclick = () => { hideDialog(); onConfirm && onConfirm(); };
  dialog.hidden = false;
  dialogBackdrop.hidden = false;
}
function hideDialog() {
  dialog.hidden = true;
  dialogBackdrop.hidden = true;
}

function confirmEmptyTrash() {
  const count = notes.length;
  if (!count) { toast('回收站已经是空的'); return; }
  confirmDialog({
    message: `彻底删除回收站里的 ${count} 篇笔记？此操作不可恢复。`,
    confirmLabel: '清空', danger: true,
    onConfirm: async () => {
      await emptyTrash();
      toast('回收站已清空');
      await renderList();
    }
  });
}

async function togglePinCurrent() {
  if (!currentId) return;
  const n = await getNote(currentId);
  if (!n) return;
  n.pinned = !n.pinned;
  currentPinned = n.pinned;
  await putNote(n);
  const idx = notes.findIndex((x) => x.id === currentId);
  if (idx >= 0) notes[idx] = n;
  toast(n.pinned ? '已置顶' : '已取消置顶');
}

/* 本地图片：读取 → 压缩 → 以 base64 嵌入 Markdown */
function resizeImage(file, maxDim = 1600) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let w = img.naturalWidth, h = img.naturalHeight;
        if (w > maxDim || h > maxDim) {
          const s = Math.min(maxDim / w, maxDim / h);
          w = Math.round(w * s); h = Math.round(h * s);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('读取失败'));
    reader.readAsDataURL(file);
  });
}

async function insertLocalImage(file) {
  if (!file) return;
  toast('正在压缩图片…');
  try {
    const dataUrl = await resizeImage(file);
    const id = uid();
    await putImage(id, dataUrl);
    imageCache[id] = dataUrl;
    const name = (file.name || '图片').replace(/\.[^.]+$/, '');
    const s = getSel();
    replaceSelection('![' + name + '](zhimo://' + id + ')', s.start, s.end);
    toast('图片已插入');
  } catch (e) {
    toast('图片处理失败');
  }
}

/* 标签编辑 */
function editTags() {
  if (!currentId) return;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentTags.join(' ');
  input.placeholder = '用空格或逗号分隔，例如：工作 灵感';
  input.className = 'dialog-input';
  dialogMessage.textContent = '';
  dialogMessage.appendChild(document.createTextNode('给这篇笔记打标签：'));
  dialogMessage.appendChild(document.createElement('br'));
  dialogMessage.appendChild(input);
  dialogConfirm.textContent = '保存';
  dialogConfirm.className = 'btn btn-primary';
  dialogCancel.hidden = false;
  dialogCancel.textContent = '取消';
  dialogConfirm.onclick = async () => {
    const tags = input.value.split(/[,\s，、]+/).map((t) => t.trim()).filter(Boolean);
    currentTags = tags;
    const n = await getNote(currentId);
    if (n) { n.tags = tags; await putNote(n); }
    hideDialog();
    toast('标签已保存');
  };
  dialog.hidden = false;
  dialogBackdrop.hidden = false;
  setTimeout(() => input.focus(), 50);
}

function openListMenu() {
  if (isTrashMode) {
    showSheet('回收站', [
      { icon: 'trash', label: '清空回收站', danger: true, action: confirmEmptyTrash },
      { icon: 'info', label: '关于', action: showAbout }
    ]);
    return;
  }
  const items = [
    { icon: 'trash', label: '回收站', action: enterTrash },
    { icon: 'palette', label: '主题', action: showThemePicker },
    { icon: 'download', label: '导出全部为 .md', action: exportAll },
    { icon: 'database', label: '备份为 JSON', action: backupJSON },
    { icon: 'upload', label: '导入 Markdown (.md)', action: startImportMD },
    { icon: 'database', label: '导入备份 (JSON)', action: () => fileJson.click() }
  ];
  // 「同步所有来源」在 Task 5 追加到这里
  items.push({ icon: 'download', label: '安装到主屏幕', action: installApp });
  items.push({ icon: 'info', label: '关于', action: showAbout });
  showSheet('更多', items);
}

function openEditorMenu() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const cur = notes.find((x) => x.id === currentId);
  const pinned = cur && cur.pinned;
  showSheet('笔记', [
    { icon: 'pin', label: pinned ? '取消置顶' : '置顶', action: togglePinCurrent },
    { icon: 'eye', label: isFocusMode ? '退出专注模式' : '专注模式', action: toggleFocusMode },
    { icon: 'image', label: '插入本地图片', action: () => fileImage.click() },
    { icon: 'tag', label: '编辑标签', action: editTags },
    { icon: 'download', label: '导出为 .md', action: exportCurrent },
    { icon: 'file-text', label: '导出为 PDF', action: exportPDF },
    { icon: isDark ? 'sun' : 'moon', label: '切换深色 / 浅色', action: toggleTheme },
    { icon: 'trash', label: '删除此篇', danger: true, action: confirmDeleteCurrent }
  ]);
}

/* ---------------- 导出 / 导入 ---------------- */
function exportCurrent() {
  const n = notes.find((x) => x.id === currentId) || { title: titleInput.value, content: editor.value };
  let text = resolveImagesInText(n.content || '');
  if (n.title && !/^\s*#\s/.test(text)) text = '# ' + n.title + '\n\n' + text;
  const name = sanitizeFilename(n.title);
  download(name + '.md', text);
  toast('已导出 ' + name + '.md');
}

function exportPDF() {
  const title = titleInput.value.trim() || '无标题';
  const content = editor.value || '';

  // 组装打印区：标题 + 渲染后的正文
  printArea.innerHTML = '';
  const h = document.createElement('h1');
  h.className = 'print-title';
  h.textContent = title;
  printArea.appendChild(h);
  const body = document.createElement('div');
  body.className = 'markdown-body';
  body.innerHTML = renderMarkdown(content);
  printArea.appendChild(body);

  // 用标题作为 PDF 默认文件名
  const prevTitle = document.title;
  document.title = title + ' · 纸墨';
  const restore = () => {
    document.title = prevTitle;
    window.removeEventListener('afterprint', restore);
  };
  window.addEventListener('afterprint', restore);
  window.print();
  setTimeout(restore, 1500); // 兜底：afterprint 未触发时恢复标题
}

function exportAll() {
  if (!notes.length) { toast('没有可导出的笔记'); return; }
  const body = notes.map((n) => `# ${n.title || '无标题'}\n\n${resolveImagesInText(n.content || '')}`).join('\n\n---\n\n');
  const date = new Date().toISOString().slice(0, 10);
  download(`纸墨笔记-${date}.md`, body);
  toast(`已导出 ${notes.length} 篇`);
}

function backupJSON() {
  const images = Object.entries(imageCache).map(([id, dataUrl]) => ({ id, dataUrl }));
  const data = { app: '纸墨', version: 2, exportedAt: new Date().toISOString(), notes, images };
  const date = new Date().toISOString().slice(0, 10);
  download(`纸墨备份-${date}.json`, JSON.stringify(data, null, 2), 'application/json;charset=utf-8');
  toast('已备份为 JSON');
}

async function importMD(file, handle) {
  const content = await file.text();
  const baseName = file.name.replace(/\.(md|markdown|txt)$/i, '');
  const m = content.match(/^\s*#\s+(.+)$/m);
  const title = m ? m[1].trim() : baseName;
  const note = { id: uid(), title, content, createdAt: Date.now(), updatedAt: Date.now() };
  await putNote(note);
  const src = {
    noteId: note.id,
    name: file.name,
    lastModified: file.lastModified,
    size: file.size,
    contentHash: hashString(content),
    syncedAt: Date.now()
  };
  if (handle) src.handle = handle;
  let savedSource = true;
  try {
    await saveSource(src);
  } catch (e) {
    savedSource = false;
  }
  await renderList();
  toast(savedSource ? '已导入：' + title : '已导入「' + title + '」，但未能记录文件关联');
}

/* 导入入口：Chromium 取文件句柄以便后续同步，其它浏览器走 input 降级 */
async function startImportMD() {
  if (canUseFileHandles) {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md', '.markdown', '.txt'] } }],
        multiple: false
      });
      const file = await handle.getFile();
      await importMD(file, handle);
    } catch (e) {
      if (!e || e.name !== 'AbortError') toast('导入失败：' + ((e && e.message) || '未知错误'));
    }
    return;
  }
  fileMd.click();
}

function restoreJSON(file) {
  const reader = new FileReader();
  reader.onload = () => {
    let data;
    try { data = JSON.parse(String(reader.result)); } catch { toast('备份文件解析失败'); return; }
    if (!data || !Array.isArray(data.notes)) { toast('不是有效的纸墨备份文件'); return; }
    confirmDialog({
      message: `将用备份覆盖当前全部 ${notes.length} 篇笔记（备份含 ${data.notes.length} 篇），确定？`,
      confirmLabel: '覆盖导入', danger: true,
      onConfirm: async () => {
        await clearAllNotes();
        for (const n of data.notes) {
          await putNote({
            id: n.id || uid(), title: n.title || '', content: n.content || '',
            createdAt: n.createdAt || Date.now(), updatedAt: n.updatedAt || Date.now()
          });
        }
        // 恢复图片
        await clearAllImages();
        Object.keys(imageCache).forEach((k) => delete imageCache[k]);
        const images = Array.isArray(data.images) ? data.images : [];
        for (const img of images) {
          if (img && img.id && img.dataUrl) {
            await putImage(img.id, img.dataUrl);
            imageCache[img.id] = img.dataUrl;
          }
        }
        if (currentId) { currentId = null; clearTimeout(saveTimer); }
        editorView.classList.remove('active');
        listView.classList.add('active');
        await renderList();
        toast('已恢复备份');
      }
    });
  };
  reader.readAsText(file);
}

/* ---------------- 主题 ---------------- */
const THEME_STYLES = [
  { id: '',           label: '纸张',       color: { light: '#FDFBF7', dark: '#1E1C17' } },
  { id: 'sketch',     label: '手绘',       color: { light: '#FDFBF7', dark: '#1E1C17' } },
  { id: 'typewriter', label: '复古打字机', color: { light: '#FCF9F0', dark: '#16140F' } },
  { id: 'forest',     label: '森系自然',   color: { light: '#FAFCF6', dark: '#111A12' } }
];
function themeColorFor(theme, style) {
  const s = THEME_STYLES.find((x) => x.id === (style || ''));
  const base = s || THEME_STYLES[0];
  return base.color[theme === 'dark' ? 'dark' : 'light'];
}
function applyTheme(t, style) {
  document.documentElement.setAttribute('data-theme', t);
  document.documentElement.setAttribute('data-style', style || '');
  localStorage.setItem('theme', t);
  localStorage.setItem('style', style || '');
  btnTheme.innerHTML = icon(t === 'dark' ? 'sun' : 'moon', 22);
  const mc = document.querySelector('meta[name="theme-color"]');
  if (mc) mc.setAttribute('content', themeColorFor(t, style));
}
function initTheme() {
  const saved = localStorage.getItem('theme');
  const style = localStorage.getItem('style') || '';
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved || (prefersDark ? 'dark' : 'light'), style);
}
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme');
  const style = document.documentElement.getAttribute('data-style') || '';
  applyTheme(cur === 'dark' ? 'light' : 'dark', style);
}
function showThemePicker() {
  const curStyle = document.documentElement.getAttribute('data-style') || '';
  const items = THEME_STYLES.map((s) => ({
    icon: s.id === curStyle ? 'check' : '',
    label: s.label,
    action: () => showThemeDarkPicker(s)
  }));
  showSheet('选择风格', items);
}

function showThemeDarkPicker(style) {
  const curTheme = document.documentElement.getAttribute('data-theme') || 'light';
  showSheet(style.label + ' · 明暗', [
    { icon: curTheme === 'light' ? 'check' : '', label: '浅色', action: () => { applyTheme('light', style.id); toast('已切换：' + style.label + ' · 浅色'); } },
    { icon: curTheme === 'dark' ? 'check' : '', label: '深色', action: () => { applyTheme('dark', style.id); toast('已切换：' + style.label + ' · 深色'); } }
  ]);
}

/* ---------------- PWA ---------------- */
function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

/* ---------------- 版本更新检查 ---------------- */
let updatePromptShown = false;

async function checkForUpdate() {
  try {
    const res = await fetch('./version.json?t=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    if (data.version && data.version !== APP_VERSION && !updatePromptShown) {
      updatePromptShown = true;
      confirmDialog({
        message: '发现新版本 ' + data.version + '（当前 ' + APP_VERSION + '）\n\n刷新页面即可更新，无需清理缓存。',
        confirmLabel: '立即刷新', cancelLabel: '稍后',
        onConfirm: () => location.reload()
      });
    }
  } catch (e) { /* 离线或网络异常时忽略 */ }
}
function isInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

function installApp() {
  if (isInstalled()) {
    toast('已经安装到主屏幕 ✓');
    return;
  }
  showInstallGuide();
}

/* 浏览器识别：根据 UA 判断，给出各自的安装/收藏步骤 */
function detectBrowser() {
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/.test(ua);

  if (isIOS) {
    if (/MicroMessenger/.test(ua)) return 'wechat-ios';
    if (/CriOS/.test(ua)) return 'ios-chrome';
    if (/FxiOS/.test(ua)) return 'ios-firefox';
    if (/EdgiOS/.test(ua)) return 'ios-edge';
    return 'ios-safari';
  }

  if (/MicroMessenger/.test(ua)) return 'wechat';
  if (/EdgA?\//.test(ua)) return 'edge';
  if (/SamsungBrowser/.test(ua)) return 'samsung';
  if (/HuaweiBrowser|HwBrowser|ArkWeb|HUAWEI/.test(ua)) return 'huawei';
  if (/MiuiBrowser|XiaoMi|Miui/.test(ua)) return 'xiaomi';
  if (/MQQBrowser|QQBrowser/.test(ua)) return 'qq';
  if (/UCBrowser|UCWEB/.test(ua)) return 'uc';
  if (/baiduboxapp|Baidu/.test(ua)) return 'baidu';
  if (/VivoBrowser/.test(ua)) return 'vivo';
  if (/HeyTapBrowser|OppoBrowser/.test(ua)) return 'oppo';
  if (/OPR\/|Opera/.test(ua)) return 'opera';
  if (/Firefox\//.test(ua)) return 'firefox';
  if (/Chrome\//.test(ua)) return 'chrome';
  return 'other';
}

const INSTALL_GUIDES = {
  'chrome':       { name: 'Chrome', full: true,  steps: ['点右上角「⋮」菜单', '选「安装应用」或「添加到主屏幕」'] },
  'edge':         { name: 'Edge', full: true,    steps: ['点右上角「⋯」菜单', '选「安装应用」或「添加到手机」'] },
  'samsung':      { name: '三星浏览器', full: true, steps: ['点右下角「≡」菜单', '选「添加页面到」→「主屏幕」'] },
  'ios-safari':   { name: 'Safari（iPhone）', full: true, steps: ['点底部「分享」按钮（方框 ↑）', '选「添加到主屏幕」', '点右上角「添加」'] },
  'ios-chrome':   { name: 'Chrome（iPhone）', full: true, steps: ['点右上角「⋯」菜单', '选「添加到主屏幕」'] },
  'ios-edge':     { name: 'Edge（iPhone）', full: true, steps: ['点底部「⋯」菜单', '选「添加到主屏幕」'] },
  'ios-firefox':  { name: 'Firefox（iPhone）', full: true, steps: ['点右上角「⋯」菜单', '选「添加到主屏幕」'] },
  'huawei':       { name: '华为浏览器', full: false, steps: ['点右上角「⋮」或「···」菜单', '选「添加到主屏幕 / 添加到桌面」'] },
  'xiaomi':       { name: '小米浏览器', full: false, steps: ['点右上角「···」菜单', '选「添加到主屏幕」'] },
  'qq':           { name: 'QQ 浏览器', full: false, steps: ['点底部菜单（或右上角「···」）', '选「添加到主屏幕」'] },
  'uc':           { name: 'UC 浏览器', full: false, steps: ['点底部中间「菜单」', '选「添加到主屏幕」'] },
  'baidu':        { name: '百度浏览器', full: false, steps: ['点浏览器菜单', '选「添加到主屏幕 / 添加收藏」'] },
  'vivo':         { name: 'vivo 浏览器', full: false, steps: ['点浏览器菜单', '选「添加到主屏幕」'] },
  'oppo':         { name: 'OPPO 浏览器', full: false, steps: ['点浏览器菜单', '选「添加到主屏幕」'] },
  'opera':        { name: 'Opera', full: false, steps: ['点浏览器菜单', '选「添加到主屏幕」'] },
  'firefox':      { name: 'Firefox', full: false, steps: ['Firefox 安卓版不支持「添加到主屏幕」', '建议改用 Chrome / Edge / 系统自带浏览器打开'] },
  'wechat':       { name: '微信', full: false, steps: ['微信内置浏览器不支持安装', '点右上角「···」→「在浏览器打开」', '再用浏览器菜单安装'] },
  'wechat-ios':   { name: '微信', full: false, steps: ['微信内置浏览器不支持安装', '点右上角「···」→「在 Safari 打开」', '再点底部「分享」→「添加到主屏幕」'] },
  'other':        { name: '当前浏览器', full: false, steps: ['在浏览器菜单里找「添加到主屏幕 / 添加到桌面」', '找不到的话直接收藏 / 加书签即可，功能不受影响'] }
};

function showInstallGuide() {
  const id = detectBrowser();
  const g = INSTALL_GUIDES[id] || INSTALL_GUIDES.other;
  const steps = g.steps.map((s, i) => (i + 1) + '. ' + s).join('\n');
  const note = g.full
    ? '安装后：主屏幕有独立图标、全屏打开，断网也能用。'
    : '提示：该浏览器可能不支持完全离线，但联网使用一切正常；建议改用 Chrome / Edge / 系统浏览器打开，安装体验最佳。';
  confirmDialog({
    message: '安装到主屏幕（已识别：' + g.name + '）\n\n' + steps + '\n\n' + note,
    confirmLabel: '知道了', cancelLabel: '', danger: false,
    onConfirm: () => {}
  });
}

/* ---------------- 关于 ---------------- */
function showAbout() {
  confirmDialog({
    message: '纸墨 · 离线 Markdown 笔记\n\n• 数据保存在手机本地（浏览器 IndexedDB）\n• 安装到主屏幕后，断网也能使用\n• 建议定期「备份为 JSON」以防数据丢失\n• 支持导出为 .md，可在 MacDown 中打开',
    confirmLabel: '知道了', cancelLabel: '', danger: false,
    onConfirm: () => {}
  });
}

/* ---------------- 事件绑定 ---------------- */
function bindEvents() {
  $('#btn-new').addEventListener('click', newNote);
  $('#btn-theme').addEventListener('click', toggleTheme);
  $('#btn-more').addEventListener('click', openListMenu);
  $('#btn-editor-more').addEventListener('click', openEditorMenu);
  $('#btn-back').addEventListener('click', closeEditor);
  btnTrashBack.addEventListener('click', exitTrash);
  btnEditMode.addEventListener('click', () => setMode('edit'));
  btnPreviewMode.addEventListener('click', () => setMode('preview'));
  sheetCancel.addEventListener('click', hideSheet);
  sheetBackdrop.addEventListener('click', hideSheet);
  dialogBackdrop.addEventListener('click', hideDialog);
  dialogCancel.addEventListener('click', hideDialog);

  searchInput.addEventListener('input', debounce(renderList, 200));

  titleInput.addEventListener('input', scheduleSave);
  editor.addEventListener('input', () => { scheduleSave(); updateWordCount(); });

  fileMd.addEventListener('change', () => {
    if (fileMd.files[0]) importMD(fileMd.files[0]).catch(() => toast('导入失败'));
    fileMd.value = '';
  });
  fileSync.addEventListener('change', () => {
    const f = fileSync.files[0];
    if (f && pendingSyncSource) {
      const src = pendingSyncSource;
      pendingSyncSource = null;
      if (f.name !== src.name) {
        toast('请选择同名文件：' + src.name);
      } else {
        syncFromFile(f, src);
      }
    }
    fileSync.value = '';
  });
  fileJson.addEventListener('change', () => {
    if (fileJson.files[0]) restoreJSON(fileJson.files[0]);
    fileJson.value = '';
  });
  fileImage.addEventListener('change', () => {
    if (fileImage.files[0]) insertLocalImage(fileImage.files[0]);
    fileImage.value = '';
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { hideSheet(); hideDialog(); }
  });
}

function injectIcons() {
  document.querySelectorAll('[data-icon]').forEach((el) => {
    el.innerHTML = icon(el.getAttribute('data-icon'), 22);
  });
}

/* ---------------- 启动 ---------------- */
async function init() {
  injectIcons();
  renderToolbar();
  initTheme();
  const verEl = $('#app-version');
  if (verEl) verEl.textContent = APP_VERSION;
  bindEvents();
  db = await openDB();
  await loadImageCache();
  await purgeOldTrash();
  await renderList();
  renderQuickbar();
  registerSW();

  // 版本更新检查：打开后、回到前台时、每 30 分钟一次
  setTimeout(checkForUpdate, 3000);
  setInterval(checkForUpdate, 30 * 60 * 1000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') checkForUpdate();
  });
}

document.addEventListener('DOMContentLoaded', init);
