import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

const STORAGE_KEY = 'inspiration-vault-data';
const saveToStorage = (data) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { console.error('保存失败:', e); } };
const loadFromStorage = () => { try { const saved = localStorage.getItem(STORAGE_KEY); return saved ? JSON.parse(saved) : null; } catch (e) { return null; } };

const initialData = {
  books: [
    {
      id: 'fortuna', title: 'Fortuna', author: '桐青璃落', tags: ['奇幻', '西方'],
      cover: '🌙', coverImage: null, color: '#2D3047', showStats: true,
      entries: [
        {
          id: 'worldview', title: '世界观', summary: '关于这个世界', content: '', isFolder: true, linkable: false,
          children: [
            {
              id: 'religion', title: '宗教', summary: '神祇与信仰', content: '', isFolder: true, linkable: false,
              children: [
                { id: 'ten-days', title: '十日旧约', summary: '创世传说', linkable: true, isFolder: false,
                  content: '　　在时间的起点，女神独自漂浮于无尽的寂静之中。\n\n　　第一日，她从心火中分离出【火的守望】。\n　　第二日，从泪水中分离出【水的祝福】。', children: [] },
                { id: 'war-gods', title: '战争双神', summary: '胜利与牺牲', linkable: true, isFolder: false,
                  content: '　　**胜利者·凯洛斯**，身披金色战甲。\n\n　　*牺牲者·赛莲娜*，身着银色长袍。', children: [] }
              ]
            },
            {
              id: 'geography', title: '地理', summary: '大陆疆域', content: '', isFolder: true, linkable: false,
              children: [
                { id: 'koltra', title: '柯尔特拉', summary: '中央王国', linkable: true, isFolder: true, content: '　　位于大陆正中央，被称为"女神的掌心"。', 
                  children: [
                    { id: 'silver-city', title: '银冠城', summary: '首都', linkable: true, isFolder: false, content: '　　首都建立在白色岩石上，城中有【千年图书馆】。', children: [] }
                  ] },
                { id: 'northland', title: '北境', summary: '冰雪王国', linkable: true, isFolder: false, content: '　　永恒冬季笼罩的土地，居民是【霜裔】后代。', children: [] }
              ]
            }
          ]
        },
        {
          id: 'characters', title: '人物', summary: '故事灵魂', content: '', isFolder: true, linkable: false,
          children: [
            { id: 'elena', title: '艾琳娜', summary: '流亡公主', linkable: true, isFolder: false, content: '　　【柯尔特拉】末代国王的独生女。在【千年图书馆】长大，对【十日旧约】研究深入。', children: [] }
          ]
        }
      ]
    },
    {
      id: 'jade-book', title: '玉辞', author: '桐青璃落', tags: ['古风'],
      cover: '🏯', coverImage: null, color: '#4A0E0E', showStats: true,
      entries: [
        { id: 'jade-chars', title: '人物', summary: '江湖儿女', content: '　　曾有异世旅人【艾琳娜】短暂停留……', isFolder: true, linkable: false, children: [] }
      ]
    }
  ]
};

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

const getAllChildContent = (entry, allEntries) => {
  let contents = [];
  const collect = (e) => {
    if (!e) return;
    if (e.content || !e.isFolder) contents.push(e);
    if (e.children?.length) {
      e.children.forEach(child => {
        const found = findEntryById(allEntries, child.id) || child;
        collect(found);
      });
    }
  };
  if (entry?.children?.length) {
    entry.children.forEach(child => {
      const found = findEntryById(allEntries, child.id) || child;
      collect(found);
    });
  }
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

const reorderEntriesInParent = (entries, parentId, fromIndex, toIndex) => {
  if (parentId === null) {
    const newEntries = [...entries];
    const [moved] = newEntries.splice(fromIndex, 1);
    newEntries.splice(toIndex, 0, moved);
    return newEntries;
  }
  return entries.map(entry => {
    if (entry.id === parentId && entry.children) {
      const newChildren = [...entry.children];
      const [moved] = newChildren.splice(fromIndex, 1);
      newChildren.splice(toIndex, 0, moved);
      return { ...entry, children: newChildren };
    }
    if (entry.children?.length) return { ...entry, children: reorderEntriesInParent(entry.children, parentId, fromIndex, toIndex) };
    return entry;
  });
};

const countWords = (entries) => {
  let count = 0;
  const traverse = (items) => items.forEach(item => {
    if (item.content) {
      const text = item.content.replace(/\[IMG:[^\]]+\]/g, '').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').replace(/__([^_]+)__/g, '$1').replace(/~~([^~]+)~~/g, '$1').replace(/\^\^([^^]+)\^\^/g, '$1').replace(/,,([^,]+),,/g, '$1');
      count += text.replace(/\s/g, '').length;
    }
    if (item.children?.length) traverse(item.children);
  });
  traverse(entries);
  return count;
};

const countEntries = (entries) => {
  let count = 0;
  const traverse = (items) => items.forEach(item => {
    if (!item.isFolder) count++;
    if (item.children?.length) traverse(item.children);
  });
  traverse(entries);
  return count;
};

const compressImage = (file, maxWidth = 600) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxWidth) { height = (height * maxWidth) / width; width = maxWidth; }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

