# StudyFlow 🎓 &bull; University Study Task Tracker

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Vanilla JS](https://img.shields.io/badge/Vanilla-JavaScript-f7df1e?logo=javascript&logoColor=black)](script.js)
[![HTML5](https://img.shields.io/badge/HTML5-Modern-e34f26?logo=html5&logoColor=white)](index.html)
[![CSS3](https://img.shields.io/badge/CSS3-Modern_Design-1572b6?logo=css3&logoColor=white)](style.css)

> A modern, beginner-friendly **Study Task Tracker** built for university students to manage assignments, coursework deadlines, and daily study goals.

---

## 🌟 Features

* 📝 **Task Management**: Create study tasks with a title, subject/course name, and deadline date.
* ✏️ **Edit & Update**: Inline form edit mode with pre-filled fields and change cancellation.
* 🗑️ **Safe Deletion**: Accessible confirmation modal dialog displaying the task title before permanent removal.
* ⏰ **Overdue Detection**: Automatically flags overdue pending tasks once their deadline date has passed, featuring a prominent red accent and alert badge.
* 📊 **Live Academic Statistics**: Real-time summary cards displaying **Total**, **Pending**, **Completed**, and **Overdue** task counters.
* 🔍 **Smart Filters**: Easily toggle between **All**, **Pending**, and **Completed** tasks with dynamic count badges on each tab.
* 💾 **LocalStorage Persistence**: Automatically saves and restores tasks upon browser reload without any external database.
* 🛡️ **Safe Text Rendering**: All user-entered strings are safely handled via `textContent` to prevent script and HTML injection (XSS).
* 📱 **Responsive & Modern Design**: Clean light layout with royal blue accents, rounded cards, smooth hover micro-interactions, and mobile-friendly controls.
* 💡 **Empty State & Sample Tasks**: Clean empty state graphics with a one-click button to load sample academic tasks.

---

## 📂 Project Structure

```text
Study-Task-Tracker/
├── index.html        # Semantic HTML5 layout, stats cards, form, and modals
├── style.css         # Modern CSS3 design system, responsive grid & animations
├── script.js         # Core vanilla JS logic, state management & storage
├── .gitignore        # Git ignore rules for clean repository hygiene
├── LICENSE           # MIT open source license
└── README.md         # Comprehensive project documentation
```

---

## 🚀 Getting Started

No installations, build steps, or backend servers are required.

### Option 1: Open Directly in Browser
1. Clone or download this repository:
   ```bash
   git clone https://github.com/DilumindaPeiris/Study-Task-Tracker.git
   ```
2. Double-click `index.html` to open it directly in Google Chrome, Microsoft Edge, Mozilla Firefox, or Safari.

### Option 2: Run with a Local Static Server
If you prefer running via `localhost`:

```bash
# Using Node.js
npx serve . -l 3000

# Or using Python 3
python -m http.server 8000
```
Then visit `http://localhost:3000` or `http://localhost:8000` in your browser.

---

## 🧠 Key Implementation Details

### Overdue Date Logic
A task is marked as overdue only if:
1. It is **not completed** (`completed === false`), AND
2. Its deadline date is strictly before the start of today (`deadlineDate < todayStartOfDay`).
Deadlines scheduled for today are flagged as **⏰ Due Today** and only transition to overdue the following day.

### Safe DOM Manipulation
User inputs are rendered strictly using `document.createElement()` and `textContent` rather than `innerHTML`, ensuring complete protection against Cross-Site Scripting (XSS).

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 👤 Author

**Diluminda Peiris**
* GitHub: [@DilumindaPeiris](https://github.com/DilumindaPeiris)
