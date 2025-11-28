import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// ==================== 本地存储工具 ====================
const STORAGE_KEY = 'inspiration-vault-data';

const saveToStorage = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('保存失败:', e);
  }
};

const loadFromStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    console.error('读取失败:', e);
    return null;
  }
};

// ==================== 初始示例数据 ====================
const initialData = {
  books: [
    {
      id: 'fortuna',
      title: 'Fortuna',
      cover: '🌙',
      coverImage: null,
      color: '#2D3047',
      lastEdited: '2024-01-15',
      entries: [
        {
          id: 'worldview',
          title: '世界观',
          summary: '关于这个世界',
          content: '',
          linkable: false,
          children: [
            {
              id: 'religion',
              title: '宗教',
              summary: '神祇与信仰体系',
              content: '',
              linkable: true,
              children: [
                {
                  id: 'ten-days',
                  title: '十日旧约',
                  summary: '创世的古老传说',
                  linkable: true,
                  content: '　　在时间的起点，当虚空尚未分离出光明与黑暗，女神独自漂浮于无尽的寂静之中。她的叹息化作了第一缕风，她的泪水汇成了第一滴海洋。\n\n　　于是，女神决定创造。\n\n　　第一日，她从自己的心火中分离出【火的守望】，让它成为一切温暖与激情的源泉。\n　　第二日，她从自己的泪水中分离出【水的祝福】，让它成为一切生命与净化的源泉。\n　　第三日，她从自己的躯体中分离出【地的生灵】，让它成为一切稳固与丰饶的源泉。\n　　第四日，她从自己的呼吸中分离出【风的歌谣】，让它成为一切自由与变化的源泉。\n\n　　这便是【十日旧约】中最为人知的篇章——创世四元素的诞生。它们生于女神的创世之初，被分别赋予与生灵的联系，成为万物的奠基。',
                  children: []
                },
                {
                  id: 'war-gods',
                  title: '战争双神',
                  summary: '胜利与牺牲的神话',
                  linkable: true,
                  content: '　　在诸神的黄昏时代，两位神祇因争夺凡人的命运而对立。\n\n　　**胜利者·凯洛斯**，身披金色战甲，手持永不折断的长矛。他代表着征服、荣耀与统治的力量。信奉他的战士相信，战争的意义在于胜利本身。\n\n　　**牺牲者·赛莲娜**，身着银色长袍，手持燃烧的火炬。她代表着守护、献身与救赎的力量。信奉她的战士相信，战争的意义在于保护所爱之人。\n\n　　传说他们曾是恋人，在一场关于凡人命运的争论中决裂。自此，每一场战争都是他们意志的延续，每一个战士都在无意识中选择了其中一方。',
                  children: []
                }
              ]
            },
            {
              id: 'geography',
              title: '地理',
              summary: '大陆与疆域',
              content: '',
              linkable: true,
              children: [
                {
                  id: 'koltra',
                  title: '柯尔特拉',
                  summary: '中央王国的心脏',
                  linkable: true,
                  content: '　　柯尔特拉位于大陆的正中央，是最古老也最繁华的王国。\n\n　　这片土地被称为"女神的掌心"，因为传说中女神创世时，正是在这里第一次触碰了大地。因此，这里的土壤格外肥沃，四季分明，气候温和。\n\n　　首都【银冠城】建立在一座巨大的白色岩石上，从远处望去，整座城市如同戴着银色王冠的巨人。城中最著名的建筑是【千年图书馆】，据说收藏着自创世以来所有的文字记录。\n\n　　柯尔特拉的人民以学识著称，几乎每个村庄都有自己的小型图书馆。这里也是【十日旧约】最完整抄本的保存地。',
                  children: []
                },
                {
                  id: 'northland',
                  title: '北境',
                  summary: '冰雪中的古老王国',
                  linkable: true,
                  content: '　　北境是一片被永恒冬季笼罩的土地。\n\n　　这里的居民是【霜裔】的后代——传说中第一批在严寒中存活下来的人类。他们有着银白色的头发和淡蓝色的眼睛，能够在零下四十度的暴风雪中行走自如。\n\n　　北境最著名的城市是【冰心堡】，一座完全由永恒冰块建造的要塞。这座冰块来自【女神的最后一滴泪】，据说只要这座城堡不融化，北境就永远不会被征服。\n\n　　北境人信奉【战争双神】中的赛莲娜，因为在这片严酷的土地上，每一个生命都是对他人的守护和牺牲。',
                  children: []
                }
              ]
            }
          ]
        },
        {
          id: 'characters',
          title: '人物',
          summary: '故事中的灵魂',
          content: '',
          linkable: false,
          children: [
            {
              id: 'protagonist',
              title: '主角',
              summary: '命运的承载者',
              content: '',
              linkable: false,
              children: [
                {
                  id: 'elena',
                  title: '艾琳娜',
                  summary: '银冠城的流亡公主',
                  linkable: true,
                  content: '　　艾琳娜是柯尔特拉末代国王的独生女，在王国覆灭之夜被忠诚的侍卫带出首都。\n\n　　她继承了母亲的银色长发和父亲的琥珀色眼睛，但最令人印象深刻的是她左肩上的胎记——一个完美的新月形状，这被认为是女神祝福的标记。\n\n　　艾琳娜从小在【千年图书馆】中长大，对【十日旧约】的研究比任何祭司都深入。她坚信，那些古老的神话中隐藏着拯救王国的秘密。',
                  children: []
                }
              ]
            }
          ]
        },
        {
          id: 'plot',
          title: '情节',
          summary: '故事的脉络',
          content: '',
          linkable: false,
          children: []
        }
      ]
    },
    {
      id: 'jade-book',
      title: '玉辞',
      cover: '🏯',
      coverImage: null,
      color: '#4A0E0E',
      lastEdited: '2024-01-08',
      entries: [
        {
          id: 'jade-world',
          title: '世界观',
          summary: '东方幻想大陆',
          content: '',
          linkable: false,
          children: []
        },
        {
          id: 'jade-chars',
          title: '人物',
          summary: '江湖儿女',
          content: '　　在这片土地上，曾有一位来自异世的旅人【艾琳娜】短暂停留，留下了关于西方女神的传说……',
          linkable: false,
          children: []
        }
      ]
    }
  ]
};