const ContentRenderer = ({ content, allTitlesMap, currentBookId, onLinkClick, fontFamily }) => {
  const processedContent = useMemo(() => {
    if (!content) return [];
    return content.split('\n').map((line, lineIndex) => {
      if (line.startsWith('[IMG:')) {
        const imgData = line.slice(5, -1);
        return <div key={lineIndex} className="content-image"><img src={imgData} alt="" loading="lazy" /></div>;
      }
      let align = 'left';
      if (line.startsWith('[CENTER]')) { align = 'center'; line = line.slice(8); }
      else if (line.startsWith('[RIGHT]')) { align = 'right'; line = line.slice(7); }
      const parts = [];
      let key = 0;
      const regex = /(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(__([^_]+)__)|(~~([^~]+)~~)|(\^\^([^^]+)\^\^)|(,,([^,]+),,)|【([^】]+)】/g;
      let lastIdx = 0, match;
      while ((match = regex.exec(line)) !== null) {
        if (match.index > lastIdx) parts.push(<span key={key++}>{line.slice(lastIdx, match.index)}</span>);
        if (match[1]) parts.push(<strong key={key++}>{match[2]}</strong>);
        else if (match[3]) parts.push(<em key={key++}>{match[4]}</em>);
        else if (match[5]) parts.push(<u key={key++}>{match[6]}</u>);
        else if (match[7]) parts.push(<del key={key++}>{match[8]}</del>);
        else if (match[9]) parts.push(<span key={key++} style={{ fontSize: '1.25em' }}>{match[10]}</span>);
        else if (match[11]) parts.push(<span key={key++} style={{ fontSize: '0.85em' }}>{match[12]}</span>);
        else if (match[13]) {
          const keyword = match[13];
          const linkTargets = allTitlesMap.get(keyword);
          const isLinked = !!linkTargets?.length;
          parts.push(<span key={key++} className={`keyword ${isLinked ? 'linked clickable' : ''}`} onClick={() => { if (isLinked) { const target = linkTargets.find(t => t.bookId === currentBookId) || linkTargets[0]; onLinkClick(keyword, target.bookId, target.entry.id); } }}>【{keyword}】</span>);
        }
        lastIdx = match.index + match[0].length;
      }
      if (lastIdx < line.length) parts.push(<span key={key++}>{line.slice(lastIdx)}</span>);
      return <p key={lineIndex} className="content-line" style={{ fontFamily, textAlign: align }}>{parts.length > 0 ? parts : line || '\u00A0'}</p>;
    });
  }, [content, allTitlesMap, currentBookId, onLinkClick, fontFamily]);
  return <div className="content-body">{processedContent}</div>;
};

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
    if (editingBook) { setTitle(editingBook.title); setAuthor(editingBook.author || ''); setTags(editingBook.tags?.join(', ') || ''); setEmoji(editingBook.cover); setCoverImage(editingBook.coverImage); setShowStats(editingBook.showStats !== false); }
    else { setTitle(''); setAuthor(''); setTags(''); setEmoji('📖'); setCoverImage(null); setShowStats(true); }
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
          {coverImage ? (<div className="cover-preview"><img src={coverImage} alt="" /><button className="remove-cover" onClick={() => setCoverImage(null)}>×</button></div>) : (<div className="emoji-picker">{emojis.map(e => <span key={e} className={`emoji-option ${emoji === e ? 'selected' : ''}`} onClick={() => setEmoji(e)}>{e}</span>)}</div>)}
          <button className="upload-cover-btn" onClick={() => fileInputRef.current?.click()}>📷 上传封面</button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={async e => { const f = e.target.files[0]; if (f) { const compressed = await compressImage(f, 400); setCoverImage(compressed); } }} style={{ display: 'none' }} />
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>取消</button>
          <button className="btn-save" onClick={() => { if (title.trim()) { onSave({ title: title.trim(), author, tags: tags.split(',').map(t => t.trim()).filter(Boolean), emoji, coverImage, showStats }); onClose(); } }} disabled={!title.trim()}>保存</button>
        </div>
      </div>
    </div>
  );
};

const TextFormatMenu = ({ isOpen, onClose, activeFormats, onToggleFormat }) => {
  if (!isOpen) return null;
  return (
    <>
      <div className="format-menu-overlay" onClick={onClose} />
      <div className="format-menu">
        <div className="format-row">
          <button className={activeFormats.bold ? 'active' : ''} onClick={() => onToggleFormat('bold')}><strong>B</strong></button>
          <button className={activeFormats.italic ? 'active' : ''} onClick={() => onToggleFormat('italic')}><em>I</em></button>
          <button className={activeFormats.underline ? 'active' : ''} onClick={() => onToggleFormat('underline')}><u>U</u></button>
          <button className={activeFormats.strike ? 'active' : ''} onClick={() => onToggleFormat('strike')}><del>S</del></button>
        </div>
        <div className="format-row size-row">
          <button className={activeFormats.small ? 'active' : ''} onClick={() => onToggleFormat('small')}>小</button>
          <button className={activeFormats.medium ? 'active' : ''} onClick={() => onToggleFormat('medium')}>中</button>
          <button className={activeFormats.big ? 'active' : ''} onClick={() => onToggleFormat('big')}>大</button>
          <button className={activeFormats.huge ? 'active' : ''} onClick={() => onToggleFormat('huge')}>特大</button>
        </div>
      </div>
    </>
  );
};

const AlignMenu = ({ isOpen, onClose, currentAlign, onAlign }) => {
  if (!isOpen) return null;
  return (
    <>
      <div className="format-menu-overlay" onClick={onClose} />
      <div className="format-menu align-menu">
        <div className="format-row">
          <button className={currentAlign === 'left' ? 'active' : ''} onClick={() => { onAlign('left'); onClose(); }}><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h18v2H3V3zm0 4h12v2H3V7zm0 4h18v2H3v-2zm0 4h12v2H3v-2zm0 4h18v2H3v-2z"/></svg></button>
          <button className={currentAlign === 'center' ? 'active' : ''} onClick={() => { onAlign('center'); onClose(); }}><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h18v2H3V3zm3 4h12v2H6V7zm-3 4h18v2H3v-2zm3 4h12v2H6v-2zm-3 4h18v2H3v-2z"/></svg></button>
          <button className={currentAlign === 'right' ? 'active' : ''} onClick={() => { onAlign('right'); onClose(); }}><svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h18v2H3V3zm6 4h12v2H9V7zm-6 4h18v2H3v-2zm6 4h12v2H9v-2zm-6 4h18v2H3v-2z"/></svg></button>
        </div>
      </div>
    </>
  );
};

const FontMenu = ({ isOpen, onClose, onSelectFont, currentFont }) => {
  const fonts = [{ name: '默认', value: "'Noto Serif SC', serif" }, { name: '宋体', value: "'Songti SC', serif" }, { name: '黑体', value: "'Heiti SC', sans-serif" }, { name: '楷体', value: "'Kaiti SC', serif" }, { name: '仿宋', value: "'FangSong SC', serif" }];
  if (!isOpen) return null;
  return (
    <>
      <div className="format-menu-overlay" onClick={onClose} />
      <div className="font-menu">
        <p className="font-section-title">选择字体</p>
        <div className="font-options">{fonts.map(f => (<div key={f.value} className={`font-item ${currentFont === f.value ? 'active' : ''}`} onClick={() => { onSelectFont(f.value); onClose(); }} style={{ fontFamily: f.value }}>{f.name}</div>))}</div>
      </div>
    </>
  );
};

const EditorToolbar = ({ onIndentAll, onFormatClick, onFontClick, onAlignClick, onImageUpload, hasActiveFormat }) => {
  const imageInputRef = useRef(null);
  return (
    <div className="editor-toolbar-bottom">
      <button onClick={onIndentAll} title="全文缩进">↵</button>
      <button onClick={onFormatClick} className={hasActiveFormat ? 'has-active' : ''} title="文字格式">A</button>
      <button onClick={onAlignClick} title="对齐"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h18v2H3V3zm3 4h12v2H6V7zm-3 4h18v2H3v-2zm3 4h12v2H6v-2zm-3 4h18v2H3v-2z"/></svg></button>
      <button onClick={onFontClick} title="字体">T</button>
      <button onClick={() => imageInputRef.current?.click()} title="插入图片">🖼</button>
      <input ref={imageInputRef} type="file" accept="image/*" onChange={onImageUpload} style={{ display: 'none' }} />
    </div>
  );
};

const AddMenu = ({ isOpen, onClose, onAddEntry, onAddFolder, onReorderMode }) => {
  if (!isOpen) return null;
  return (
    <>
      <div className="add-menu-overlay" onClick={onClose} />
      <div className="add-menu">
        <div className="add-menu-item" onClick={() => { onReorderMode(); onClose(); }}><span>↕️</span><span>调整排序</span></div>
        <div className="add-menu-item" onClick={() => { onAddFolder(); onClose(); }}><span>📁</span><span>新建分类</span></div>
        <div className="add-menu-item" onClick={() => { onAddEntry(); onClose(); }}><span>📄</span><span>新建词条</span></div>
      </div>
    </>
  );
};

