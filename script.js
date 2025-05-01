// Оголошення констант
const API_URL = "https://script.google.com/macros/s/AKfycbx_Sjqds2oIId57hsSTh2tgDTY8NuW6MxoBEYc5g3VhRC9dlumHhch0q1INORNVcoy3/exec";
const SERVICE_NAMES = {
  classic: "Класичний манікюр",
  gel: "Гель-лак",
  design: "Манікюр із дизайном"
};
const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", 
  "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", 
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00"
];
const ADMIN_PASSWORD = "admin123";
const SESSION_DURATION = 120; // хвилин

// Утилітні функції
function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function timeToMinutes(timeStr) {
  if (!/^\d{2}:\d{2}$/.test(timeStr)) return 0;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

function validatePhone(phone) {
  return /^\+?\d{10,12}$/.test(phone);
}

// При завантаженні сторінки
window.onload = () => {
  initializeDatePicker();
  setupAdminAccess();
};

function initializeDatePicker() {
  const dateInput = document.getElementById("date");
  const today = new Date();
  const todayStr = formatDate(today);
  
  dateInput.setAttribute("min", todayStr);
  
  // Додаємо обробник події change для перевірки дати
  dateInput.addEventListener("change", function() {
    const selectedDate = new Date(this.value);
    const todayDate = new Date(todayStr);
    
    // Скидаємо час для коректного порівняння
    todayDate.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < todayDate) {
      alert("Не можна обирати дати в минулому. Будь ласка, оберіть сьогоднішню або майбутню дату.");
      this.value = "";
    }
    
    updateTimeSlots();
  });
  
  updateTimeSlots();
}

// Функція для оновлення списку доступних часових слотів
function updateTimeSlots() {
  const dateInputElem = document.getElementById("date");
  const timeSelectElem = document.getElementById("time");
  
  // Очищення списку слотів
  timeSelectElem.innerHTML = "";

  const selectedDate = dateInputElem.value;
  if (!selectedDate) {
    appendOption(timeSelectElem, "Спочатку оберіть дату", "", true);
    return;
  }

  const todayStr = formatDate(new Date());
  const isToday = selectedDate === todayStr;
  
  // Отримуємо поточний час в хвилинах, якщо обрана дата - сьогодні
  let currentMinutes = 0;
  if (isToday) {
    const now = new Date();
    currentMinutes = now.getHours() * 60 + now.getMinutes();
  }

  // Додаємо параметр часу для уникнення кешування
  const url = `${API_URL}?date=${selectedDate}&t=${Date.now()}`;

  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      // Відфільтровуємо некоректні записи та отримуємо список зайнятих часів
      const bookedTimes = data
        .filter(row => row && row[1] && typeof row[1] === 'string')
        .map(row => row[1].trim());
      
      const bookedSet = new Set(bookedTimes);
      
      // Обчислюємо недоступні слоти з урахуванням 2-годинного вікна
      const unavailableSlots = calculateUnavailableSlots(bookedTimes);
      
      // Формуємо доступні слоти
      const availableSlots = TIME_SLOTS.filter(slot => {
        const slotInMinutes = timeToMinutes(slot);
        const isPast = isToday && slotInMinutes < currentMinutes;
        return !isPast && !bookedSet.has(slot) && !unavailableSlots.has(slot);
      });

      // Оновлюємо випадаючий список
      populateTimeSelect(timeSelectElem, availableSlots);
    })
    .catch(err => {
      console.error("Помилка отримання записів:", err);
      appendOption(timeSelectElem, "Не вдалося завантажити слоти", "", true);
    });
}

function calculateUnavailableSlots(bookedTimes) {
  const unavailableSlots = new Set();
  
  bookedTimes.forEach(bookedSlot => {
    if (!/^\d{2}:\d{2}$/.test(bookedSlot)) return; // Пропускаємо некоректний час
    
    const bookedMinutes = timeToMinutes(bookedSlot);
    const startMinutes = bookedMinutes - SESSION_DURATION; // 2 години перед
    const endMinutes = bookedMinutes + SESSION_DURATION; // 2 години після

    // Додаємо слоти в межах 2-годинного вікна
    TIME_SLOTS.forEach(slot => {
      const slotMinutes = timeToMinutes(slot);
      if (slotMinutes > startMinutes && slotMinutes < endMinutes) {
        unavailableSlots.add(slot);
      }
    });
  });
  
  return unavailableSlots;
}

function populateTimeSelect(selectElement, availableSlots) {
  selectElement.innerHTML = "";
  
  if (availableSlots.length === 0) {
    appendOption(selectElement, "Оксана весь день зайнята", "", true);
  } else {
    appendOption(selectElement, "Оберіть час", "", true, true);
    
    availableSlots.forEach(slot => {
      appendOption(selectElement, slot, slot);
    });
  }
}

function appendOption(selectElement, text, value, disabled = false, selected = false) {
  const option = document.createElement("option");
  option.textContent = text;
  option.value = value;
  
  if (disabled) option.disabled = true;
  if (selected) option.selected = true;
  
  selectElement.appendChild(option);
}

