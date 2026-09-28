const STORAGE_KEY = 'donewell-tasks-v1';
const dateKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const today = () => dateKey();
const tomorrow = () => { const date = new Date(); date.setDate(date.getDate() + 1); return dateKey(date); };
const parseDate = (value) => new Date(`${value}T12:00:00`);
const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && dateKey(parseDate(value)) === value;
const priorities = ['normal', 'high', 'low'];
const repeats = ['none', 'daily', 'weekly', 'monthly'];

const starterTasks = [
  { id: crypto.randomUUID(), title: 'Plan the week with intention', due: today(), priority: 'high', completed: false, created: Date.now() },
  { id: crypto.randomUUID(), title: 'Take a proper screen break', due: today(), priority: 'normal', completed: false, created: Date.now() - 1 },
  { id: crypto.randomUUID(), title: 'Review the project notes', due: tomorrow(), priority: 'low', completed: false, created: Date.now() - 2 },
];

let tasks;
try { const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)); tasks = Array.isArray(stored) ? stored : starterTasks; } catch { tasks = starterTasks; }
let activeFilter = 'all';
let searchTerm = '';
let editingId = null;
let activeTag = '';
let sortBy = 'newest';
let undoSnapshot = null;

const list = document.querySelector('.task-list');
const empty = document.querySelector('.empty-state');
const form = document.querySelector('.task-form');
const viewTitle = document.querySelector('.todo-toolbar h3');
const notice = document.querySelector('.task-notice');
const tagFilter = document.querySelector('.tag-filter');
const formatDate = (date) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(parseDate(date));
const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const rowFor = (id) => [...list.querySelectorAll('.task-row')].find((row) => row.dataset.id === id);
const fullDate = (value) => new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(parseDate(value));
const monthNames = Array.from({ length: 12 }, (_, month) => new Intl.DateTimeFormat('en', { month: 'long' }).format(new Date(2026, month, 1)));
let openDateField = null;
let calendarMonth = null;

function dateFieldMarkup(value = '', required = false) {
  const due = validDate(value) ? value : '';
  return `<div class="date-field"><span>Due${required ? ' *' : ''}</span><input name="due" type="hidden" value="${due}"><button class="date-trigger ${due ? 'has-date' : ''}" type="button" aria-label="Choose due date${required ? ' (required)' : ''}" aria-haspopup="dialog" aria-expanded="false"><span>${due ? fullDate(due) : 'Pick a date'}</span><span aria-hidden="true">▦</span></button><div class="date-picker" role="dialog" aria-label="Choose due date" hidden></div></div>`;
}

function updateDateField(field) {
  const due = field.querySelector('input[name="due"]').value;
  const trigger = field.querySelector('.date-trigger');
  trigger.firstElementChild.textContent = validDate(due) ? fullDate(due) : 'Pick a date';
  trigger.classList.toggle('has-date', validDate(due));
  trigger.removeAttribute('data-invalid');
}

function closeDatePicker(restoreFocus = true) {
  if (!openDateField) return;
  const trigger = openDateField.querySelector('.date-trigger');
  openDateField.querySelector('.date-picker').hidden = true;
  trigger.setAttribute('aria-expanded', 'false');
  openDateField = null;
  if (restoreFocus && trigger.isConnected) trigger.focus();
}

