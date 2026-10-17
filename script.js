/**
 * StudyFlow - Study Task Tracker
 * Beginner-friendly vanilla JavaScript for university students.
 * 
 * Features:
 * - Add, edit, and delete study tasks
 * - Mark tasks as pending or completed
 * - Filter by All, Pending, and Completed
 * - Live statistics: Total, Pending, Completed, and Overdue
 * - Highlight overdue tasks that are still pending
 * - Save & load tasks from localStorage
 * - Safe rendering preventing any HTML/script injection (XSS)
 */

// ==========================================================================
// 1. Application State & LocalStorage Configuration
// ==========================================================================

// The localStorage key used to save our task list
const STORAGE_KEY = 'studyflow_tasks';

// In-memory array holding all task objects
let tasks = [];

// Current filter view: 'all' | 'pending' | 'completed'
let currentFilter = 'all';

// Tracks the ID of the task currently being edited (null when adding a new task)
let editingTaskId = null;

// ==========================================================================
// 2. DOM Element References
// ==========================================================================

const taskForm = document.getElementById('taskForm');
const taskIdInput = document.getElementById('taskIdInput');
const taskTitleInput = document.getElementById('taskTitle');
const taskSubjectInput = document.getElementById('taskSubject');
const taskDeadlineInput = document.getElementById('taskDeadline');
const formHeading = document.getElementById('formHeading');
const formBadge = document.getElementById('formBadge');
const submitBtn = document.getElementById('submitBtn');
const submitBtnText = document.getElementById('submitBtnText');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const formAlert = document.getElementById('formAlert');

const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const emptyStateTitle = document.getElementById('emptyStateTitle');
const emptyStateMessage = document.getElementById('emptyStateMessage');
const addSampleTasksBtn = document.getElementById('addSampleTasksBtn');

// Statistics & Badges
const totalCountEl = document.getElementById('totalCount');
const pendingCountEl = document.getElementById('pendingCount');
const completedCountEl = document.getElementById('completedCount');
const overdueCountEl = document.getElementById('overdueCount');
const overdueCardEl = document.querySelector('.stat-overdue');

// Filter Tab Badges
const filterCountAll = document.getElementById('filterCountAll');
const filterCountPending = document.getElementById('filterCountPending');
const filterCountCompleted = document.getElementById('filterCountCompleted');
const filterTabs = document.querySelectorAll('.filter-tab');

// Current date display in header
const currentDateDisplay = document.getElementById('currentDateDisplay');

// Delete Confirmation Modal
const deleteModal = document.getElementById('deleteModal');
const modalTaskTitle = document.getElementById('modalTaskTitle');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

// Tracks the task ID pending deletion confirmation
let taskToDeleteId = null;

// ==========================================================================
// 3. Storage Functions (Save & Load)
// ==========================================================================

/**
 * Loads tasks saved in browser localStorage.
 * If no data exists, initializes an empty list.
 */
function loadTasksFromStorage() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (rawData) {
      tasks = JSON.parse(rawData);
      // Ensure tasks is an array
      if (!Array.isArray(tasks)) {
        tasks = [];
      }
    } else {
      tasks = [];
    }
  } catch (error) {
    console.error('Failed to load tasks from localStorage:', error);
    tasks = [];
  }
}

/**
 * Saves current tasks array into browser localStorage as a JSON string.
 */
function saveTasksToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Failed to save tasks to localStorage:', error);
    showFormAlert('Failed to save tasks to browser storage.');
  }
}

// ==========================================================================
// 4. Date & Overdue Calculation Helpers
// ==========================================================================

/**
 * Checks whether a task is overdue.
 * Rule: A task is overdue ONLY if it is still pending AND its deadline date has passed.
 * (If deadline is today, it is not overdue yet).
 * 
 * @param {Object} task 
 * @returns {boolean}
 */
