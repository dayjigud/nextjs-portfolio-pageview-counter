const STORAGE_KEY = 'donewell-tasks-v1';
const today = () => new Date().toISOString().slice(0, 10);
const tomorrow = () => new Date(Date.now() + 86400000).toISOString().slice(0, 10);

const starterTasks = [
  { id: crypto.randomUUID(), title: 'Plan the week with intention', due: today(), priority: 'high', completed: false, created: Date.now() },
  { id: crypto.randomUUID(), title: 'Take a proper screen break', due: today(), priority: 'normal', completed: false, created: Date.now() - 1 },
  { id: crypto.randomUUID(), title: 'Review the project notes', due: tomorrow(), priority: 'low', completed: false, created: Date.now() - 2 },
];

let tasks;
try { tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || starterTasks; } catch { tasks = starterTasks; }
let activeFilter = 'all';
let searchTerm = '';

const list = document.querySelector('.task-list');
const empty = document.querySelector('.empty-state');
const form = document.querySelector('.task-form');
const viewTitle = document.querySelector('.todo-toolbar h3');
const formatDate = (date) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(`${date}T12:00:00`));
const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
const escapeHTML = (value) => { const node = document.createElement('span'); node.textContent = value; return node.innerHTML; };

function matchesFilter(task) {
  if (activeFilter === 'today') return !task.completed && task.due === today();
  if (activeFilter === 'upcoming') return !task.completed && task.due > today();
  if (activeFilter === 'completed') return task.completed;
  return !task.completed;
}

function render() {
  const visible = tasks.filter((task) => matchesFilter(task) && task.title.toLowerCase().includes(searchTerm));
  list.innerHTML = visible.map((task) => `
    <li class="task-row ${task.completed ? 'done' : ''}" data-id="${task.id}">
      <button class="task-check" type="button" aria-label="Mark ${escapeHTML(task.title)} ${task.completed ? 'incomplete' : 'complete'}"><span>✓</span></button>
      <div class="task-copy"><p>${escapeHTML(task.title)}</p><div><span class="priority ${task.priority}">${task.priority}</span>${task.due ? `<time datetime="${task.due}">${task.due === today() ? 'Today' : formatDate(task.due)}</time>` : ''}</div></div>
      <button class="task-delete" type="button" aria-label="Delete ${escapeHTML(task.title)}">×</button>
    </li>`).join('');
  empty.hidden = visible.length > 0;
  list.hidden = visible.length === 0;

  const open = tasks.filter((task) => !task.completed).length;
  const complete = tasks.length - open;
  const percentage = tasks.length ? Math.round((complete / tasks.length) * 100) : 0;
  document.querySelector('.progress-copy').textContent = `${complete} of ${tasks.length} done`;
  document.querySelector('.progress-track span').style.width = `${percentage}%`;
  document.querySelector('[data-count="all"]').textContent = open;
  document.querySelector('[data-count="today"]').textContent = tasks.filter((task) => !task.completed && task.due === today()).length;
  document.querySelector('[data-count="upcoming"]').textContent = tasks.filter((task) => !task.completed && task.due > today()).length;
  document.querySelector('[data-count="completed"]').textContent = complete;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const title = data.get('title').trim();
  if (!title) return;
  tasks.unshift({ id: crypto.randomUUID(), title, due: data.get('due'), priority: data.get('priority'), completed: false, created: Date.now() });
  save(); form.reset(); render(); form.elements.title.focus();
});

list.addEventListener('click', (event) => {
  const row = event.target.closest('.task-row');
  if (!row) return;
  if (event.target.closest('.task-check')) tasks = tasks.map((task) => task.id === row.dataset.id ? { ...task, completed: !task.completed } : task);
  if (event.target.closest('.task-delete')) tasks = tasks.filter((task) => task.id !== row.dataset.id);
  save(); render();
});

document.querySelectorAll('.filter').forEach((button) => button.addEventListener('click', () => {
  activeFilter = button.dataset.filter;
  document.querySelectorAll('.filter').forEach((item) => item.classList.toggle('active', item === button));
  viewTitle.textContent = button.querySelector('span').textContent;
  render();
}));
document.querySelector('.task-search').addEventListener('input', (event) => { searchTerm = event.target.value.toLowerCase(); render(); });
document.querySelector('.clear-completed').addEventListener('click', () => { tasks = tasks.filter((task) => !task.completed); save(); render(); });

const now = new Date();
document.querySelector('.todo-date').textContent = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(now);
const updateClock = () => { document.querySelector('.projects-clock').textContent = new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' }).format(new Date()); };
updateClock(); setInterval(updateClock, 30000); render();
