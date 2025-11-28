import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// ==================== 本地存储 ====================
const STORAGE_KEY = 'inspiration-vault-data';
const saveToStorage = (data) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { console.error('保存失败:', e); } };
const loadFromStorage = () => { try { const saved = localStorage.getItem(STORAGE_KEY); return saved ? JSON.parse(saved) : null; } catch (e) { return null; } };

// ==================== 初始数据 ====================
const initialData = {
  books: [
    {
      id: 'fortuna',
      title: 'Fortuna',
      author: '桐青璃落',
      tags: ['奇幻', '西方'],
      cover: '🌙',
      coverImage: null,
      color: '#2D3047',
      showStats: true,
      entries: [
        {
          id: 'worldview',
          title: '世界观',
          summary: '关于这个世界',
          content: '',
          isFolder: true,
          linkable: false,
          children: [
            {
              id: 'religion',
              title: '宗教',
              summary: '神祇与信仰体系',
              content: '',
              isFolder: true,
              linkable: false,
              children: [
                { id: 'ten-days', title: '十日旧约', summary: '创世的古老传说', linkable: true, isFolder: false,
                  content: '　　在时间的起点，当虚空尚未分离出光明与黑暗，女神独自漂浮于无尽的寂静之中。\n\n　　第一日，她从心火中分离出【火的守望】。\n　　第二日，她从泪水中分离出【水的祝福】。\n　　第三日，她从躯体中分离出【地的生灵】。\n　　第四日，她从呼吸中分离出【风的歌谣】。', children: [] },
                { id: 'war-gods', title: '战争双神', summary: '胜利与牺牲', linkable: true, isFolder: false,
                  content: '　　**胜利者·凯洛斯**，身披金色战甲。\n\n　　**牺牲者·赛莲娜**，身着银色长袍。', children: [] }
              ]
            },
            {
              id: 'geography',
              title: '地理',
              summary: '大陆与疆域',
              content: '',
              isFolder: true,
              linkable: false,
              children: [
                { id: 'koltra', title: '柯尔特拉', summary: '中央王国', linkable: true, isFolder: true,
                  content: '　　柯尔特拉位于大陆正中央，被称为"女神的掌心"。', 
                  children: [
                    { id: 'silver-city', title: '银冠城', summary: '首都', linkable: true, isFolder: false, content: '　　首都建立在白色岩石上，城中有【千年图书馆】。', children: [] }
                  ] },
                { id: 'northland', title: '北境', summary: '冰雪王国', linkable: true, isFolder: false,
                  content: '　　北境是永恒冬季笼罩的土地，居民是【霜裔】后代。', children: [] }
              ]
            }
          ]
        },
        {
          id: 'characters',
          title: '人物',
          summary: '故事中的灵魂',
          content: '',
          isFolder: true,
          linkable: false,
          children: [
            { id: 'elena', title: '艾琳娜', summary: '流亡公主', linkable: true, isFolder: false,
              content: '　　艾琳娜是【柯尔特拉】末代国王的独生女。她在【千年图书馆】长大，对【十日旧约】研究深入。', children: [] }
          ]
        }
      ]
    },
    {
      id: 'jade-book',
      title: '玉辞',
      author: '桐青璃落',
      tags: ['古风', '东方'],
      cover: '🏯',
      coverImage: null,
      color: '#4A0E0E',
      showStats: true,
      entries: [
        { id: 'jade-chars', title: '人物', summary: '江湖儿女', content: '　　曾有异世旅人【艾琳娜】短暂停留……', isFolder: true, linkable: false, children: [] }
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
      if (entry.linkable) {
        if (!titleMap.has(entry.title)) titleMap.set(entry.title, []);
        titleMap.get(entry.title).push({ bookId, bookTitle, entry });
      }
      if (entry.children?.length) collect(entry.children, bookId, bookTitle);
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

const findEntryById = (entries, id) => {
  for (const entry of entries) {
    if (entry.id === id) return entry;
    if (entry.children?.length) {
      const found = findEntryById(entry.children, id);
      if (found) return found;
    }
  }
  return null;
};

const getAllChildContent = (entry) => {
  let contents = [];
  const collect = (e) => {
    contents.push(e);
    if (e.children?.length) e.children.forEach(child => collect(child));
  };
  if (entry.children?.length) entry.children.forEach(child => collect(child));
  else contents.push(entry);
  return contents.filter(c => c.content || c.isFolder === false);
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

const countWords = (entries) => {
  let count = 0;
  const traverse = (items) => {
    items.forEach(item => {
      if (item.content) count += item.content.replace(/\s/g, '').length;
      if (item.children?.length) traverse(item.children);
    });
  };
  traverse(entries);
  return count;
};

const countEntries = (entries) => {
  let count = 0;
  const traverse = (items) => {
    items.forEach(item => {
      if (!item.isFolder) count++;
      if (item.children?.length) traverse(item.children);
    });
  };
  traverse(entries);
  return count;
};

// ==================== 富文本渲染 ====================
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
      
      // 处理图片标记
      if (line.startsWith('[IMG:')) {
        const imgData = line.slice(5, -1);
        return <div key={lineIndex} className="content-image"><img src={imgData} alt="" /></div>;
      }
      
      return <p key={lineIndex} className="content-line">{parts.length > 0 ? parts : line || '\u00A0'}</p>;
    });
  }, [content, allTitlesMap, currentBookId, onLinkClick, isReadOnly]);
  return <div className="content-body">{processedContent}</div>;
};