function isTaskOverdue(task) {
  if (task.completed || !task.deadline) {
    return false;
  }

  // Get current date normalized to 00:00:00 local time
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Parse YYYY-MM-DD from deadline input to avoid timezone offset issues
  const parts = task.deadline.split('-');
  if (parts.length !== 3) return false;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JS
  const day = parseInt(parts[2], 10);

  const deadlineDate = new Date(year, month, day);
  deadlineDate.setHours(0, 0, 0, 0);

  // If deadline date is strictly before today, it is overdue
  return deadlineDate.getTime() < today.getTime();
}

/**
 * Checks whether a task deadline is scheduled for today.
 * 
 * @param {Object} task 
 * @returns {boolean}
 */
function isTaskDueToday(task) {
  if (task.completed || !task.deadline) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parts = task.deadline.split('-');
  if (parts.length !== 3) return false;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const deadlineDate = new Date(year, month, day);
  deadlineDate.setHours(0, 0, 0, 0);

  return deadlineDate.getTime() === today.getTime();
}

/**
 * Formats a YYYY-MM-DD date string into a friendly, human-readable format.
 * Example: '2026-10-25' -> 'Oct 25, 2026'
 * 
 * @param {string} dateString 
 * @returns {string}
 */
function formatDeadlineDisplay(dateString) {
  if (!dateString) return '';

  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const date = new Date(year, month, day);

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Displays today's formatted date in the application header.
 */
function displayCurrentDate() {
  if (!currentDateDisplay) return;
  const now = new Date();
  currentDateDisplay.textContent = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

// ==========================================================================
// 5. Form Validation & Alert Display
// ==========================================================================

/**
 * Displays an inline validation error message above the form.
 * 
 * @param {string} message 
 */
function showFormAlert(message) {
  formAlert.textContent = message;
  formAlert.style.display = 'block';
}

/**
 * Clears the inline validation error message.
 */
function clearFormAlert() {
  formAlert.textContent = '';
  formAlert.style.display = 'none';
}

/**
 * Validates user input according to the assignment requirements:
 * 1. Title must not be empty or contain only whitespace.
 * 2. Subject must not be empty or contain only whitespace.
 * 3. Deadline must be selected and a valid date string.
 * 
 * @param {string} title 
 * @param {string} subject 
 * @param {string} deadline 
 * @returns {boolean} true if valid, false otherwise
 */
function validateInputs(title, subject, deadline) {
  clearFormAlert();

  if (!title || title.trim() === '') {
    showFormAlert('Please enter a task title. It cannot be blank or spaces only.');
    taskTitleInput.focus();
    return false;
  }

  if (!subject || subject.trim() === '') {
    showFormAlert('Please specify a subject or course name.');
    taskSubjectInput.focus();
    return false;
  }

  if (!deadline || deadline.trim() === '') {
    showFormAlert('Please select a valid deadline date.');
    taskDeadlineInput.focus();
    return false;
  }

  // Verify that the date is a real parseable date
  const parsedDate = new Date(deadline);
  if (isNaN(parsedDate.getTime())) {
    showFormAlert('The selected deadline date is invalid.');
    taskDeadlineInput.focus();
    return false;
  }

  return true;
}

// ==========================================================================
// 6. Task Management: Add, Edit, Delete, Toggle Complete
// ==========================================================================

/**
 * Handles form submission for both adding a new task and updating an existing one.
 * 
 * @param {Event} event 
 */
function handleFormSubmit(event) {
  event.preventDefault();

  const title = taskTitleInput.value;
  const subject = taskSubjectInput.value;
  const deadline = taskDeadlineInput.value;

  // Validate inputs
  if (!validateInputs(title, subject, deadline)) {
    return;
  }

  const trimmedTitle = title.trim();
  const trimmedSubject = subject.trim();

  if (editingTaskId) {
    // EDIT MODE: Update existing task
    const taskIndex = tasks.findIndex(t => t.id === editingTaskId);
    if (taskIndex !== -1) {
      tasks[taskIndex].title = trimmedTitle;
      tasks[taskIndex].subject = trimmedSubject;
      tasks[taskIndex].deadline = deadline;
    }
    cancelEditMode();
  } else {
    // ADD MODE: Create new task object
    const newTask = {
      id: 'task_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      title: trimmedTitle,
      subject: trimmedSubject,
      deadline: deadline,
      completed: false,
      createdAt: new Date().toISOString()
    };

    // Add new task to the beginning of the list
    tasks.unshift(newTask);
    resetForm();
  }

  // Save changes to localStorage and refresh interface
  saveTasksToStorage();
  renderTasks();
}

/**
 * Toggles a task's status between pending and completed.
 * 
 * @param {string} taskId 
 */
function handleToggleComplete(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  task.completed = !task.completed;
  saveTasksToStorage();
  renderTasks();
}

/**
 * Switches the form into edit mode and pre-fills fields with the task's data.
 * 
 * @param {string} taskId 
 */
function handleStartEdit(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  clearFormAlert();
  editingTaskId = task.id;
  taskIdInput.value = task.id;
  taskTitleInput.value = task.title;
  taskSubjectInput.value = task.subject;
  taskDeadlineInput.value = task.deadline;

  // Update UI indicators to show edit mode
  formHeading.textContent = 'Edit Task';
  formBadge.textContent = 'Editing';
  formBadge.classList.add('editing');
  submitBtnText.textContent = 'Save Changes';
  cancelEditBtn.style.display = 'inline-flex';

  // Smoothly scroll to the form card (helpful on smaller mobile screens)
  taskTitleInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
  taskTitleInput.focus();
}

/**
 * Cancels editing mode and restores the form to "Add New Task".
 */
function cancelEditMode() {
  editingTaskId = null;
  resetForm();

  formHeading.textContent = 'Add New Task';
  formBadge.textContent = 'New';
  formBadge.classList.remove('editing');
  submitBtnText.textContent = 'Add Task';
  cancelEditBtn.style.display = 'none';
  clearFormAlert();
}

/**
 * Resets form input values.
 */
function resetForm() {
  taskIdInput.value = '';
  taskTitleInput.value = '';
  taskSubjectInput.value = '';
  taskDeadlineInput.value = '';
}

/**
 * Asks for confirmation before deleting a task.
 * Displays an accessible modal with the task's title and cancel/confirm buttons.
 * 
 * @param {string} taskId 
 */
function handleDeleteTask(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  taskToDeleteId = task.id;
  modalTaskTitle.textContent = task.title;
  deleteModal.style.display = 'flex';
  cancelDeleteBtn.focus();
}

/**
 * Closes the delete confirmation modal without deleting.
 */
function closeDeleteModal() {
  taskToDeleteId = null;
  deleteModal.style.display = 'none';
}

/**
 * Confirms and executes task deletion.
 */
function confirmDeleteTask() {
  if (!taskToDeleteId) return;

  const id = taskToDeleteId;
  // Remove the task from the array
  tasks = tasks.filter(t => t.id !== id);

  // If we were currently editing the deleted task, cancel edit mode
  if (editingTaskId === id) {
    cancelEditMode();
  }

  saveTasksToStorage();
  closeDeleteModal();
  renderTasks();
}

/**
 * Sets current filter ('all', 'pending', or 'completed') and updates list view.
 * 
 * @param {string} filterName 
 */
function handleFilterChange(filterName) {
  currentFilter = filterName;

  // Update active class on filter tabs
  filterTabs.forEach(tab => {
    const isActive = tab.getAttribute('data-filter') === filterName;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  renderTasks();
}

// ==========================================================================
// 7. Rendering & Safe DOM Generation
// ==========================================================================

/**
 * Recalculates and updates task counters across statistics cards and tabs.
 */
function updateStatistics() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;
  const overdue = tasks.filter(t => isTaskOverdue(t)).length;

  totalCountEl.textContent = total;
  pendingCountEl.textContent = pending;
  completedCountEl.textContent = completed;
  overdueCountEl.textContent = overdue;

  // Tab badges
  filterCountAll.textContent = total;
  filterCountPending.textContent = pending;
  filterCountCompleted.textContent = completed;

  // Highlight overdue card if there are overdue pending tasks
  if (overdue > 0) {
    overdueCardEl.classList.add('has-overdue');
  } else {
    overdueCardEl.classList.remove('has-overdue');
  }
}

/**
 * Renders the filtered list of tasks to the DOM.
 * All user text is rendered safely using textContent to prevent XSS.
 */
function renderTasks() {
  updateStatistics();

  // Clear existing items in list
  taskList.innerHTML = '';

  // Filter tasks based on the active tab
  let filteredTasks = tasks;
  if (currentFilter === 'pending') {
    filteredTasks = tasks.filter(t => !t.completed);
  } else if (currentFilter === 'completed') {
    filteredTasks = tasks.filter(t => t.completed);
  }

  // Handle Empty State
  if (filteredTasks.length === 0) {
    taskList.style.display = 'none';
    emptyState.style.display = 'block';

    if (tasks.length === 0) {
      emptyStateTitle.textContent = 'No study tasks yet';
      emptyStateMessage.textContent = 'Add your first task above with a subject and deadline to stay on top of your semester!';
      addSampleTasksBtn.style.display = 'inline-flex';
    } else if (currentFilter === 'pending') {
      emptyStateTitle.textContent = 'All caught up!';
      emptyStateMessage.textContent = 'You have no pending tasks right now. Great job!';
      addSampleTasksBtn.style.display = 'none';
    } else if (currentFilter === 'completed') {
      emptyStateTitle.textContent = 'No completed tasks';
      emptyStateMessage.textContent = 'Check off tasks as you finish them to see them archived here.';
      addSampleTasksBtn.style.display = 'none';
    }
    return;
  }

  taskList.style.display = 'flex';
  emptyState.style.display = 'none';

  // Build task list items safely
  filteredTasks.forEach(task => {
    const taskLi = document.createElement('li');
    taskLi.className = 'task-item';
    taskLi.dataset.taskId = task.id;

    const overdue = isTaskOverdue(task);
    const dueToday = isTaskDueToday(task);

    if (task.completed) {
      taskLi.classList.add('is-completed');
    } else if (overdue) {
      taskLi.classList.add('is-overdue');
    }

    // 1. Checkbox container
    const checkboxContainer = document.createElement('div');
    checkboxContainer.className = 'task-checkbox-container';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.setAttribute('aria-label', `Mark "${task.title}" as ${task.completed ? 'pending' : 'completed'}`);
    checkbox.addEventListener('change', () => handleToggleComplete(task.id));

    checkboxContainer.appendChild(checkbox);

    // 2. Task Content (Title & Badges)
    const contentDiv = document.createElement('div');
    contentDiv.className = 'task-content';

    const headerRow = document.createElement('div');
    headerRow.className = 'task-header-row';

    const titleEl = document.createElement('h3');
    titleEl.className = 'task-title';
    // SAFE: Uses textContent to avoid HTML injection
    titleEl.textContent = task.title;

    headerRow.appendChild(titleEl);

    // Badges Row
    const metaDiv = document.createElement('div');
    metaDiv.className = 'task-meta';

    // Subject Badge
    const subjectBadge = document.createElement('span');
    subjectBadge.className = 'badge badge-subject';
    subjectBadge.textContent = task.subject;
    metaDiv.appendChild(subjectBadge);

    // Deadline & Status Badge
    if (task.completed) {
      const completedBadge = document.createElement('span');
      completedBadge.className = 'badge badge-completed';
      completedBadge.textContent = '✓ Completed';
      metaDiv.appendChild(completedBadge);
    } else if (overdue) {
      const overdueBadge = document.createElement('span');
      overdueBadge.className = 'badge badge-overdue';
      overdueBadge.textContent = `⚠ Overdue: ${formatDeadlineDisplay(task.deadline)}`;
      metaDiv.appendChild(overdueBadge);
    } else if (dueToday) {
      const todayBadge = document.createElement('span');
      todayBadge.className = 'badge badge-today';
      todayBadge.textContent = '⏰ Due Today';
      metaDiv.appendChild(todayBadge);
    } else {
      const deadlineBadge = document.createElement('span');
      deadlineBadge.className = 'badge badge-deadline';
      deadlineBadge.textContent = `📅 Due: ${formatDeadlineDisplay(task.deadline)}`;
      metaDiv.appendChild(deadlineBadge);
    }

    contentDiv.appendChild(headerRow);
    contentDiv.appendChild(metaDiv);

    // 3. Action Buttons (Edit and Delete)
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'task-actions';

    // Edit Button
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'icon-btn';
    editBtn.title = 'Edit task';
    editBtn.setAttribute('aria-label', `Edit "${task.title}"`);
    editBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
      </svg>
    `;
    editBtn.addEventListener('click', () => handleStartEdit(task.id));

    // Delete Button
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'icon-btn delete-btn';
    deleteBtn.title = 'Delete task';
    deleteBtn.setAttribute('aria-label', `Delete "${task.title}"`);
    deleteBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line>
        <line x1="14" y1="11" x2="14" y2="17"></line>
      </svg>
    `;
    deleteBtn.addEventListener('click', () => handleDeleteTask(task.id));

    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);

    // Assemble Item
    taskLi.appendChild(checkboxContainer);
    taskLi.appendChild(contentDiv);
    taskLi.appendChild(actionsDiv);

    taskList.appendChild(taskLi);
  });
}

// ==========================================================================
// 8. Sample Tasks Initializer (Optional Helper for University Students)
// ==========================================================================

/**
 * Loads a few realistic university study tasks so the user can see how the tracker looks.
 */
function loadSampleTasks() {
  const today = new Date();

  // Create formatted dates relative to today
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 2);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 3);

  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  const formatDateYMD = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  tasks = [
    {
      id: 'sample_1',
      title: 'Submit Lab Report on Binary Search Trees',
      subject: 'Computer Science',
      deadline: formatDateYMD(yesterday), // Demonstrates overdue functionality!
      completed: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'sample_2',
      title: 'Read Chapters 4 & 5 for Midterm Review',
      subject: 'Calculus II',
      deadline: formatDateYMD(tomorrow),
      completed: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'sample_3',
      title: 'Prepare Slide Deck for Group Presentation',
      subject: 'Economics 101',
      deadline: formatDateYMD(nextWeek),
      completed: true,
      createdAt: new Date().toISOString()
    }
  ];

  saveTasksToStorage();
  renderTasks();
}

