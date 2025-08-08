import { useState, FormEvent, useEffect } from 'react';
import './App.css';

// Data structures
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

interface TodoList {
  id: number;
  name: string;
  todos: Todo[];
}

// Key for localStorage
const LOCAL_STORAGE_KEY = 'todoAppLists';

function App() {
  // State for lists, loaded from localStorage
  const [lists, setLists] = useState<TodoList[]>(() => {
    try {
      const savedLists = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      // Provide default data for a better first-time experience
      return savedLists ? JSON.parse(savedLists) : [{ id: 1, name: 'My Todos', todos: [] }];
    } catch (error) {
      console.error("Could not parse lists from localStorage", error);
      return [{ id: 1, name: 'My Todos', todos: [] }];
    }
  });

  // State for the currently selected list
  const [activeListId, setActiveListId] = useState<number | null>(null);

  // State for form inputs
  const [newListName, setNewListName] = useState('');
  const [newTodoText, setNewTodoText] = useState('');

  // UI state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddingTodo, setIsAddingTodo] = useState(false);

  // PWA install prompt state
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(
    () => window.matchMedia('(display-mode: standalone)').matches
  );

  // --- Effects ---

  // Persist lists to localStorage whenever they change
  useEffect(() => {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(lists));
  }, [lists]);

  // Set the first list as active when the app loads or lists change
  useEffect(() => {
    if (activeListId === null && lists.length > 0) {
      setActiveListId(lists[0].id);
    }
    // If the active list was deleted, select another one or none
    if (activeListId !== null && !lists.some(list => list.id === activeListId)) {
        setActiveListId(lists.length > 0 ? lists[0].id : null);
    }
  }, [lists, activeListId]);

  // PWA install prompt logic
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setIsInstalled(true);
    };
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  // --- Handlers ---

  const handleAddList = (e: FormEvent) => {
    e.preventDefault();
    if (newListName.trim() === '') return;
    const newList: TodoList = {
      id: Date.now(),
      name: newListName.trim(),
      todos: [],
    };
    const updatedLists = [...lists, newList];
    setLists(updatedLists);
    setNewListName('');
    setActiveListId(newList.id);
    setIsDrawerOpen(false);
  };

  const handleDeleteList = (listIdToDelete: number) => {
    setLists(lists.filter(list => list.id !== listIdToDelete));
  };

  const handleSelectList = (listId: number) => {
    setActiveListId(listId);
    setIsDrawerOpen(false);
  };

  const handleAddTodo = (e: FormEvent) => {
    e.preventDefault();
    if (newTodoText.trim() === '' || activeListId === null) return;
    const newTodo: Todo = {
      id: Date.now(),
      text: newTodoText.trim(),
      completed: false,
    };
    setLists(lists.map(list => 
      list.id === activeListId 
        ? { ...list, todos: [...list.todos, newTodo] } 
        : list
    ));
    setNewTodoText('');
    setIsAddingTodo(false);
  };

  const toggleTodo = (todoId: number) => {
    if (activeListId === null) return;
    setLists(lists.map(list => 
      list.id === activeListId 
        ? { ...list, todos: list.todos.map(todo => 
            todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
          )} 
        : list
    ));
  };

  const deleteTodo = (todoId: number) => {
    if (activeListId === null) return;
    setLists(lists.map(list => 
      list.id === activeListId 
        ? { ...list, todos: list.todos.filter(todo => todo.id !== todoId) } 
        : list
    ));
  };

  const activeList = lists.find(list => list.id === activeListId);

  // --- Render ---

  return (
    <div className={`app-wrapper ${isDrawerOpen ? 'drawer-open' : ''}`}>
      <nav className="side-drawer">
        <h2>My Lists</h2>
        <ul className="lists-list">
          {lists.map(list => (
            <li
              key={list.id}
              className={`list-item ${list.id === activeListId ? 'active' : ''}`}
              onClick={() => handleSelectList(list.id)}
            >
              <span className="list-name">{list.name}</span>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDeleteList(list.id); }} 
                className="delete-btn"
              >
                &times;
              </button>
            </li>
          ))}
        </ul>
        <form onSubmit={handleAddList} className="add-list-form">
          <input
            type="text"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="Add new list..."
          />
          <button type="submit">+</button>
        </form>
        <div className="pwa-install-card">
          {isInstalled ? null : installPrompt ? (
            <button onClick={handleInstallClick}>Install App</button>
          ) : null}
        </div>
      </nav>

      <div className="drawer-overlay" onClick={() => setIsDrawerOpen(false)}></div>

      <main className="main-content">
        <header className="app-header">
          <button className="hamburger-btn" onClick={() => setIsDrawerOpen(!isDrawerOpen)}>
            &#9776;
          </button>
          <h1>{activeList?.name || 'Todo'}</h1>
        </header>

        <div className="todos-panel">
          {activeList ? (
            <ul className="todos-list">
              {activeList.todos.map((todo) => (
                <li key={todo.id} className={todo.completed ? 'completed' : ''}>
                  <span className="todo-checkbox" onClick={() => toggleTodo(todo.id)}>
                    {todo.completed && '✔'}
                  </span>
                  <span className="todo-text" onClick={() => toggleTodo(todo.id)}>
                    {todo.text}
                  </span>
                  <button onClick={() => deleteTodo(todo.id)} className="delete-btn">&times;</button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="no-list-selected">
              <p>Create a list or select one from the menu.</p>
            </div>
          )}
        </div>

        {activeList && !isAddingTodo && (
          <button className="fab" onClick={() => setIsAddingTodo(true)}>+</button>
        )}

        {isAddingTodo && (
          <div className="add-todo-container">
            <form onSubmit={handleAddTodo} className="add-todo-form">
              <input
                type="text"
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                placeholder="Add a new todo"
                autoFocus
                onBlur={() => { if (newTodoText.trim() === '') setIsAddingTodo(false); }}
              />
              <button type="submit">Add</button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