const ReorderList = ({ entries, onReorder, onExit }) => {
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const listRef = useRef(null);
  const handleTouchStart = (e, index) => { setDraggingIndex(index); if (navigator.vibrate) navigator.vibrate(30); };
  const handleTouchMove = (e) => { if (draggingIndex === null) return; e.preventDefault(); const touch = e.touches[0]; const items = listRef.current?.querySelectorAll('.reorder-item'); if (!items) return; for (let i = 0; i < items.length; i++) { const rect = items[i].getBoundingClientRect(); if (touch.clientY >= rect.top && touch.clientY <= rect.bottom) { setOverIndex(i); break; } } };
  const handleTouchEnd = () => { if (draggingIndex !== null && overIndex !== null && draggingIndex !== overIndex) onReorder(draggingIndex, overIndex); setDraggingIndex(null); setOverIndex(null); };
  return (
    <div className="reorder-mode">
      <div className="reorder-header"><h3>调整排序</h3><button className="done-btn" onClick={onExit}>完成</button></div>
      <p className="reorder-hint">长按书签拖动调整顺序</p>
      <div className="reorder-list" ref={listRef} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        {entries.map((entry, index) => (<div key={entry.id} className={`reorder-item ${draggingIndex === index ? 'dragging' : ''} ${overIndex === index && draggingIndex !== index ? 'over' : ''}`} onTouchStart={(e) => handleTouchStart(e, index)}><div className="reorder-content"><span className="reorder-icon">{entry.isFolder ? '📁' : '📄'}</span><span className="reorder-title">{entry.title}</span></div><div className="bookmark-tab"><span>≡</span></div></div>))}
      </div>
    </div>
  );
};

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
  const [mergedContents, setMergedContents] = useState([]);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editingBook, setEditingBook] = useState(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [contextMenu, setContextMenu] = useState({ isOpen: false, position: { x: 0, y: 0 }, options: [] });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });
  const [jumpHistory, setJumpHistory] = useState([]);
  const [slideAnimation, setSlideAnimation] = useState('');
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [showAlignMenu, setShowAlignMenu] = useState(false);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [currentFont, setCurrentFont] = useState("'Noto Serif SC', serif");
  const [currentAlign, setCurrentAlign] = useState('left');
  const [activeFormats, setActiveFormats] = useState({ bold: false, italic: false, underline: false, strike: false, small: false, medium: false, big: false, huge: false });
  const [isReorderMode, setIsReorderMode] = useState(false);
  const longPressTimer = useRef(null);
  const editorRef = useRef(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  useEffect(() => { saveToStorage(data); }, [data]);
  const allTitlesMap = useMemo(() => collectAllLinkableTitles(data.books), [data.books]);
  useEffect(() => { if (currentBook) { const updated = data.books.find(b => b.id === currentBook.id); if (updated) setCurrentBook(updated); } }, [data.books]);
  useEffect(() => { if (currentEntry && currentBook) { const found = findEntryById(currentBook.entries, currentEntry.id); if (found) setCurrentEntry(found); } }, [currentBook]);

  const saveContentNow = useCallback((content, entryId = null, bookId = null) => {
    const eId = entryId || currentEntry?.id;
    const bId = bookId || currentBook?.id;
    if (!eId || !bId) return;
    setData(prev => ({ ...prev, books: prev.books.map(b => b.id === bId ? { ...b, entries: updateEntryInTree(b.entries, eId, { content }) } : b) }));
  }, [currentEntry?.id, currentBook?.id]);

  const initMergedContents = useCallback((entry) => {
    if (!entry || !currentBook) return;
    const items = getAllChildContent(entry, currentBook.entries);
    setMergedContents(items.map(item => ({ id: item.id, title: item.title, content: item.content || '', isNew: false })));
  }, [currentBook]);

  const handleLongPressStart = (e, type, item) => {
    const touch = e.touches ? e.touches[0] : e;
    const position = { x: touch.clientX, y: touch.clientY };
    longPressTimer.current = setTimeout(() => {
      let options = [];
      if (type === 'entry') {
        options = [
          { icon: '✏️', label: '编辑信息', action: () => { setEditingEntry(item); setShowEntryModal(true); } },
          { icon: item.linkable ? '🚫' : '⭐', label: item.linkable ? '关闭跳转' : '开启跳转', action: () => { setData(prev => ({ ...prev, books: prev.books.map(b => b.id === currentBook.id ? { ...b, entries: updateEntryInTree(b.entries, item.id, { linkable: !item.linkable }) } : b) })); } },
          { icon: '🗑️', label: '删除', danger: true, action: () => setConfirmModal({ isOpen: true, title: '确认删除', message: `删除「${item.title}」？`, onConfirm: () => { setData(prev => ({ ...prev, books: prev.books.map(b => b.id === currentBook.id ? { ...b, entries: deleteEntryFromTree(b.entries, item.id) } : b) })); if (currentEntry?.id === item.id) handleBack(); setConfirmModal({ isOpen: false }); } }) }
        ];
      } else if (type === 'book') {
        options = [
          { icon: '✏️', label: '编辑', action: () => { setEditingBook(item); setShowBookModal(true); } },
          { icon: '🗑️', label: '删除', danger: true, action: () => setConfirmModal({ isOpen: true, title: '确认删除', message: `删除「${item.title}」？`, onConfirm: () => { setData(prev => ({ ...prev, books: prev.books.filter(b => b.id !== item.id) })); setConfirmModal({ isOpen: false }); } }) }
        ];
      }
      setContextMenu({ isOpen: true, position, options });
    }, 500);
  };
  const handleLongPressEnd = () => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } };

  const handleBookSelect = (book) => { setCurrentBook(book); setCurrentEntry(null); setViewMode('list'); setNavigationStack([]); };
  const handleBackToShelf = () => { if (!isReadOnly && currentEntry) saveContentNow(editContent); setSlideAnimation('slide-out'); setTimeout(() => { setCurrentBook(null); setCurrentEntry(null); setViewMode('list'); setNavigationStack([]); setIsSidebarOpen(false); setJumpHistory([]); setIsReorderMode(false); setSlideAnimation(''); }, 200); };

  const handleEntryClick = (entry) => {
    if (!isReadOnly && currentEntry) saveContentNow(editContent);
    setSlideAnimation('slide-in');
    setNavigationStack(prev => [...prev, currentEntry].filter(Boolean));
    setCurrentEntry(entry);
    if (entry.isFolder || entry.children?.length > 0) setViewMode('list');
    else { setViewMode('single'); setEditContent(entry.content || ''); setIsReadOnly(true); }
    setTimeout(() => setSlideAnimation(''), 250);
  };

  const handleBack = () => {
    if (!isReadOnly && currentEntry) saveContentNow(editContent);
    setSlideAnimation('slide-out');
    setTimeout(() => {
      if (navigationStack.length > 0) { const prev = navigationStack[navigationStack.length - 1]; setNavigationStack(s => s.slice(0, -1)); setCurrentEntry(prev); setViewMode(prev ? 'list' : 'list'); }
      else { setCurrentEntry(null); setViewMode('list'); }
      setSlideAnimation(''); setIsReorderMode(false);
    }, 200);
  };

  const handleJumpBack = () => { if (jumpHistory.length > 0) { const last = jumpHistory[jumpHistory.length - 1]; setJumpHistory(prev => prev.slice(0, -1)); const book = data.books.find(b => b.id === last.bookId); if (book) { setCurrentBook(book); setNavigationStack(last.navStack); setCurrentEntry(last.entry); setViewMode(last.viewMode); if (last.entry?.content) setEditContent(last.entry.content); } } };

  const handleSidebarSelect = (entry) => { if (!isReadOnly && currentEntry) saveContentNow(editContent); const path = findEntryPath(currentBook.entries, entry.id); if (path) { setNavigationStack(path.slice(0, -1)); setCurrentEntry(entry); if (entry.isFolder || entry.children?.length > 0) setViewMode('list'); else { setViewMode('single'); setEditContent(entry.content || ''); } } setIsSidebarOpen(false); };

  const handleLinkClick = useCallback((keyword, targetBookId, targetEntryId) => {
    setJumpHistory(prev => [...prev, { bookId: currentBook.id, entry: currentEntry, navStack: navigationStack, viewMode }]);
    const targetBook = data.books.find(b => b.id === targetBookId);
    if (targetBook) {
      setSlideAnimation('slide-in'); setCurrentBook(targetBook);
      const path = findEntryPath(targetBook.entries, targetEntryId);
      if (path) { const targetEntry = path[path.length - 1]; setNavigationStack(path.slice(0, -1)); setCurrentEntry(targetEntry); if (targetEntry.isFolder && targetEntry.linkable) { setViewMode('merged'); setTimeout(() => initMergedContents(targetEntry), 0); } else if (targetEntry.isFolder) { setViewMode('list'); } else { setViewMode('single'); setEditContent(targetEntry.content || ''); } }
      setTimeout(() => setSlideAnimation(''), 250);
    }
  }, [currentBook, currentEntry, navigationStack, viewMode, data.books, initMergedContents]);

  const handleMergedContentChange = (index, field, value) => {
    const newContents = mergedContents.map((item, i) => i === index ? { ...item, [field]: value } : item);
    setMergedContents(newContents);
    if (!newContents[index].isNew) { const item = newContents[index]; saveContentNow(value, item.id, currentBook.id); }
  };

  const handleAddMergedEntry = () => {
    const newEntry = { id: generateId(), title: '新词条', content: '', isNew: true };
    setMergedContents(prev => [...prev, newEntry]);
    const entryToAdd = { id: newEntry.id, title: newEntry.title, summary: '', content: '', isFolder: false, linkable: true, children: [] };
    setData(prev => ({ ...prev, books: prev.books.map(b => b.id === currentBook.id ? { ...b, entries: addEntryToParent(b.entries, currentEntry.id, entryToAdd) } : b) }));
  };

  const handleAddEntry = (entryData) => {
    const newEntry = { id: generateId(), title: entryData.title, summary: entryData.summary || '', content: '', isFolder: entryData.isFolder, linkable: !entryData.isFolder, children: entryData.isFolder ? [] : undefined };
    setData(prev => ({ ...prev, books: prev.books.map(b => b.id === currentBook.id ? { ...b, entries: addEntryToParent(b.entries, currentEntry?.id || null, newEntry) } : b) }));
  };

  const handleUpdateEntry = (entryData) => { if (!editingEntry) return; setData(prev => ({ ...prev, books: prev.books.map(b => b.id === currentBook.id ? { ...b, entries: updateEntryInTree(b.entries, editingEntry.id, { title: entryData.title, summary: entryData.summary }) } : b) })); setEditingEntry(null); };

  const handleAddBook = ({ title, author, tags, emoji, coverImage, showStats }) => {
    if (editingBook) { setData(prev => ({ ...prev, books: prev.books.map(b => b.id === editingBook.id ? { ...b, title, author, tags, cover: emoji, coverImage, showStats } : b) })); setEditingBook(null); }
    else { const colors = ['#2D3047', '#1A1A2E', '#4A0E0E', '#0E4A2D', '#3D2E4A', '#4A3D0E']; setData(prev => ({ ...prev, books: [...prev.books, { id: generateId(), title, author, tags, cover: emoji, coverImage, showStats, color: colors[Math.floor(Math.random() * colors.length)], entries: [] }] })); }
  };

  const handleReorder = (fromIndex, toIndex) => { setData(prev => ({ ...prev, books: prev.books.map(b => b.id === currentBook.id ? { ...b, entries: reorderEntriesInParent(b.entries, currentEntry?.id || null, fromIndex, toIndex) } : b) })); };

  const handleToggleFormat = (type) => {
    setActiveFormats(prev => {
      const newFormats = { ...prev };
      if (['small', 'medium', 'big', 'huge'].includes(type)) { newFormats.small = false; newFormats.medium = false; newFormats.big = false; newFormats.huge = false; }
      newFormats[type] = !prev[type];
      return newFormats;
    });
  };

  const getFormatMarkers = () => {
    const markers = { prefix: '', suffix: '' };
    if (activeFormats.bold) { markers.prefix += '**'; markers.suffix = '**' + markers.suffix; }
    if (activeFormats.italic) { markers.prefix += '*'; markers.suffix = '*' + markers.suffix; }
    if (activeFormats.underline) { markers.prefix += '__'; markers.suffix = '__' + markers.suffix; }
    if (activeFormats.strike) { markers.prefix += '~~'; markers.suffix = '~~' + markers.suffix; }
    if (activeFormats.big || activeFormats.huge) { markers.prefix += '^^'; markers.suffix = '^^' + markers.suffix; }
    if (activeFormats.small) { markers.prefix += ',,'; markers.suffix = ',,' + markers.suffix; }
    return markers;
  };

  const handleEditorChange = (e) => {
    const textarea = e.target;
    const newValue = textarea.value;
    const oldValue = editContent;
    if (newValue.length > oldValue.length) {
      const markers = getFormatMarkers();
      if (markers.prefix) {
        const diff = newValue.length - oldValue.length;
        const insertPos = textarea.selectionStart - diff;
        const insertedText = newValue.slice(insertPos, insertPos + diff);
        if (insertedText && !/[\n\r]/.test(insertedText)) {
          const formattedText = markers.prefix + insertedText + markers.suffix;
          const newContent = oldValue.slice(0, insertPos) + formattedText + oldValue.slice(insertPos);
          setEditContent(newContent);
          saveContentNow(newContent);
          setTimeout(() => { const newPos = insertPos + formattedText.length - markers.suffix.length; textarea.setSelectionRange(newPos, newPos); }, 0);
          return;
        }
      }
    }
    setEditContent(newValue);
    saveContentNow(newValue);
  };

  const handleAlign = (align) => {
    setCurrentAlign(align);
    if (!editorRef.current) return;
    const textarea = editorRef.current;
    const { selectionStart } = textarea;
    const lines = editContent.split('\n');
    let charCount = 0, lineIndex = 0;
    for (let i = 0; i < lines.length; i++) { if (charCount + lines[i].length >= selectionStart) { lineIndex = i; break; } charCount += lines[i].length + 1; }
    let line = lines[lineIndex].replace(/^\[(CENTER|RIGHT|LEFT)\]/, '');
    if (align === 'center') line = '[CENTER]' + line;
    else if (align === 'right') line = '[RIGHT]' + line;
    lines[lineIndex] = line;
    const newContent = lines.join('\n');
    setEditContent(newContent);
    saveContentNow(newContent);
  };

  const handleIndentAll = () => {
    const lines = editContent.split('\n').map(line => { if (line.trim() && !line.startsWith('　　') && !line.startsWith('[IMG:') && !line.startsWith('[CENTER]') && !line.startsWith('[RIGHT]')) return '　　' + line; return line; });
    const newContent = lines.join('\n');
    setEditContent(newContent);
    saveContentNow(newContent);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) { try { const compressed = await compressImage(file, 600); const newContent = editContent + '\n[IMG:' + compressed + ']\n'; setEditContent(newContent); saveContentNow(newContent); } catch (err) { console.error('图片处理失败:', err); } }
    e.target.value = '';
  };

  const handleContentTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; touchStartY.current = e.touches[0].clientY; };
  const handleContentTouchEnd = (e) => { const deltaX = e.changedTouches[0].clientX - touchStartX.current; const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY.current); if (deltaX > 80 && deltaY < 50 && (currentEntry || navigationStack.length > 0)) handleBack(); };

  const handleEntrySwipe = (entry, deltaX) => {
    if (deltaX < -80 && (entry.isFolder || entry.children?.length > 0)) {
      if (!isReadOnly && currentEntry) saveContentNow(editContent);
      setSlideAnimation('slide-in'); setNavigationStack(prev => [...prev, currentEntry].filter(Boolean)); setCurrentEntry(entry); setViewMode('merged');
      setTimeout(() => initMergedContents(entry), 50); setTimeout(() => setSlideAnimation(''), 250);
    }
  };

  const currentEntries = currentEntry?.children || currentBook?.entries || [];
  const isEditing = !isReadOnly && (viewMode === 'single' || viewMode === 'merged');
  const hasActiveFormat = Object.values(activeFormats).some(v => v);

  if (!currentBook) {
    return (
      <div className="app bookshelf-view">
        <header className="bookshelf-header"><h1>灵感穹顶</h1><p className="subtitle">拾起每一颗星星</p><p className="subtitle">便能拥有属于你的宇宙</p></header>
        <div className="bookshelf">
          {data.books.map(book => (<div key={book.id} className="book-card" style={{ '--book-color': book.color }} onClick={() => handleBookSelect(book)} onTouchStart={(e) => handleLongPressStart(e, 'book', book)} onTouchEnd={handleLongPressEnd} onTouchMove={handleLongPressEnd}><div className="book-spine"></div><div className="book-cover">{book.coverImage ? <img src={book.coverImage} alt={book.title} className="cover-image" /> : <span className="book-emoji">{book.cover}</span>}</div><div className="book-shadow"></div><div className="book-meta"><h2>{book.title}</h2>{book.author && <p>{book.author} 著</p>}</div></div>))}
          <div className="book-card add-book" onClick={() => { setEditingBook(null); setShowBookModal(true); }}><div className="book-cover"><span className="add-icon">+</span></div><div className="book-meta"><h2>新建世界</h2></div></div>
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
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}><div className="sidebar-header"><h2>{currentBook.title}</h2><button className="close-sidebar" onClick={() => setIsSidebarOpen(false)}>×</button></div><div className="sidebar-content">{currentBook.entries.map(entry => <SidebarItem key={entry.id} entry={entry} onSelect={handleSidebarSelect} currentId={currentEntry?.id} expandedIds={expandedIds} onToggle={id => setExpandedIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; })} />)}</div></div>
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}
      <div className="main-content" onTouchStart={handleContentTouchStart} onTouchEnd={handleContentTouchEnd}>
        <header className="top-bar">
          <div className="top-left"><button className="icon-btn" onClick={() => setIsSidebarOpen(true)}>☰</button>{jumpHistory.length > 0 && <button className="icon-btn jump-back-btn" onClick={handleJumpBack}>↩️</button>}{(currentEntry || navigationStack.length > 0) && <button className="icon-btn" onClick={handleBack}>←</button>}<button className="icon-btn" onClick={handleBackToShelf}>🏠</button></div>
          <div className="breadcrumb"><span className="book-name">{currentBook.title}</span>{currentEntry && <><span className="separator">/</span><span className="current-title">{currentEntry.title}</span></>}</div>
          <div className="top-right">{(viewMode === 'single' || viewMode === 'merged') && (<div className="read-mode-toggle" onClick={() => setIsReadOnly(!isReadOnly)}><span className={`toggle-label ${isReadOnly ? 'active' : ''}`}>阅读</span><div className={`toggle-switch ${!isReadOnly ? 'edit-mode' : ''}`}><div className="toggle-knob" /></div><span className={`toggle-label ${!isReadOnly ? 'active' : ''}`}>编辑</span></div>)}</div>
        </header>
        {!currentEntry && currentBook.showStats && (<div className="book-info-card"><div className="info-cover">{currentBook.coverImage ? <img src={currentBook.coverImage} alt="" /> : <span>{currentBook.cover}</span>}</div><div className="info-details">{currentBook.author && <p>作者：{currentBook.author}</p>}{currentBook.tags?.length > 0 && <p>标签：{currentBook.tags.join('、')}</p>}<p>词条：{countEntries(currentBook.entries)}条</p><p>字数：{countWords(currentBook.entries).toLocaleString()}字</p></div></div>)}
        <main className={`content-area ${slideAnimation}`}>
          {viewMode === 'list' && !isReorderMode && (<>{currentEntry && <div className="list-header"><h1>{currentEntry.title}</h1>{currentEntry.summary && <p className="summary">{currentEntry.summary}</p>}</div>}<p className="swipe-hint">💡 左滑合并视图 · 右滑返回 · 长按编辑</p><div className="entry-list">{currentEntries.map((entry) => { let touchX = 0; return (<div key={entry.id} className="entry-card" onClick={() => handleEntryClick(entry)} onTouchStart={(e) => { touchX = e.touches[0].clientX; handleLongPressStart(e, 'entry', entry); }} onTouchMove={handleLongPressEnd} onTouchEnd={(e) => { handleLongPressEnd(); const dx = e.changedTouches[0].clientX - touchX; handleEntrySwipe(entry, dx); }}><div className="entry-icon">{entry.isFolder ? '📁' : '📄'}</div><div className="entry-info"><h3>{entry.title}{entry.linkable && <span className="star-badge">⭐</span>}</h3><p>{entry.summary}</p></div><span className="entry-arrow">›</span></div>); })}</div>{currentEntries.length === 0 && <div className="empty-state"><span>✨</span><p>点击右下角添加</p></div>}</>)}
          {viewMode === 'list' && isReorderMode && <ReorderList entries={currentEntries} onReorder={handleReorder} onExit={() => setIsReorderMode(false)} />}
          {viewMode === 'single' && currentEntry && (<div className="single-view"><div className="content-header"><h1>{currentEntry.title}</h1>{!isReadOnly && <button className="edit-meta-btn" onClick={() => { setEditingEntry(currentEntry); setShowEntryModal(true); }}>✏️</button>}</div>{isReadOnly ? <ContentRenderer content={currentEntry.content} allTitlesMap={allTitlesMap} currentBookId={currentBook.id} onLinkClick={handleLinkClick} fontFamily={currentFont} /> : <textarea ref={editorRef} className="content-editor full" value={editContent} onChange={handleEditorChange} placeholder="开始书写..." style={{ fontFamily: currentFont }} />}</div>)}
          {viewMode === 'merged' && currentEntry && (<div className="merged-view"><div className="content-header merged-header"><h1>{currentEntry.title}</h1><p className="merged-hint">📖 合并视图</p></div>{isReadOnly ? (<div className="merged-content-read">{getAllChildContent(currentEntry, currentBook.entries).map((item, idx, arr) => (<div key={item.id} className="merged-section"><div className="section-title" onClick={() => handleSidebarSelect(item)}><span className="section-bullet">•</span>{item.title}</div><ContentRenderer content={item.content} allTitlesMap={allTitlesMap} currentBookId={currentBook.id} onLinkClick={handleLinkClick} fontFamily={currentFont} />{idx < arr.length - 1 && <div className="section-divider" />}</div>))}</div>) : (<div className="merged-content-edit">{mergedContents.map((item, idx) => (<div key={item.id} className="merged-edit-section"><div className="merged-edit-header"><span className="section-bullet">•</span><input type="text" value={item.title} onChange={e => handleMergedContentChange(idx, 'title', e.target.value)} className="merged-title-input" />{item.isNew && <span className="new-badge">新</span>}</div><textarea value={item.content} onChange={e => handleMergedContentChange(idx, 'content', e.target.value)} className="merged-content-textarea" style={{ fontFamily: currentFont }} placeholder="内容..." /></div>))}<button className="add-merged-entry-btn" onClick={handleAddMergedEntry}>+ 添加词条</button></div>)}</div>)}
        </main>
        {viewMode === 'list' && !isReorderMode && (<><button className={`fab ${showAddMenu ? 'active' : ''}`} onClick={() => setShowAddMenu(!showAddMenu)}><span style={{ transform: showAddMenu ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</span></button><AddMenu isOpen={showAddMenu} onClose={() => setShowAddMenu(false)} onAddEntry={() => { setEditingEntry(null); setIsCreatingFolder(false); setShowEntryModal(true); }} onAddFolder={() => { setEditingEntry(null); setIsCreatingFolder(true); setShowEntryModal(true); }} onReorderMode={() => setIsReorderMode(true)} /></>)}
        {isEditing && <EditorToolbar onIndentAll={handleIndentAll} onFormatClick={() => setShowFormatMenu(true)} onAlignClick={() => setShowAlignMenu(true)} onFontClick={() => setShowFontMenu(true)} onImageUpload={handleImageUpload} hasActiveFormat={hasActiveFormat} />}
        <TextFormatMenu isOpen={showFormatMenu} onClose={() => setShowFormatMenu(false)} activeFormats={activeFormats} onToggleFormat={handleToggleFormat} />
        <AlignMenu isOpen={showAlignMenu} onClose={() => setShowAlignMenu(false)} currentAlign={currentAlign} onAlign={handleAlign} />
        <FontMenu isOpen={showFontMenu} onClose={() => setShowFontMenu(false)} onSelectFont={setCurrentFont} currentFont={currentFont} />
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
.bookshelf-header h1{font-family:'ZCOOL XiaoWei',serif;font-size:2.5rem;color:#f4e4c1;letter-spacing:.3em;text-shadow:0 0 40px rgba(244,228,193,.3);margin-bottom:16px}
.subtitle{color:rgba(244,228,193,.6);font-size:.95rem;letter-spacing:.15em;line-height:1.8}
.bookshelf{display:flex;flex-wrap:wrap;gap:30px;justify-content:center;max-width:1200px;margin:0 auto}
.book-card{position:relative;width:140px;cursor:pointer;perspective:1000px;user-select:none}
.book-card:active{transform:scale(.95)}
.book-spine{position:absolute;left:0;top:0;width:15px;height:180px;background:var(--book-color,#2D3047);border-radius:3px 0 0 3px;transform:rotateY(-30deg) translateX(-8px);transform-origin:right center;box-shadow:-5px 0 15px rgba(0,0,0,.3)}
.book-cover{width:100%;height:180px;background:linear-gradient(145deg,var(--book-color,#2D3047) 0%,color-mix(in srgb,var(--book-color,#2D3047) 70%,black) 100%);border-radius:0 8px 8px 0;display:flex;align-items:center;justify-content:center;box-shadow:5px 5px 20px rgba(0,0,0,.4),inset -2px 0 10px rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);overflow:hidden;position:relative}
.cover-image{position:absolute;width:100%;height:100%;object-fit:cover}
.book-emoji{font-size:3rem;filter:drop-shadow(0 0 10px rgba(255,255,255,.3))}
.book-shadow{position:absolute;bottom:-15px;left:10%;width:80%;height:15px;background:radial-gradient(ellipse,rgba(0,0,0,.4) 0%,transparent 70%)}
.book-meta{text-align:center;padding:12px 4px 0}
.book-meta h2{color:#f4e4c1;font-size:.95rem;margin-bottom:4px}
.book-meta p{color:rgba(244,228,193,.5);font-size:.75rem}
.add-book{opacity:.5;transition:opacity .3s}
.add-book:active{opacity:.8}
.add-book .book-cover{background:linear-gradient(145deg,#2a2a3e 0%,#1a1a2e 100%);border:2px dashed rgba(244,228,193,.3)}
.add-icon{font-size:2.5rem;color:rgba(244,228,193,.5)}
.main-view{background:linear-gradient(180deg,#faf8f3 0%,#f5f0e8 100%);position:relative;display:flex;flex-direction:column}
.sidebar{position:fixed;left:0;top:0;width:280px;max-width:85vw;height:100%;background:linear-gradient(180deg,#2D3047 0%,#1a1a2e 100%);z-index:1000;transform:translateX(-100%);transition:transform .3s;display:flex;flex-direction:column;box-shadow:5px 0 30px rgba(0,0,0,.3)}
.sidebar.open{transform:translateX(0)}
.sidebar-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:999}
.sidebar-header{padding:20px 16px;border-bottom:1px solid rgba(244,228,193,.1);display:flex;justify-content:space-between;align-items:center}
.sidebar-header h2{color:#f4e4c1;font-size:1.2rem;font-family:'ZCOOL XiaoWei',serif}
.close-sidebar{background:none;border:none;color:rgba(244,228,193,.6);font-size:1.5rem;cursor:pointer}
.sidebar-content{flex:1;overflow-y:auto;padding:12px 0}
.sidebar-item{display:flex;align-items:center;padding:12px 16px;color:rgba(244,228,193,.8);cursor:pointer;gap:8px}
.sidebar-item:active,.sidebar-item.active{background:rgba(244,228,193,.1)}
.expand-icon{font-size:.9rem;width:16px;transition:transform .2s}
.expand-icon.expanded{transform:rotate(90deg)}
.sidebar-icon{font-size:.85rem}
.sidebar-title{font-size:.9rem;flex:1}
.link-star{font-size:.65rem;opacity:.7}
.top-bar{position:sticky;top:0;z-index:100;display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:rgba(250,248,243,.95);backdrop-filter:blur(10px);border-bottom:1px solid rgba(45,48,71,.1)}
.top-left{display:flex;gap:4px}
.icon-btn{background:none;border:none;font-size:1.2rem;padding:8px;border-radius:8px;cursor:pointer;color:#2D3047}
.icon-btn:active{background:rgba(45,48,71,.1)}
.jump-back-btn{background:rgba(139,115,85,.1);color:#8B7355}
.breadcrumb{flex:1;text-align:center;font-size:.85rem;color:#666;overflow:hidden}
.book-name{color:#2D3047;font-weight:600}
.separator{margin:0 6px;color:#ccc}
.current-title{color:#8B7355}
.read-mode-toggle{display:flex;align-items:center;gap:6px;cursor:pointer;padding:4px 8px;border-radius:16px;background:rgba(45,48,71,.05)}
.toggle-label{font-size:.75rem;color:#999;transition:color .2s}
.toggle-label.active{color:#2D3047;font-weight:600}
.toggle-switch{width:36px;height:20px;background:#2D3047;border-radius:10px;position:relative;transition:background .3s}
.toggle-switch.edit-mode{background:#8B7355}
.toggle-knob{position:absolute;left:2px;top:2px;width:16px;height:16px;background:#f4e4c1;border-radius:50%;transition:transform .3s;box-shadow:0 2px 4px rgba(0,0,0,.2)}
.toggle-switch.edit-mode .toggle-knob{transform:translateX(16px)}
.book-info-card{display:flex;gap:16px;padding:20px;background:#fff;margin:16px;border-radius:12px;box-shadow:0 2px 8px rgba(45,48,71,.08)}
.info-cover{width:70px;height:95px;border-radius:6px;overflow:hidden;background:linear-gradient(135deg,#2D3047,#1a1a2e);display:flex;align-items:center;justify-content:center;font-size:2rem;flex-shrink:0}
.info-cover img{width:100%;height:100%;object-fit:cover}
.info-details{flex:1;font-size:.85rem;color:#666;display:flex;flex-direction:column;gap:6px}
.content-area{padding:20px 16px;padding-bottom:80px;flex:1;overflow-y:auto}
.content-area.slide-in{animation:slideIn .25s ease-out}
.content-area.slide-out{animation:slideOut .2s ease-in}
@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes slideOut{from{transform:translateX(0);opacity:1}to{transform:translateX(100%);opacity:0}}
.list-header{margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid rgba(45,48,71,.1)}
.list-header h1{font-family:'ZCOOL XiaoWei',serif;font-size:1.6rem;color:#2D3047;margin-bottom:6px}
.list-header .summary{color:#8B7355;font-size:.9rem}
.swipe-hint{font-size:.75rem;color:#aaa;text-align:center;margin-bottom:16px}
.entry-list{display:flex;flex-direction:column;gap:10px}
.entry-card{display:flex;align-items:center;gap:12px;padding:16px;background:#fff;border-radius:12px;cursor:pointer;box-shadow:0 2px 8px rgba(45,48,71,.08);user-select:none;transition:transform .15s}
.entry-card:active{transform:scale(.98)}
.entry-icon{font-size:1.3rem}
.entry-info{flex:1;min-width:0}
.entry-info h3{font-size:1rem;color:#2D3047;margin-bottom:2px;font-weight:600;display:flex;align-items:center;gap:6px}
.entry-info p{font-size:.8rem;color:#8B7355;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.star-badge{font-size:.7rem;opacity:.7}
.entry-arrow{font-size:1.3rem;color:#ccc}
.empty-state{text-align:center;padding:60px 20px;color:#999}
.empty-state span{font-size:2.5rem;display:block;margin-bottom:12px}
.single-view,.merged-view{background:#fff;border-radius:16px;padding:24px 20px;box-shadow:0 4px 20px rgba(45,48,71,.1);min-height:calc(100vh - 200px)}
.content-header{margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid rgba(45,48,71,.1);display:flex;justify-content:space-between;align-items:center}
.content-header h1{font-family:'ZCOOL XiaoWei',serif;font-size:1.5rem;color:#2D3047}
.edit-meta-btn{background:none;border:1px solid #ddd;padding:6px 12px;border-radius:6px;font-size:.8rem;color:#666;cursor:pointer}
.merged-header{text-align:center;display:block}
.merged-hint{color:#8B7355;font-size:.85rem;margin-top:6px}
.content-body{line-height:1.9;color:#333;font-size:16px}
.content-line{margin-bottom:.5em;text-align:justify}
.content-image{text-align:center;margin:16px 0}
.content-image img{max-width:100%;border-radius:8px;max-height:300px;object-fit:contain}
.keyword{color:#2D3047;font-weight:600}
.keyword.linked{color:#8B7355;background:linear-gradient(180deg,transparent 60%,rgba(139,115,85,.2) 60%);cursor:pointer}
.content-editor{width:100%;min-height:50vh;padding:0;border:none;font-family:'Noto Serif SC',serif;font-size:16px;line-height:1.9;resize:none;background:transparent}
.content-editor:focus{outline:none}
.content-editor.full{min-height:calc(100vh - 280px)}
.merged-content-read .merged-section{margin-bottom:32px}
.section-title{font-size:1.1rem;color:#2D3047;font-weight:600;margin-bottom:12px;cursor:pointer;display:flex;align-items:center;gap:8px}
.section-bullet{font-size:1.5rem;color:#8B7355}
.section-divider{height:1px;background:linear-gradient(90deg,transparent,rgba(45,48,71,.15),transparent);margin:32px 0}
.merged-content-edit{display:flex;flex-direction:column;gap:24px}
.merged-edit-section{padding-bottom:20px;border-bottom:1px solid rgba(45,48,71,.1)}
.merged-edit-header{display:flex;align-items:center;gap:8px;margin-bottom:12px}
.merged-title-input{flex:1;background:none;border:none;font-size:1.1rem;font-weight:600;color:#2D3047;padding:4px 0;font-family:'Noto Serif SC',serif}
.merged-title-input:focus{outline:none}
.new-badge{font-size:.7rem;background:#8B7355;color:#fff;padding:2px 6px;border-radius:4px}
.merged-content-textarea{width:100%;min-height:100px;padding:0;border:none;font-family:'Noto Serif SC',serif;font-size:16px;line-height:1.8;resize:none;background:transparent}
.merged-content-textarea:focus{outline:none}
.add-merged-entry-btn{background:none;border:1px dashed rgba(45,48,71,.2);border-radius:8px;padding:12px;color:#8B7355;font-size:.9rem;cursor:pointer}
.add-merged-entry-btn:active{background:rgba(139,115,85,.05)}
.fab{position:fixed;right:24px;bottom:24px;width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#2D3047,#1a1a2e);border:none;color:#f4e4c1;font-size:1.8rem;cursor:pointer;box-shadow:0 4px 20px rgba(45,48,71,.4);display:flex;align-items:center;justify-content:center;z-index:50}
.fab:active,.fab.active{transform:scale(.9)}
.fab.active{background:linear-gradient(135deg,#8B7355,#6B5335)}
.add-menu-overlay{position:fixed;inset:0;z-index:48}
.add-menu{position:fixed;right:24px;bottom:90px;background:#fff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,.15);overflow:hidden;z-index:49;animation:slideUp .2s}
@keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.add-menu-item{display:flex;align-items:center;gap:12px;padding:16px 20px;cursor:pointer}
.add-menu-item:active{background:#f5f5f5}
.add-menu-item:not(:last-child){border-bottom:1px solid #eee}
.editor-toolbar-bottom{position:fixed;bottom:0;left:0;right:0;display:flex;justify-content:space-around;padding:8px 16px;background:rgba(250,248,243,.98);border-top:1px solid rgba(45,48,71,.08);z-index:50}
.editor-toolbar-bottom button{background:none;border:none;font-size:1rem;padding:8px 14px;cursor:pointer;color:#2D3047;border-radius:6px;display:flex;align-items:center;justify-content:center}
.editor-toolbar-bottom button:active{background:rgba(45,48,71,.08)}
.editor-toolbar-bottom button.has-active{color:#8B7355;background:rgba(139,115,85,.1)}
.format-menu-overlay{position:fixed;inset:0;z-index:58}
.format-menu{position:fixed;left:16px;right:16px;bottom:60px;background:#fff;border-radius:12px;box-shadow:0 -4px 20px rgba(0,0,0,.1);z-index:59;padding:12px}
.format-row{display:flex;justify-content:space-around;margin-bottom:8px}
.format-row:last-child{margin-bottom:0}
.format-row button{width:44px;height:44px;border-radius:10px;border:1px solid #eee;background:#fff;font-size:1rem;cursor:pointer;display:flex;align-items:center;justify-content:center}
.format-row button:active{background:rgba(139,115,85,.15)}
.format-row button.active{background:#8B7355;color:#fff;border-color:#8B7355}
.size-row button{width:auto;padding:0 14px}
.align-menu .format-row{justify-content:center;gap:16px}
.font-menu{position:fixed;left:16px;right:16px;bottom:60px;background:#fff;border-radius:12px;box-shadow:0 -4px 20px rgba(0,0,0,.1);z-index:59;padding:16px}
.font-section-title{font-size:.8rem;color:#999;margin-bottom:12px}
.font-options{display:flex;flex-wrap:wrap;gap:8px}
.font-item{padding:10px 14px;border-radius:8px;cursor:pointer;font-size:.9rem;background:#f5f5f5}
.font-item:active,.font-item.active{background:rgba(139,115,85,.15);color:#8B7355}
.reorder-mode{padding:0}
.reorder-header{display:flex;justify-content:space-between;align-items:center;padding:16px 0;border-bottom:1px solid rgba(45,48,71,.1);margin-bottom:16px}
.reorder-header h3{font-family:'ZCOOL XiaoWei',serif;font-size:1.3rem;color:#2D3047}
.done-btn{background:#8B7355;color:#fff;border:none;padding:8px 20px;border-radius:8px;font-size:.9rem;cursor:pointer}
.reorder-hint{font-size:.8rem;color:#999;text-align:center;margin-bottom:16px}
.reorder-list{display:flex;flex-direction:column;gap:8px}
.reorder-item{display:flex;align-items:center;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(45,48,71,.08);transition:transform .15s,opacity .15s}
.reorder-item.dragging{opacity:.6;transform:scale(.95)}
.reorder-item.over{border:2px dashed #8B7355}
.reorder-content{flex:1;display:flex;align-items:center;gap:12px;padding:14px 16px}
.reorder-icon{font-size:1.2rem}
.reorder-title{font-size:.95rem;color:#2D3047}
.bookmark-tab{width:40px;height:100%;background:linear-gradient(135deg,#8B7355,#6B5335);display:flex;align-items:center;justify-content:center;color:#f4e4c1;font-size:1.2rem;clip-path:polygon(0 0,100% 0,100% 100%,0 100%,8px 50%)}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:2000;display:flex;align-items:center;justify-content:center;padding:20px}
.modal-content{background:#fff;border-radius:16px;padding:24px;width:100%;max-width:360px;max-height:80vh;overflow-y:auto}
.modal-content h3{font-family:'ZCOOL XiaoWei',serif;font-size:1.3rem;color:#2D3047;margin-bottom:16px;text-align:center}
.confirm-modal p{text-align:center;color:#666;margin-bottom:20px}
.modal-hint{font-size:.85rem;color:#8B7355;margin-bottom:16px;text-align:center}
.modal-content input[type="text"]{width:100%;padding:12px 16px;border:2px solid rgba(45,48,71,.1);border-radius:10px;font-family:'Noto Serif SC',serif;font-size:1rem;margin-bottom:12px}
.modal-content input:focus{outline:none;border-color:#8B7355}
.checkbox-label{display:flex;align-items:center;gap:10px;margin-bottom:12px;font-size:.9rem;color:#666;cursor:pointer}
.checkbox-label input{width:18px;height:18px;accent-color:#8B7355}
.section-label{font-size:.85rem;color:#666;margin-bottom:10px}
.cover-section{margin-bottom:16px}
.cover-preview{position:relative;width:100%;height:150px;border-radius:10px;overflow:hidden;margin-bottom:12px}
.cover-preview img{width:100%;height:100%;object-fit:cover}
.remove-cover{position:absolute;top:8px;right:8px;width:28px;height:28px;border-radius:50%;background:rgba(0,0,0,.6);color:#fff;border:none;font-size:1.2rem;cursor:pointer}
.upload-cover-btn{width:100%;padding:12px;border:2px dashed rgba(45,48,71,.2);border-radius:10px;background:none;color:#666;font-size:.9rem;cursor:pointer;margin-top:12px}
.emoji-picker{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.emoji-option{font-size:1.8rem;padding:8px;border-radius:8px;cursor:pointer}
.emoji-option.selected{background:rgba(139,115,85,.2);transform:scale(1.1)}
.modal-actions{display:flex;gap:12px;margin-top:16px}
.btn-cancel,.btn-save,.btn-danger{flex:1;padding:12px;border-radius:10px;font-family:'Noto Serif SC',serif;font-size:1rem;cursor:pointer}
.btn-cancel{background:none;border:2px solid rgba(45,48,71,.2);color:#666}
.btn-save{background:linear-gradient(135deg,#2D3047,#1a1a2e);border:none;color:#f4e4c1}
.btn-danger{background:#e53935;border:none;color:#fff}
.btn-save:disabled{opacity:.5}
.book-modal{max-width:400px}
.context-overlay{position:fixed;inset:0;z-index:1998}
.context-menu{position:fixed;background:#fff;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,.2);overflow:hidden;z-index:1999;min-width:160px}
.context-item{display:flex;align-items:center;gap:12px;padding:14px 18px;cursor:pointer;font-size:.95rem}
.context-item:active{background:#f5f5f5}
.context-item.danger{color:#e53935}
.context-item:not(:last-child){border-bottom:1px solid #eee}
.context-icon{font-size:1.1rem}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-thumb{background:rgba(45,48,71,.15);border-radius:2px}
.sidebar ::-webkit-scrollbar-thumb{background:rgba(244,228,193,.2)}
`;
