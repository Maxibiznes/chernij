// При завантаженні сторінки встановлюємо мінімальну дату і завантажуємо початкові слоти
window.onload = function() {
  const dateInput = document.getElementById("date");
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  const todayStr = yyyy + '-' + mm + '-' + dd;
  dateInput.setAttribute("min", todayStr);
  updateTimeSlots();
};

// Функція для оновлення списку доступних часових слотів
function updateTimeSlots() {
  const dateInputElem = document.getElementById("date");
  const timeSelectElem = document.getElementById("time");
  timeSelectElem.innerHTML = ""; // Очищення списку слотів

  const selectedDate = dateInputElem.value;
  if (!selectedDate) {
    const option = document.createElement("option");
    option.textContent = "Спочатку оберіть дату";
    option.disabled = true;
    timeSelectElem.appendChild(option);
    return;
  }
  
  const todayStr = new Date().toISOString().split("T")[0];
  let currentMinutes = 0;
  if (selectedDate === todayStr) {
    const now = new Date();
    currentMinutes = now.getHours() * 60 + now.getMinutes();
  }
  
  const url = "https://script.google.com/macros/s/AKfycbx_Sjqds2oIId57hsSTh2tgDTY8NuW6MxoBEYc5g3VhRC9dlumHhch0q1INORNVcoy3/exec?date="
              + selectedDate + "&t=" + new Date().getTime();
  
  fetch(url)
    .then(response => response.json())
    .then(data => {
      const bookedTimes = data.map(row => row[1].trim());
      const allSlots = [
        "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
        "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
        "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
        "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00"
      ];
      
      const bookedSet = new Set(bookedTimes);
      // Обчислюємо недоступні слоти з урахуванням 2-годинного вікна перед і після кожного заброньованого часу
      const unavailableSlots = new Set();
      bookedTimes.forEach(bookedSlot => {
        if (!/^\d{2}:\d{2}$/.test(bookedSlot)) return; // Пропускаємо некоректний час
        const [bookedHour, bookedMinute] = bookedSlot.split(":").map(Number);
        const bookedMinutes = bookedHour * 60 + bookedMinute;
        const startMinutes = bookedMinutes - 120; // 2 години перед
        const endMinutes = bookedMinutes + 120; // 2 години після

        // Додаємо слоти в межах 2-годинного вікна перед і після
        allSlots.forEach(slot => {
          const [hour, minute] = slot.split(":").map(Number);
          const slotMinutes = hour * 60 + minute;
          if (slotMinutes >= startMinutes && slotMinutes <= endMinutes) {
            unavailableSlots.add(slot);
          }
        });
      });

      const availableSlots = allSlots.filter(slot => {
        const [hour, minute] = slot.split(":").map(Number);
        const slotInMinutes = hour * 60 + minute;
        const isPast = (selectedDate === todayStr && slotInMinutes < currentMinutes);
        return (!isPast && !bookedSet.has(slot) && !unavailableSlots.has(slot));
      });
      
      timeSelectElem.innerHTML = "";
      if (availableSlots.length === 0) {
        const option = document.createElement("option");
        option.textContent = "Немає доступних слотів";
        option.disabled = true;
        timeSelectElem.appendChild(option);
      } else {
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "Оберіть час";
        placeholder.disabled = true;
        placeholder.selected = true;
        timeSelectElem.appendChild(placeholder);
        availableSlots.forEach(slot => {
          const option = document.createElement("option");
          option.value = slot;
          option.textContent = slot;
          timeSelectElem.appendChild(option);
        });
      }
    })
    .catch(err => {
      console.error("Помилка отримання записів:", err);
      timeSelectElem.innerHTML = "";
      const option = document.createElement("option");
      option.textContent = "Не вдалося завантажити слоти";
      option.disabled = true;
      timeSelectElem.appendChild(option);
    });
}

// Функція бронювання запису
function bookAppointment() {
  const service = document.getElementById("service").value;
  const date = document.getElementById("date").value;
  const time = document.getElementById("time").value;
  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  
  if (!name || !phone || !date || !time) {
    alert("Будь ласка, заповніть усі поля!");
    return;
  }
  
  if (!/^\+?\d{10,12}$/.test(phone)) {
    alert("Невірний формат телефону. Введіть 10-12 цифр, наприклад, +380123456789.");
    return;
  }
  
  const serviceNames = {
    classic: "Класичний манікюр",
    gel: "Гель-лак",
    design: "Манікюр із дизайном"
  };
  
  const data = {
    action: "create",
    service: serviceNames[service] || service,
    date: date,
    time: time,
    name: name,
    phone: phone
  };
  
  fetch("https://script.google.com/macros/s/AKfycbx_Sjqds2oIId57hsSTh2tgDTY8NuW6MxoBEYc5g3VhRC9dlumHhch0q1INORNVcoy3/exec", {
    method: "POST",
    body: JSON.stringify(data)
  })
  .then(response => response.text())
  .then(result => {
    if (result !== "Success") throw new Error(result);
    document.getElementById("confirmation").textContent =
      `Ви записані на ${data.service} до Оксани Черній на ${date} о ${time}. Дякуємо, ${name}!`;
    document.getElementById("confirmation").style.display = "block";
    document.getElementById("name").value = "";
    document.getElementById("phone").value = "";
    setTimeout(updateTimeSlots, 1000);
  })
  .catch(error => {
    alert("Помилка запису: " + error.message);
    console.error("Помилка запису:", error);
  });
}