// ==========================================================================
// 9. Event Listeners & Application Initialization
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Show today's date in header
  displayCurrentDate();

  // Load existing tasks from storage
  loadTasksFromStorage();

  // Initial render
  renderTasks();

  // Listen to form submit
  taskForm.addEventListener('submit', handleFormSubmit);

  // Listen to cancel edit button
  cancelEditBtn.addEventListener('click', cancelEditMode);

  // Clear validation alert when user types in inputs
  taskTitleInput.addEventListener('input', clearFormAlert);
  taskSubjectInput.addEventListener('input', clearFormAlert);
  taskDeadlineInput.addEventListener('change', clearFormAlert);

  // Filter tabs click handlers
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const filter = tab.getAttribute('data-filter');
      handleFilterChange(filter);
    });
  });

  // Load sample tasks button on empty state
  if (addSampleTasksBtn) {
    addSampleTasksBtn.addEventListener('click', loadSampleTasks);
  }

  // Delete modal event listeners
  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  }
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', confirmDeleteTask);
  }
  if (deleteModal) {
    // Close modal if user clicks the dark backdrop outside the card
    deleteModal.addEventListener('click', (event) => {
      if (event.target === deleteModal) {
        closeDeleteModal();
      }
    });
  }

  // Close modal when pressing the Escape key
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && deleteModal && deleteModal.style.display === 'flex') {
      closeDeleteModal();
    }
  });
});
