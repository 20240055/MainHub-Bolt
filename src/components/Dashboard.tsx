import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Calculator, ListTodo, Link as LinkIcon, LogOut, Trash2, Edit2, ExternalLink, Maximize2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

interface Bookmark {
  id: string;
  title: string;
  url: string;
  thumbnail?: string;
  embedded?: boolean;
}

export function Dashboard() {
  const [activeTab, setActiveTab] = useState('calculator');
  const [number1, setNumber1] = useState('');
  const [number2, setNumber2] = useState('');
  const [operation, setOperation] = useState('percentage');
  const [result, setResult] = useState('');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [newBookmarkTitle, setNewBookmarkTitle] = useState('');
  const [newBookmarkUrl, setNewBookmarkUrl] = useState('');
  const [newBookmarkThumbnail, setNewBookmarkThumbnail] = useState('');
  const [newBookmarkEmbedded, setNewBookmarkEmbedded] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [showEmbedded, setShowEmbedded] = useState<string | null>(null);

  useEffect(() => {
    fetchTodos();
    fetchBookmarks();
  }, []);

  const fetchTodos = async () => {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Fehler beim Laden der Todos');
    } else {
      setTodos(data || []);
    }
  };

  const fetchBookmarks = async () => {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Fehler beim Laden der Lesezeichen');
    } else {
      setBookmarks(data || []);
    }
  };

  const calculate = () => {
    const n1 = parseFloat(number1);
    const n2 = parseFloat(number2);

    if (isNaN(n1) || isNaN(n2)) {
      toast.error('Bitte gültige Zahlen eingeben');
      return;
    }

    switch (operation) {
      case 'percentage':
        setResult(`${(n1 * n2) / 100}`);
        break;
      case 'add':
        setResult(`${n1 + n2}`);
        break;
      case 'subtract':
        setResult(`${n1 - n2}`);
        break;
      case 'multiply':
        setResult(`${n1 * n2}`);
        break;
      case 'divide':
        if (n2 === 0) {
          toast.error('Division durch Null nicht möglich');
          return;
        }
        setResult(`${n1 / n2}`);
        break;
    }
  };

  const deleteTodo = async (id: string) => {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Fehler beim Löschen des Todos');
    } else {
      toast.success('Todo gelöscht');
      fetchTodos();
    }
  };

  const deleteBookmark = async (id: string) => {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Fehler beim Löschen des Lesezeichens');
    } else {
      toast.success('Lesezeichen gelöscht');
      fetchBookmarks();
    }
  };

  const updateBookmark = async () => {
    if (!editingBookmark) return;

    const { error } = await supabase
      .from('bookmarks')
      .update({
        title: editingBookmark.title,
        url: editingBookmark.url,
        thumbnail: editingBookmark.thumbnail,
        embedded: editingBookmark.embedded
      })
      .eq('id', editingBookmark.id);

    if (error) {
      toast.error('Fehler beim Aktualisieren des Lesezeichens');
    } else {
      toast.success('Lesezeichen aktualisiert');
      setEditingBookmark(null);
      fetchBookmarks();
    }
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('todos')
      .insert([{ 
        title: newTodo.trim(),
        user_id: user.id
      }]);

    if (error) {
      toast.error('Fehler beim Hinzufügen des Todos');
    } else {
      toast.success('Todo hinzugefügt');
      setNewTodo('');
      fetchTodos();
    }
  };

  const toggleTodo = async (id: string, completed: boolean) => {
    const { error } = await supabase
      .from('todos')
      .update({ completed: !completed })
      .eq('id', id);

    if (error) {
      toast.error('Fehler beim Aktualisieren des Todos');
    } else {
      fetchTodos();
    }
  };

  const addBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookmarkTitle.trim() || !newBookmarkUrl.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('bookmarks')
      .insert([{ 
        title: newBookmarkTitle.trim(),
        url: newBookmarkUrl.trim(),
        thumbnail: newBookmarkThumbnail.trim() || null,
        embedded: newBookmarkEmbedded,
        user_id: user.id
      }]);

    if (error) {
      toast.error('Fehler beim Hinzufügen des Lesezeichens');
    } else {
      toast.success('Lesezeichen hinzugefügt');
      setNewBookmarkTitle('');
      setNewBookmarkUrl('');
      setNewBookmarkThumbnail('');
      setNewBookmarkEmbedded(false);
      fetchBookmarks();
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Fehler beim Abmelden');
    } else {
      toast.success('Erfolgreich abgemeldet');
    }
  };

  const operations = [
    { value: 'percentage', label: 'Prozentrechnung', icon: '％' },
    { value: 'add', label: 'Addition', icon: '+' },
    { value: 'subtract', label: 'Subtraktion', icon: '-' },
    { value: 'multiply', label: 'Multiplikation', icon: '×' },
    { value: 'divide', label: 'Division', icon: '÷' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 border-b border-red-500 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <button
                onClick={() => setActiveTab('calculator')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
                  activeTab === 'calculator' 
                    ? 'bg-gradient-to-r from-red-600 to-red-700 shadow-lg shadow-red-500/30' 
                    : 'hover:bg-gray-700'
                }`}
              >
                <Calculator className="w-5 h-5" />
                <span>Rechner</span>
              </button>
              <button
                onClick={() => setActiveTab('todos')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
                  activeTab === 'todos' 
                    ? 'bg-gradient-to-r from-red-600 to-red-700 shadow-lg shadow-red-500/30' 
                    : 'hover:bg-gray-700'
                }`}
              >
                <ListTodo className="w-5 h-5" />
                <span>Todos</span>
              </button>
              <button
                onClick={() => setActiveTab('bookmarks')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
                  activeTab === 'bookmarks' 
                    ? 'bg-gradient-to-r from-red-600 to-red-700 shadow-lg shadow-red-500/30' 
                    : 'hover:bg-gray-700'
                }`}
              >
                <LinkIcon className="w-5 h-5" />
                <span>Lesezeichen</span>
              </button>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 rounded-full hover:bg-gray-700 transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span>Abmelden</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'calculator' && (
          <div className="bg-gray-800 rounded-2xl p-8 shadow-2xl border border-red-500/30 backdrop-blur-sm">
            <h2 className="text-2xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-300">
              Mathematischer Rechner
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Operation</label>
                <div className="grid grid-cols-5 gap-3">
                  {operations.map((op) => (
                    <button
                      key={op.value}
                      onClick={() => setOperation(op.value)}
                      className={`p-4 rounded-xl text-center transition-all duration-200 ${
                        operation === op.value
                          ? 'bg-gradient-to-r from-red-600 to-red-700 shadow-lg shadow-red-500/30'
                          : 'bg-gray-700/50 hover:bg-gray-700'
                      }`}
                    >
                      <div className="text-xl mb-1">{op.icon}</div>
                      <div className="text-sm">{op.label}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Erste Zahl</label>
                  <input
                    type="number"
                    value={number1}
                    onChange={(e) => setNumber1(e.target.value)}
                    className="w-full rounded-xl bg-gray-700/50 border-gray-600 text-white py-3 px-4 focus:border-red-500 focus:ring focus:ring-red-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Zweite Zahl</label>
                  <input
                    type="number"
                    value={number2}
                    onChange={(e) => setNumber2(e.target.value)}
                    className="w-full rounded-xl bg-gray-700/50 border-gray-600 text-white py-3 px-4 focus:border-red-500 focus:ring focus:ring-red-500/20"
                  />
                </div>
              </div>
              <button
                onClick={calculate}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-6 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg shadow-red-500/30"
              >
                Berechnen
              </button>
              {result && (
                <div className="mt-6 p-6 bg-gray-700/50 rounded-xl border border-red-500/20">
                  <p className="text-lg font-medium">Ergebnis: <span className="text-red-400">{result}</span></p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'todos' && (
          <div className="bg-gray-800 rounded-2xl p-8 shadow-2xl border border-red-500/30 backdrop-blur-sm">
            <h2 className="text-2xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-300">
              Todos
            </h2>
            <form onSubmit={addTodo} className="flex space-x-4 mb-8">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="Neues Todo hinzufügen..."
                className="flex-1 rounded-xl bg-gray-700/50 border-gray-600 text-white py-3 px-4 focus:border-red-500 focus:ring focus:ring-red-500/20"
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-6 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg shadow-red-500/30"
              >
                Hinzufügen
              </button>
            </form>
            <ul className="space-y-3">
              {todos.map((todo) => (
                <li
                  key={todo.id}
                  className="flex items-center space-x-4 p-4 bg-gray-700/50 rounded-xl border border-red-500/20 transition-all duration-200 hover:border-red-500/40"
                >
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo.id, todo.completed)}
                    className="h-5 w-5 rounded border-gray-600 text-red-600 focus:ring-red-500"
                  />
                  <span className={`flex-1 ${todo.completed ? 'line-through text-gray-400' : ''}`}>
                    {todo.title}
                  </span>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 'bookmarks' && (
          <div className="bg-gray-800 rounded-2xl p-8 shadow-2xl border border-red-500/30 backdrop-blur-sm">
            <h2 className="text-2xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-300">
              Lesezeichen
            </h2>
            <form onSubmit={addBookmark} className="space-y-4 mb-8">
              <div className="space-y-3">
                <input
                  type="text"
                  value={newBookmarkTitle}
                  onChange={(e) => setNewBookmarkTitle(e.target.value)}
                  placeholder="Titel"
                  className="w-full rounded-xl bg-gray-700/50 border-gray-600 text-white py-3 px-4 focus:border-red-500 focus:ring focus:ring-red-500/20"
                />
                <input
                  type="url"
                  value={newBookmarkUrl}
                  onChange={(e) => setNewBookmarkUrl(e.target.value)}
                  placeholder="URL"
                  className="w-full rounded-xl bg-gray-700/50 border-gray-600 text-white py-3 px-4 focus:border-red-500 focus:ring focus:ring-red-500/20"
                />
                <input
                  type="url"
                  value={newBookmarkThumbnail}
                  onChange={(e) => setNewBookmarkThumbnail(e.target.value)}
                  placeholder="Thumbnail URL (optional)"
                  className="w-full rounded-xl bg-gray-700/50 border-gray-600 text-white py-3 px-4 focus:border-red-500 focus:ring focus:ring-red-500/20"
                />
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={newBookmarkEmbedded}
                    onChange={(e) => setNewBookmarkEmbedded(e.target.checked)}
                    className="rounded border-gray-600 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-gray-300">In Popup öffnen</span>
                </label>
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white py-3 px-6 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg shadow-red-500/30"
              >
                Lesezeichen hinzufügen
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookmarks.map((bookmark) => (
                <div
                  key={bookmark.id}
                  className="relative group"
                >
                  {editingBookmark?.id === bookmark.id ? (
                    <div className="p-4 bg-gray-700 rounded-xl border border-red-500/40">
                      <input
                        type="text"
                        value={editingBookmark.title}
                        onChange={(e) => setEditingBookmark({...editingBookmark, title: e.target.value})}
                        className="w-full mb-2 rounded-lg bg-gray-600 border-gray-500 text-white py-2 px-3"
                        placeholder="Titel"
                      />
                      <input
                        type="url"
                        value={editingBookmark.url}
                        onChange={(e) => setEditingBookmark({...editingBookmark, url: e.target.value})}
                        className="w-full mb-2 rounded-lg bg-gray-600 border-gray-500 text-white py-2 px-3"
                        placeholder="URL"
                      />
                      <input
                        type="url"
                        value={editingBookmark.thumbnail || ''}
                        onChange={(e) => setEditingBookmark({...editingBookmark, thumbnail: e.target.value})}
                        className="w-full mb-2 rounded-lg bg-gray-600 border-gray-500 text-white py-2 px-3"
                        placeholder="Thumbnail URL"
                      />
                      <label className="flex items-center space-x-2 mb-3">
                        <input
                          type="checkbox"
                          checked={editingBookmark.embedded}
                          onChange={(e) => setEditingBookmark({...editingBookmark, embedded: e.target.checked})}
                          className="rounded border-gray-600 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-gray-300">In Popup öffnen</span>
                      </label>
                      <div className="flex space-x-2">
                        <button
                          onClick={updateBookmark}
                          className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700"
                        >
                          Speichern
                        </button>
                        <button
                          onClick={() => setEditingBookmark(null)}
                          className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
                        >
                          Abbrechen
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="block p-4 bg-gray-700/50 rounded-xl border border-red-500/20 hover:border-red-500/40 transition-all duration-200">
                      {bookmark.thumbnail && (
                        <img
                          src={bookmark.thumbnail}
                          alt={bookmark.title}
                          className="w-full h-32 object-cover rounded-lg mb-3"
                        />
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <LinkIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                          <span className="text-gray-100 truncate">{bookmark.title}</span>
                        </div>
                        <div className="flex items-center space-x-2 ml-2">
                          <button
                            onClick={() => setEditingBookmark(bookmark)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {bookmark.embedded ? (
                            <button
                              onClick={() => setShowEmbedded(bookmark.id)}
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Maximize2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <a
                              href={bookmark.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={() => deleteBookmark(bookmark.id)}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Embedded View Modal */}
            {showEmbedded && (
              <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
                <div className="bg-gray-800 rounded-2xl p-4 w-full max-w-4xl h-[70vh] flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">
                      {bookmarks.find(b => b.id === showEmbedded)?.title}
                    </h3>
                    <button
                      onClick={() => setShowEmbedded(null)}
                      className="p-1 hover:bg-gray-700 rounded-lg"
                    >
                      <Maximize2 className="w-6 h-6" />
                    </button>
                  </div>
                  <iframe
                    src={bookmarks.find(b => b.id === showEmbedded)?.url}
                    className="w-full flex-1 rounded-lg bg-white"
                    title="Embedded content"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
