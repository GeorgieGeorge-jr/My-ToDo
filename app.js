document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const body = document.querySelector('body');
    const addTaskBtn = document.getElementById('addTaskBtn');
    const listBox = document.getElementById('listBox');
    const completedBox = document.getElementById('completedBox');
    const historyBox = document.getElementById('historyBox');
    const listInput = document.getElementById('listInput');
    const taskDate = document.getElementById('taskDate');
    const taskTime = document.getElementById('taskTime');
    const setReminder = document.getElementById('setReminder');
    const reminderRepeat = document.getElementById('reminderRepeat');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const reminderAlarm = document.getElementById('reminderAlarm');
    
    // Set min date to today
    const today = new Date().toISOString().split('T')[0];
    taskDate.min = today;
    taskDate.value = today;
    
    // Enable/disable reminder repeat based on checkbox
    setReminder.addEventListener('change', () => {
        reminderRepeat.disabled = !setReminder.checked;
    });
    
    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
        });
    });
    
    // Load tasks from localStorage on page load
    const savedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const savedCompleted = JSON.parse(localStorage.getItem('completedTasks')) || [];
    const savedHistory = JSON.parse(localStorage.getItem('taskHistory')) || [];
    
    savedTasks.forEach(task => addTaskToList(task, false));
    savedCompleted.forEach(task => addTaskToList(task, true));
    savedHistory.forEach(history => addToHistory(history));
    
    // Initialize drag and drop
    initSortable();
    
    // Check for reminders every minute
    setInterval(checkReminders, 60000);
    
    // Add task button click event
    addTaskBtn.addEventListener('click', addNewTask);
    
    // Add task on Enter key
    listInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addNewTask();
        }
    });
    
    function addNewTask() {
        const taskValue = listInput.value.trim();
        const dateValue = taskDate.value;
        const timeValue = taskTime.value || '23:59'; // Default to end of day if no time specified
        const hasReminder = setReminder.checked;
        const repeatOption = reminderRepeat.value;
        
        if (taskValue) {
            const task = {
                id: Date.now(),
                text: taskValue,
                date: dateValue,
                time: timeValue,
                reminder: hasReminder,
                repeat: repeatOption,
                completed: false,
                createdAt: new Date().toISOString()
            };
            
            addTaskToList(task, false);
            saveTasksToLocalStorage();
            
            // Reset form
            listInput.value = "";
            taskDate.value = today;
            taskTime.value = "";
            setReminder.checked = false;
            reminderRepeat.disabled = true;
            reminderRepeat.value = "none";
            
            // Add to history
            addToHistory({
                action: 'added',
                task: taskValue,
                timestamp: new Date().toISOString()
            });
        }
    }
    
    // Function to add a task to the list
    function addTaskToList(taskData, isCompleted) {
        const listItem = document.createElement('li');
        listItem.dataset.id = taskData.id;
        listItem.dataset.date = taskData.date;
        listItem.dataset.time = taskData.time;
        
        // Format date and time for display
        const taskDate = new Date(`${taskData.date}T${taskData.time}`);
        const now = new Date();
        const isOverdue = !isCompleted && taskDate < now;
        
        const dueDateText = formatDueDate(taskData.date, taskData.time);
        
        listItem.innerHTML = `
            <div class="task-content">
                <div>${taskData.text}</div>
                <div class="task-details">
                    Due: ${dueDateText}
                    ${taskData.reminder ? ' <i class="fas fa-bell" title="Reminder set"></i>' : ''}
                    ${isOverdue ? ' <span class="overdue">(Overdue)</span>' : ''}
                </div>
            </div>
            <div class="task-actions">
                <button class="edit-btn" title="Edit"><i class="fas fa-edit"></i></button>
                <button class="complete-btn" title="${isCompleted ? 'Uncomplete' : 'Complete'}">
                    <i class="fas ${isCompleted ? 'fa-undo' : 'fa-check'}"></i>
                </button>
                <button class="delete-btn" title="Delete"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        
        if (isCompleted) {
            listItem.classList.add('completed');
            completedBox.appendChild(listItem);
        } else {
            listBox.appendChild(listItem);
        }
        
        // Set up event listeners for the buttons
        listItem.querySelector('.edit-btn').addEventListener('click', () => editTask(listItem, taskData));
        listItem.querySelector('.complete-btn').addEventListener('click', () => toggleComplete(listItem, taskData));
        listItem.querySelector('.delete-btn').addEventListener('click', () => deleteTask(listItem, taskData));
    }
    
    function formatDueDate(dateStr, timeStr) {
        const taskDate = new Date(`${dateStr}T${timeStr}`);
        const now = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(now.getDate() + 1);
        
        // Check if it's today
        if (taskDate.toDateString() === now.toDateString()) {
            return `Today at ${taskDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})`;
        }
        // Check if it's tomorrow
        else if (taskDate.toDateString() === tomorrow.toDateString()) {
            return `Tomorrow at ${taskDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})`;
        }
        // Otherwise show full date
        else {
            return taskDate.toLocaleString([], {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute:'2-digit'
            });
        }
    }
    
    function editTask(listItem, taskData) {
        const taskText = listItem.querySelector('.task-content div').textContent;
        listInput.value = taskText;
        taskDate.value = taskData.date;
        taskTime.value = taskData.time;
        setReminder.checked = taskData.reminder;
        reminderRepeat.disabled = !taskData.reminder;
        if (taskData.reminder) {
            reminderRepeat.value = taskData.repeat || 'none';
        }
        
        // Remove the task being edited
        if (listItem.parentElement === listBox) {
            listBox.removeChild(listItem);
        } else {
            completedBox.removeChild(listItem);
        }
        
        // Update tasks in localStorage
        saveTasksToLocalStorage();
        
        // Add to history
        addToHistory({
            action: 'edited',
            task: taskText,
            timestamp: new Date().toISOString()
        });
        
        // Focus the input
        listInput.focus();
    }
    
    function toggleComplete(listItem, taskData) {
        const isCompleted = listItem.classList.contains('completed');
        
        if (isCompleted) {
            // Move to active tasks
            listItem.classList.remove('completed');
            listBox.appendChild(listItem);
            taskData.completed = false;
            
            // Update complete button
            listItem.querySelector('.complete-btn').innerHTML = '<i class="fas fa-check"></i>';
            listItem.querySelector('.complete-btn').title = 'Complete';
            
            // Add to history
            addToHistory({
                action: 'uncompleted',
                task: taskData.text,
                timestamp: new Date().toISOString()
            });
        } else {
            // Move to completed tasks
            listItem.classList.add('completed');
            completedBox.appendChild(listItem);
            taskData.completed = true;
            taskData.completedAt = new Date().toISOString();
            
            // Update complete button
            listItem.querySelector('.complete-btn').innerHTML = '<i class="fas fa-undo"></i>';
            listItem.querySelector('.complete-btn').title = 'Uncomplete';
            
            // Add to history
            addToHistory({
                action: 'completed',
                task: taskData.text,
                timestamp: new Date().toISOString()
            });
        }
        
        saveTasksToLocalStorage();
    }
    
    function deleteTask(listItem, taskData) {
        if (listItem.parentElement === listBox) {
            listBox.removeChild(listItem);
        } else {
            completedBox.removeChild(listItem);
        }
        
        saveTasksToLocalStorage();
        
        // Add to history
        addToHistory({
            action: 'deleted',
            task: taskData.text,
            timestamp: new Date().toISOString()
        });
    }
    
    function addToHistory(historyItem) {
        const historyElement = document.createElement('div');
        historyElement.className = 'history-item';
        
        const actionIcon = {
            added: 'fa-plus-circle',
            edited: 'fa-edit',
            completed: 'fa-check-circle',
            uncompleted: 'fa-redo',
            deleted: 'fa-trash-alt'
        }[historyItem.action];
        
        historyElement.innerHTML = `
            <div><i class="fas ${actionIcon}"></i> Task ${historyItem.action}: <span class="task-name">${historyItem.task}</span></div>
            <div class="timestamp">${new Date(historyItem.timestamp).toLocaleString()}</div>
        `;
        
        historyBox.insertBefore(historyElement, historyBox.firstChild);
        
        // Save to localStorage
        const savedHistory = JSON.parse(localStorage.getItem('taskHistory')) || [];
        savedHistory.unshift(historyItem);
        localStorage.setItem('taskHistory', JSON.stringify(savedHistory.slice(0, 100))); // Keep only last 100 items
    }
    
    // Save tasks to localStorage
    function saveTasksToLocalStorage() {
        const tasks = Array.from(listBox.children).map(item => {
            return {
                id: item.dataset.id,
                text: item.querySelector('.task-content div').textContent,
                date: item.dataset.date,
                time: item.dataset.time,
                reminder: item.querySelector('.fa-bell') !== null,
                repeat: 'none', // This would need to be stored in dataset
                completed: false,
                createdAt: new Date().toISOString()
            };
        });
        
        const completedTasks = Array.from(completedBox.children).map(item => {
            return {
                id: item.dataset.id,
                text: item.querySelector('.task-content div').textContent,
                date: item.dataset.date,
                time: item.dataset.time,
                reminder: item.querySelector('.fa-bell') !== null,
                repeat: 'none', // This would need to be stored in dataset
                completed: true,
                createdAt: new Date().toISOString(),
                completedAt: new Date().toISOString()
            };
        });
        
        localStorage.setItem('tasks', JSON.stringify(tasks));
        localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
    }
    
    // Initialize drag and drop sorting
    function initSortable() {
        let draggedItem = null;
        
        // Add event listeners for drag and drop
        document.querySelectorAll('.sortable li').forEach(item => {
            item.setAttribute('draggable', true);
            
            item.addEventListener('dragstart', () => {
                draggedItem = item;
                setTimeout(() => item.classList.add('sortable-ghost'), 0);
            });
            
            item.addEventListener('dragend', () => {
                item.classList.remove('sortable-ghost');
            });
        });
        
        document.querySelectorAll('.sortable').forEach(list => {
            list.addEventListener('dragover', e => {
                e.preventDefault();
                const afterElement = getDragAfterElement(list, e.clientY);
                if (afterElement == null) {
                    list.appendChild(draggedItem);
                } else {
                    list.insertBefore(draggedItem, afterElement);
                }
            });
        });
    }
    
    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('li:not(.sortable-ghost)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    
    // Check for due reminders
    function checkReminders() {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        // Get all tasks with reminders
        const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        
        tasks.forEach(task => {
            if (task.reminder) {
                const taskDate = new Date(`${task.date}T${task.time}`);
                const taskTime = taskDate.getHours() * 60 + taskDate.getMinutes();
                
                // Check if it's time for the reminder (within 1 minute window)
                if (Math.abs(currentTime - taskTime) <= 1 && now.toDateString() === taskDate.toDateString()) {
                    showReminder(task);
                }
            }
        });
    }
    
    function showReminder(task) {
        // Play alarm sound
        reminderAlarm.play();
        
        // Show notification
        if (Notification.permission === 'granted') {
            new Notification(`Reminder: ${task.text}`, {
                body: `This task is due now!`,
                icon: 'https://cdn-icons-png.flaticon.com/512/3652/3652191.png'
            });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification(`Reminder: ${task.text}`, {
                        body: `This task is due now!`,
                        icon: 'https://cdn-icons-png.flaticon.com/512/3652/3652191.png'
                    });
                }
            });
        }
        
        // Repeat if needed
        if (task.repeat === 'daily') {
            // For simplicity, we'll just update the date for the next day
            // In a real app, you'd want a more robust scheduling system
            const nextDay = new Date(`${task.date}T${task.time}`);
            nextDay.setDate(nextDay.getDate() + 1);
            
            // Update the task in localStorage
            const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            const updatedTasks = tasks.map(t => {
                if (t.id === task.id) {
                    return {
                        ...t,
                        date: nextDay.toISOString().split('T')[0]
                    };
                }
                return t;
            });
            localStorage.setItem('tasks', JSON.stringify(updatedTasks));
        }
    }
    
    // Request notification permission on page load
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
});