function renderCalendar() {
  const picker = openDateField.querySelector('.date-picker');
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const selected = openDateField.querySelector('input[name="due"]').value;
  const start = (new Date(year, month, 1).getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekFromNow = new Date();
  weekFromNow.setDate(weekFromNow.getDate() + 7);
  const quickDates = [
    ['Today', today()], ['Tomorrow', tomorrow()],
    ['Next week', dateKey(weekFromNow)],
  ];
  picker.innerHTML = `
    <div class="date-picker-header">
      <button class="calendar-prev" type="button" aria-label="Previous month">‹</button>
      <select class="calendar-month" aria-label="Month">${monthNames.map((name, index) => `<option value="${index}" ${index === month ? 'selected' : ''}>${name}</option>`).join('')}</select>
      <select class="calendar-year" aria-label="Year">${Array.from({ length: 11 }, (_, index) => year - 5 + index).map((value) => `<option value="${value}" ${value === year ? 'selected' : ''}>${value}</option>`).join('')}</select>
      <button class="calendar-next" type="button" aria-label="Next month">›</button>
    </div>
    <div class="date-weekdays" aria-hidden="true">${weekdays.map((day) => `<span>${day}</span>`).join('')}</div>
    <div class="date-days">${'<span></span>'.repeat(start)}${Array.from({ length: days }, (_, index) => {
      const value = dateKey(new Date(year, month, index + 1));
      return `<button class="date-day ${value === today() ? 'is-today' : ''} ${value === selected ? 'is-selected' : ''}" type="button" data-date="${value}" aria-label="${fullDate(value)}" aria-pressed="${value === selected}" ${value === today() ? 'aria-current="date"' : ''}>${index + 1}</button>`;
    }).join('')}</div>
    <div class="date-quick">${quickDates.map(([label, value]) => `<button type="button" data-date="${value}">${label}</button>`).join('')}<button class="date-clear" type="button">Clear</button></div>`;
}

function openDatePicker(field) {
  closeDatePicker(false);
  openDateField = field;
  const selected = field.querySelector('input[name="due"]').value;
  const view = selected && validDate(selected) ? parseDate(selected) : new Date();
  calendarMonth = new Date(view.getFullYear(), view.getMonth(), 1);
  field.querySelector('.date-picker').hidden = false;
  field.querySelector('.date-trigger').setAttribute('aria-expanded', 'true');
  renderCalendar();
  const focusDate = selected && selected.slice(0, 7) === dateKey(calendarMonth).slice(0, 7) ? selected : today();
  (field.querySelector(`.date-day[data-date="${focusDate}"]`) || field.querySelector('.date-day')).focus();
}

function selectDate(value) {
  const field = openDateField;
  field.querySelector('input[name="due"]').value = value;
  updateDateField(field);
  closeDatePicker();
}

document.addEventListener('click', (event) => {
  const trigger = event.target.closest('.date-trigger');
  if (trigger) {
    const field = trigger.closest('.date-field');
    if (openDateField === field) closeDatePicker();
    else openDatePicker(field);
    return;
  }
  if (!openDateField || !event.target.closest('.date-picker')) return;
  const button = event.target.closest('button');
  if (!button) return;
  if (button.matches('.calendar-prev, .calendar-next')) {
    calendarMonth.setMonth(calendarMonth.getMonth() + (button.matches('.calendar-next') ? 1 : -1));
    renderCalendar();
    openDateField.querySelector(button.matches('.calendar-next') ? '.calendar-next' : '.calendar-prev').focus();
  } else if (button.matches('.date-clear')) selectDate('');
  else if (button.dataset.date) selectDate(button.dataset.date);
});

document.addEventListener('change', (event) => {
  if (!openDateField || !event.target.matches('.calendar-month, .calendar-year')) return;
  const picker = openDateField.querySelector('.date-picker');
  const month = Number(picker.querySelector('.calendar-month').value);
  const year = Number(picker.querySelector('.calendar-year').value);
  calendarMonth = new Date(year, month, 1);
  const selector = event.target.matches('.calendar-month') ? '.calendar-month' : '.calendar-year';
  renderCalendar();
  picker.querySelector(selector).focus();
});

document.addEventListener('pointerdown', (event) => {
  if (openDateField && !openDateField.contains(event.target)) closeDatePicker(false);
});
document.addEventListener('focusin', (event) => {
  if (openDateField && !openDateField.contains(event.target)) closeDatePicker(false);
});

document.addEventListener('keydown', (event) => {
  if (!openDateField) return;
  if (event.key === 'Escape') {
    event.preventDefault(); event.stopPropagation(); closeDatePicker();
    return;
  }
  if (!event.target.matches('.date-day')) return;
  const day = parseDate(event.target.dataset.date);
  const weekday = (day.getDay() + 6) % 7;
  if (event.key === 'ArrowLeft') day.setDate(day.getDate() - 1);
  else if (event.key === 'ArrowRight') day.setDate(day.getDate() + 1);
  else if (event.key === 'ArrowUp') day.setDate(day.getDate() - 7);
  else if (event.key === 'ArrowDown') day.setDate(day.getDate() + 7);
  else if (event.key === 'Home') day.setDate(day.getDate() - weekday);
  else if (event.key === 'End') day.setDate(day.getDate() + 6 - weekday);
  else return;
  event.preventDefault(); event.stopPropagation();
  calendarMonth = new Date(day.getFullYear(), day.getMonth(), 1);
  renderCalendar();
  openDateField.querySelector(`.date-day[data-date="${dateKey(day)}"]`).focus();
}, true);

function showNotice(message, snapshot = null) {
  undoSnapshot = snapshot;
  notice.querySelector('span').textContent = message;
  notice.querySelector('button').hidden = !snapshot;
  notice.hidden = false;
}

function clearNotice() { undoSnapshot = null; notice.hidden = true; }
function commit() { save(); clearNotice(); render(); }

function nextDue(task) {
  let date = parseDate(task.due);
  const anchor = task.repeatDay || date.getDate();
  do {
    if (task.repeat === 'daily') date.setDate(date.getDate() + 1);
    if (task.repeat === 'weekly') date.setDate(date.getDate() + 7);
    if (task.repeat === 'monthly') {
      const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1, 12);
      const lastDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
      nextMonth.setDate(Math.min(anchor, lastDay));
      date = nextMonth;
    }
  } while (dateKey(date) <= today());
  return dateKey(date);
}

