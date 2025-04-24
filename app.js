const body = document.querySelector('body');
const addTaskBtn = document.getElementById('addTaskBtn');
const listBox = document.getElementById('listBox');

// Load tasks from localStorage on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
    savedTasks.forEach(task => addTaskToList(task));
});

// Function to add a task to the list
function addTaskToList(taskValue) {
    const listItem = document.createElement('li');
    listItem.innerHTML = taskValue;

    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    deleteBtn.style.marginLeft = '10px';

    deleteBtn.addEventListener('click', () => {
        listBox.removeChild(listItem);
        saveTasksToLocalStorage();
    });

    listItem.appendChild(deleteBtn);
    listBox.appendChild(listItem);
}

// Save tasks to localStorage
function saveTasksToLocalStorage() {
    const tasks = Array.from(listBox.children).map(item => item.firstChild.textContent);
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Add task button click event
addTaskBtn.addEventListener('click', () => {
    const listInput = document.getElementById('listInput');
    const listValue = listInput.value.trim();

    if (listValue) {
        addTaskToList(listValue);
        saveTasksToLocalStorage();
        listInput.value = ""; 
    }
});
