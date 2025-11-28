import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

// ==================== 本地存储 ====================
const STORAGE_KEY = 'inspiration-vault-data';
const saveToStorage = (data) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { console.error('保存失败:', e); } };
const loadFromStorage = () => { try { const saved = localStorage.getItem(STORAGE_KEY); return saved ? JSON.parse(saved) : null; } catch (e) { return null; } };

// ==================== 初始数据 ====================
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
                  content: '<p>　　在时间的起点，女神独自漂浮于无尽的寂静之中。</p><p>　　第一日，她从心火中分离出【火的守望】。</p><p>　　第二日，从泪水中分离出【水的祝福】。</p>', children: [] },
                { id: 'war-gods', title: '战争双神', summary: '胜利与牺牲', linkable: true, isFolder: false,
                  content: '<p>　　<b>胜利者·凯洛斯</b>，身披金色战甲。</p><p>　　<i>牺牲者·赛莲娜</i>，身着银色长袍。</p>', children: [] }
              ]
            },
            {
              id: 'geography', title: '地理', summary: '大陆疆域', content: '', isFolder: true, linkable: false,
              children: [
                { id: 'koltra', title: '柯尔特拉', summary: '中央王国', linkable: true, isFolder: true, content: '<p>　　位于大陆正中央，被称为"女神的掌心"。</p>', 
                  children: [
                    { id: 'silver-city', title: '银冠城', summary: '首都', linkable: true, isFolder: false, content: '<p>　　首都建立在白色岩石上，城中有【千年图书馆】。</p>', children: [] }
                  ] },
                { id: 'northland', title: '北境', summary: '冰雪王国', linkable: true, isFolder: false, content: '<p>　　永恒冬季笼罩的土地，居民是【霜裔】后代。</p>', children: [] }
              ]
            }
          ]
        },
        {
          id: 'characters', title: '人物', summary: '故事灵魂', content: '', isFolder: true, linkable: false,
          children: [
            { id: 'elena', title: '艾琳娜', summary: '流亡公主', linkable: true, isFolder: false, content: '<p>　　【柯尔特拉】末代国王的独生女。在【千年图书馆】长大，对【十日旧约】研究深入。</p>', children: [] }
          ]
        }
      ]
    },
    {
      id: 'jade-book', title: '玉辞', author: '桐青璃落', tags: ['古风'],
      cover: '🏯', coverImage: null, color: '#4A0E0E', showStats: true,
      entries: [
        { id: 'jade-chars', title: '人物', summary: '江湖儿女', content: '<p>　　曾有异世旅人【艾琳娜】短暂停留……</p>', isFolder: true, linkable: false, children: [] }
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
    if (entry.children?.length) {
      return { ...entry, children: reorderEntriesInParent(entry.children, parentId, fromIndex, toIndex) };
    }
    return entry;
  });
};