function syncRepeatRequirement(targetForm) {
  const required = targetForm.elements.repeat.value !== 'none';
  const field = targetForm.querySelector('.date-field');
  field.querySelector(':scope > span').textContent = required ? 'Due *' : 'Due';
  field.querySelector('.date-trigger').setAttribute('aria-label', required ? 'Choose due date (required)' : 'Choose due date');
}

function hasRequiredDueDate(targetForm) {
  if (targetForm.elements.repeat.value === 'none' || targetForm.elements.due.value) return true;
  const field = targetForm.querySelector('.date-field');
  openDatePicker(field);
  field.querySelector('.date-trigger').setAttribute('data-invalid', 'true');
  showNotice('Choose a due date for a repeating task.');
  return false;
}

function taskDetails(targetForm, original = {}) {
  const data = new FormData(targetForm);
  const due = data.get('due');
  const repeat = data.get('repeat');
  return {
    title: data.get('title').trim(), due, priority: data.get('priority'),
    notes: data.get('notes').trim(), tag: data.get('tag').trim(), repeat,
    repeatDay: repeat === 'monthly' ? (original.repeat === 'monthly' && original.due === due ? original.repeatDay : parseDate(due).getDate()) : null,
  };
}

function matchesFilter(task) {
  if (activeFilter === 'today') return !task.completed && task.due === today();
  if (activeFilter === 'overdue') return !task.completed && task.due && task.due < today();
  if (activeFilter === 'upcoming') return !task.completed && task.due > today();
  if (activeFilter === 'completed') return task.completed;
  return !task.completed;
}

