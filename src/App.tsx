/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';
import { addTodo, getTodos } from './api/todos';
import { UserWarning } from './UserWarning';
import { USER_ID } from './api/todos';
import { deleteTodo } from './api/todos';

interface Todo {
  id: number,
  title: string,
  completed: boolean,
}

export const App: React.FC = () => {
  const [todos, setTodos] = useState([]);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [newTitle, setNewTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [tempTodo, setTempTodo] = useState<any>(null);
  const [deletingIds, setDeletingIds] = useState<number[]>([]);

  useEffect(() => {
    loadTodos();
  }, []);

  const showError = (message: string) => {
    setError(message);

    setTimeout(() => {
      setError(null);
    }, 3000);
  };

  const loadTodos = async () => {
    setError(null);

    try {
      const data = await getTodos();

      setTodos(data);
    } catch (e) {
      showError('Unable to load todos');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const title = newTitle.trim();

    if (!title) {
      showError('Title should not be empty');

      return;
    }

    setError(null);
    setIsAdding(true);

    const temp = {
      id: 0,
      title,
      completed: false,
    };

    setTempTodo(temp);

    try {
      const newTodoFromServer = await addTodo({
        title,
        completed: false,
        userId: USER_ID,
      });

      setTodos(prev => [...prev, newTodoFromServer]);
      setNewTitle('');
    } catch (e) {
      showError('Unable to add a todo');
    } finally {
      setIsAdding(false);
      setTempTodo(null);
    }
  };

  const handleDelete = async (id: number) => {
    setError(null);
    setDeletingIds(prev => [...prev, id]);

    try {
      await deleteTodo(id);

      setTodos(prev => prev.filter(todo => todo.id !== id))
    } catch (e) {
      showError('Unable to add a todo');
    } finally {
      setDeletingIds(prev => prev.filter(itemId => itemId.id !== id));
    }
  };

  const handleClearCompleted = async () => {
    const completedTodos = todos.filter(todo => todo.completed);

    if (completedTodos.length === 0) {
      return;
    }

    setError(null);

    const ids = completedTodos.map(todo => todo.id);
    setDeletingIds(prev => [...prev, ...ids]);

    try {
      await Promise.all(ids.map(id => deleteTodo(id)));

      setTodos(prev => prev.filter(todo => !todo.completed));
    } catch (e) {
      showError('Unable to delete a todo');
    } finally {
      setDeletingIds(prev =>
        prev.filter(id => !ids.includes(id))
      );
    }
  };

  const visibleTodos = todos.filter(todo => {
    if (filter === 'active') {
      return !todo.completed;
    }

    if (filter === 'completed') {
      return todo.completed;
    }

    return true;
  });

  if (USER_ID === 0) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          {/* this button should have `active` class only if all todos are completed */}
          <button
            type="button"
            className={`todoapp__toggle-all ${todos.every(t => t.completed) ? 'active' : ''}`}
            data-cy="ToggleAllButton"
          />

          {/* Add a todo on form submit */}
          <form onSubmit={handleSubmit}>
            <input
              data-cy="NewTodoField"
              type="text"
              className="todoapp__new-todo"
              placeholder="What needs to be done?"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              disabled={isAdding}
            />
          </form>
        </header>

        {(todos.length > 0 || tempTodo) && (
          <section className="todoapp__main" data-cy="TodoList">
            {tempTodo && (
              <div className="todo">
                <span className="todo__title">{tempTodo.title}</span>

                <div className="modal overlay is-active">
                  <div className="modal-background has-background-white-ter" />
                  <div className="loader" />
                </div>
              </div>
            )}

            {visibleTodos.map(todo => (
              <div
                key={todo.id}
                data-cy="Todo"
                className={`todo ${todo.completed ? 'completed' : ''}`}
              >
                <label className="todo__status-label">
                  <input
                    data-cy="TodoStatus"
                    type="checkbox"
                    className="todo__status"
                    checked={todo.completed}
                    readOnly
                  />
                </label>

                <span data-cy="TodoTitle" className="todo__title">
                  {todo.title}
                </span>

                <button
                  type="button"
                  className="todo__remove"
                  data-cy="TodoDelete"
                  onClick={() => handleDelete(todo.id)}
                  disabled={deletingIds.includes(todo.id)}
                >
                  ×
                </button>

                <div data-cy="TodoLoader"
                    className={`modal overlay ${deletingIds.includes(todo.id) ? 'is-active' : ''}`}
                >
                  <div className="modal-background has-background-white-ter" />
                  <div className="loader" />
                </div>
              </div>
            ))}
          </section>
        )}

        {todos.length > 0 && (
          <footer className="todoapp__footer" data-cy="Footer">
            <span className="todo-count" data-cy="TodosCounter">
              {todos.filter(t => !t.completed).length} items left
            </span>

            {/* Active link should have the 'selected' class */}
            <nav className="filter" data-cy="Filter">
              <a
                href="#/"
                className={`filter__link ${filter === 'all' ? 'selected' : ''}`}
                data-cy="FilterLinkAll"
                onClick={() => setFilter('all')}
              >
                All
              </a>

              <a
                href="#/active"
                className={`filter__link ${filter === 'active' ? 'selected' : ''}`}
                data-cy="FilterLinkActive"
                onClick={() => setFilter('active')}
              >
                Active
              </a>

              <a
                href="#/completed"
                className={`filter__link ${filter === 'completed' ? 'selected' : ''}`}
                data-cy="FilterLinkCompleted"
                onClick={() => setFilter('completed')}
              >
                Completed
              </a>
            </nav>

            {/* this button should be disabled if there are no completed todos */}
            <button
              type="button"
              className="todoapp__clear-completed"
              data-cy="ClearCompletedButton"
              onClick={handleClearCompleted}
              disabled={!todos.some(t => t.completed)}
            >
              Clear completed
            </button>
          </footer>
        )}
      </div>

      {/* DON'T use conditional rendering to hide the notification */}
      {/* Add the 'hidden' class to hide the message smoothly */}
      <div
        data-cy="ErrorNotification"
        className={`notification is-danger is-light has-text-weight-normal ${
          !error ? 'hidden' : ''
        }`}
      >
        <button
          data-cy="HideErrorButton"
          type="button"
          className="delete"
          onClick={() => setError(null)}
          // disabled={!todos.some(todo => todo.completed)}
        />
        {error}
      </div>
    </div>
  );
};