// ==================== 工具函数 ====================
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const collectAllLinkableTitles = (books) => {
  const titleMap = new Map();
  const collect = (entries, bookId, bookTitle) => {
    entries.forEach(entry => {
      if (entry.linkable !== false) {
        if (!titleMap.has(entry.title)) {
          titleMap.set(entry.title, []);
        }
        titleMap.get(entry.title).push({ bookId, bookTitle, entry });
      }
      if (entry.children?.length) {
        collect(entry.children, bookId, bookTitle);
      }
    });
  };
  books.forEach(book => collect(book.entries, book.id, book.title));
  return titleMap;
};

const findEntryPath = (entries, targetId, path = []) => {
  for (const entry of entries) {
    const currentPath = [...path, entry];
    if (entry.id === targetId) return currentPath;
    if (entry.children?.length) {
      const found = findEntryPath(entry.children, targetId, currentPath);
      if (found) return found;
    }
  }
  return null;
};

const getAllChildContent = (entry) => {
  let contents = [];
  const collect = (e, depth = 0) => {
    if (e.content) contents.push({ ...e, depth });
    if (e.children?.length) e.children.forEach(child => collect(child, depth + 1));
  };
  if (entry.children?.length) entry.children.forEach(child => collect(child, 0));
  else if (entry.content) contents.push({ ...entry, depth: 0 });
  return contents;
};

const updateEntryInTree = (entries, entryId, updates) => {
  return entries.map(entry => {
    if (entry.id === entryId) return { ...entry, ...updates };
    if (entry.children?.length) return { ...entry, children: updateEntryInTree(entry.children, entryId, updates) };
    return entry;
  });
};

const addEntryToParent = (entries, parentId, newEntry) => {
  if (!parentId) return [...entries, newEntry];
  return entries.map(entry => {
    if (entry.id === parentId) return { ...entry, children: [...(entry.children || []), newEntry] };
    if (entry.children?.length) return { ...entry, children: addEntryToParent(entry.children, parentId, newEntry) };
    return entry;
  });
};

const deleteEntryFromTree = (entries, entryId) => {
  return entries.filter(entry => entry.id !== entryId).map(entry => {
    if (entry.children?.length) return { ...entry, children: deleteEntryFromTree(entry.children, entryId) };
    return entry;
  });
};

// ==================== 组件 ====================
const ContentRenderer = ({ content, allTitlesMap, currentBookId, onLinkClick, isReadOnly }) => {
  const processedContent = useMemo(() => {
    if (!content) return [];
    return content.split('\n').map((line, lineIndex) => {
      const parts = [];
      let key = 0;
      const segments = [];
      let lastIdx = 0;
      const combinedRegex = /(\*\*([^*]+)\*\*)|【([^】]+)】/g;
      let match;
      
      while ((match = combinedRegex.exec(line)) !== null) {
        if (match.index > lastIdx) segments.push({ type: 'text', content: line.slice(lastIdx, match.index) });
        if (match[1]) segments.push({ type: 'bold', content: match[2] });
        else if (match[3]) {
          const keyword = match[3];
          const linkTargets = allTitlesMap.get(keyword);
          segments.push({ type: 'keyword', content: keyword, isLinked: !!linkTargets?.length, targets: linkTargets || [] });
        }
        lastIdx = match.index + match[0].length;
      }
      if (lastIdx < line.length) segments.push({ type: 'text', content: line.slice(lastIdx) });
      
      segments.forEach((seg) => {
        if (seg.type === 'text') parts.push(<span key={key++}>{seg.content}</span>);
        else if (seg.type === 'bold') parts.push(<strong key={key++}>{seg.content}</strong>);
        else if (seg.type === 'keyword') {
          parts.push(
            <span key={key++} className={`keyword ${seg.isLinked ? 'linked' : ''} ${isReadOnly && seg.isLinked ? 'clickable' : ''}`}
              onClick={() => {
                if (isReadOnly && seg.isLinked) {
                  const sameBookTarget = seg.targets.find(t => t.bookId === currentBookId);
                  const target = sameBookTarget || seg.targets[0];
                  onLinkClick(seg.content, target.bookId, target.entry.id);
                }
              }}>【{seg.content}】</span>
          );
        }
      });
      return <p key={lineIndex} className="content-line">{parts.length > 0 ? parts : line || '\u00A0'}</p>;
    });
  }, [content, allTitlesMap, currentBookId, onLinkClick, isReadOnly]);
  return <div className="content-body">{processedContent}</div>;
};