const countWords = (entries) => {
  let count = 0;
  const traverse = (items) => items.forEach(item => {
    if (item.content) {
      const div = document.createElement('div');
      div.innerHTML = item.content;
      count += (div.textContent || '').replace(/\s/g, '').length;
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
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
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

// ==================== 弹窗 ====================
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
            <div className="cover-preview"><img src={coverImage} alt="" /><button className="remove-cover" onClick={() => setCoverImage(null)}>×</button></div>
          ) : (
            <div className="emoji-picker">{emojis.map(e => <span key={e} className={`emoji-option ${emoji === e ? 'selected' : ''}`} onClick={() => setEmoji(e)}>{e}</span>)}</div>
          )}
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

// ==================== 格式菜单 ====================
const TextFormatMenu = ({ isOpen, onClose, onFormat }) => {
  if (!isOpen) return null;
  return (
    <>
      <div className="format-menu-overlay" onClick={onClose} />
      <div className="format-menu">
        <div className="format-row">
          <button onClick={() => { onFormat('bold'); }} title="加粗"><strong>B</strong></button>
          <button onClick={() => { onFormat('italic'); }} title="斜体"><em>I</em></button>
          <button onClick={() => { onFormat('underline'); }} title="下划线"><u>U</u></button>
          <button onClick={() => { onFormat('strikeThrough'); }} title="删除线"><del>S</del></button>
        </div>
        <div className="format-row size-row">
          <button onClick={() => { onFormat('fontSize', '2'); }}>小</button>
          <button onClick={() => { onFormat('fontSize', '3'); }}>中</button>
          <button onClick={() => { onFormat('fontSize', '4'); }}>大</button>
          <button onClick={() => { onFormat('fontSize', '5'); }}>特大</button>
        </div>
      </div>
    </>
  );
};

const AlignMenu = ({ isOpen, onClose, onAlign }) => {
  if (!isOpen) return null;
  return (
    <>
      <div className="format-menu-overlay" onClick={onClose} />
      <div className="format-menu align-menu">
        <div className="format-row">
          <button onClick={() => { onAlign('left'); onClose(); }} title="左对齐">⬅</button>
          <button onClick={() => { onAlign('center'); onClose(); }} title="居中">⬌</button>
          <button onClick={() => { onAlign('right'); onClose(); }} title="右对齐">➡</button>
        </div>
      </div>
    </>
  );
};

const FontMenu = ({ isOpen, onClose, onSelectFont, currentFont }) => {
  const fonts = [
    { name: '默认', value: "'Noto Serif SC', serif" },
    { name: '宋体', value: "'Songti SC', 'SimSun', serif" },
    { name: '黑体', value: "'Heiti SC', 'SimHei', sans-serif" },
    { name: '楷体', value: "'Kaiti SC', 'KaiTi', serif" },
    { name: '仿宋', value: "'FangSong SC', 'FangSong', serif" },
  ];
  if (!isOpen) return null;
  return (
    <>
      <div className="format-menu-overlay" onClick={onClose} />
      <div className="font-menu">
        <p className="font-section-title">选择字体</p>
        <div className="font-options">
          {fonts.map(f => (
            <div key={f.value} className={`font-item ${currentFont === f.value ? 'active' : ''}`} 
              onClick={() => { onSelectFont(f.value); onClose(); }} style={{ fontFamily: f.value }}>{f.name}</div>
          ))}
        </div>
      </div>
    </>
  );
};

// ==================== 编辑工具栏 ====================
const EditorToolbar = ({ onIndentAll, onFormatClick, onFontClick, onAlignClick, onImageUpload }) => {
  const imageInputRef = useRef(null);
  return (
    <div className="editor-toolbar-bottom">
      <button onClick={onIndentAll} title="全文缩进">↵</button>
      <button onClick={onFormatClick} title="文字格式">A</button>
      <button onClick={onAlignClick} title="对齐">≡</button>
      <button onClick={onFontClick} title="字体">T</button>
      <button onClick={() => imageInputRef.current?.click()} title="插入图片">🖼</button>
      <input ref={imageInputRef} type="file" accept="image/*" onChange={onImageUpload} style={{ display: 'none' }} />
    </div>
  );
};

// ==================== FAB菜单 ====================
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

// ==================== 排序模式 ====================
const ReorderList = ({ entries, onReorder, onExit }) => {
  const [draggingIndex, setDraggingIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);
  const listRef = useRef(null);

  const handleTouchStart = (e, index) => {
    setDraggingIndex(index);
    if (navigator.vibrate) navigator.vibrate(30);
  };

  const handleTouchMove = (e) => {
    if (draggingIndex === null) return;
    e.preventDefault();
    const touch = e.touches[0];
    const items = listRef.current?.querySelectorAll('.reorder-item');
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const rect = items[i].getBoundingClientRect();
      if (touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
        setOverIndex(i);
        break;
      }
    }
  };

  const handleTouchEnd = () => {
    if (draggingIndex !== null && overIndex !== null && draggingIndex !== overIndex) {
      onReorder(draggingIndex, overIndex);
    }
    setDraggingIndex(null);
    setOverIndex(null);
  };

  return (
    <div className="reorder-mode">
      <div className="reorder-header">
        <h3>调整排序</h3>
        <button className="done-btn" onClick={onExit}>完成</button>
      </div>
      <p className="reorder-hint">长按书签拖动调整顺序</p>
      <div className="reorder-list" ref={listRef} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        {entries.map((entry, index) => (
          <div key={entry.id} className={`reorder-item ${draggingIndex === index ? 'dragging' : ''} ${overIndex === index && draggingIndex !== index ? 'over' : ''}`} onTouchStart={(e) => handleTouchStart(e, index)}>
            <div className="reorder-content">
              <span className="reorder-icon">{entry.isFolder ? '📁' : '📄'}</span>
              <span className="reorder-title">{entry.title}</span>
            </div>
            <div className="bookmark-tab"><span>≡</span></div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==================== 富文本阅读渲染 ====================
const ContentRenderer = ({ content, allTitlesMap, currentBookId, onLinkClick, fontFamily }) => {
  const containerRef = useRef(null);
  
  useEffect(() => {
    if (!containerRef.current || !content) return;
    // 处理关键词链接
    const processKeywords = (html) => {
      return html.replace(/【([^】]+)】/g, (match, keyword) => {
        const linkTargets = allTitlesMap.get(keyword);
        if (linkTargets?.length) {
          return `<span class="keyword linked clickable" data-keyword="${keyword}">【${keyword}】</span>`;
        }
        return `<span class="keyword">【${keyword}】</span>`;
      });
    };
    containerRef.current.innerHTML = processKeywords(content);
    
    // 绑定点击事件
    containerRef.current.querySelectorAll('.keyword.clickable').forEach(el => {
      el.onclick = () => {
        const keyword = el.dataset.keyword;
        const linkTargets = allTitlesMap.get(keyword);
        if (linkTargets?.length) {
          const target = linkTargets.find(t => t.bookId === currentBookId) || linkTargets[0];
          onLinkClick(keyword, target.bookId, target.entry.id);
        }
      };
    });
  }, [content, allTitlesMap, currentBookId, onLinkClick]);

  return <div ref={containerRef} className="content-body" style={{ fontFamily }} />;
};

// ==================== 富文本编辑器 ====================
const RichEditor = ({ content, onChange, fontFamily, onSave }) => {
  const editorRef = useRef(null);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && content !== undefined) {
      // 只在内容不同时更新，避免光标跳动
      if (editorRef.current.innerHTML !== content) {
        editorRef.current.innerHTML = content || '<p><br></p>';
      }
    }
  }, [content]);

  const handleInput = () => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (editorRef.current) {
        const html = editorRef.current.innerHTML;
        onChange(html);
        onSave(html);
      }
    }, 300);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  return (
    <div
      ref={editorRef}
      className="rich-editor"
      contentEditable
      onInput={handleInput}
      onPaste={handlePaste}
      style={{ fontFamily }}
      suppressContentEditableWarning
    />
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
  const [pageFlipAnimation, setPageFlipAnimation] = useState('');
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [showAlignMenu, setShowAlignMenu] = useState(false);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [currentFont, setCurrentFont] = useState("'Noto Serif SC', serif");
  const [isReorderMode, setIsReorderMode] = useState(false);
  const longPressTimer = useRef(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  useEffect(() => { saveToStorage(data); }, [data]);
  
  const allTitlesMap = useMemo(() => collectAllLinkableTitles(data.books), [data.books]);
  
  useEffect(() => { 
    if (currentBook) { 
      const updated = data.books.find(b => b.id === currentBook.id); 
      if (updated) setCurrentBook(updated); 
    } 
  }, [data]);
  
  useEffect(() => { 
    if (currentEntry && currentBook) { 
      const found = findEntryById(currentBook.entries, currentEntry.id); 
      if (found) setCurrentEntry(found); 
    } 
  }, [currentBook]);

  const initMergedContents = useCallback((entry) => {
    if (!entry || !currentBook) return;
    const items = getAllChildContent(entry, currentBook.entries);
    setMergedContents(items.map(item => ({ id: item.id, title: item.title, content: item.content || '', isNew: false })));
  }, [currentBook]);

  // 保存单个词条内容
  const saveEntryContent = useCallback((html) => {
    if (!currentEntry || !currentBook) return;
    const updatedEntries = updateEntryInTree(currentBook.entries, currentEntry.id, { content: html });
    setData(prev => ({ ...prev, books: prev.books.map(b => b.id === currentBook.id ? { ...b, entries: updatedEntries } : b) }));
  }, [currentEntry, currentBook]);

  // 长按
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

  // 书架进入书籍（翻页动画）
  const handleBookSelect = (book) => { 
    setPageFlipAnimation('page-flip-in');
    setTimeout(() => {
      setCurrentBook(book); 
      setCurrentEntry(null); 
      setViewMode('list'); 
      setNavigationStack([]);
      setPageFlipAnimation('');
    }, 400);
  };
  
  const handleBackToShelf = () => {
    setPageFlipAnimation('page-flip-out');
    setTimeout(() => { 
      setCurrentBook(null); 
      setCurrentEntry(null); 
      setViewMode('list'); 
      setNavigationStack([]); 
      setIsSidebarOpen(false); 
      setJumpHistory([]); 
      setIsReorderMode(false);
      setPageFlipAnimation('');
    }, 400);
  };

  const handleEntryClick = (entry) => {
    setSlideAnimation('slide-in');
    setNavigationStack(prev => [...prev, currentEntry].filter(Boolean));
    setCurrentEntry(entry);
    if (entry.isFolder || entry.children?.length > 0) setViewMode('list');
    else { 
      setViewMode('single'); 
      setEditContent(entry.content || ''); 
      setIsReadOnly(true); 
    }
    setTimeout(() => setSlideAnimation(''), 250);
  };

  const handleBack = () => {
    setSlideAnimation('slide-out');
    setTimeout(() => {
      if (navigationStack.length > 0) {
        const prev = navigationStack[navigationStack.length - 1];
        setNavigationStack(s => s.slice(0, -1));
        setCurrentEntry(prev);
        setViewMode(prev ? 'list' : 'list');
      } else { setCurrentEntry(null); setViewMode('list'); }
      setSlideAnimation('');
      setIsReorderMode(false);
    }, 200);
  };

  const handleJumpBack = () => {
    if (jumpHistory.length > 0) {
      const last = jumpHistory[jumpHistory.length - 1];
      setJumpHistory(prev => prev.slice(0, -1));
      const book = data.books.find(b => b.id === last.bookId);
      if (book) { 
        setCurrentBook(book); 
        setNavigationStack(last.navStack); 
        setCurrentEntry(last.entry); 
        setViewMode(last.viewMode); 
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
      else { 
        setViewMode('single'); 
        setEditContent(entry.content || ''); 
      }
    }
    setIsSidebarOpen(false);
  };

  const handleLinkClick = useCallback((keyword, targetBookId, targetEntryId) => {
    setJumpHistory(prev => [...prev, { bookId: currentBook.id, entry: currentEntry, navStack: navigationStack, viewMode }]);
    const targetBook = data.books.find(b => b.id === targetBookId);
    if (targetBook) {
      setSlideAnimation('slide-in');
      setCurrentBook(targetBook);
      const path = findEntryPath(targetBook.entries, targetEntryId);
      if (path) {
        const targetEntry = path[path.length - 1];
        setNavigationStack(path.slice(0, -1));
        setCurrentEntry(targetEntry);
        if (targetEntry.isFolder && targetEntry.linkable) { 
          setViewMode('merged'); 
          setTimeout(() => initMergedContents(targetEntry), 0);
        } else if (targetEntry.isFolder) {
          setViewMode('list');
        } else { 
          setViewMode('single'); 
          setEditContent(targetEntry.content || ''); 
        }
      }
      setTimeout(() => setSlideAnimation(''), 250);
    }
  }, [currentBook, currentEntry, navigationStack, viewMode, data.books, initMergedContents]);

  const handleSaveMergedContent = useCallback(() => {
    if (!currentEntry || !currentBook) return;
    let updatedEntries = currentBook.entries;
    mergedContents.forEach(item => {
      if (item.isNew && item.title.trim()) {
        const newEntry = { id: item.id, title: item.title.trim(), summary: '', content: item.content, isFolder: false, linkable: true, children: [] };
        updatedEntries = addEntryToParent(updatedEntries, currentEntry.id, newEntry);
      } else if (!item.isNew) {
        updatedEntries = updateEntryInTree(updatedEntries, item.id, { content: item.content });
      }
    });
    setData(prev => ({ ...prev, books: prev.books.map(b => b.id === currentBook.id ? { ...b, entries: updatedEntries } : b) }));
  }, [currentEntry, currentBook, mergedContents]);

  const handleMergedContentChange = (index, field, value) => {
    const newContents = mergedContents.map((item, i) => i === index ? { ...item, [field]: value } : item);
    setMergedContents(newContents);
    // 立即保存
    if (!newContents[index].isNew) {
      const item = newContents[index];
      const updatedEntries = updateEntryInTree(currentBook.entries, item.id, { [field]: value });
      setData(prev => ({ ...prev, books: prev.books.map(b => b.id === currentBook.id ? { ...b, entries: updatedEntries } : b) }));
    }
  };

  const handleAddMergedEntry = () => {
    setMergedContents(prev => [...prev, { id: generateId(), title: '新词条', content: '', isNew: true }]);
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

  const handleReorder = (fromIndex, toIndex) => {
    const parentId = currentEntry?.id || null;
    const updatedEntries = reorderEntriesInParent(currentBook.entries, parentId, fromIndex, toIndex);
    setData(prev => ({ ...prev, books: prev.books.map(b => b.id === currentBook.id ? { ...b, entries: updatedEntries } : b) }));
  };

  // 富文本格式命令
  const handleFormat = (command, value = null) => {
    document.execCommand(command, false, value);
  };

  // 对齐
  const handleAlign = (align) => {
    document.execCommand('justify' + align.charAt(0).toUpperCase() + align.slice(1), false, null);
  };

  // 全文缩进
  const handleIndentAll = () => {
    const editor = document.querySelector('.rich-editor');
    if (!editor) return;
    const paragraphs = editor.querySelectorAll('p, div');
    paragraphs.forEach(p => {
      const text = p.textContent;
      if (text && !text.startsWith('　　')) {
        p.textContent = '　　' + text;
      }
    });
    // 触发保存
    const html = editor.innerHTML;
    setEditContent(html);
    saveEntryContent(html);
  };

  // 插入图片
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 600);
        const imgHtml = `<p style="text-align:center"><img src="${compressed}" style="max-width:100%;border-radius:8px" /></p>`;
        document.execCommand('insertHTML', false, imgHtml);
        // 触发保存
        setTimeout(() => {
          const editor = document.querySelector('.rich-editor');
          if (editor) {
            const html = editor.innerHTML;
            setEditContent(html);
            saveEntryContent(html);
          }
        }, 100);
      } catch (err) {
        console.error('图片处理失败:', err);
      }
    }
    e.target.value = '';
  };

  // 滑动手势
  const handleContentTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; touchStartY.current = e.touches[0].clientY; };
  const handleContentTouchEnd = (e) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
    if (deltaX > 80 && deltaY < 50 && (currentEntry || navigationStack.length > 0)) handleBack();
  };

  // 词条左滑
  const handleEntrySwipe = (entry, deltaX) => {
    if (deltaX < -80 && (entry.isFolder || entry.children?.length > 0)) {
      setSlideAnimation('slide-in');
      setNavigationStack(prev => [...prev, currentEntry].filter(Boolean));
      setCurrentEntry(entry);
      setViewMode('merged');
      setTimeout(() => initMergedContents(entry), 50);
      setTimeout(() => setSlideAnimation(''), 250);
    }
  };

  const currentEntries = currentEntry?.children || currentBook?.entries || [];
  const isEditing = !isReadOnly && (viewMode === 'single' || viewMode === 'merged');

  // ==================== 书架 ====================
  if (!currentBook) {
    return (
      <div className={`app bookshelf-view ${pageFlipAnimation}`}>
        <header className="bookshelf-header">
          <h1>灵感穹顶</h1>
          <p className="subtitle">拾起每一颗星星</p>
          <p className="subtitle">便能拥有属于你的宇宙</p>
        </header>
        <div className="bookshelf">
          {data.books.map(book => (
            <div key={book.id} className="book-card" style={{ '--book-color': book.color }}
              onClick={() => handleBookSelect(book)}
              onTouchStart={(e) => handleLongPressStart(e, 'book', book)} onTouchEnd={handleLongPressEnd} onTouchMove={handleLongPressEnd}>
              <div className="book-spine"></div>
              <div className="book-cover">
                {book.coverImage ? <img src={book.coverImage} alt={book.title} className="cover-image" /> : <span className="book-emoji">{book.cover}</span>}
              </div>
              <div className="book-shadow"></div>
              <div className="book-meta"><h2>{book.title}</h2>{book.author && <p>{book.author} 著</p>}</div>
            </div>
          ))}
          <div className="book-card add-book" onClick={() => { setEditingBook(null); setShowBookModal(true); }}>
            <div className="book-cover"><span className="add-icon">+</span></div>
            <div className="book-meta"><h2>新建世界</h2></div>
          </div>
        </div>
        <BookModal isOpen={showBookModal} onClose={() => { setShowBookModal(false); setEditingBook(null); }} onSave={handleAddBook} editingBook={editingBook} />
        <ContextMenu isOpen={contextMenu.isOpen} position={contextMenu.position} onClose={() => setContextMenu({ ...contextMenu, isOpen: false })} options={contextMenu.options} />
        <ConfirmModal isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message} onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal({ isOpen: false })} />
        <style>{styles}</style>
      </div>
    );
  }

  // ==================== 主视图 ====================
  return (
    <div className={`app main-view ${pageFlipAnimation}`}>
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header"><h2>{currentBook.title}</h2><button className="close-sidebar" onClick={() => setIsSidebarOpen(false)}>×</button></div>
        <div className="sidebar-content">{currentBook.entries.map(entry => <SidebarItem key={entry.id} entry={entry} onSelect={handleSidebarSelect} currentId={currentEntry?.id} expandedIds={expandedIds} onToggle={id => setExpandedIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; })} />)}</div>
      </div>
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}
      
      <div className="main-content" onTouchStart={handleContentTouchStart} onTouchEnd={handleContentTouchEnd}>
        <header className="top-bar">
          <div className="top-left">
            <button className="icon-btn" onClick={() => setIsSidebarOpen(true)}>☰</button>
            {jumpHistory.length > 0 && <button className="icon-btn jump-back-btn" onClick={handleJumpBack}>↩️</button>}
            {(currentEntry || navigationStack.length > 0) && <button className="icon-btn" onClick={handleBack}>←</button>}
            <button className="icon-btn" onClick={handleBackToShelf}>🏠</button>
          </div>
          <div className="breadcrumb"><span className="book-name">{currentBook.title}</span>{currentEntry && <><span className="separator">/</span><span className="current-title">{currentEntry.title}</span></>}</div>
          <div className="top-right">
            {(viewMode === 'single' || viewMode === 'merged') && (
              <div className="read-mode-toggle" onClick={() => setIsReadOnly(!isReadOnly)}>
                <span className={`toggle-label ${isReadOnly ? 'active' : ''}`}>阅读</span>
                <div className={`toggle-switch ${!isReadOnly ? 'edit-mode' : ''}`}><div className="toggle-knob" /></div>
                <span className={`toggle-label ${!isReadOnly ? 'active' : ''}`}>编辑</span>
              </div>
            )}
          </div>
        </header>

        {!currentEntry && currentBook.showStats && (
          <div className="book-info-card">
            <div className="info-cover">{currentBook.coverImage ? <img src={currentBook.coverImage} alt="" /> : <span>{currentBook.cover}</span>}</div>
            <div className="info-details">
              {currentBook.author && <p>作者：{currentBook.author}</p>}
              {currentBook.tags?.length > 0 && <p>标签：{currentBook.tags.join('、')}</p>}
              <p>词条：{countEntries(currentBook.entries)}条</p>
              <p>字数：{countWords(currentBook.entries).toLocaleString()}字</p>
            </div>
          </div>
        )}
        
        <main className={`content-area ${slideAnimation}`}>
          {viewMode === 'list' && !isReorderMode && (
            <>
              {currentEntry && <div className="list-header"><h1>{currentEntry.title}</h1>{currentEntry.summary && <p className="summary">{currentEntry.summary}</p>}</div>}
              <p className="swipe-hint">💡 左滑合并视图 · 右滑返回 · 长按编辑</p>
              <div className="entry-list">
                {currentEntries.map((entry) => {
                  let touchX = 0;
                  return (
                    <div key={entry.id} className="entry-card" onClick={() => handleEntryClick(entry)}
                      onTouchStart={(e) => { touchX = e.touches[0].clientX; handleLongPressStart(e, 'entry', entry); }}
                      onTouchMove={handleLongPressEnd}
                      onTouchEnd={(e) => { handleLongPressEnd(); const dx = e.changedTouches[0].clientX - touchX; handleEntrySwipe(entry, dx); }}>
                      <div className="entry-icon">{entry.isFolder ? '📁' : '📄'}</div>
                      <div className="entry-info">
                        <h3>{entry.title}{entry.linkable && <span className="star-badge">⭐</span>}</h3>
                        <p>{entry.summary}</p>
                      </div>
                      <span className="entry-arrow">›</span>
                    </div>
                  );
                })}
              </div>
              {currentEntries.length === 0 && <div className="empty-state"><span>✨</span><p>点击右下角添加</p></div>}
            </>
          )}

          {viewMode === 'list' && isReorderMode && (
            <ReorderList entries={currentEntries} onReorder={handleReorder} onExit={() => setIsReorderMode(false)} />
          )}
          
          {viewMode === 'single' && currentEntry && (
            <div className="single-view">
              <div className="content-header">
                <h1>{currentEntry.title}</h1>
                {!isReadOnly && <button className="edit-meta-btn" onClick={() => { setEditingEntry(currentEntry); setShowEntryModal(true); }}>✏️</button>}
              </div>
              {isReadOnly ? (
                <ContentRenderer content={currentEntry.content} allTitlesMap={allTitlesMap} currentBookId={currentBook.id} onLinkClick={handleLinkClick} fontFamily={currentFont} />
              ) : (
                <RichEditor content={editContent} onChange={setEditContent} fontFamily={currentFont} onSave={saveEntryContent} />
              )}
            </div>
          )}
          
          {viewMode === 'merged' && currentEntry && (
            <div className="merged-view">
              <div className="content-header merged-header"><h1>{currentEntry.title}</h1><p className="merged-hint">📖 合并视图</p></div>
              {isReadOnly ? (
                <div className="merged-content-read">
                  {getAllChildContent(currentEntry, currentBook.entries).map((item, idx, arr) => (
                    <div key={item.id} className="merged-section">
                      <div className="section-title" onClick={() => handleSidebarSelect(item)}><span className="section-bullet">•</span>{item.title}</div>
                      <ContentRenderer content={item.content} allTitlesMap={allTitlesMap} currentBookId={currentBook.id} onLinkClick={handleLinkClick} fontFamily={currentFont} />
                      {idx < arr.length - 1 && <div className="section-divider" />}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="merged-content-edit">
                  {mergedContents.map((item, idx) => (
                    <div key={item.id} className="merged-edit-section">
                      <div className="merged-edit-header">
                        <span className="section-bullet">•</span>
                        <input type="text" value={item.title} onChange={e => handleMergedContentChange(idx, 'title', e.target.value)} className="merged-title-input" />
                        {item.isNew && <span className="new-badge">新</span>}
                      </div>
                      <div 
                        className="merged-rich-editor"
                        contentEditable 
                        dangerouslySetInnerHTML={{ __html: item.content }}
                        onBlur={e => handleMergedContentChange(idx, 'content', e.target.innerHTML)}
                        style={{ fontFamily: currentFont }}
                      />
                    </div>
                  ))}
                  <button className="add-merged-entry-btn" onClick={handleAddMergedEntry}>+ 添加词条</button>
                </div>
              )}
            </div>
          )}
        </main>
        
        {viewMode === 'list' && !isReorderMode && (
          <>
            <button className={`fab ${showAddMenu ? 'active' : ''}`} onClick={() => setShowAddMenu(!showAddMenu)}><span style={{ transform: showAddMenu ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</span></button>
            <AddMenu isOpen={showAddMenu} onClose={() => setShowAddMenu(false)} onAddEntry={() => { setEditingEntry(null); setIsCreatingFolder(false); setShowEntryModal(true); }} onAddFolder={() => { setEditingEntry(null); setIsCreatingFolder(true); setShowEntryModal(true); }} onReorderMode={() => setIsReorderMode(true)} />
          </>
        )}
        
        {isEditing && <EditorToolbar onIndentAll={handleIndentAll} onFormatClick={() => setShowFormatMenu(true)} onAlignClick={() => setShowAlignMenu(true)} onFontClick={() => setShowFontMenu(true)} onImageUpload={handleImageUpload} />}
        <TextFormatMenu isOpen={showFormatMenu} onClose={() => setShowFormatMenu(false)} onFormat={handleFormat} />
        <AlignMenu isOpen={showAlignMenu} onClose={() => setShowAlignMenu(false)} onAlign={handleAlign} />
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

/* 翻页动画 */
.page-flip-in{animation:pageFlipIn .4s ease-out}
.page-flip-out{animation:pageFlipOut .4s ease-in}
@keyframes pageFlipIn{
  0%{transform:perspective(1000px) rotateY(-90deg);transform-origin:right center;opacity:0}
  100%{transform:perspective(1000px) rotateY(0);transform-origin:right center;opacity:1}
}
@keyframes pageFlipOut{
  0%{transform:perspective(1000px) rotateY(0);transform-origin:left center;opacity:1}
  100%{transform:perspective(1000px) rotateY(90deg);transform-origin:left center;opacity:0}
}

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
.content-body p{margin-bottom:.5em;text-align:justify}
.content-body img{max-width:100%;border-radius:8px;display:block;margin:16px auto}
.keyword{color:#2D3047;font-weight:600}
.keyword.linked{color:#8B7355;background:linear-gradient(180deg,transparent 60%,rgba(139,115,85,.2) 60%);cursor:pointer}
.rich-editor{min-height:50vh;line-height:1.9;font-size:16px;outline:none;color:#333}
.rich-editor:empty:before{content:'开始书写...';color:#999}
.rich-editor p{margin-bottom:.5em}
.rich-editor img{max-width:100%;border-radius:8px;display:block;margin:16px auto}
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
.merged-rich-editor{min-height:80px;line-height:1.8;font-size:16px;outline:none;color:#333}
.merged-rich-editor:empty:before{content:'内容...';color:#999}
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
.editor-toolbar-bottom button{background:none;border:none;font-size:1rem;padding:8px 14px;cursor:pointer;color:#2D3047;border-radius:6px}
.editor-toolbar-bottom button:active{background:rgba(45,48,71,.08)}
.format-menu-overlay{position:fixed;inset:0;z-index:58}
.format-menu{position:fixed;left:16px;right:16px;bottom:60px;background:#fff;border-radius:12px;box-shadow:0 -4px 20px rgba(0,0,0,.1);z-index:59;padding:12px}
.format-row{display:flex;justify-content:space-around;margin-bottom:8px}
.format-row:last-child{margin-bottom:0}
.format-row button{width:44px;height:44px;border-radius:10px;border:1px solid #eee;background:#fff;font-size:1rem;cursor:pointer}
.format-row button:active{background:rgba(139,115,85,.15)}
.size-row button{width:auto;padding:0 14px}
.align-menu .format-row button{font-size:1.2rem}
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