// Функції для адмін-панелі
function loginAdmin() {
  const passwordInput = document.getElementById("admin-password");
  const password = passwordInput.value;
  if (password === "admin123") {
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
  
  fields.forEach(field => {
    const isEditable = field.getAttribute("contenteditable") === "true";
    field.setAttribute("contenteditable", !isEditable);
    field.style.backgroundColor = isEditable ? "" : "#f9f9f9";
  });
  
  if (editButton.textContent === "Редагувати") {
    editButton.textContent = "Зберегти";
    editButton.onclick = () => saveChanges(row, originalData);
  } else {
    editButton.textContent = "Редагувати";
    editButton.onclick = () => enableEditing(row, originalData);
  }
}

function saveChanges(row, originalData) {
  const fields = row.querySelectorAll("td:not(:last-child):not(:first-child)");
  const updatedData = [originalData[0]]; // Зберігаємо номер рядка
  fields.forEach(field => updatedData.push(field.textContent.trim()));
  
  if (!/^\d{4}-\d{2}-\d{2}$/.test(updatedData[1])) {
    alert("Невірний формат дати (yyyy-MM-dd).");
    return;
  }
  if (!/^\d{2}:\d{2}$/.test(updatedData[2])) {
    alert("Невірний формат часу (HH:mm).");
    return;
  }
  if (!updatedData[4]) {
    alert("Ім’я не може бути порожнім.");
    return;
  }
  if (!/^\+?\d{10,12}$/.test(updatedData[5])) {
    alert("Невірний формат телефону.");
    return;
  }
  
  const data = {
    action: "update",
    original: originalData.slice(1),
    updated: updatedData.slice(1)
  };
  
  fetch("https://script.google.com/macros/s/AKfycbx_Sjqds2oIId57hsSTh2tgDTY8NuW6MxoBEYc5g3VhRC9dlumHhch0q1INORNVcoy3/exec", {
    method: "POST",
    body: JSON.stringify(data)
  })
  .then(response => response.text())
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
  fetch("https://script.google.com/macros/s/AKfycbx_Sjqds2oIId57hsSTh2tgDTY8NuW6MxoBEYc5g3VhRC9dlumHhch0q1INORNVcoy3/exec")
    .then(response => response.json())
    .then(data => {
      console.log("Отримані дані з сервера:", data); // Дебаг-лог
      const container = document.getElementById("appointments-list");
      container.innerHTML = "";
      
      const table = document.createElement("table");
      table.classList.add("appointments-table");
      
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
      
      const tbody = document.createElement("tbody");
      data.forEach((row, index) => {
        const tr = document.createElement("tr");
        
        const tdIndex = document.createElement("td");
        tdIndex.textContent = index + 1;
        tr.appendChild(tdIndex);
        
        const tdDate = document.createElement("td");
        tdDate.textContent = row[0]; // Дата вже відформатована бекендом
        tr.appendChild(tdDate);
        
        const tdTime = document.createElement("td");
        tdTime.textContent = row[1]; // Час уже відформатований бекендом
        tr.appendChild(tdTime);
        
        const tdService = document.createElement("td");
        tdService.textContent = row[2];
        tr.appendChild(tdService);
        
        const tdName = document.createElement("td");
        tdName.textContent = row[3];
        tr.appendChild(tdName);
        
        const tdPhone = document.createElement("td");
        tdPhone.textContent = row[4];
        tr.appendChild(tdPhone);
        
        const tdActions = document.createElement("td");
        const editButton = document.createElement("button");
        editButton.textContent = "Редагувати";
        editButton.onclick = () => enableEditing(tr, [index + 1, ...row]);
        tdActions.appendChild(editButton);
        tr.appendChild(tdActions);
        
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      container.appendChild(table);
    })
    .catch(error => {
      console.error("Помилка завантаження записів:", error);
      alert("Помилка завантаження записів: " + error.message);
    });
}

document.querySelector("h1").addEventListener("click", () => {
  document.querySelector(".admin-login").style.display = "block";
});
