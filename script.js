const todoInput = document.getElementById("todoInput");
const priorityInput = document.getElementById("priorityInput");
const dueDateInput = document.getElementById("dueDateInput");
const addBtn = document.getElementById("addBtn");
const todoList = document.getElementById("todoList");
const todoCount = document.getElementById("todoCount");
const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");
const emptyMessage = document.getElementById("emptyMessage");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const clearCompletedBtn = document.getElementById("clearCompletedBtn");
const clearAllBtn = document.getElementById("clearAllBtn");
const filterButtons = document.querySelectorAll(".filter-btn");

const STORAGE_KEY = "todo-list-data";
const PRIORITY_LABEL = { high: "높음", medium: "중간", low: "낮음" };
const PRIORITY_WEIGHT = { high: 3, medium: 2, low: 1 };

let todos = loadTodos();
let currentFilter = "all";
let keyword = "";
let sortType = "newest";
let editingId = null;

function loadTodos() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item.text === "string")
      .map((item) => ({
        id: item.id || Date.now() + Math.random(),
        text: item.text,
        done: Boolean(item.done),
        priority: item.priority || "medium",
        dueDate: item.dueDate || "",
        createdAt: item.createdAt || Date.now()
      }));
  } catch {
    return [];
  }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

const isOverdue = (todo) => {
  if (!todo.dueDate || todo.done) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(todo.dueDate) < today;
};

const addTodo = (text, priority, dueDate) => {
  todos.push({
    id: Date.now() + Math.random(),
    text,
    done: false,
    priority,
    dueDate,
    createdAt: Date.now()
  });
  saveTodos();
  renderTodos();
};

const toggleTodo = (id) => {
  todos = todos.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo));
  saveTodos();
  renderTodos();
};

const deleteTodo = (id) => {
  todos = todos.filter((todo) => todo.id !== id);
  saveTodos();
  renderTodos();
};

const editTodo = (id, nextText) => {
  const text = nextText.trim();
  if (!text) {
    editingId = null;
    renderTodos();
    return;
  }
  todos = todos.map((todo) => (todo.id === id ? { ...todo, text } : todo));
  editingId = null;
  saveTodos();
  renderTodos();
};

const clearCompleted = () => {
  todos = todos.filter((todo) => !todo.done);
  saveTodos();
  renderTodos();
};

const clearAll = () => {
  if (!todos.length) return;
  if (!confirm("전체 항목을 모두 비울까요?")) return;
  todos = [];
  saveTodos();
  renderTodos();
};

const applyFilterSearchSort = () => {
  let list = [...todos];

  if (currentFilter === "active") list = list.filter((todo) => !todo.done);
  if (currentFilter === "done") list = list.filter((todo) => todo.done);

  if (keyword) {
    const lower = keyword.toLowerCase();
    list = list.filter((todo) => todo.text.toLowerCase().includes(lower));
  }

  if (sortType === "oldest") {
    list.sort((a, b) => a.createdAt - b.createdAt);
  } else if (sortType === "priority") {
    list.sort((a, b) => PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]);
  } else if (sortType === "dueDate") {
    list.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });
  } else {
    list.sort((a, b) => b.createdAt - a.createdAt);
  }

  return list;
};

const updateSummary = () => {
  const total = todos.length;
  const done = todos.filter((todo) => todo.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const overdue = todos.filter((todo) => isOverdue(todo)).length;
  todoCount.textContent = `총 ${total}개 / 완료 ${done}개 / 지연 ${overdue}개`;
  progressText.textContent = `완료율 ${pct}%`;
  progressFill.style.width = `${pct}%`;
};

const renderTodos = () => {
  todoList.innerHTML = "";
  const visibleTodos = applyFilterSearchSort();
  updateSummary();

  emptyMessage.hidden = visibleTodos.length > 0;
  todoList.hidden = visibleTodos.length === 0;

  if (!todos.length) {
    emptyMessage.textContent = "아직 등록된 할 일이 없습니다.";
  } else if (!visibleTodos.length) {
    emptyMessage.textContent = "조건에 맞는 할 일이 없습니다.";
  }

  filterButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === currentFilter);
  });

  visibleTodos.forEach((todo) => {
    const li = document.createElement("li");
    li.className = `todo-item ${todo.done ? "done" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.done;
    checkbox.addEventListener("change", () => toggleTodo(todo.id));

    const mainWrap = document.createElement("div");
    mainWrap.className = "todo-main";

    if (editingId === todo.id) {
      const editInput = document.createElement("input");
      editInput.type = "text";
      editInput.className = "edit-input";
      editInput.value = todo.text;
      editInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") editTodo(todo.id, editInput.value);
        if (event.key === "Escape") {
          editingId = null;
          renderTodos();
        }
      });
      mainWrap.appendChild(editInput);
      setTimeout(() => {
        editInput.focus();
        editInput.select();
      }, 0);
    } else {
      const textSpan = document.createElement("span");
      textSpan.className = "todo-text";
      textSpan.textContent = todo.text;

      const meta = document.createElement("span");
      meta.className = "todo-meta";

      const pTag = document.createElement("span");
      pTag.className = `tag ${todo.priority}`;
      pTag.textContent = `우선순위 ${PRIORITY_LABEL[todo.priority]}`;
      meta.appendChild(pTag);

      if (todo.dueDate) {
        const dTag = document.createElement("span");
        dTag.className = `tag ${isOverdue(todo) ? "overdue" : ""}`;
        dTag.textContent = isOverdue(todo) ? `지연 ${todo.dueDate}` : `마감 ${todo.dueDate}`;
        meta.appendChild(dTag);
      }

      mainWrap.append(meta, textSpan);
    }

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "edit-btn";
    editButton.textContent = editingId === todo.id ? "저장" : "수정";
    editButton.addEventListener("click", () => {
      if (editingId === todo.id) {
        const editInput = li.querySelector(".edit-input");
        editTodo(todo.id, editInput ? editInput.value : todo.text);
      } else {
        editingId = todo.id;
        renderTodos();
      }
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-btn";
    deleteButton.textContent = "삭제";
    deleteButton.addEventListener("click", () => deleteTodo(todo.id));

    li.append(checkbox, mainWrap, editButton, deleteButton);
    todoList.appendChild(li);
  });
};

const submitTodo = () => {
  const text = todoInput.value.trim();
  if (!text) {
    todoInput.focus();
    return;
  }
  addTodo(text, priorityInput.value, dueDateInput.value);
  todoInput.value = "";
  dueDateInput.value = "";
  priorityInput.value = "medium";
  todoInput.focus();
};

addBtn.addEventListener("click", submitTodo);
todoInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") submitTodo();
});

searchInput.addEventListener("input", (event) => {
  keyword = event.target.value.trim();
  renderTodos();
});

sortSelect.addEventListener("change", (event) => {
  sortType = event.target.value;
  renderTodos();
});

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentFilter = btn.dataset.filter;
    editingId = null;
    renderTodos();
  });
});

clearCompletedBtn.addEventListener("click", clearCompleted);
clearAllBtn.addEventListener("click", clearAll);

renderTodos();