// ==================== 石墨风格编辑工具栏 ====================
const EditorToolbar = ({ onAction, onImageUpload, visible }) => {
  const imageInputRef = useRef(null);
  if (!visible) return null;
  
  return (
    <div className="editor-toolbar-bottom">
      <button onClick={() => onAction('indent')} title="缩进">⇥</button>
      <button onClick={() => onAction('bold')} title="加粗"><strong>B</strong></button>
      <button onClick={() => onAction('keyword')} title="关键词">【】</button>
      <button onClick={() => onAction('bullet')} title="新建子词条">·</button>
      <button onClick={() => imageInputRef.current?.click()} title="图片">🖼</button>
      <input ref={imageInputRef} type="file" accept="image/*" onChange={onImageUpload} style={{ display: 'none' }} />
    </div>
  );
};

// ==================== 侧边栏 ====================
const SidebarItem = ({ entry, depth = 0, onSelect, currentId, expandedIds, onToggle }) => {
  const hasChildren = entry.children?.length > 0;
  const isExpanded = expandedIds.has(entry.id);
  return (
    <div className="sidebar-item-wrapper">
      <div className={`sidebar-item ${currentId === entry.id ? 'active' : ''}`} style={{ paddingLeft: `${12 + depth * 16}px` }} onClick={() => onSelect(entry)}>
        {hasChildren && <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`} onClick={(e) => { e.stopPropagation(); onToggle(entry.id); }}>›</span>}
        <span className="sidebar-icon">{entry.isFolder ? '📁' : '📄'}</span>
        <span className="sidebar-title">{entry.title}</span>
        {entry.linkable && <span className="link-star">⭐</span>}
      </div>
      {hasChildren && isExpanded && entry.children.map(child => <SidebarItem key={child.id} entry={child} depth={depth + 1} onSelect={onSelect} currentId={currentId} expandedIds={expandedIds} onToggle={onToggle} />)}
    </div>
  );
};

// ==================== 弹窗组件 ====================
const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content confirm-modal" onClick={e => e.stopPropagation()}>
        <h3>{title}</h3><p>{message}</p>
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
  
  useEffect(() => {
    if (editingEntry) { setTitle(editingEntry.title || ''); setSummary(editingEntry.summary || ''); }
    else { setTitle(''); setSummary(''); setCreateAsFolder(isFolder || false); }
  }, [editingEntry, isOpen, isFolder]);
  
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>{editingEntry ? '编辑词条' : (createAsFolder ? '新建分类' : '新建词条')}</h3>
        {parentTitle && <p className="modal-hint">添加到: {parentTitle}</p>}
        <input type="text" placeholder="标题" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
        <input type="text" placeholder="简介（可选）" value={summary} onChange={e => setSummary(e.target.value)} />
        {!editingEntry && <label className="checkbox-label"><input type="checkbox" checked={createAsFolder} onChange={e => setCreateAsFolder(e.target.checked)} /><span>创建为分类文件夹</span></label>}
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>取消</button>
          <button className="btn-save" onClick={() => { if (title.trim()) { onSave({ title: title.trim(), summary: summary.trim(), isFolder: createAsFolder }); onClose(); } }} disabled={!title.trim()}>{editingEntry ? '保存' : '创建'}</button>
        </div>
      </div>
    </div>
  );
};

const BookModal = ({ isOpen, onClose, onSave, editingBook }) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [tags, setTags] = useState('');
  const [emoji, setEmoji] = useState('📖');
  const [coverImage, setCoverImage] = useState(null);
  const [showStats, setShowStats] = useState(true);
  const fileInputRef = useRef(null);
  const emojis = ['📖', '🌙', '⭐', '🏯', '🗡️', '🌸', '🔮', '🐉', '🦋', '🌊', '🔥', '💎'];
  
  useEffect(() => {
    if (editingBook) {
      setTitle(editingBook.title); setAuthor(editingBook.author || '');
      setTags(editingBook.tags?.join(', ') || ''); setEmoji(editingBook.cover);
      setCoverImage(editingBook.coverImage); setShowStats(editingBook.showStats !== false);
    } else { setTitle(''); setAuthor(''); setTags(''); setEmoji('📖'); setCoverImage(null); setShowStats(true); }
  }, [editingBook, isOpen]);
  
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content book-modal" onClick={e => e.stopPropagation()}>
        <h3>{editingBook ? '编辑书籍' : '新建世界'}</h3>
        <input type="text" placeholder="书名" value={title} onChange={e => setTitle(e.target.value)} autoFocus />
        <input type="text" placeholder="作者（可选）" value={author} onChange={e => setAuthor(e.target.value)} />
        <input type="text" placeholder="标签，逗号分隔（可选）" value={tags} onChange={e => setTags(e.target.value)} />
        <label className="checkbox-label"><input type="checkbox" checked={showStats} onChange={e => setShowStats(e.target.checked)} /><span>显示字数统计</span></label>
        <div className="cover-section">
          <p className="section-label">封面</p>
          {coverImage ? (
            <div className="cover-preview"><img src={coverImage} alt="封面" /><button className="remove-cover" onClick={() => setCoverImage(null)}>×</button></div>
          ) : (
            <div className="emoji-picker">{emojis.map(e => <span key={e} className={`emoji-option ${emoji === e ? 'selected' : ''}`} onClick={() => setEmoji(e)}>{e}</span>)}</div>
          )}
          <button className="upload-cover-btn" onClick={() => fileInputRef.current?.click()}>📷 上传封面图片</button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onload = ev => setCoverImage(ev.target.result); r.readAsDataURL(f); } }} style={{ display: 'none' }} />
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>取消</button>
          <button className="btn-save" onClick={() => { if (title.trim()) { onSave({ title: title.trim(), author, tags: tags.split(',').map(t => t.trim()).filter(Boolean), emoji, coverImage, showStats }); onClose(); } }} disabled={!title.trim()}>保存</button>
        </div>
      </div>
    </div>
  );
};

// ==================== 主应用 ====================
export default function App() {
  const [data, setData] = useState(() => loadFromStorage() || initialData);
  const [currentBook, setCurrentBook] = useState(null);
  const [currentEntry, setCurrentEntry] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // list, single, merged
  const [isReadOnly, setIsReadOnly] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [navigationStack, setNavigationStack] = useState([]);
  const [editContent, setEditContent] = useState('');
  const [mergedEditContent, setMergedEditContent] = useState('');
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editingBook, setEditingBook] = useState(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [contextMenu, setContextMenu] = useState({ isOpen: false, position: { x: 0, y: 0 }, options: [] });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });
  const [jumpHistory, setJumpHistory] = useState([]);
  const [slideAnimation, setSlideAnimation] = useState('');
  const longPressTimer = useRef(null);
  const editorRef = useRef(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  useEffect(() => { saveToStorage(data); }, [data]);
  const allTitlesMap = useMemo(() => collectAllLinkableTitles(data.books), [data.books]);
  useEffect(() => { if (currentBook) { const updated = data.books.find(b => b.id === currentBook.id); if (updated) setCurrentBook(updated); } }, [data]);
  useEffect(() => { if (currentEntry && currentBook) { const found = findEntryById(currentBook.entries, currentEntry.id); if (found) setCurrentEntry(found); } }, [currentBook]);

  // 生成合并视图内容
  const generateMergedContent = useCallback((entry) => {
    const items = getAllChildContent(entry);
    return items.map(item => `·${item.title}\n${item.content || ''}`).join('\n\n');
  }, []);

  // 解析合并视图内容并同步
  const parseMergedContent = useCallback((content, parentEntry) => {
    const sections = content.split(/\n·/).filter(Boolean);
    const updates = [];
    
    sections.forEach((section, idx) => {
      const lines = section.split('\n');
      let title = lines[0].replace(/^·/, '').trim();
      const contentText = lines.slice(1).join('\n').trim();
      
      // 查找现有词条或创建新词条
      const existingItems = getAllChildContent(parentEntry);
      const existingItem = existingItems.find(item => item.title === title);
      
      if (existingItem) {
        updates.push({ id: existingItem.id, content: contentText });
      } else if (title) {
        // 新词条
        updates.push({ isNew: true, title, content: contentText, parentId: parentEntry.id });
      }
    });
    
    return updates;
  }, []);

  // 长按处理
  const handleLongPressStart = (e, type, item) => {
    const touch = e.touches ? e.touches[0] : e;
    const position = { x: touch.clientX, y: touch.clientY };
    longPressTimer.current = setTimeout(() => {
      let options = [];
      if (type === 'entry') {
        options = [
          { icon: '✏️', label: '编辑信息', action: () => { setEditingEntry(item); setShowEntryModal(true); } },
          { icon: item.linkable ? '🚫' : '⭐', label: item.linkable ? '关闭跳转' : '开启跳转', action: () => {
            const updatedEntries = updateEntryInTree(currentBook.entries, item.id, { linkable: !item.linkable });
            setData(prev => ({ ...prev, books: prev.books.map(b => b.id === currentBook.id ? { ...b, entries: updatedEntries } : b) }));
          }},
          { icon: '🗑️', label: '删除', danger: true, action: () => setConfirmModal({ isOpen: true, title: '确认删除', message: `删除「${item.title}」？`, onConfirm: () => {
            const updatedEntries = deleteEntryFromTree(currentBook.entries, item.id);
            setData(prev => ({ ...prev, books: prev.books.map(b => b.id === currentBook.id ? { ...b, entries: updatedEntries } : b) }));
            if (currentEntry?.id === item.id) handleBack();
            setConfirmModal({ isOpen: false });
          }})}
        ];
      } else if (type === 'book') {
        options = [
          { icon: '✏️', label: '编辑', action: () => { setEditingBook(item); setShowBookModal(true); } },
          { icon: '🗑️', label: '删除', danger: true, action: () => setConfirmModal({ isOpen: true, title: '确认删除', message: `删除「${item.title}」？`, onConfirm: () => { setData(prev => ({ ...prev, books: prev.books.filter(b => b.id !== item.id) })); setConfirmModal({ isOpen: false }); }})}
        ];
      }
      setContextMenu({ isOpen: true, position, options });
    }, 500);
  };

  const handleLongPressEnd = () => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } };

  const handleBookSelect = (book) => { setCurrentBook(book); setCurrentEntry(null); setViewMode('list'); setNavigationStack([]); };
  
  const handleBackToShelf = () => {
    if (!isReadOnly && currentEntry) {
      if (viewMode === 'single') handleSaveContent();
      else if (viewMode === 'merged') handleSaveMergedContent();
    }
    setCurrentBook(null); setCurrentEntry(null); setViewMode('list'); setNavigationStack([]); setIsSidebarOpen(false); setJumpHistory([]);
  };

  const handleEntryClick = (entry) => {
    setNavigationStack(prev => [...prev, currentEntry].filter(Boolean));
    setCurrentEntry(entry);
    if (entry.isFolder || entry.children?.length > 0) {
      setViewMode('list');
    } else {
      setViewMode('single');
      setEditContent(entry.content || '');
    }
  };

  const handleBack = () => {
    if (!isReadOnly && currentEntry) {
      if (viewMode === 'single') handleSaveContent();
      else if (viewMode === 'merged') handleSaveMergedContent();
    }
    if (navigationStack.length > 0) {
      const prev = navigationStack[navigationStack.length - 1];
      setNavigationStack(s => s.slice(0, -1));
      setCurrentEntry(prev);
      setViewMode(prev ? 'list' : 'list');
    } else {
      setCurrentEntry(null);
      setViewMode('list');
    }
  };

  const handleJumpBack = () => {
    if (jumpHistory.length > 0) {
      const last = jumpHistory[jumpHistory.length - 1];
      setJumpHistory(prev => prev.slice(0, -1));
      const book = data.books.find(b => b.id === last.bookId);
      if (book) {
        setCurrentBook(book); setNavigationStack(last.navStack);
        setCurrentEntry(last.entry); setViewMode(last.viewMode);
        if (last.entry?.content) setEditContent(last.entry.content);
      }
    }
  };

  const handleSidebarSelect = (entry) => {
    const path = findEntryPath(currentBook.entries, entry.id);
    if (path) {
      setNavigationStack(path.slice(0, -1));
      setCurrentEntry(entry);
      if (entry.isFolder || entry.children?.length > 0) setViewMode('list');
      else { setViewMode('single'); setEditContent(entry.content || ''); }
    }
    setIsSidebarOpen(false);
  };

  const handleLinkClick = useCallback((keyword, targetBookId, targetEntryId) => {
    setJumpHistory(prev => [...prev, { bookId: currentBook.id, entry: currentEntry, navStack: navigationStack, viewMode }]);
    const targetBook = data.books.find(b => b.id === targetBookId);
    if (targetBook) {
      setCurrentBook(targetBook);
      const path = findEntryPath(targetBook.entries, targetEntryId);
      if (path) {
        const targetEntry = path[path.length - 1];
        setNavigationStack(path.slice(0, -1));
        setCurrentEntry(targetEntry);
        // 如果是开启了跳转的文件夹，显示合并视图
        if (targetEntry.isFolder && targetEntry.linkable) {
          setSlideAnimation('slide-in');
          setViewMode('merged');
          setMergedEditContent(generateMergedContent(targetEntry));
        } else if (targetEntry.isFolder) {
          setViewMode('list');
        } else {
          setViewMode('single');
          setEditContent(targetEntry.content || '');
        }
      }
    }
  }, [currentBook, currentEntry, navigationStack, viewMode, data.books, generateMergedContent]);

  const handleSaveContent = () => {
    if (!currentEntry || !currentBook) return;
    const updatedEntries = updateEntryInTree(currentBook.entries, currentEntry.id, { content: editContent });
    setData(prev => ({ ...prev, books: prev.books.map(b => b.id === currentBook.id ? { ...b, entries: updatedEntries } : b) }));
  };

  const handleSaveMergedContent = () => {
    if (!currentEntry || !currentBook) return;
    const updates = parseMergedContent(mergedEditContent, currentEntry);
    let updatedEntries = currentBook.entries;
    
    updates.forEach(update => {
      if (update.isNew) {
        const newEntry = { id: generateId(), title: update.title, summary: '', content: update.content, isFolder: false, linkable: true, children: [] };
        updatedEntries = addEntryToParent(updatedEntries, update.parentId, newEntry);
      } else {
        updatedEntries = updateEntryInTree(updatedEntries, update.id, { content: update.content });
      }
    });
    
    setData(prev => ({ ...prev, books: prev.books.map(b => b.id === currentBook.id ? { ...b, entries: updatedEntries } : b) }));
  };

  const handleAddEntry = (entryData) => {
    const newEntry = { id: generateId(), title: entryData.title, summary: entryData.summary || '', content: '', isFolder: entryData.isFolder, linkable: !entryData.isFolder, children: entryData.isFolder ? [] : undefined };
    const parentId = currentEntry?.id || null;
    const updatedEntries = addEntryToParent(currentBook.entries, parentId, newEntry);
    setData(prev => ({ ...prev, books: prev.books.map(b => b.id === currentBook.id ? { ...b, entries: updatedEntries } : b) }));
  };

  const handleUpdateEntry = (entryData) => {
    if (!editingEntry) return;
    const updatedEntries = updateEntryInTree(currentBook.entries, editingEntry.id, { title: entryData.title, summary: entryData.summary });
    setData(prev => ({ ...prev, books: prev.books.map(b => b.id === currentBook.id ? { ...b, entries: updatedEntries } : b) }));
    setEditingEntry(null);
  };

  const handleAddBook = ({ title, author, tags, emoji, coverImage, showStats }) => {
    if (editingBook) {
      setData(prev => ({ ...prev, books: prev.books.map(b => b.id === editingBook.id ? { ...b, title, author, tags, cover: emoji, coverImage, showStats } : b) }));
      setEditingBook(null);
    } else {
      const colors = ['#2D3047', '#1A1A2E', '#4A0E0E', '#0E4A2D', '#3D2E4A', '#4A3D0E'];
      setData(prev => ({ ...prev, books: [...prev.books, { id: generateId(), title, author, tags, cover: emoji, coverImage, showStats, color: colors[Math.floor(Math.random() * colors.length)], entries: [] }] }));
    }
  };

  const handleEditorAction = (action) => {
    const textarea = editorRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart, end = textarea.selectionEnd;
    const text = viewMode === 'merged' ? mergedEditContent : editContent;
    const selectedText = text.substring(start, end);
    let newText = text, newCursorPos = end;
    
    if (action === 'indent') {
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      newText = text.substring(0, lineStart) + '　　' + text.substring(lineStart);
      newCursorPos = start + 2;
    } else if (action === 'bold') {
      if (selectedText) { newText = text.substring(0, start) + '**' + selectedText + '**' + text.substring(end); newCursorPos = end + 4; }
      else { newText = text.substring(0, start) + '****' + text.substring(end); newCursorPos = start + 2; }
    } else if (action === 'keyword') {
      if (selectedText) { newText = text.substring(0, start) + '【' + selectedText + '】' + text.substring(end); newCursorPos = end + 2; }
      else { newText = text.substring(0, start) + '【】' + text.substring(end); newCursorPos = start + 1; }
    } else if (action === 'bullet') {
      newText = text.substring(0, start) + '\n\n·新词条\n' + text.substring(end);
      newCursorPos = start + 3;
    }
    
    if (viewMode === 'merged') setMergedEditContent(newText);
    else setEditContent(newText);
    setTimeout(() => { textarea.focus(); textarea.setSelectionRange(newCursorPos, newCursorPos); }, 0);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target.result;
        const textarea = editorRef.current;
        const start = textarea?.selectionStart || editContent.length;
        const text = viewMode === 'merged' ? mergedEditContent : editContent;
        const newText = text.substring(0, start) + `\n[IMG:${imageData}]\n` + text.substring(start);
        if (viewMode === 'merged') setMergedEditContent(newText);
        else setEditContent(newText);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // 滑动处理
  const handleTouchStart = (e, entry) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    handleLongPressStart(e, 'entry', entry);
  };
  
  const handleTouchEnd = (e, entry) => {
    handleLongPressEnd();
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    if (deltaX < -80 && deltaY < 50 && (entry.isFolder || entry.children?.length > 0)) {
      setSlideAnimation('slide-in');
      setNavigationStack(prev => [...prev, currentEntry].filter(Boolean));
      setCurrentEntry(entry);
      setViewMode('merged');
      setMergedEditContent(generateMergedContent(entry));
      setTimeout(() => setSlideAnimation(''), 300);
    }
  };

  const currentEntries = currentEntry?.children || currentBook?.entries || [];

  // ==================== 书架视图 ====================
  if (!currentBook) {
    return (
      <div className="app bookshelf-view">
        <header className="bookshelf-header">
          <h1>灵感穹顶</h1>
          <div className="header-actions">
            <button className="header-btn" onClick={() => { setEditingBook(null); setShowBookModal(true); }}>+</button>
          </div>
        </header>
        
        <div className="bookshelf">
          {data.books.map(book => (
            <div key={book.id} className="book-item"
              onClick={() => handleBookSelect(book)}
              onTouchStart={(e) => handleLongPressStart(e, 'book', book)}
              onTouchEnd={handleLongPressEnd} onTouchMove={handleLongPressEnd}
              onMouseDown={(e) => handleLongPressStart(e, 'book', book)}
              onMouseUp={handleLongPressEnd} onMouseLeave={handleLongPressEnd}>
              <div className="book-cover-wrapper">
                {book.coverImage ? (
                  <img src={book.coverImage} alt={book.title} className="book-cover-img" />
                ) : (
                  <div className="book-cover-emoji" style={{ background: `linear-gradient(135deg, ${book.color} 0%, ${book.color}dd 100%)` }}>
                    <span>{book.cover}</span>
                  </div>
                )}
                {book.tags?.[0] && <span className="book-tag">{book.tags[0]}</span>}
              </div>
              <div className="book-info">
                <h3 className="book-title">{book.title}</h3>
                {book.author && <p className="book-author">{book.author} 著</p>}
              </div>
            </div>
          ))}
        </div>
        
        <BookModal isOpen={showBookModal} onClose={() => { setShowBookModal(false); setEditingBook(null); }} onSave={handleAddBook} editingBook={editingBook} />
        <ContextMenu isOpen={contextMenu.isOpen} position={contextMenu.position} onClose={() => setContextMenu({ ...contextMenu, isOpen: false })} options={contextMenu.options} />
        <ConfirmModal isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message} onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal({ isOpen: false })} />
        <style>{styles}</style>
      </div>
    );
  }

  // ==================== 书籍详情页 ====================
  return (
    <div className="app main-view">
      {/* 侧边栏 */}
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header"><h2>{currentBook.title}</h2><button className="close-sidebar" onClick={() => setIsSidebarOpen(false)}>×</button></div>
        <div className="sidebar-content">{currentBook.entries.map(entry => <SidebarItem key={entry.id} entry={entry} onSelect={handleSidebarSelect} currentId={currentEntry?.id} expandedIds={expandedIds} onToggle={id => setExpandedIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; })} />)}</div>
      </div>
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}
      
      <div className="main-content">
        {/* 顶部栏 */}
        <header className="top-bar">
          <div className="top-left">
            <button className="icon-btn" onClick={() => setIsSidebarOpen(true)}>☰</button>
            {jumpHistory.length > 0 && <button className="icon-btn jump-back" onClick={handleJumpBack}>↩</button>}
            {(currentEntry || navigationStack.length > 0) ? (
              <button className="icon-btn" onClick={handleBack}>←</button>
            ) : (
              <button className="icon-btn" onClick={handleBackToShelf}>←</button>
            )}
          </div>
          <div className="breadcrumb">
            <span className="book-name">{currentBook.title}</span>
            {currentEntry && <><span className="sep">/</span><span className="current-name">{currentEntry.title}</span></>}
          </div>
          <div className="top-right">
            {(viewMode === 'single' || viewMode === 'merged') && (
              <div className="read-toggle" onClick={() => {
                if (!isReadOnly) {
                  if (viewMode === 'single') handleSaveContent();
                  else if (viewMode === 'merged') handleSaveMergedContent();
                }
                setIsReadOnly(!isReadOnly);
              }}>
                <span className={isReadOnly ? 'active' : ''}>读</span>
                <span className={!isReadOnly ? 'active' : ''}>写</span>
              </div>
            )}
          </div>
        </header>
        
        {/* 书籍信息卡片 */}
        {!currentEntry && currentBook.showStats && (
          <div className="book-info-card">
            <div className="info-cover">
              {currentBook.coverImage ? <img src={currentBook.coverImage} alt="" /> : <span className="info-emoji">{currentBook.cover}</span>}
            </div>
            <div className="info-details">
              {currentBook.author && <p>作者：{currentBook.author}</p>}
              {currentBook.tags?.length > 0 && <p>标签：{currentBook.tags.join(', ')}</p>}
              <p>词条：{countEntries(currentBook.entries)}条</p>
              <p>字数：{countWords(currentBook.entries).toLocaleString()}字</p>
            </div>
          </div>
        )}
        
        {/* 内容区 */}
        <main className={`content-area ${slideAnimation}`}>
          {viewMode === 'list' && (
            <div className="entry-list">
              {currentEntry && <div className="list-header"><h1>{currentEntry.title}</h1>{currentEntry.summary && <p>{currentEntry.summary}</p>}</div>}
              {!currentEntry && <p className="list-hint">💡 左滑分类查看合并视图 · 长按编辑</p>}
              
              {currentEntries.map(entry => (
                <div key={entry.id} className="entry-card"
                  onClick={() => handleEntryClick(entry)}
                  onTouchStart={(e) => handleTouchStart(e, entry)}
                  onTouchEnd={(e) => handleTouchEnd(e, entry)}
                  onTouchMove={handleLongPressEnd}
                  onMouseDown={(e) => handleLongPressStart(e, 'entry', entry)}
                  onMouseUp={handleLongPressEnd} onMouseLeave={handleLongPressEnd}>
                  <div className="entry-icon">{entry.isFolder ? '📁' : '📄'}</div>
                  <div className="entry-info">
                    <h3>{entry.title}{entry.linkable && <span className="star-badge">⭐</span>}</h3>
                    <p>{entry.summary}</p>
                  </div>
                  <span className="entry-arrow">›</span>
                </div>
              ))}
              
              {currentEntries.length === 0 && <div className="empty-state"><span>✨</span><p>点击下方添加内容</p></div>}
            </div>
          )}
          
          {viewMode === 'single' && currentEntry && (
            <div className="single-view">
              <div className="view-header"><h1>{currentEntry.title}</h1></div>
              {isReadOnly ? (
                <ContentRenderer content={currentEntry.content} allTitlesMap={allTitlesMap} currentBookId={currentBook.id} onLinkClick={handleLinkClick} isReadOnly={true} />
              ) : (
                <textarea ref={editorRef} className="content-editor" value={editContent} onChange={e => setEditContent(e.target.value)} placeholder="开始书写..." />
              )}
            </div>
          )}
          
          {viewMode === 'merged' && currentEntry && (
            <div className="merged-view">
              <div className="view-header merged"><h1>{currentEntry.title}</h1><span className="merged-badge">合并视图</span></div>
              {isReadOnly ? (
                <div className="merged-content">
                  {getAllChildContent(currentEntry).map((item, idx) => (
                    <div key={item.id} className="merged-section">
                      <h3 className="section-title" onClick={() => handleSidebarSelect(item)}>·{item.title}</h3>
                      <ContentRenderer content={item.content} allTitlesMap={allTitlesMap} currentBookId={currentBook.id} onLinkClick={handleLinkClick} isReadOnly={true} />
                    </div>
                  ))}
                </div>
              ) : (
                <textarea ref={editorRef} className="content-editor merged-editor" value={mergedEditContent} onChange={e => setMergedEditContent(e.target.value)} placeholder="·词条标题&#10;正文内容&#10;&#10;·新词条&#10;正文内容" />
              )}
            </div>
          )}
        </main>
        
        {/* 底部工具栏/添加按钮 */}
        {viewMode === 'list' && (
          <div className="bottom-bar">
            <button className="add-btn" onClick={() => { setEditingEntry(null); setIsCreatingFolder(false); setShowEntryModal(true); }}>
              <span>+</span> 新建词条
            </button>
            <button className="add-btn folder" onClick={() => { setEditingEntry(null); setIsCreatingFolder(true); setShowEntryModal(true); }}>
              <span>📁</span> 新建分类
            </button>
          </div>
        )}
        
        <EditorToolbar onAction={handleEditorAction} onImageUpload={handleImageUpload} visible={!isReadOnly && (viewMode === 'single' || viewMode === 'merged')} />
      </div>
      
      <EntryModal isOpen={showEntryModal} onClose={() => { setShowEntryModal(false); setEditingEntry(null); }} onSave={editingEntry ? handleUpdateEntry : handleAddEntry} editingEntry={editingEntry} parentTitle={currentEntry?.title} isFolder={isCreatingFolder} />
      <ContextMenu isOpen={contextMenu.isOpen} position={contextMenu.position} onClose={() => setContextMenu({ ...contextMenu, isOpen: false })} options={contextMenu.options} />
      <ConfirmModal isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message} onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal({ isOpen: false })} />
      <style>{styles}</style>
    </div>
  );
}

// ==================== 样式 ====================
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&family=ZCOOL+XiaoWei&display=swap');
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body,#root{height:100%;overflow:hidden}
.app{height:100%;font-family:'Noto Serif SC',serif;overflow-y:auto;-webkit-overflow-scrolling:touch}

/* 书架 */
.bookshelf-view{background:#f8f8f8;min-height:100%}
.bookshelf-header{position:sticky;top:0;z-index:100;background:#3d9970;color:#fff;padding:16px 20px;display:flex;justify-content:space-between;align-items:center}
.bookshelf-header h1{font-family:'ZCOOL XiaoWei',serif;font-size:1.4rem;letter-spacing:.1em}
.header-btn{background:none;border:none;color:#fff;font-size:1.8rem;cursor:pointer}
.bookshelf{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;padding:20px}
.book-item{cursor:pointer;user-select:none}
.book-cover-wrapper{position:relative;aspect-ratio:3/4;border-radius:8px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.15)}
.book-cover-img{width:100%;height:100%;object-fit:cover}
.book-cover-emoji{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:3rem}
.book-tag{position:absolute;top:0;left:0;background:#3d9970;color:#fff;font-size:.65rem;padding:2px 8px;transform:rotate(-45deg) translate(-30%,-50%);transform-origin:center}
.book-info{padding:8px 4px}
.book-info .book-title{font-size:.9rem;color:#333;margin-bottom:2px}
.book-info .book-author{font-size:.75rem;color:#999}

/* 主视图 */
.main-view{background:#faf8f3;display:flex;flex-direction:column}
.sidebar{position:fixed;left:0;top:0;width:280px;max-width:85vw;height:100%;background:linear-gradient(180deg,#2D3047,#1a1a2e);z-index:1000;transform:translateX(-100%);transition:transform .3s;display:flex;flex-direction:column;box-shadow:5px 0 30px rgba(0,0,0,.3)}
.sidebar.open{transform:translateX(0)}
.sidebar-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:999}
.sidebar-header{padding:20px 16px;border-bottom:1px solid rgba(244,228,193,.1);display:flex;justify-content:space-between;align-items:center}
.sidebar-header h2{color:#f4e4c1;font-size:1.1rem}
.close-sidebar{background:none;border:none;color:rgba(244,228,193,.6);font-size:1.5rem;cursor:pointer}
.sidebar-content{flex:1;overflow-y:auto;padding:12px 0}
.sidebar-item{display:flex;align-items:center;padding:12px 16px;color:rgba(244,228,193,.8);cursor:pointer;gap:8px}
.sidebar-item:active,.sidebar-item.active{background:rgba(244,228,193,.1)}
.expand-icon{font-size:.9rem;width:16px;transition:transform .2s}
.expand-icon.expanded{transform:rotate(90deg)}
.sidebar-icon{font-size:.85rem}
.sidebar-title{font-size:.9rem;flex:1}
.link-star{font-size:.7rem;opacity:.7}

/* 顶部栏 */
.top-bar{position:sticky;top:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:rgba(250,248,243,.95);backdrop-filter:blur(10px);border-bottom:1px solid rgba(0,0,0,.08)}
.top-left,.top-right{display:flex;gap:4px;align-items:center}
.icon-btn{background:none;border:none;font-size:1.2rem;padding:8px;border-radius:8px;cursor:pointer;color:#333}
.icon-btn:active{background:rgba(0,0,0,.05)}
.jump-back{color:#3d9970;background:rgba(61,153,112,.1)}
.breadcrumb{flex:1;text-align:center;font-size:.9rem;color:#666}
.book-name{color:#333;font-weight:600}
.sep{margin:0 6px;color:#ccc}
.current-name{color:#8B7355}
.read-toggle{display:flex;background:#eee;border-radius:12px;overflow:hidden;font-size:.8rem}
.read-toggle span{padding:6px 12px;cursor:pointer;transition:all .2s}
.read-toggle span.active{background:#3d9970;color:#fff}

/* 书籍信息卡片 */
.book-info-card{display:flex;gap:16px;padding:20px;background:#fff;margin:16px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.05)}
.info-cover{width:80px;height:110px;border-radius:6px;overflow:hidden;background:#eee;display:flex;align-items:center;justify-content:center}
.info-cover img{width:100%;height:100%;object-fit:cover}
.info-emoji{font-size:2.5rem}
.info-details{flex:1;font-size:.85rem;color:#666;display:flex;flex-direction:column;gap:4px}
.info-details p{margin:0}

/* 内容区 */
.content-area{flex:1;padding:0 16px 100px}
.content-area.slide-in{animation:slideIn .3s ease}
@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
.list-header{padding:20px 0 16px;border-bottom:1px solid rgba(0,0,0,.08);margin-bottom:16px}
.list-header h1{font-family:'ZCOOL XiaoWei',serif;font-size:1.5rem;color:#333}
.list-header p{color:#8B7355;font-size:.9rem;margin-top:4px}
.list-hint{text-align:center;font-size:.8rem;color:#999;padding:12px 0}
.entry-list{display:flex;flex-direction:column;gap:10px}
.entry-card{display:flex;align-items:center;gap:12px;padding:16px;background:#fff;border-radius:10px;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,.06);user-select:none}
.entry-card:active{transform:scale(.98)}
.entry-icon{font-size:1.2rem}
.entry-info{flex:1;min-width:0}
.entry-info h3{font-size:.95rem;color:#333;display:flex;align-items:center;gap:6px}
.entry-info p{font-size:.8rem;color:#999;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.star-badge{font-size:.7rem}
.entry-arrow{color:#ccc;font-size:1.2rem}
.empty-state{text-align:center;padding:60px 20px;color:#999}
.empty-state span{font-size:2rem;display:block;margin-bottom:12px}

/* 单词条/合并视图 */
.single-view,.merged-view{background:#fff;border-radius:12px;padding:24px 20px;margin-top:16px;box-shadow:0 2px 8px rgba(0,0,0,.05)}
.view-header{margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid rgba(0,0,0,.08)}
.view-header h1{font-family:'ZCOOL XiaoWei',serif;font-size:1.4rem;color:#333}
.view-header.merged{display:flex;justify-content:space-between;align-items:center}
.merged-badge{font-size:.75rem;color:#fff;background:#3d9970;padding:4px 10px;border-radius:10px}
.content-body{line-height:1.9;color:#333;font-size:.95rem}
.content-line{margin-bottom:.3em;text-align:justify}
.content-image{margin:16px 0}
.content-image img{max-width:100%;border-radius:8px}
.keyword{color:#333;font-weight:600}
.keyword.linked{color:#3d9970;background:linear-gradient(180deg,transparent 60%,rgba(61,153,112,.15) 60%)}
.keyword.clickable{cursor:pointer}
.merged-section{margin-bottom:24px}
.section-title{font-size:1.1rem;color:#333;font-weight:600;margin-bottom:12px;cursor:pointer}
.section-title:active{color:#3d9970}
.content-editor{width:100%;min-height:300px;padding:16px;border:1px solid #eee;border-radius:10px;font-family:'Noto Serif SC',serif;font-size:.95rem;line-height:1.9;resize:none}
.content-editor:focus{outline:none;border-color:#3d9970}
.merged-editor{min-height:400px}

/* 底部按钮 */
.bottom-bar{position:fixed;bottom:0;left:0;right:0;display:flex;gap:12px;padding:16px;background:#faf8f3;border-top:1px solid rgba(0,0,0,.05)}
.add-btn{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;padding:14px;background:#3d9970;color:#fff;border:none;border-radius:10px;font-size:.95rem;cursor:pointer}
.add-btn.folder{background:#fff;color:#333;border:1px solid #ddd}
.add-btn:active{opacity:.9}

/* 编辑工具栏 */
.editor-toolbar-bottom{position:fixed;bottom:0;left:0;right:0;display:flex;justify-content:space-around;padding:12px 16px;background:#fff;border-top:1px solid #eee;z-index:50}
.editor-toolbar-bottom button{background:none;border:none;font-size:1.1rem;padding:10px 16px;cursor:pointer;color:#666;border-radius:8px}
.editor-toolbar-bottom button:active{background:#f5f5f5}

/* 弹窗 */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:2000;display:flex;align-items:center;justify-content:center;padding:20px}
.modal-content{background:#fff;border-radius:16px;padding:24px;width:100%;max-width:360px;max-height:80vh;overflow-y:auto}
.modal-content h3{font-size:1.2rem;color:#333;margin-bottom:16px;text-align:center}
.confirm-modal p{text-align:center;color:#666;margin-bottom:20px}
.modal-hint{font-size:.85rem;color:#8B7355;margin-bottom:12px;text-align:center}
.modal-content input[type="text"]{width:100%;padding:12px;border:1px solid #ddd;border-radius:8px;font-size:1rem;margin-bottom:12px}
.modal-content input:focus{outline:none;border-color:#3d9970}
.checkbox-label{display:flex;align-items:center;gap:10px;margin-bottom:12px;font-size:.9rem;color:#666;cursor:pointer}
.checkbox-label input{width:18px;height:18px;accent-color:#3d9970}
.section-label{font-size:.85rem;color:#666;margin-bottom:8px}
.cover-section{margin-bottom:16px}
.cover-preview{position:relative;width:100%;height:140px;border-radius:8px;overflow:hidden;margin-bottom:12px}
.cover-preview img{width:100%;height:100%;object-fit:cover}
.remove-cover{position:absolute;top:8px;right:8px;width:28px;height:28px;border-radius:50%;background:rgba(0,0,0,.6);color:#fff;border:none;font-size:1.2rem;cursor:pointer}
.upload-cover-btn{width:100%;padding:12px;border:1px dashed #ddd;border-radius:8px;background:none;color:#666;font-size:.9rem;cursor:pointer;margin-top:8px}
.emoji-picker{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.emoji-option{font-size:1.6rem;padding:8px;border-radius:8px;cursor:pointer}
.emoji-option.selected{background:rgba(61,153,112,.2)}
.modal-actions{display:flex;gap:12px;margin-top:16px}
.btn-cancel,.btn-save,.btn-danger{flex:1;padding:12px;border-radius:10px;font-size:1rem;cursor:pointer}
.btn-cancel{background:none;border:1px solid #ddd;color:#666}
.btn-save{background:#3d9970;border:none;color:#fff}
.btn-danger{background:#e53935;border:none;color:#fff}
.btn-save:disabled{opacity:.5}
.book-modal{max-width:400px}

/* 上下文菜单 */
.context-overlay{position:fixed;inset:0;z-index:1998}
.context-menu{position:fixed;background:#fff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,.15);overflow:hidden;z-index:1999;min-width:150px}
.context-item{display:flex;align-items:center;gap:12px;padding:14px 18px;cursor:pointer;font-size:.95rem}
.context-item:active{background:#f5f5f5}
.context-item.danger{color:#e53935}
.context-item:not(:last-child){border-bottom:1px solid #eee}
.context-icon{font-size:1rem}

::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-thumb{background:rgba(0,0,0,.1);border-radius:2px}
`;