function render() {
  closeDatePicker(false);
  const labels = [...new Set(tasks.map((task) => task.tag).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  if (activeTag && !labels.includes(activeTag)) activeTag = '';
  tagFilter.innerHTML = `<option value="">All labels</option>${labels.map((tag) => `<option value="${escapeHTML(tag)}">${escapeHTML(tag)}</option>`).join('')}`;
  tagFilter.value = activeTag;

  const visible = tasks.filter((task) => matchesFilter(task)
    && (!activeTag || task.tag === activeTag)
    && `${task.title} ${task.notes || ''} ${task.tag || ''}`.toLowerCase().includes(searchTerm));
  const priorityRank = { high: 0, normal: 1, low: 2 };
  visible.sort((a, b) => {
    if (sortBy === 'due') return (a.due || '9999-12-31').localeCompare(b.due || '9999-12-31') || b.created - a.created;
    if (sortBy === 'priority') return (priorityRank[a.priority] ?? 1) - (priorityRank[b.priority] ?? 1) || b.created - a.created;
    return b.created - a.created;
  });
  list.innerHTML = visible.map((task) => task.id === editingId ? `
    <li class="task-row editing" data-id="${task.id}">
      <form class="task-edit-form" aria-label="Edit ${escapeHTML(task.title)}">
        <label class="sr-only" for="edit-title">Task title</label>
        <input id="edit-title" name="title" type="text" maxlength="120" required value="${escapeHTML(task.title)}">
        <div class="task-edit-options">
          ${dateFieldMarkup(task.due, task.repeat && task.repeat !== 'none')}
          <label>Priority <select name="priority">
            ${priorities.map((priority) => `<option value="${priority}" ${task.priority === priority ? 'selected' : ''}>${priority}</option>`).join('')}
          </select></label>
          <label>Repeat <select name="repeat">${repeats.map((repeat) => `<option value="${repeat}" ${(task.repeat || 'none') === repeat ? 'selected' : ''}>${repeat === 'none' ? 'Never' : repeat}</option>`).join('')}</select></label>
          <label>Label <input name="tag" maxlength="40" value="${escapeHTML(task.tag || '')}"></label>
          <label class="notes-field">Notes <textarea name="notes" maxlength="1000" rows="2">${escapeHTML(task.notes || '')}</textarea></label>
          <div class="task-edit-actions"><button type="submit">Save</button><button class="task-cancel" type="button">Cancel</button></div>
        </div>
      </form>
    </li>` : `
    <li class="task-row ${task.completed ? 'done' : ''}" data-id="${task.id}">
      <button class="task-check" type="button" aria-label="Mark ${escapeHTML(task.title)} ${task.completed ? 'incomplete' : 'complete'}"><span>✓</span></button>
      <div class="task-copy"><p>${escapeHTML(task.title)}</p><div>
        <span class="priority ${priorities.includes(task.priority) ? task.priority : 'normal'}">${escapeHTML(task.priority)}</span>
        ${task.due && validDate(task.due) ? `<time class="${!task.completed && task.due < today() ? 'overdue' : ''}" datetime="${task.due}">${task.due === today() ? 'Today' : task.due < today() && !task.completed ? `Overdue · ${formatDate(task.due)}` : formatDate(task.due)}</time>` : ''}
        ${task.repeat && task.repeat !== 'none' ? `<span class="task-repeat">↻ ${escapeHTML(task.repeat)}</span>` : ''}
        ${task.tag ? `<span class="task-tag">${escapeHTML(task.tag)}</span>` : ''}
      </div>${task.notes ? `<p class="task-notes">${escapeHTML(task.notes)}</p>` : ''}</div>
      <div class="task-actions"><button class="task-edit" type="button" aria-label="Edit ${escapeHTML(task.title)}">Edit</button><button class="task-delete" type="button" aria-label="Delete ${escapeHTML(task.title)}">×</button></div>
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
  document.querySelector('[data-count="overdue"]').textContent = tasks.filter((task) => !task.completed && task.due && task.due < today()).length;
  document.querySelector('[data-count="upcoming"]').textContent = tasks.filter((task) => !task.completed && task.due > today()).length;
  document.querySelector('[data-count="completed"]').textContent = complete;
  document.querySelector('.clear-completed').disabled = complete === 0;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!hasRequiredDueDate(form)) return;
  const details = taskDetails(form);
  if (!details.title) return;
  tasks.unshift({ id: crypto.randomUUID(), ...details, completed: false, created: Date.now() });
  commit(); form.reset(); updateDateField(form.querySelector('.date-field')); syncRepeatRequirement(form); form.elements.title.focus();
});
form.addEventListener('change', (event) => { if (event.target.name === 'repeat') syncRepeatRequirement(form); });

list.addEventListener('click', (event) => {
  const row = event.target.closest('.task-row');
  if (!row) return;
  if (event.target.closest('.task-edit')) {
    editingId = row.dataset.id;
    render();
    list.querySelector('.task-edit-form input[name="title"]').focus();
    return;
  }
  if (event.target.closest('.task-cancel')) {
    editingId = null;
    render();
    rowFor(row.dataset.id)?.querySelector('.task-edit')?.focus();
    return;
  }
  const task = tasks.find((item) => item.id === row.dataset.id);
  if (event.target.closest('.task-check')) {
    if (!task.completed && repeats.includes(task.repeat) && task.repeat !== 'none' && validDate(task.due)) {
      const completed = { ...task, id: crypto.randomUUID(), completed: true, repeat: 'none', repeatDay: null, created: Date.now() };
      tasks = [completed, ...tasks.map((item) => item.id === task.id ? { ...item, due: nextDue(item) } : item)];
    } else tasks = tasks.map((item) => item.id === task.id ? { ...item, completed: !item.completed } : item);
    commit();
    return;
  }
  if (event.target.closest('.task-delete')) {
    const before = structuredClone(tasks);
    tasks = tasks.filter((item) => item.id !== row.dataset.id);
    save(); render(); showNotice('Task deleted.', before);
  }
});

list.addEventListener('submit', (event) => {
  if (!event.target.matches('.task-edit-form')) return;
  event.preventDefault();
  if (!hasRequiredDueDate(event.target)) return;
  const row = event.target.closest('.task-row');
  const original = tasks.find((task) => task.id === row.dataset.id);
  const details = taskDetails(event.target, original);
  if (!details.title) return;
  tasks = tasks.map((task) => task.id === row.dataset.id ? { ...task, ...details } : task);
  editingId = null;
  commit();
  rowFor(row.dataset.id)?.querySelector('.task-edit')?.focus();
});

list.addEventListener('change', (event) => {
  if (event.target.name === 'repeat') syncRepeatRequirement(event.target.form);
});

list.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || !event.target.closest('.task-edit-form')) return;
  const row = event.target.closest('.task-row');
  editingId = null;
  render();
  rowFor(row.dataset.id)?.querySelector('.task-edit')?.focus();
});

document.querySelectorAll('.filter').forEach((button) => button.addEventListener('click', () => {
  activeFilter = button.dataset.filter;
  document.querySelectorAll('.filter').forEach((item) => item.classList.toggle('active', item === button));
  viewTitle.textContent = button.querySelector('span').textContent;
  render();
}));
document.querySelector('.task-search').addEventListener('input', (event) => { searchTerm = event.target.value.toLowerCase(); render(); });
tagFilter.addEventListener('change', (event) => { activeTag = event.target.value; render(); });
document.querySelector('.task-sort').addEventListener('change', (event) => { sortBy = event.target.value; render(); });
document.querySelector('.clear-completed').addEventListener('click', () => {
  const before = structuredClone(tasks);
  tasks = tasks.filter((task) => !task.completed);
  save(); render(); showNotice('Completed tasks cleared.', before);
});
document.querySelector('.undo-action').addEventListener('click', () => {
  if (!undoSnapshot) return;
  tasks = undoSnapshot;
  save(); render(); showNotice('Change undone.');
});

document.querySelector('.export-tasks').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), tasks }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `donewell-backup-${today()}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  showNotice('Backup downloaded to this device.');
});

function validateBackup(backup) {
  if (backup?.version !== 1 || !Array.isArray(backup.tasks) || backup.tasks.length > 5000) throw new Error('This is not a supported Donewell backup.');
  const ids = new Set();
  return backup.tasks.map((task) => {
    if (!task || typeof task !== 'object'
      || typeof task.id !== 'string' || !/^[\w-]{1,80}$/.test(task.id) || ids.has(task.id)
      || typeof task.title !== 'string' || !task.title.trim() || task.title.length > 120
      || typeof task.due !== 'string' || (task.due && !validDate(task.due))
      || !priorities.includes(task.priority) || typeof task.completed !== 'boolean'
      || !Number.isFinite(task.created) || task.created < 0
      || (task.notes != null && (typeof task.notes !== 'string' || task.notes.length > 1000))
      || (task.tag != null && (typeof task.tag !== 'string' || task.tag.length > 40))
      || (task.repeat != null && !repeats.includes(task.repeat))
      || (task.repeat && task.repeat !== 'none' && !task.due)) throw new Error('The backup contains an invalid task.');
    ids.add(task.id);
    return { id: task.id, title: task.title, due: task.due, priority: task.priority,
      completed: task.completed, created: task.created, notes: task.notes || '', tag: task.tag || '',
      repeat: task.repeat || 'none', repeatDay: task.repeat === 'monthly' ? (Number.isInteger(task.repeatDay) && task.repeatDay >= 1 && task.repeatDay <= 31 ? task.repeatDay : parseDate(task.due).getDate()) : null };
  });
}

const importFile = document.querySelector('.import-file');
document.querySelector('.import-tasks').addEventListener('click', () => importFile.click());
importFile.addEventListener('change', async () => {
  const file = importFile.files[0];
  if (!file) return;
  try {
    if (file.size > 2_000_000) throw new Error('The backup file is too large.');
    const imported = validateBackup(JSON.parse(await file.text()));
    if (!confirm(`Replace your ${tasks.length} current tasks with ${imported.length} tasks from this backup?`)) return;
    tasks = imported;
    editingId = null;
    save(); render(); showNotice('Backup imported.');
  } catch (error) { showNotice(error instanceof SyntaxError ? 'The backup is not valid JSON.' : error.message); }
  finally { importFile.value = ''; }
});

const now = new Date();
document.querySelector('.todo-date').textContent = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(now);
const updateClock = () => { document.querySelector('.projects-clock').textContent = new Intl.DateTimeFormat('en', { hour: '2-digit', minute: '2-digit' }).format(new Date()); };
updateClock(); setInterval(updateClock, 30000); render();
