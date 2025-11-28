import React, { useState, useEffect, useCallback, useMemo } from 'react';

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
      color: '#2D3047',
      lastEdited: '2024-01-15',
      entries: [
        {
          id: 'worldview',
          title: '世界观',
          summary: '关于这个世界',
          children: [
            {
              id: 'religion',
              title: '宗教',
              summary: '神祇与信仰体系',
              children: [
                {
                  id: 'ten-days',
                  title: '十日旧约',
                  summary: '创世的古老传说',
                  content: '在时间的起点，当虚空尚未分离出光明与黑暗，女神独自漂浮于无尽的寂静之中。她的叹息化作了第一缕风，她的泪水汇成了第一滴海洋。\n\n于是，女神决定创造。\n\n第一日，她从自己的心火中分离出【火的守望】，让它成为一切温暖与激情的源泉。\n第二日，她从自己的泪水中分离出【水的祝福】，让它成为一切生命与净化的源泉。\n第三日，她从自己的躯体中分离出【地的生灵】，让它成为一切稳固与丰饶的源泉。\n第四日，她从自己的呼吸中分离出【风的歌谣】，让它成为一切自由与变化的源泉。\n\n这便是【十日旧约】中最为人知的篇章——创世四元素的诞生。它们生于女神的创世之初，被分别赋予与生灵的联系，成为万物的奠基。',
                  children: []
                },
                {
                  id: 'war-gods',
                  title: '战争双神',
                  summary: '胜利与牺牲的神话',
                  content: '在诸神的黄昏时代，两位神祇因争夺凡人的命运而对立。\n\n【胜利者·凯洛斯】，身披金色战甲，手持永不折断的长矛。他代表着征服、荣耀与统治的力量。信奉他的战士相信，战争的意义在于胜利本身。\n\n【牺牲者·赛莲娜】，身着银色长袍，手持燃烧的火炬。她代表着守护、献身与救赎的力量。信奉她的战士相信，战争的意义在于保护所爱之人。\n\n传说他们曾是恋人，在一场关于凡人命运的争论中决裂。自此，每一场战争都是他们意志的延续，每一个战士都在无意识中选择了其中一方。',
                  children: []
                }
              ]
            },
            {
              id: 'geography',
              title: '地理',
              summary: '大陆与疆域',
              children: [
                {
                  id: 'koltra',
                  title: '柯尔特拉',
                  summary: '中央王国的心脏',
                  content: '柯尔特拉位于大陆的正中央，是最古老也最繁华的王国。\n\n这片土地被称为"女神的掌心"，因为传说中女神创世时，正是在这里第一次触碰了大地。因此，这里的土壤格外肥沃，四季分明，气候温和。\n\n首都【银冠城】建立在一座巨大的白色岩石上，从远处望去，整座城市如同戴着银色王冠的巨人。城中最著名的建筑是【千年图书馆】，据说收藏着自创世以来所有的文字记录。\n\n柯尔特拉的人民以学识著称，几乎每个村庄都有自己的小型图书馆。这里也是【十日旧约】最完整抄本的保存地。',
                  children: []
                },
                {
                  id: 'northland',
                  title: '北境',
                  summary: '冰雪中的古老王国',
                  content: '北境是一片被永恒冬季笼罩的土地。\n\n这里的居民是【霜裔】的后代——传说中第一批在严寒中存活下来的人类。他们有着银白色的头发和淡蓝色的眼睛，能够在零下四十度的暴风雪中行走自如。\n\n北境最著名的城市是【冰心堡】，一座完全由永恒冰块建造的要塞。这座冰块来自【女神的最后一滴泪】，据说只要这座城堡不融化，北境就永远不会被征服。\n\n北境人信奉【战争双神】中的赛莲娜，因为在这片严酷的土地上，每一个生命都是对他人的守护和牺牲。',
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
          children: [
            {
              id: 'protagonist',
              title: '主角',
              summary: '命运的承载者',
              children: [
                {
                  id: 'elena',
                  title: '艾琳娜',
                  summary: '银冠城的流亡公主',
                  content: '艾琳娜是柯尔特拉末代国王的独生女，在王国覆灭之夜被忠诚的侍卫带出首都。\n\n她继承了母亲的银色长发和父亲的琥珀色眼睛，但最令人印象深刻的是她左肩上的胎记——一个完美的新月形状，这被认为是女神祝福的标记。\n\n艾琳娜从小在【千年图书馆】中长大，对【十日旧约】的研究比任何祭司都深入。她坚信，那些古老的神话中隐藏着拯救王国的秘密。',
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
          children: []
        }
      ]
    },
    {
      id: 'starfall',
      title: '星陨纪元',
      cover: '⭐',
      color: '#1A1A2E',
      lastEdited: '2024-01-10',
      entries: []
    },
    {
      id: 'jade-empire',
      title: '玉京录',
      cover: '🏯',
      color: '#4A0E0E',
      lastEdited: '2024-01-08',
      entries: []
    }
  ]
};

// ==================== 工具函数 ====================
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const collectAllTitles = (entries, titles = new Set()) => {
  entries.forEach(entry => {
    titles.add(entry.title);
    if (entry.children?.length) {
      collectAllTitles(entry.children, titles);
    }
  });
  return titles;
};

const findEntryByTitle = (entries, title) => {
  for (const entry of entries) {
    if (entry.title === title) return entry;
    if (entry.children?.length) {
      const found = findEntryByTitle(entry.children, title);
      if (found) return found;
    }
  }
  return null;
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
    if (e.content) {
      contents.push({ ...e, depth });
    }
    if (e.children?.length) {
      e.children.forEach(child => collect(child, depth + 1));
    }
  };
  if (entry.children?.length) {
    entry.children.forEach(child => collect(child, 0));
  } else if (entry.content) {
    contents.push({ ...entry, depth: 0 });
  }
  return contents;
};

const updateEntryInTree = (entries, entryId, updates) => {
  return entries.map(entry => {
    if (entry.id === entryId) {
      return { ...entry, ...updates };
    }
    if (entry.children?.length) {
      return { ...entry, children: updateEntryInTree(entry.children, entryId, updates) };
    }
    return entry;
  });
};

const addEntryToParent = (entries, parentId, newEntry) => {
  if (!parentId) {
    return [...entries, newEntry];
  }
  return entries.map(entry => {
    if (entry.id === parentId) {
      return { ...entry, children: [...(entry.children || []), newEntry] };
    }
    if (entry.children?.length) {
      return { ...entry, children: addEntryToParent(entry.children, parentId, newEntry) };
    }
    return entry;
  });
};

const deleteEntryFromTree = (entries, entryId) => {
  return entries.filter(entry => entry.id !== entryId).map(entry => {
    if (entry.children?.length) {
      return { ...entry, children: deleteEntryFromTree(entry.children, entryId) };
    }
    return entry;
  });
};

// ==================== 内容渲染组件 ====================
const ContentRenderer = ({ content, allTitles, onLinkClick, isReadOnly }) => {
  const processedContent = useMemo(() => {
    if (!content) return [];
    const lines = content.split('\n');
    return lines.map((line, lineIndex) => {
      const parts = [];
      let remaining = line;
      let key = 0;
      const regex = /【([^】]+)】/g;
      let lastIndex = 0;
      let match;
      while ((match = regex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(<span key={key++}>{line.slice(lastIndex, match.index)}</span>);
        }
        const keyword = match[1];
        const isLinked = allTitles.has(keyword);
        parts.push(
          <span
            key={key++}
            className={`keyword ${isLinked ? 'linked' : ''} ${isReadOnly && isLinked ? 'clickable' : ''}`}
            onClick={() => isReadOnly && isLinked && onLinkClick(keyword)}
          >
            【{keyword}】
          </span>
        );
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < line.length) {
        parts.push(<span key={key++}>{line.slice(lastIndex)}</span>);
      }
      return (
        <p key={lineIndex} className="content-line">
          {parts.length > 0 ? parts : line || '\u00A0'}
        </p>
      );
    });
  }, [content, allTitles, onLinkClick, isReadOnly]);
  return <div className="content-body">{processedContent}</div>;
};

// ==================== 侧边栏项目组件 ====================
const SidebarItem = ({ entry, depth = 0, onSelect, currentId, expandedIds, onToggle }) => {
  const hasChildren = entry.children?.length > 0;
  const isExpanded = expandedIds.has(entry.id);
  const isActive = currentId === entry.id;
  return (
    <div className="sidebar-item-wrapper">
      <div
        className={`sidebar-item ${isActive ? 'active' : ''}`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onClick={() => onSelect(entry)}
      >
        {hasChildren && (
          <span
            className={`expand-icon ${isExpanded ? 'expanded' : ''}`}
            onClick={(e) => { e.stopPropagation(); onToggle(entry.id); }}
          >
            ›
          </span>
        )}
        <span className="sidebar-title">{entry.title}</span>
      </div>
      {hasChildren && isExpanded && (
        <div className="sidebar-children">
          {entry.children.map(child => (
            <SidebarItem
              key={child.id}
              entry={child}
              depth={depth + 1}
              onSelect={onSelect}
              currentId={currentId}
              expandedIds={expandedIds}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== 新建/编辑弹窗组件 ====================
const EntryModal = ({ isOpen, onClose, onSave, editingEntry, parentTitle }) => {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  
  useEffect(() => {
    if (editingEntry) {
      setTitle(editingEntry.title || '');
      setSummary(editingEntry.summary || '');
    } else {
      setTitle('');
      setSummary('');
    }
  }, [editingEntry, isOpen]);
  
  if (!isOpen) return null;
  
  const handleSave = () => {
    if (!title.trim()) return;
    onSave({ title: title.trim(), summary: summary.trim() });
    onClose();
  };
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>{editingEntry ? '编辑词条' : '新建词条'}</h3>
        {parentTitle && <p className="modal-hint">添加到: {parentTitle}</p>}
        <input
          type="text"
          placeholder="标题"
          value={title}
          onChange={e => setTitle(e.target.value)}
          autoFocus
        />
        <input
          type="text"
          placeholder="简介（可选）"
          value={summary}
          onChange={e => setSummary(e.target.value)}
        />
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>取消</button>
          <button className="btn-save" onClick={handleSave} disabled={!title.trim()}>保存</button>
        </div>
      </div>
    </div>
  );
};

// ==================== 新建书籍弹窗 ====================
const BookModal = ({ isOpen, onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('📖');
  const emojis = ['📖', '🌙', '⭐', '🏯', '🗡️', '🌸', '🔮', '🐉', '🦋', '🌊', '🔥', '💎'];
  
  if (!isOpen) return null;
  
  const handleSave = () => {
    if (!title.trim()) return;
    onSave({ title: title.trim(), emoji });
    setTitle('');
    setEmoji('📖');
    onClose();
  };
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3>新建世界</h3>
        <input
          type="text"
          placeholder="世界名称"
          value={title}
          onChange={e => setTitle(e.target.value)}
          autoFocus
        />
        <div className="emoji-picker">
          {emojis.map(e => (
            <span
              key={e}
              className={`emoji-option ${emoji === e ? 'selected' : ''}`}
              onClick={() => setEmoji(e)}
            >
              {e}
            </span>
          ))}
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>取消</button>
          <button className="btn-save" onClick={handleSave} disabled={!title.trim()}>创建</button>
        </div>
      </div>
    </div>
  );
};

// ==================== 主应用组件 ====================
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

  // 自动保存
  useEffect(() => {
    saveToStorage(data);
  }, [data]);

  const allTitles = useMemo(() => {
    if (!currentBook) return new Set();
    return collectAllTitles(currentBook.entries);
  }, [currentBook]);

  // 更新当前书籍引用
  useEffect(() => {
    if (currentBook) {
      const updated = data.books.find(b => b.id === currentBook.id);
      if (updated) setCurrentBook(updated);
    }
  }, [data]);

  // 更新当前词条引用
  useEffect(() => {
    if (currentEntry && currentBook) {
      const path = findEntryPath(currentBook.entries, currentEntry.id);
      if (path) {
        setCurrentEntry(path[path.length - 1]);
      }
    }
  }, [currentBook]);

  const handleBookSelect = (book) => {
    setCurrentBook(book);
    setCurrentEntry(null);
    setViewMode('list');
    setNavigationStack([]);
  };

  const handleBackToShelf = () => {
    setCurrentBook(null);
    setCurrentEntry(null);
    setViewMode('list');
    setNavigationStack([]);
    setIsSidebarOpen(false);
  };

  const handleEntryClick = (entry) => {
    if (entry.children?.length > 0) {
      setNavigationStack(prev => [...prev, currentEntry].filter(Boolean));
      setCurrentEntry(entry);
      setViewMode('list');
    } else {
      setNavigationStack(prev => [...prev, currentEntry].filter(Boolean));
      setCurrentEntry(entry);
      setViewMode('single');
      setEditContent(entry.content || '');
    }
  };

  const handleEntryDoubleClick = (entry) => {
    setNavigationStack(prev => [...prev, currentEntry].filter(Boolean));
    setCurrentEntry(entry);
    setViewMode('merged');
  };

  const handleBack = () => {
    // 先保存当前内容
    if (!isReadOnly && currentEntry && viewMode === 'single') {
      handleSaveContent();
    }
    
    if (navigationStack.length > 0) {
      const previous = navigationStack[navigationStack.length - 1];
      setNavigationStack(prev => prev.slice(0, -1));
      setCurrentEntry(previous);
      setViewMode(previous ? 'list' : 'list');
    } else {
      setCurrentEntry(null);
      setViewMode('list');
    }
  };

  const handleSidebarSelect = (entry) => {
    const path = findEntryPath(currentBook.entries, entry.id);
    if (path) {
      setNavigationStack(path.slice(0, -1));
      setCurrentEntry(entry);
      if (entry.children?.length > 0) {
        setViewMode('list');
      } else {
        setViewMode('single');
        setEditContent(entry.content || '');
      }
    }
    setIsSidebarOpen(false);
  };

  const handleLinkClick = useCallback((keyword) => {
    const entry = findEntryByTitle(currentBook.entries, keyword);
    if (entry) {
      const path = findEntryPath(currentBook.entries, entry.id);
      if (path) {
        setNavigationStack(path.slice(0, -1));
        setCurrentEntry(entry);
        if (entry.children?.length > 0) {
          setViewMode('list');
        } else {
          setViewMode('single');
          setEditContent(entry.content || '');
        }
      }
    }
  }, [currentBook]);

  const handleToggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSaveContent = () => {
    if (!currentEntry || !currentBook) return;
    const updatedEntries = updateEntryInTree(currentBook.entries, currentEntry.id, { content: editContent });
    setData(prev => ({
      ...prev,
      books: prev.books.map(b => b.id === currentBook.id ? { ...b, entries: updatedEntries, lastEdited: new Date().toISOString() } : b)
    }));
  };

  const handleAddEntry = (entryData) => {
    const newEntry = {
      id: generateId(),
      title: entryData.title,
      summary: entryData.summary || '',
      content: '',
      children: []
    };
    const parentId = currentEntry?.id || null;
    const updatedEntries = addEntryToParent(currentBook.entries, parentId, newEntry);
    setData(prev => ({
      ...prev,
      books: prev.books.map(b => b.id === currentBook.id ? { ...b, entries: updatedEntries, lastEdited: new Date().toISOString() } : b)
    }));
  };

  const handleAddBook = ({ title, emoji }) => {
    const colors = ['#2D3047', '#1A1A2E', '#4A0E0E', '#0E4A2D', '#3D2E4A', '#4A3D0E'];
    const newBook = {
      id: generateId(),
      title,
      cover: emoji,
      color: colors[Math.floor(Math.random() * colors.length)],
      lastEdited: new Date().toISOString(),
      entries: []
    };
    setData(prev => ({ ...prev, books: [...prev.books, newBook] }));
  };

  const currentEntries = currentEntry?.children || currentBook?.entries || [];
  const mergedContents = viewMode === 'merged' && currentEntry ? getAllChildContent(currentEntry) : [];

  // ==================== 书架视图 ====================
  if (!currentBook) {
    return (
      <div className="app bookshelf-view">
        <header className="bookshelf-header">
          <h1>灵感穹顶</h1>
          <p className="subtitle">收集你的创作宇宙</p>
        </header>
        
        <div className="bookshelf">
          {data.books.map(book => (
            <div
              key={book.id}
              className="book-card"
              style={{ '--book-color': book.color }}
              onClick={() => handleBookSelect(book)}
            >
              <div className="book-spine"></div>
              <div className="book-cover">
                <span className="book-emoji">{book.cover}</span>
                <h2 className="book-title">{book.title}</h2>
              </div>
              <div className="book-shadow"></div>
            </div>
          ))}
          
          <div className="book-card add-book" onClick={() => setShowBookModal(true)}>
            <div className="book-cover">
              <span className="add-icon">+</span>
              <span className="add-text">新建世界</span>
            </div>
          </div>
        </div>
        
        <BookModal
          isOpen={showBookModal}
          onClose={() => setShowBookModal(false)}
          onSave={handleAddBook}
        />
        
        <style>{styles}</style>
      </div>
    );
  }

  // ==================== 主阅读/编辑视图 ====================
  return (
    <div className="app main-view">
      {/* 侧边栏 */}
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2>{currentBook.title}</h2>
          <button className="close-sidebar" onClick={() => setIsSidebarOpen(false)}>×</button>
        </div>
        <div className="sidebar-content">
          {currentBook.entries.map(entry => (
            <SidebarItem
              key={entry.id}
              entry={entry}
              onSelect={handleSidebarSelect}
              currentId={currentEntry?.id}
              expandedIds={expandedIds}
              onToggle={handleToggleExpand}
            />
          ))}
        </div>
      </div>
      
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}
      
      {/* 主内容区 */}
      <div className="main-content">
        {/* 顶部栏 */}
        <header className="top-bar">
          <div className="top-left">
            <button className="icon-btn menu-btn" onClick={() => setIsSidebarOpen(true)}>☰</button>
            {(currentEntry || navigationStack.length > 0) && (
              <button className="icon-btn back-btn" onClick={handleBack}>←</button>
            )}
            <button className="icon-btn home-btn" onClick={handleBackToShelf}>🏠</button>
          </div>
          
          <div className="breadcrumb">
            <span className="book-name" onClick={handleBackToShelf}>{currentBook.title}</span>
            {currentEntry && (
              <>
                <span className="separator">/</span>
                <span className="current-title">{currentEntry.title}</span>
              </>
            )}
          </div>
          
          <div className="top-right">
            <div className="read-mode-toggle" onClick={() => {
              if (!isReadOnly && currentEntry && viewMode === 'single') {
                handleSaveContent();
              }
              setIsReadOnly(!isReadOnly);
            }}>
              <span className={`toggle-label ${isReadOnly ? 'active' : ''}`}>阅读</span>
              <div className={`toggle-switch ${!isReadOnly ? 'edit-mode' : ''}`}>
                <div className="toggle-knob" />
              </div>
              <span className={`toggle-label ${!isReadOnly ? 'active' : ''}`}>编辑</span>
            </div>
          </div>
        </header>
        
        {/* 内容区 */}
        <main className="content-area">
          {viewMode === 'list' && (
            <div className="entry-list">
              {currentEntry && (
                <div className="list-header">
                  <h1>{currentEntry.title}</h1>
                  <p className="summary">{currentEntry.summary}</p>
                </div>
              )}
              
              {currentEntries.map(entry => (
                <div
                  key={entry.id}
                  className="entry-card"
                  onClick={() => handleEntryClick(entry)}
                  onDoubleClick={() => handleEntryDoubleClick(entry)}
                >
                  <div className="entry-icon">{entry.children?.length > 0 ? '📁' : '📄'}</div>
                  <div className="entry-info">
                    <h3 className="entry-title">{entry.title}</h3>
                    <p className="entry-summary">{entry.summary}</p>
                  </div>
                  <div className="entry-arrow">›</div>
                </div>
              ))}
              
              {currentEntries.length === 0 && (
                <div className="empty-state">
                  <span className="empty-icon">✨</span>
                  <p>这里还是一片空白</p>
                  <p className="empty-hint">点击右下角添加新灵感</p>
                </div>
              )}
            </div>
          )}
          
          {viewMode === 'single' && currentEntry && (
            <div className="single-view">
              <div className="content-header">
                <h1>{currentEntry.title}</h1>
              </div>
              {isReadOnly ? (
                <ContentRenderer
                  content={currentEntry.content}
                  allTitles={allTitles}
                  onLinkClick={handleLinkClick}
                  isReadOnly={isReadOnly}
                />
              ) : (
                <textarea
                  className="content-editor"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="在这里记录你的灵感..."
                />
              )}
            </div>
          )}
          
          {viewMode === 'merged' && currentEntry && (
            <div className="merged-view">
              <div className="content-header merged-header">
                <h1>{currentEntry.title}</h1>
                <p className="merged-hint">合并视图 · 包含所有子条目</p>
              </div>
              {mergedContents.map((item, index) => (
                <div key={item.id} className="merged-section">
                  <div className="section-title" onClick={() => handleSidebarSelect(item)}>
                    <span className="section-bullet">·</span>
                    {item.title}
                  </div>
                  <ContentRenderer
                    content={item.content}
                    allTitles={allTitles}
                    onLinkClick={handleLinkClick}
                    isReadOnly={isReadOnly}
                  />
                  {index < mergedContents.length - 1 && <div className="section-divider" />}
                </div>
              ))}
              {mergedContents.length === 0 && (
                <div className="empty-state"><p>该分类下暂无内容</p></div>
              )}
            </div>
          )}
        </main>
        
        {/* 添加按钮 */}
        <button className="fab" onClick={() => { setEditingEntry(null); setShowEntryModal(true); }}>
          <span>+</span>
        </button>
      </div>
      
      <EntryModal
        isOpen={showEntryModal}
        onClose={() => setShowEntryModal(false)}
        onSave={handleAddEntry}
        editingEntry={editingEntry}
        parentTitle={currentEntry?.title}
      />
      
      <style>{styles}</style>
    </div>
  );
}

// ==================== 样式 ====================
const styles = `
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&family=ZCOOL+XiaoWei&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

html, body, #root {
  height: 100%;
  overflow: hidden;
}

.app {
  height: 100%;
  font-family: 'Noto Serif SC', serif;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.bookshelf-view {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);
  padding: 60px 20px;
  min-height: 100%;
}

.bookshelf-header {
  text-align: center;
  margin-bottom: 50px;
}

.bookshelf-header h1 {
  font-family: 'ZCOOL XiaoWei', serif;
  font-size: 2.5rem;
  color: #f4e4c1;
  letter-spacing: 0.3em;
  text-shadow: 0 0 40px rgba(244, 228, 193, 0.3);
  margin-bottom: 12px;
}

.subtitle {
  color: rgba(244, 228, 193, 0.5);
  font-size: 0.9rem;
  letter-spacing: 0.2em;
}

.bookshelf {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
  justify-content: center;
  max-width: 1200px;
  margin: 0 auto;
}

.book-card {
  position: relative;
  width: 140px;
  height: 200px;
  cursor: pointer;
  perspective: 1000px;
  transition: transform 0.3s ease;
}

.book-card:active {
  transform: scale(0.95);
}

.book-spine {
  position: absolute;
  left: 0;
  top: 0;
  width: 15px;
  height: 100%;
  background: var(--book-color, #2D3047);
  border-radius: 3px 0 0 3px;
  transform: rotateY(-30deg) translateX(-8px);
  transform-origin: right center;
  box-shadow: -5px 0 15px rgba(0,0,0,0.3);
}

.book-cover {
  position: absolute;
  width: 100%;
  height: 100%;
  background: linear-gradient(145deg, var(--book-color, #2D3047) 0%, color-mix(in srgb, var(--book-color, #2D3047) 70%, black) 100%);
  border-radius: 0 8px 8px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  box-shadow: 5px 5px 20px rgba(0,0,0,0.4), inset -2px 0 10px rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
}

.book-emoji {
  font-size: 3rem;
  filter: drop-shadow(0 0 10px rgba(255,255,255,0.3));
}

.book-title {
  color: #f4e4c1;
  font-size: 1rem;
  text-align: center;
  padding: 0 15px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.book-shadow {
  position: absolute;
  bottom: -15px;
  left: 10%;
  width: 80%;
  height: 15px;
  background: radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%);
}

.add-book {
  opacity: 0.5;
  transition: opacity 0.3s ease;
}

.add-book:active {
  opacity: 0.8;
}

.add-book .book-cover {
  background: linear-gradient(145deg, #2a2a3e 0%, #1a1a2e 100%);
  border: 2px dashed rgba(244, 228, 193, 0.3);
}

.add-icon {
  font-size: 2.5rem;
  color: rgba(244, 228, 193, 0.5);
}

.add-text {
  color: rgba(244, 228, 193, 0.5);
  font-size: 0.85rem;
}

/* 主视图 */
.main-view {
  background: linear-gradient(180deg, #faf8f3 0%, #f5f0e8 100%);
  position: relative;
  display: flex;
  flex-direction: column;
}

/* 侧边栏 */
.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  width: 280px;
  max-width: 85vw;
  height: 100%;
  background: linear-gradient(180deg, #2D3047 0%, #1a1a2e 100%);
  z-index: 1000;
  transform: translateX(-100%);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  box-shadow: 5px 0 30px rgba(0,0,0,0.3);
}

.sidebar.open {
  transform: translateX(0);
}

.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 999;
  backdrop-filter: blur(2px);
}

.sidebar-header {
  padding: 20px 16px;
  border-bottom: 1px solid rgba(244, 228, 193, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.sidebar-header h2 {
  color: #f4e4c1;
  font-size: 1.2rem;
  font-family: 'ZCOOL XiaoWei', serif;
}

.close-sidebar {
  background: none;
  border: none;
  color: rgba(244, 228, 193, 0.6);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 4px 8px;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 0;
  -webkit-overflow-scrolling: touch;
}

.sidebar-item-wrapper {
  user-select: none;
}

.sidebar-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  color: rgba(244, 228, 193, 0.8);
  cursor: pointer;
  transition: all 0.2s;
  gap: 8px;
}

.sidebar-item:active {
  background: rgba(244, 228, 193, 0.15);
}

.sidebar-item.active {
  background: rgba(244, 228, 193, 0.15);
  color: #f4e4c1;
}

.expand-icon {
  font-size: 0.9rem;
  transition: transform 0.2s;
  width: 16px;
  text-align: center;
}

.expand-icon.expanded {
  transform: rotate(90deg);
}

.sidebar-title {
  font-size: 0.9rem;
}

/* 顶部栏 */
.top-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(250, 248, 243, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(45, 48, 71, 0.1);
  flex-shrink: 0;
}

.top-left {
  display: flex;
  gap: 4px;
}

.icon-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s;
  color: #2D3047;
}

.icon-btn:active {
  background: rgba(45, 48, 71, 0.1);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #666;
  flex: 1;
  justify-content: center;
  overflow: hidden;
}

.book-name {
  color: #2D3047;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.separator {
  color: #ccc;
}

.current-title {
  color: #8B7355;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.top-right {
  display: flex;
  align-items: center;
}

.read-mode-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 16px;
  background: rgba(45, 48, 71, 0.05);
}

.toggle-label {
  font-size: 0.75rem;
  color: #999;
  transition: color 0.2s;
}

.toggle-label.active {
  color: #2D3047;
  font-weight: 600;
}

.toggle-switch {
  width: 36px;
  height: 20px;
  background: #2D3047;
  border-radius: 10px;
  position: relative;
  transition: background 0.3s;
}

.toggle-switch.edit-mode {
  background: #8B7355;
}

.toggle-knob {
  position: absolute;
  left: 2px;
  top: 2px;
  width: 16px;
  height: 16px;
  background: #f4e4c1;
  border-radius: 50%;
  transition: transform 0.3s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.toggle-switch.edit-mode .toggle-knob {
  transform: translateX(16px);
}

/* 内容区 */
.content-area {
  padding: 20px 16px;
  padding-bottom: 100px;
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.list-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(45, 48, 71, 0.1);
}

.list-header h1 {
  font-family: 'ZCOOL XiaoWei', serif;
  font-size: 1.6rem;
  color: #2D3047;
  margin-bottom: 6px;
}

.list-header .summary {
  color: #8B7355;
  font-size: 0.9rem;
}

.entry-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.entry-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(45, 48, 71, 0.08);
  border: 1px solid rgba(45, 48, 71, 0.05);
}

.entry-card:active {
  transform: scale(0.98);
  box-shadow: 0 1px 4px rgba(45, 48, 71, 0.1);
}

.entry-icon {
  font-size: 1.3rem;
}

.entry-info {
  flex: 1;
  min-width: 0;
}

.entry-title {
  font-size: 1rem;
  color: #2D3047;
  margin-bottom: 2px;
  font-weight: 600;
}

.entry-summary {
  font-size: 0.8rem;
  color: #8B7355;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.entry-arrow {
  font-size: 1.3rem;
  color: #ccc;
}

/* 单条目视图 */
.single-view, .merged-view {
  background: white;
  border-radius: 16px;
  padding: 24px 20px;
  box-shadow: 0 4px 20px rgba(45, 48, 71, 0.1);
}

.content-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(45, 48, 71, 0.1);
}

.content-header h1 {
  font-family: 'ZCOOL XiaoWei', serif;
  font-size: 1.6rem;
  color: #2D3047;
}

.merged-header {
  text-align: center;
}

.merged-hint {
  color: #8B7355;
  font-size: 0.85rem;
  margin-top: 6px;
}

.content-body {
  line-height: 1.9;
  color: #333;
  font-size: 0.95rem;
}

.content-line {
  margin-bottom: 0.4em;
}

.keyword {
  color: #2D3047;
  font-weight: 600;
}

.keyword.linked {
  color: #8B7355;
  background: linear-gradient(180deg, transparent 60%, rgba(139, 115, 85, 0.2) 60%);
}

.keyword.clickable {
  cursor: pointer;
}

.keyword.clickable:active {
  color: #6B5335;
  background: linear-gradient(180deg, transparent 60%, rgba(139, 115, 85, 0.4) 60%);
}

.content-editor {
  width: 100%;
  min-height: 300px;
  padding: 16px;
  border: 2px solid rgba(45, 48, 71, 0.1);
  border-radius: 12px;
  font-family: 'Noto Serif SC', serif;
  font-size: 0.95rem;
  line-height: 1.9;
  resize: vertical;
  transition: border-color 0.2s;
}

.content-editor:focus {
  outline: none;
  border-color: #8B7355;
}

/* 合并视图 */
.merged-section {
  margin-bottom: 28px;
}

.section-title {
  font-size: 1.2rem;
  color: #2D3047;
  font-weight: 600;
  margin-bottom: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
}

.section-bullet {
  font-size: 1.8rem;
  line-height: 1;
}

.section-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(45, 48, 71, 0.2), transparent);
  margin: 28px 0;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 12px;
}

.empty-hint {
  font-size: 0.85rem;
  margin-top: 6px;
}

/* 浮动按钮 */
.fab {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2D3047, #1a1a2e);
  border: none;
  color: #f4e4c1;
  font-size: 1.8rem;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(45, 48, 71, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  transition: transform 0.2s;
}

.fab:active {
  transform: scale(0.9);
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  backdrop-filter: blur(2px);
}

.modal-content {
  background: white;
  border-radius: 16px;
  padding: 24px;
  width: 100%;
  max-width: 360px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.modal-content h3 {
  font-family: 'ZCOOL XiaoWei', serif;
  font-size: 1.3rem;
  color: #2D3047;
  margin-bottom: 16px;
  text-align: center;
}

.modal-hint {
  font-size: 0.85rem;
  color: #8B7355;
  margin-bottom: 16px;
  text-align: center;
}

.modal-content input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid rgba(45, 48, 71, 0.1);
  border-radius: 10px;
  font-family: 'Noto Serif SC', serif;
  font-size: 1rem;
  margin-bottom: 12px;
  transition: border-color 0.2s;
}

.modal-content input:focus {
  outline: none;
  border-color: #8B7355;
}

.emoji-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-bottom: 20px;
}

.emoji-option {
  font-size: 1.8rem;
  padding: 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.emoji-option.selected {
  background: rgba(139, 115, 85, 0.2);
  transform: scale(1.1);
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.btn-cancel, .btn-save {
  flex: 1;
  padding: 12px;
  border-radius: 10px;
  font-family: 'Noto Serif SC', serif;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: none;
  border: 2px solid rgba(45, 48, 71, 0.2);
  color: #666;
}

.btn-save {
  background: linear-gradient(135deg, #2D3047, #1a1a2e);
  border: none;
  color: #f4e4c1;
}

.btn-save:disabled {
  opacity: 0.5;
}

/* 滚动条 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(45, 48, 71, 0.2);
  border-radius: 3px;
}

.sidebar ::-webkit-scrollbar-thumb {
  background: rgba(244, 228, 193, 0.2);
}
`;