const SidebarItem = ({ entry, depth = 0, onSelect, currentId, expandedIds, onToggle }) => {
  const hasChildren = entry.children?.length > 0 || Array.isArray(entry.children);
  const isExpanded = expandedIds.has(entry.id);
  return (
    <div className="sidebar-item-wrapper">
      <div className={`sidebar-item ${currentId === entry.id ? 'active' : ''}`} style={{ paddingLeft: `${12 + depth * 16}px` }} onClick={() => onSelect(entry)}>
        {hasChildren && <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`} onClick={(e) => { e.stopPropagation(); onToggle(entry.id); }}>›</span>}
        <span className="sidebar-icon">{hasChildren ? '📁' : '📄'}</span>
        <span className="sidebar-title">{entry.title}</span>
      </div>
      {hasChildren && isExpanded && entry.children.map(child => <SidebarItem key={child.id} entry={child} depth={depth + 1} onSelect={onSelect} currentId={currentId} expandedIds={expandedIds} onToggle={onToggle} />)}
    </div>
  );
};

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content confirm-modal" onClick={e => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onCancel}>取消</button>
          <button className="btn-danger" onClick={onConfirm}>确认删除</button>
        </div>
      </div>
    </div>
  );
};

const ContextMenu = ({ isOpen, position, onClose, options }) => {
  if (!isOpen) return null;
  return (
    <>
      <div className="context-overlay" onClick={onClose} />
      <div className="context-menu" style={{ top: position.y, left: Math.min(position.x, window.innerWidth - 180) }}>
        {options.map((opt, idx) => (
          <div key={idx} className={`context-item ${opt.danger ? 'danger' : ''}`} onClick={() => { opt.action(); onClose(); }}>
            <span className="context-icon">{opt.icon}</span>{opt.label}
          </div>
        ))}
      </div>
    </>
  );
};

const EntryModal = ({ isOpen, onClose, onSave, editingEntry, parentTitle, isFolder }) => {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [createAsFolder, setCreateAsFolder] = useState(false);
  const [linkable, setLinkable] = useState(true);
  
  useEffect(() => {
    if (editingEntry) { setTitle(editingEntry.title || ''); setSummary(editingEntry.summary || ''); setLinkable(editingEntry.linkable !== false); }
    else { setTitle(''); setSummary(''); setCreateAsFolder(isFolder || false); setLinkable(true); }
  }, [editingEntry, isOpen, isFolder]);
  
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>{editingEntry ? '编辑词条' : (createAsFolder ? '新建分类文件夹' : '新建词条')}</h3>
        {parentTitle && <p className="modal-hint">添加到: {parentTitle}</p>}
        <input type="text" placeholder="标题" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
        <input type="text" placeholder="简介（可选）" value={summary} onChange={e => setSummary(e.target.value)} />
        {!editingEntry && <label className="checkbox-label"><input type="checkbox" checked={createAsFolder} onChange={e => setCreateAsFolder(e.target.checked)} /><span>创建为分类文件夹</span></label>}
        <label className="checkbox-label"><input type="checkbox" checked={linkable} onChange={e => setLinkable(e.target.checked)} /><span>允许跨文档跳转</span></label>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>取消</button>
          <button className="btn-save" onClick={() => { if (title.trim()) { onSave({ title: title.trim(), summary: summary.trim(), isFolder: createAsFolder, linkable }); onClose(); } }} disabled={!title.trim()}>{editingEntry ? '保存' : '创建'}</button>
        </div>
      </div>
    </div>
  );
};

const BookModal = ({ isOpen, onClose, onSave, editingBook }) => {
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('📖');
  const [coverImage, setCoverImage] = useState(null);
  const fileInputRef = useRef(null);
  const emojis = ['📖', '🌙', '⭐', '🏯', '🗡️', '🌸', '🔮', '🐉', '🦋', '🌊', '🔥', '💎', '🌹', '🎭', '⚔️', '🏰'];
  
  useEffect(() => {
    if (editingBook) { setTitle(editingBook.title); setEmoji(editingBook.cover); setCoverImage(editingBook.coverImage); }
    else { setTitle(''); setEmoji('📖'); setCoverImage(null); }
  }, [editingBook, isOpen]);
  
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>{editingBook ? '编辑书籍' : '新建世界'}</h3>
        <input type="text" placeholder="世界名称" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
        <div className="cover-section">
          <p className="section-label">封面</p>
          {coverImage ? (
            <div className="cover-preview"><img src={coverImage} alt="封面" /><button className="remove-cover" onClick={() => setCoverImage(null)}>×</button></div>
          ) : (
            <>
              <div className="emoji-picker">{emojis.map(e => <span key={e} className={`emoji-option ${emoji === e ? 'selected' : ''}`} onClick={() => setEmoji(e)}>{e}</span>)}</div>
              <button className="upload-cover-btn" onClick={() => fileInputRef.current?.click()}>📷 上传封面</button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onload = ev => setCoverImage(ev.target.result); r.readAsDataURL(f); } }} style={{ display: 'none' }} />
            </>
          )}
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>取消</button>
          <button className="btn-save" onClick={() => { if (title.trim()) { onSave({ title: title.trim(), emoji, coverImage }); onClose(); } }} disabled={!title.trim()}>{editingBook ? '保存' : '创建'}</button>
        </div>
      </div>
    </div>
  );
};

const EditorToolbar = ({ onAction, onImageUpload }) => {
  const imageInputRef = useRef(null);
  return (
    <div className="editor-toolbar">
      <button onClick={() => onAction('indent')}>⇥ 缩进</button>
      <button onClick={() => onAction('bold')}><strong>B</strong> 加粗</button>
      <button onClick={() => onAction('keyword')}>【】关键词</button>
      <button onClick={() => imageInputRef.current?.click()}>🖼️ 图片</button>
      <input ref={imageInputRef} type="file" accept="image/*" onChange={onImageUpload} style={{ display: 'none' }} />
    </div>
  );
};

const AddMenu = ({ isOpen, onClose, onAddEntry, onAddFolder }) => {
  if (!isOpen) return null;
  return (
    <>
      <div className="add-menu-overlay" onClick={onClose} />
      <div className="add-menu">
        <div className="add-menu-item" onClick={() => { onAddFolder(); onClose(); }}><span className="add-menu-icon">📁</span><span>新建分类文件夹</span></div>
        <div className="add-menu-item" onClick={() => { onAddEntry(); onClose(); }}><span className="add-menu-icon">📄</span><span>新建词条</span></div>
      </div>
    </>
  );
};

// ==================== 主应用 ====================
export default function App() {
  const [data, setData] = useState(() => loadFromStorage() || initialData);
  const [currentBook, setCurrentBook] = useState(null);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [isReadOnly, setIsReadOnly] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [navigationStack, setNavigationStack] = useState([]);
  const [editContent, setEditContent] = useState('');
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editingBook, setEditingBook] = useState(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [contextMenu, setContextMenu] = useState({ isOpen: false, position: { x: 0, y: 0 }, options: [] });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [jumpHistory, setJumpHistory] = useState([]);
  const longPressTimer = useRef(null);
  const editorRef = useRef(null);
  const touchStartX = useRef(0);

  useEffect(() => { saveToStorage(data); }, [data]);
  
  const allTitlesMap = useMemo(() => collectAllLinkableTitles(data.books), [data.books]);

  useEffect(() => { if (currentBook) { const updated = data.books.find(b => b.id === currentBook.id); if (updated) setCurrentBook(updated); } }, [data]);
  useEffect(() => { if (currentEntry && currentBook) { const path = findEntryPath(currentBook.entries, currentEntry.id); if (path) setCurrentEntry(path[path.length - 1]); } }, [currentBook]);

  const handleLongPressStart = (e, type, item) => {
    const touch = e.touches ? e.touches[0] : e;
    const position = { x: touch.clientX, y: touch.clientY };
    longPressTimer.current = setTimeout(() => {
      const options = type === 'entry' ? [
        { icon: '✏️', label: '编辑', action: () => { setEditingEntry(item); setShowEntryModal(true); } },
        { icon: item.linkable !== false ? '🔗' : '🚫', label: item.linkable !== false ? '关闭跳转' : '开启跳转', action: () => {
          const updatedEntries = updateEntryInTree(currentBook.entries, item.id, { linkable: item.linkable === false });
          setData(prev => ({ ...prev, books: prev.books.map(b => b.id === currentBook.id ? { ...b, entries: updatedEntries } : b) }));
        }},
        { icon: '🗑️', label: '删除', danger: true, action: () => setConfirmModal({ isOpen: true, title: '确认删除', message: `删除「${item.title}」及其所有子词条？`, onConfirm: () => {
          const updatedEntries = deleteEntryFromTree(currentBook.entries, item.id);
          setData(prev => ({ ...prev, books: prev.books.map(b => b.id === currentBook.id ? { ...b, entries: updatedEntries } : b) }));
          if (currentEntry?.id === item.id) handleBack();
          setConfirmModal({ isOpen: false });
        }})}
      ] : [
        { icon: '✏️', label: '编辑', action: () => { setEditingBook(item); setShowBookModal(true); } },
        { icon: '🗑️', label: '删除', danger: true, action: () => setConfirmModal({ isOpen: true, title: '确认删除', message: `删除「${item.title}」及全部内容？`, onConfirm: () => { setData(prev => ({ ...prev, books: prev.books.filter(b => b.id !== item.id) })); setConfirmModal({ isOpen: false }); }})}
      ];
      setContextMenu({ isOpen: true, position, options });
    }, 500);
  };

  const handleLongPressEnd = () => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } };

  const handleBookSelect = (book) => { setCurrentBook(book); setCurrentEntry(null); setViewMode('list'); setNavigationStack([]); };
  const handleBackToShelf = () => { if (!isReadOnly && currentEntry && viewMode === 'single') handleSaveContent(); setCurrentBook(null); setCurrentEntry(null); setViewMode('list'); setNavigationStack([]); setIsSidebarOpen(false); setJumpHistory([]); };

  const handleEntryClick = (entry) => {
    const hasChildren = entry.children?.length > 0 || Array.isArray(entry.children);
    setNavigationStack(prev => [...prev, currentEntry].filter(Boolean));
    setCurrentEntry(entry);
    if (hasChildren) setViewMode('list');
    else { setViewMode('single'); setEditContent(entry.content || ''); }
  };

  const handleBack = () => {
    if (!isReadOnly && currentEntry && viewMode === 'single') handleSaveContent();
    if (navigationStack.length > 0) { const prev = navigationStack[navigationStack.length - 1]; setNavigationStack(s => s.slice(0, -1)); setCurrentEntry(prev); setViewMode(prev ? 'list' : 'list'); }
    else { setCurrentEntry(null); setViewMode('list'); }
  };

  const handleJumpBack = () => {
    if (jumpHistory.length > 0) {
      const last = jumpHistory[jumpHistory.length - 1];
      setJumpHistory(prev => prev.slice(0, -1));
      const book = data.books.find(b => b.id === last.bookId);
      if (book) { setCurrentBook(book); setNavigationStack(last.navStack); setCurrentEntry(last.entry); setViewMode(last.viewMode); if (last.entry?.content) setEditContent(last.entry.content); }
    }
  };

  const handleSidebarSelect = (entry) => {
    const path = findEntryPath(currentBook.entries, entry.id);
    if (path) { setNavigationStack(path.slice(0, -1)); setCurrentEntry(entry); const hasChildren = entry.children?.length > 0 || Array.isArray(entry.children); if (hasChildren) setViewMode('list'); else { setViewMode('single'); setEditContent(entry.content || ''); } }
    setIsSidebarOpen(false);
  };

  const handleLinkClick = useCallback((keyword, targetBookId, targetEntryId) => {
    setJumpHistory(prev => [...prev, { bookId: currentBook.id, entry: currentEntry, navStack: navigationStack, viewMode }]);
    const targetBook = data.books.find(b => b.id === targetBookId);
    if (targetBook) {
      setCurrentBook(targetBook);
      const path = findEntryPath(targetBook.entries, targetEntryId);
      if (path) { const targetEntry = path[path.length - 1]; setNavigationStack(path.slice(0, -1)); setCurrentEntry(targetEntry); const hasChildren = targetEntry.children?.length > 0 || Array.isArray(targetEntry.children); if (hasChildren) setViewMode('list'); else { setViewMode('single'); setEditContent(targetEntry.content || ''); } }
    }
  }, [currentBook, currentEntry, navigationStack, viewMode, data.books]);

  const handleSaveContent = () => {
    if (!currentEntry || !currentBook) return;
    const updatedEntries = updateEntryInTree(currentBook.entries, currentEntry.id, { content: editContent });
    setData(prev => ({ ...prev, books: prev.books.map(b => b.id === currentBook.id ? { ...b, entries: updatedEntries, lastEdited: new Date().toISOString() } : b) }));
  };

  const handleAddEntry = (entryData) => {
    const newEntry = { id: generateId(), title: entryData.title, summary: entryData.summary || '', content: '', linkable: entryData.linkable, children: entryData.isFolder ? [] : undefined };
    const parentId = currentEntry?.id || null;
    const updatedEntries = addEntryToParent(currentBook.entries, parentId, newEntry);
    setData(prev => ({ ...prev, books: prev.books.map(b => b.id === currentBook.id ? { ...b, entries: updatedEntries, lastEdited: new Date().toISOString() } : b) }));
  };

  const handleUpdateEntry = (entryData) => {
    if (!editingEntry) return;
    const updatedEntries = updateEntryInTree(currentBook.entries, editingEntry.id, { title: entryData.title, summary: entryData.summary, linkable: entryData.linkable });
    setData(prev => ({ ...prev, books: prev.books.map(b => b.id === currentBook.id ? { ...b, entries: updatedEntries } : b) }));
    setEditingEntry(null);
  };

  const handleAddBook = ({ title, emoji, coverImage }) => {
    if (editingBook) { setData(prev => ({ ...prev, books: prev.books.map(b => b.id === editingBook.id ? { ...b, title, cover: emoji, coverImage, lastEdited: new Date().toISOString() } : b) })); setEditingBook(null); }
    else { const colors = ['#2D3047', '#1A1A2E', '#4A0E0E', '#0E4A2D', '#3D2E4A', '#4A3D0E']; setData(prev => ({ ...prev, books: [...prev.books, { id: generateId(), title, cover: emoji, coverImage, color: colors[Math.floor(Math.random() * colors.length)], lastEdited: new Date().toISOString(), entries: [] }] })); }
  };

  const handleEditorAction = (action) => {
    const textarea = editorRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart, end = textarea.selectionEnd, text = editContent, selectedText = text.substring(start, end);
    let newText = text, newCursorPos = end;
    if (action === 'indent') { const lineStart = text.lastIndexOf('\n', start - 1) + 1; newText = text.substring(0, lineStart) + '　　' + text.substring(lineStart); newCursorPos = start + 2; }
    else if (action === 'bold') { if (selectedText) { newText = text.substring(0, start) + '**' + selectedText + '**' + text.substring(end); newCursorPos = end + 4; } else { newText = text.substring(0, start) + '****' + text.substring(end); newCursorPos = start + 2; } }
    else if (action === 'keyword') { if (selectedText) { newText = text.substring(0, start) + '【' + selectedText + '】' + text.substring(end); newCursorPos = end + 2; } else { newText = text.substring(0, start) + '【】' + text.substring(end); newCursorPos = start + 1; } }
    setEditContent(newText);
    setTimeout(() => { textarea.focus(); textarea.setSelectionRange(newCursorPos, newCursorPos); }, 0);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) { const reader = new FileReader(); reader.onload = (event) => { const start = editorRef.current?.selectionStart || editContent.length; setEditContent(editContent.substring(0, start) + `\n[图片]\n` + editContent.substring(start)); }; reader.readAsDataURL(file); }
  };

  const handleTouchStart = (e, entry) => { touchStartX.current = e.touches[0].clientX; handleLongPressStart(e, 'entry', entry); };
  const handleTouchEnd = (e, entry) => {
    handleLongPressEnd();
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (deltaX < -80) { setNavigationStack(prev => [...prev, currentEntry].filter(Boolean)); setCurrentEntry(entry); setViewMode('merged'); }
  };

  const currentEntries = currentEntry?.children || currentBook?.entries || [];
  const mergedContents = viewMode === 'merged' && currentEntry ? getAllChildContent(currentEntry) : [];

  if (!currentBook) {
    return (
      <div className="app bookshelf-view">
        <header className="bookshelf-header"><h1>灵感穹顶</h1><p className="subtitle">收集你的创作宇宙</p></header>
        <div className="bookshelf">
          {data.books.map(book => (
            <div key={book.id} className="book-card" style={{ '--book-color': book.color }} onClick={() => handleBookSelect(book)}
              onTouchStart={(e) => handleLongPressStart(e, 'book', book)} onTouchEnd={handleLongPressEnd} onTouchMove={handleLongPressEnd}
              onMouseDown={(e) => handleLongPressStart(e, 'book', book)} onMouseUp={handleLongPressEnd} onMouseLeave={handleLongPressEnd}>
              <div className="book-spine"></div>
              <div className="book-cover">
                {book.coverImage ? <img src={book.coverImage} alt={book.title} className="cover-image" /> : <span className="book-emoji">{book.cover}</span>}
                <h2 className="book-title">{book.title}</h2>
              </div>
              <div className="book-shadow"></div>
            </div>
          ))}
          <div className="book-card add-book" onClick={() => { setEditingBook(null); setShowBookModal(true); }}><div className="book-cover"><span className="add-icon">+</span><span className="add-text">新建世界</span></div></div>
        </div>
        <BookModal isOpen={showBookModal} onClose={() => { setShowBookModal(false); setEditingBook(null); }} onSave={handleAddBook} editingBook={editingBook} />
        <ContextMenu isOpen={contextMenu.isOpen} position={contextMenu.position} onClose={() => setContextMenu({ ...contextMenu, isOpen: false })} options={contextMenu.options} />
        <ConfirmModal isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message} onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal({ isOpen: false })} />
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className="app main-view">
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header"><h2>{currentBook.title}</h2><button className="close-sidebar" onClick={() => setIsSidebarOpen(false)}>×</button></div>
        <div className="sidebar-content">{currentBook.entries.map(entry => <SidebarItem key={entry.id} entry={entry} onSelect={handleSidebarSelect} currentId={currentEntry?.id} expandedIds={expandedIds} onToggle={id => setExpandedIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; })} />)}</div>
      </div>
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}
      
      <div className="main-content">
        <header className="top-bar">
          <div className="top-left">
            <button className="icon-btn" onClick={() => setIsSidebarOpen(true)}>☰</button>
            {jumpHistory.length > 0 && <button className="icon-btn jump-back-btn" onClick={handleJumpBack}>↩️</button>}
            {(currentEntry || navigationStack.length > 0) && <button className="icon-btn" onClick={handleBack}>←</button>}
            <button className="icon-btn" onClick={handleBackToShelf}>🏠</button>
          </div>
          <div className="breadcrumb"><span className="book-name" onClick={handleBackToShelf}>{currentBook.title}</span>{currentEntry && <><span className="separator">/</span><span className="current-title">{currentEntry.title}</span></>}</div>
          <div className="top-right">
            <div className="read-mode-toggle" onClick={() => { if (!isReadOnly && currentEntry && viewMode === 'single') handleSaveContent(); setIsReadOnly(!isReadOnly); }}>
              <span className={`toggle-label ${isReadOnly ? 'active' : ''}`}>阅读</span>
              <div className={`toggle-switch ${!isReadOnly ? 'edit-mode' : ''}`}><div className="toggle-knob" /></div>
              <span className={`toggle-label ${!isReadOnly ? 'active' : ''}`}>编辑</span>
            </div>
          </div>
        </header>
        
        <main className="content-area">
          {viewMode === 'list' && (
            <div className="entry-list">
              {currentEntry && <div className="list-header"><h1>{currentEntry.title}</h1><p className="summary">{currentEntry.summary}</p></div>}
              <p className="swipe-hint">💡 左滑查看合并视图 · 长按编辑/删除</p>
              {currentEntries.map(entry => (
                <div key={entry.id} className={`entry-card ${entry.linkable === false ? 'not-linkable' : ''}`}
                  onClick={() => handleEntryClick(entry)}
                  onTouchStart={(e) => handleTouchStart(e, entry)} onTouchEnd={(e) => handleTouchEnd(e, entry)} onTouchMove={handleLongPressEnd}
                  onMouseDown={(e) => handleLongPressStart(e, 'entry', entry)} onMouseUp={handleLongPressEnd} onMouseLeave={handleLongPressEnd}>
                  <div className="entry-icon">{entry.children?.length > 0 || Array.isArray(entry.children) ? '📁' : '📄'}</div>
                  <div className="entry-info"><h3 className="entry-title">{entry.title}{entry.linkable === false && <span className="no-link-badge">🚫</span>}</h3><p className="entry-summary">{entry.summary}</p></div>
                  <div className="entry-arrow">›</div>
                </div>
              ))}
              {currentEntries.length === 0 && <div className="empty-state"><span className="empty-icon">✨</span><p>这里还是一片空白</p><p className="empty-hint">点击右下角添加</p></div>}
            </div>
          )}
          
          {viewMode === 'single' && currentEntry && (
            <div className="single-view">
              <div className="content-header"><h1>{currentEntry.title}</h1>{!isReadOnly && <button className="edit-meta-btn" onClick={() => { setEditingEntry(currentEntry); setShowEntryModal(true); }}>✏️ 编辑</button>}</div>
              {isReadOnly ? <ContentRenderer content={currentEntry.content} allTitlesMap={allTitlesMap} currentBookId={currentBook.id} onLinkClick={handleLinkClick} isReadOnly={isReadOnly} /> : (
                <><EditorToolbar onAction={handleEditorAction} onImageUpload={handleImageUpload} /><textarea ref={editorRef} className="content-editor" value={editContent} onChange={(e) => setEditContent(e.target.value)} placeholder="记录灵感...&#10;【】包裹关键词 · **加粗**" /></>
              )}
            </div>
          )}
          
          {viewMode === 'merged' && currentEntry && (
            <div className="merged-view">
              <div className="content-header merged-header"><h1>{currentEntry.title}</h1><p className="merged-hint">📖 合并视图</p></div>
              {mergedContents.map((item, index) => (
                <div key={item.id} className="merged-section">
                  <div className="section-title" onClick={() => handleSidebarSelect(item)}><span className="section-bullet">·</span>{item.title}</div>
                  <ContentRenderer content={item.content} allTitlesMap={allTitlesMap} currentBookId={currentBook.id} onLinkClick={handleLinkClick} isReadOnly={true} />
                  {index < mergedContents.length - 1 && <div className="section-divider" />}
                </div>
              ))}
              {mergedContents.length === 0 && <div className="empty-state"><p>暂无内容</p></div>}
            </div>
          )}
        </main>
        
        <button className={`fab ${showAddMenu ? 'active' : ''}`} onClick={() => setShowAddMenu(!showAddMenu)}><span style={{ transform: showAddMenu ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</span></button>
        <AddMenu isOpen={showAddMenu} onClose={() => setShowAddMenu(false)} onAddEntry={() => { setEditingEntry(null); setIsCreatingFolder(false); setShowEntryModal(true); }} onAddFolder={() => { setEditingEntry(null); setIsCreatingFolder(true); setShowEntryModal(true); }} />
      </div>
      
      <EntryModal isOpen={showEntryModal} onClose={() => { setShowEntryModal(false); setEditingEntry(null); }} onSave={editingEntry ? handleUpdateEntry : handleAddEntry} editingEntry={editingEntry} parentTitle={currentEntry?.title} isFolder={isCreatingFolder} />
      <ContextMenu isOpen={contextMenu.isOpen} position={contextMenu.position} onClose={() => setContextMenu({ ...contextMenu, isOpen: false })} options={contextMenu.options} />
      <ConfirmModal isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message} onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal({ isOpen: false })} />
      <style>{styles}</style>
    </div>
  );
}

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&family=ZCOOL+XiaoWei&display=swap');
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body,#root{height:100%;overflow:hidden}
.app{height:100%;font-family:'Noto Serif SC',serif;overflow-y:auto;-webkit-overflow-scrolling:touch}
.bookshelf-view{background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f0f23 100%);padding:60px 20px;min-height:100%}
.bookshelf-header{text-align:center;margin-bottom:50px}
.bookshelf-header h1{font-family:'ZCOOL XiaoWei',serif;font-size:2.5rem;color:#f4e4c1;letter-spacing:.3em;text-shadow:0 0 40px rgba(244,228,193,.3);margin-bottom:12px}
.subtitle{color:rgba(244,228,193,.5);font-size:.9rem;letter-spacing:.2em}
.bookshelf{display:flex;flex-wrap:wrap;gap:30px;justify-content:center;max-width:1200px;margin:0 auto}
.book-card{position:relative;width:140px;height:200px;cursor:pointer;perspective:1000px;transition:transform .3s;user-select:none}
.book-card:active{transform:scale(.95)}
.book-spine{position:absolute;left:0;top:0;width:15px;height:100%;background:var(--book-color,#2D3047);border-radius:3px 0 0 3px;transform:rotateY(-30deg) translateX(-8px);transform-origin:right center;box-shadow:-5px 0 15px rgba(0,0,0,.3)}
.book-cover{position:absolute;width:100%;height:100%;background:linear-gradient(145deg,var(--book-color,#2D3047) 0%,color-mix(in srgb,var(--book-color,#2D3047) 70%,black) 100%);border-radius:0 8px 8px 0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;box-shadow:5px 5px 20px rgba(0,0,0,.4),inset -2px 0 10px rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);overflow:hidden}
.cover-image{position:absolute;width:100%;height:100%;object-fit:cover}
.book-emoji{font-size:3rem;filter:drop-shadow(0 0 10px rgba(255,255,255,.3))}
.book-title{color:#f4e4c1;font-size:1rem;text-align:center;padding:0 15px;text-shadow:0 2px 4px rgba(0,0,0,.3);position:relative;z-index:1}
.book-shadow{position:absolute;bottom:-15px;left:10%;width:80%;height:15px;background:radial-gradient(ellipse,rgba(0,0,0,.4) 0%,transparent 70%)}
.add-book{opacity:.5;transition:opacity .3s}
.add-book:active{opacity:.8}
.add-book .book-cover{background:linear-gradient(145deg,#2a2a3e 0%,#1a1a2e 100%);border:2px dashed rgba(244,228,193,.3)}
.add-icon{font-size:2.5rem;color:rgba(244,228,193,.5)}
.add-text{color:rgba(244,228,193,.5);font-size:.85rem}
.main-view{background:linear-gradient(180deg,#faf8f3 0%,#f5f0e8 100%);position:relative;display:flex;flex-direction:column}
.sidebar{position:fixed;left:0;top:0;width:280px;max-width:85vw;height:100%;background:linear-gradient(180deg,#2D3047 0%,#1a1a2e 100%);z-index:1000;transform:translateX(-100%);transition:transform .3s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column;box-shadow:5px 0 30px rgba(0,0,0,.3)}
.sidebar.open{transform:translateX(0)}
.sidebar-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:999;backdrop-filter:blur(2px)}
.sidebar-header{padding:20px 16px;border-bottom:1px solid rgba(244,228,193,.1);display:flex;justify-content:space-between;align-items:center;flex-shrink:0}
.sidebar-header h2{color:#f4e4c1;font-size:1.2rem;font-family:'ZCOOL XiaoWei',serif}
.close-sidebar{background:none;border:none;color:rgba(244,228,193,.6);font-size:1.5rem;cursor:pointer;padding:4px 8px}
.sidebar-content{flex:1;overflow-y:auto;padding:12px 0;-webkit-overflow-scrolling:touch}
.sidebar-item-wrapper{user-select:none}
.sidebar-item{display:flex;align-items:center;padding:12px 16px;color:rgba(244,228,193,.8);cursor:pointer;transition:all .2s;gap:8px}
.sidebar-item:active{background:rgba(244,228,193,.15)}
.sidebar-item.active{background:rgba(244,228,193,.15);color:#f4e4c1}
.expand-icon{font-size:.9rem;transition:transform .2s;width:16px;text-align:center}
.expand-icon.expanded{transform:rotate(90deg)}
.sidebar-icon{font-size:.9rem}
.sidebar-title{font-size:.9rem}
.top-bar{position:sticky;top:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:rgba(250,248,243,.95);backdrop-filter:blur(10px);border-bottom:1px solid rgba(45,48,71,.1);flex-shrink:0}
.top-left{display:flex;gap:4px}
.icon-btn{background:none;border:none;font-size:1.2rem;cursor:pointer;padding:8px;border-radius:8px;transition:all .2s;color:#2D3047}
.icon-btn:active{background:rgba(45,48,71,.1)}
.jump-back-btn{background:rgba(139,115,85,.1);color:#8B7355}
.breadcrumb{display:flex;align-items:center;gap:6px;font-size:.85rem;color:#666;flex:1;justify-content:center;overflow:hidden}
.book-name{color:#2D3047;font-weight:600;cursor:pointer;white-space:nowrap}
.separator{color:#ccc}
.current-title{color:#8B7355;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.top-right{display:flex;align-items:center}
.read-mode-toggle{display:flex;align-items:center;gap:6px;cursor:pointer;padding:4px 8px;border-radius:16px;background:rgba(45,48,71,.05)}
.toggle-label{font-size:.75rem;color:#999;transition:color .2s}
.toggle-label.active{color:#2D3047;font-weight:600}
.toggle-switch{width:36px;height:20px;background:#2D3047;border-radius:10px;position:relative;transition:background .3s}
.toggle-switch.edit-mode{background:#8B7355}
.toggle-knob{position:absolute;left:2px;top:2px;width:16px;height:16px;background:#f4e4c1;border-radius:50%;transition:transform .3s;box-shadow:0 2px 4px rgba(0,0,0,.2)}
.toggle-switch.edit-mode .toggle-knob{transform:translateX(16px)}
.content-area{padding:20px 16px;padding-bottom:100px;flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch}
.list-header{margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid rgba(45,48,71,.1)}
.list-header h1{font-family:'ZCOOL XiaoWei',serif;font-size:1.6rem;color:#2D3047;margin-bottom:6px}
.list-header .summary{color:#8B7355;font-size:.9rem}
.swipe-hint{font-size:.8rem;color:#999;text-align:center;margin-bottom:16px}
.entry-list{display:flex;flex-direction:column;gap:10px}
.entry-card{display:flex;align-items:center;gap:12px;padding:16px;background:#fff;border-radius:12px;cursor:pointer;transition:all .2s;box-shadow:0 2px 8px rgba(45,48,71,.08);border:1px solid rgba(45,48,71,.05);user-select:none}
.entry-card.not-linkable{border-left:3px solid #ccc}
.entry-card:active{transform:scale(.98);box-shadow:0 1px 4px rgba(45,48,71,.1)}
.entry-icon{font-size:1.3rem}
.entry-info{flex:1;min-width:0}
.entry-title{font-size:1rem;color:#2D3047;margin-bottom:2px;font-weight:600;display:flex;align-items:center;gap:6px}
.no-link-badge{font-size:.7rem;opacity:.6}
.entry-summary{font-size:.8rem;color:#8B7355;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.entry-arrow{font-size:1.3rem;color:#ccc}
.single-view,.merged-view{background:#fff;border-radius:16px;padding:24px 20px;box-shadow:0 4px 20px rgba(45,48,71,.1)}
.content-header{margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid rgba(45,48,71,.1);display:flex;justify-content:space-between;align-items:center}
.content-header h1{font-family:'ZCOOL XiaoWei',serif;font-size:1.6rem;color:#2D3047}
.edit-meta-btn{background:none;border:1px solid #ddd;padding:6px 12px;border-radius:6px;font-size:.8rem;color:#666;cursor:pointer}
.merged-header{text-align:center;display:block}
.merged-hint{color:#8B7355;font-size:.85rem;margin-top:6px}
.content-body{line-height:1.9;color:#333;font-size:.95rem}
.content-line{margin-bottom:.4em;text-align:justify}
.keyword{color:#2D3047;font-weight:600}
.keyword.linked{color:#8B7355;background:linear-gradient(180deg,transparent 60%,rgba(139,115,85,.2) 60%)}
.keyword.clickable{cursor:pointer}
.keyword.clickable:active{color:#6B5335;background:linear-gradient(180deg,transparent 60%,rgba(139,115,85,.4) 60%)}
.editor-toolbar{display:flex;gap:8px;padding:12px;background:#f5f5f5;border-radius:8px;margin-bottom:12px;flex-wrap:wrap}
.editor-toolbar button{background:#fff;border:1px solid #ddd;padding:8px 12px;border-radius:6px;font-size:.85rem;cursor:pointer;display:flex;align-items:center;gap:4px;transition:all .2s}
.editor-toolbar button:active{background:#eee}
.content-editor{width:100%;min-height:300px;padding:16px;border:2px solid rgba(45,48,71,.1);border-radius:12px;font-family:'Noto Serif SC',serif;font-size:.95rem;line-height:1.9;resize:vertical;transition:border-color .2s}
.content-editor:focus{outline:none;border-color:#8B7355}
.merged-section{margin-bottom:28px}
.section-title{font-size:1.2rem;color:#2D3047;font-weight:600;margin-bottom:12px;cursor:pointer;display:flex;align-items:center;gap:6px}
.section-bullet{font-size:1.8rem;line-height:1}
.section-divider{height:1px;background:linear-gradient(90deg,transparent,rgba(45,48,71,.2),transparent);margin:28px 0}
.empty-state{text-align:center;padding:60px 20px;color:#999}
.empty-icon{font-size:2.5rem;display:block;margin-bottom:12px}
.empty-hint{font-size:.85rem;margin-top:6px}
.fab{position:fixed;right:24px;bottom:24px;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#2D3047,#1a1a2e);border:none;color:#f4e4c1;font-size:1.8rem;cursor:pointer;box-shadow:0 4px 20px rgba(45,48,71,.4);display:flex;align-items:center;justify-content:center;z-index:50;transition:transform .2s,background .2s}
.fab:active,.fab.active{transform:scale(.9)}
.fab.active{background:linear-gradient(135deg,#8B7355,#6B5335)}
.add-menu-overlay{position:fixed;inset:0;z-index:48}
.add-menu{position:fixed;right:24px;bottom:90px;background:#fff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,.15);overflow:hidden;z-index:49;animation:slideUp .2s}
@keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.add-menu-item{display:flex;align-items:center;gap:12px;padding:16px 20px;cursor:pointer;transition:background .2s}
.add-menu-item:active{background:#f5f5f5}
.add-menu-item:not(:last-child){border-bottom:1px solid #eee}
.add-menu-icon{font-size:1.3rem}
.context-overlay{position:fixed;inset:0;z-index:1998}
.context-menu{position:fixed;background:#fff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,.2);overflow:hidden;z-index:1999;min-width:160px;animation:fadeIn .15s}
@keyframes fadeIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
.context-item{display:flex;align-items:center;gap:12px;padding:14px 18px;cursor:pointer;transition:background .2s;font-size:.95rem}
.context-item:active{background:#f5f5f5}
.context-item.danger{color:#e53935}
.context-item:not(:last-child){border-bottom:1px solid #eee}
.context-icon{font-size:1.1rem}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:2000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(2px)}
.modal-content{background:#fff;border-radius:16px;padding:24px;width:100%;max-width:360px;box-shadow:0 20px 60px rgba(0,0,0,.3);max-height:80vh;overflow-y:auto}
.modal-content h3{font-family:'ZCOOL XiaoWei',serif;font-size:1.3rem;color:#2D3047;margin-bottom:16px;text-align:center}
.confirm-modal p{text-align:center;color:#666;margin-bottom:20px;line-height:1.6}
.modal-hint{font-size:.85rem;color:#8B7355;margin-bottom:16px;text-align:center}
.modal-content input[type="text"]{width:100%;padding:12px 16px;border:2px solid rgba(45,48,71,.1);border-radius:10px;font-family:'Noto Serif SC',serif;font-size:1rem;margin-bottom:12px;transition:border-color .2s}
.modal-content input[type="text"]:focus{outline:none;border-color:#8B7355}
.checkbox-label{display:flex;align-items:center;gap:10px;margin-bottom:12px;cursor:pointer;font-size:.9rem;color:#666}
.checkbox-label input{width:18px;height:18px;accent-color:#8B7355}
.section-label{font-size:.85rem;color:#666;margin-bottom:10px}
.cover-section{margin-bottom:16px}
.cover-preview{position:relative;width:100%;height:150px;border-radius:10px;overflow:hidden;margin-bottom:12px}
.cover-preview img{width:100%;height:100%;object-fit:cover}
.remove-cover{position:absolute;top:8px;right:8px;width:28px;height:28px;border-radius:50%;background:rgba(0,0,0,.6);color:#fff;border:none;font-size:1.2rem;cursor:pointer;display:flex;align-items:center;justify-content:center}
.upload-cover-btn{width:100%;padding:12px;border:2px dashed rgba(45,48,71,.2);border-radius:10px;background:none;color:#666;font-size:.9rem;cursor:pointer;margin-top:12px}
.emoji-picker{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.emoji-option{font-size:1.8rem;padding:8px;border-radius:8px;cursor:pointer;transition:all .2s}
.emoji-option.selected{background:rgba(139,115,85,.2);transform:scale(1.1)}
.modal-actions{display:flex;gap:12px;margin-top:16px}
.btn-cancel,.btn-save,.btn-danger{flex:1;padding:12px;border-radius:10px;font-family:'Noto Serif SC',serif;font-size:1rem;cursor:pointer;transition:all .2s}
.btn-cancel{background:none;border:2px solid rgba(45,48,71,.2);color:#666}
.btn-save{background:linear-gradient(135deg,#2D3047,#1a1a2e);border:none;color:#f4e4c1}
.btn-danger{background:#e53935;border:none;color:#fff}
.btn-save:disabled{opacity:.5}
::-webkit-scrollbar{width:6px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:rgba(45,48,71,.2);border-radius:3px}
.sidebar ::-webkit-scrollbar-thumb{background:rgba(244,228,193,.2)}
`;