// Функція бронювання запису
function bookAppointment() {
  const service = document.getElementById("service").value;
  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;
  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();

  // Валідація форми
  if (!name || !phone || !date || !time) {
    alert("Будь ласка, заповніть усі поля!");
    return;
  }

  if (!validatePhone(phone)) {
    alert("Невірний формат телефону. Введіть 10-12 цифр, наприклад, +380123456789.");
    return;
  }

  const data = {
    action: "create",
    service: SERVICE_NAMES[service] || service,
    date: date,
    time: time,
    name: name,
    phone: phone
  };

  sendRequest(data)
    .then(result => {
      if (result !== "Success") throw new Error(result);
      
      // Відображення підтвердження
      const confirmationElement = document.getElementById("confirmation");
      confirmationElement.textContent = 
        `Ви записані на ${data.service} до Оксани Черній на ${date} о ${time}. Дякуємо, ${name}!`;
      confirmationElement.style.display = "block";
      
      // Скидання форми
      document.getElementById("name").value = "";
      document.getElementById("phone").value = "";
      
      // Оновлення доступних часових слотів
      setTimeout(updateTimeSlots, 1000);
    })
    .catch(error => {
      alert("Помилка запису: " + error.message);
      console.error("Помилка запису:", error);
    });
}

// Функції для адмін-панелі
function setupAdminAccess() {
  document.querySelector("h1").addEventListener("click", () => {
    document.querySelector(".admin-login").style.display = "block";
  });
}

function loginAdmin() {
  const passwordInput = document.getElementById("admin-password");
  const password = passwordInput.value;
  
  if (password === ADMIN_PASSWORD) {
    document.querySelector(".admin-login").style.display = "none";
    document.querySelector(".admin-panel").style.display = "block";
    document.getElementById("admin-error").style.display = "none";
    passwordInput.value = "";
    showAppointments();
  } else {
    document.getElementById("admin-error").style.display = "block";
  }
}

function logoutAdmin() {
  document.querySelector(".admin-panel").style.display = "none";
  document.querySelector(".admin-login").style.display = "block";
  document.getElementById("admin-password").value = "";
  document.getElementById("admin-error").style.display = "none";
}

function enableEditing(row, originalData) {
  const fields = row.querySelectorAll("td:not(:last-child):not(:first-child)");
  const editButton = row.querySelector("button");
  const isEditing = editButton.textContent === "Зберегти";

  fields.forEach((field) => {
    field.setAttribute("contenteditable", !isEditing);
    field.style.backgroundColor = isEditing ? "" : "#f9f9f9";
  });

  if (isEditing) {
    // Зберегти режим
    editButton.textContent = "Редагувати";
    editButton.onclick = () => enableEditing(row, originalData);
  } else {
    // Редагувати режим
    editButton.textContent = "Зберегти";
    editButton.onclick = () => saveChanges(row, originalData);
  }
}

function saveChanges(row, originalData) {
  const fields = row.querySelectorAll("td:not(:last-child):not(:first-child)");
  const updatedData = [originalData[0]]; // Зберігаємо номер рядка
  
  fields.forEach((field) => updatedData.push(field.textContent.trim()));

  // Валідація даних
  if (!/^\d{4}-\d{2}-\d{2}$/.test(updatedData[1])) {
    alert("Невірний формат дати (yyyy-MM-dd).");
    return;
  }
  if (!/^\d{2}:\d{2}$/.test(updatedData[2])) {
    alert("Невірний формат часу (HH:mm).");
    return;
  }
  if (!updatedData[4]) {
    alert("Ім'я не може бути порожнім.");
    return;
  }
  if (!validatePhone(updatedData[5])) {
    alert("Невірний формат телефону.");
    return;
  }

  const data = {
    action: "update",
    original: originalData.slice(1),
    updated: updatedData.slice(1)
  };

  sendRequest(data)
    .then(result => {
      if (result !== "Success") throw new Error(result);
      alert("Запис успішно оновлено!");
      showAppointments();
    })
    .catch(error => {
      alert("Помилка оновлення запису: " + error.message);
      console.error("Помилка оновлення запису:", error);
    });
}

function showAppointments() {
  fetch(API_URL)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      const container = document.getElementById("appointments-list");
      container.innerHTML = "";

      // Створення таблиці
      const table = createAppointmentsTable(data);
      container.appendChild(table);
    })
    .catch(error => {
      console.error("Помилка завантаження записів:", error);
      alert("Помилка завантаження записів: " + error.message);
    });
}

function createAppointmentsTable(data) {
  const table = document.createElement("table");
  table.classList.add("appointments-table");

  // Додавання заголовків
  const headers = ["№", "Дата", "Час", "Послуга", "Ім'я", "Телефон", "Дії"];
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  
  headers.forEach(headerText => {
    const th = document.createElement("th");
    th.textContent = headerText;
    headerRow.appendChild(th);
  });
  
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Додавання рядків з даними
  const tbody = document.createElement("tbody");
  
  data.forEach((row, index) => {
    const tr = createAppointmentRow(row, index);
    tbody.appendChild(tr);
  });
  
  table.appendChild(tbody);
  return table;
}

function createAppointmentRow(rowData, index) {
  const tr = document.createElement("tr");
  const rowNumber = index + 1;
  
  // Додавання номера рядка
  const tdIndex = document.createElement("td");
  tdIndex.textContent = rowNumber;
  tr.appendChild(tdIndex);
  
  // Додавання основних полів
  rowData.forEach((cellData, cellIndex) => {
    if (cellIndex <= 4) { // Обмежуємо до 5 полів (дата, час, послуга, ім'я, телефон)
      const td = document.createElement("td");
      td.textContent = cellData;
      tr.appendChild(td);
    }
  });
  
  // Додавання кнопки редагування
  const tdActions = document.createElement("td");
  const editButton = document.createElement("button");
  editButton.textContent = "Редагувати";
  editButton.onclick = () => enableEditing(tr, [rowNumber, ...rowData]);
  tdActions.appendChild(editButton);
  tr.appendChild(tdActions);
  
  return tr;
}

// Функція для відправки запитів
function sendRequest(data) {
  return fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(data)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.text();
  });
}