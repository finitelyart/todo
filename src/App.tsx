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
      return savedLists ? JSON.parse(savedLists) : [];
    } catch (error) {
      console.error("Could not parse lists from localStorage", error);
      return [];
    }
  });

  // State for the currently selected list
  const [activeListId, setActiveListId] = useState<number | null>(null);

  // State for form inputs
  const [newListName, setNewListName] = useState('');
  const [newTodoText, setNewTodoText] = useState('');

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
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
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
    // Set the new list as active
    setActiveListId(newList.id);
  };
  
  const handleDeleteList = (listIdToDelete: number) => {
    const updatedLists = lists.filter(list => list.id !== listIdToDelete);
    setLists(updatedLists);
  };

  const handleAddTodo = (e: FormEvent) => {
    e.preventDefault();
    if (newTodoText.trim() === '' || activeListId === null) return;
    const newTodo: Todo = {
      id: Date.now(),
      text: newTodoText.trim(),
      completed: false,
    };
    const updatedLists = lists.map(list => {
      if (list.id === activeListId) {
        return { ...list, todos: [...list.todos, newTodo] };
      }
      return list;
    });
    setLists(updatedLists);
    setNewTodoText('');
  };

  const toggleTodo = (todoId: number) => {
    if (activeListId === null) return;
    const updatedLists = lists.map(list => {
      if (list.id === activeListId) {
        const updatedTodos = list.todos.map(todo =>
          todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
        );
        return { ...list, todos: updatedTodos };
      }
      return list;
    });
    setLists(updatedLists);
  };

  const deleteTodo = (todoId: number) => {
    if (activeListId === null) return;
    const updatedLists = lists.map(list => {
      if (list.id === activeListId) {
        const updatedTodos = list.todos.filter(todo => todo.id !== todoId);
        return { ...list, todos: updatedTodos };
      }
      return list;
    });
    setLists(updatedLists);
  };

  const activeList = lists.find(list => list.id === activeListId);

  // --- Render ---

  return (
    <>
      <h1>Advanced Todo App</h1>
      <div className="app-container">
        <div className="lists-panel">
          <h2>My Lists</h2>
          <form onSubmit={handleAddList}>
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="New list name"
            />
            <button type="submit">Add List</button>
          </form>
          <ul className="lists-list">
            {lists.map(list => (
              <li
                key={list.id}
                className={`list-item ${list.id === activeListId ? 'active' : ''}`}
                onClick={() => setActiveListId(list.id)}
              >
                <span className="list-name">
                  {list.name}
                </span>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteList(list.id); }} className="delete-list-btn">
                  &times;
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="todos-panel">
          {activeList ? (
            <>
              <h2>{activeList.name}</h2>
              <form onSubmit={handleAddTodo}>
                <input
                  type="text"
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  placeholder="Add a new todo"
                />
                <button type="submit">Add Todo</button>
              </form>
              <ul className="todos-list">
                {activeList.todos.map((todo) => (
                  <li
                    key={todo.id}
                    className={todo.completed ? 'completed' : ''}
                  >
                    <span onClick={() => toggleTodo(todo.id)}>{todo.text}</span>
                    <button onClick={() => deleteTodo(todo.id)}>Delete</button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="no-list-selected">
                <h2>No list selected</h2>
                <p>Create a list or select one to start adding todos.</p>
            </div>
          )}
        </div>
      </div>

       <div className="card">
        {isInstalled ? (
          <p>Application is already installed.</p>
        ) : installPrompt ? (
          <button onClick={handleInstallClick}>Install App</button>
        ) : (
          <p>App is installable, but the prompt is not available at the moment.</p>
        )}
      </div>
    </>
  );
}

export default App;
