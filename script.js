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
  
  const url = "https://script.google.com/macros/s/AKfycbx_Sjqds2oIId57hsSTh2tgDTY8NuW6MxoBEYc5g3VhRC9dlumHhch0q1INORNVcoy3/exec?date=" + selectedDate + "&t=" + new Date().getTime();
  
  fetch(url)
    .then(response => {
      if (!response.ok) throw new Error("Сервер повернув помилку: " + response.status);
      return response.json();
    })
    .then(data => {
      console.log("Отримані дані:", data);
      const bookedTimes = data.map(row => row[1].trim());
      console.log("Заброньовані часи:", bookedTimes);
      
      const allSlots = [
        "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
        "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
        "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
        "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00"
      ];
      
      const bookedSet = new Set(bookedTimes);
      const blockedSlots = new Set();
      
      // Додаємо до blockedSlots слоти, які йдуть протягом 2 годин після заброньованих
      bookedTimes.forEach(bookedTime => {
        const [hour, minute] = bookedTime.split(":").map(Number);
        const bookedMinutes = hour * 60 + minute;
        for (let i = 1; i <= 4; i++) { // 4 слоти по 30 хвилин = 2 години
          const nextMinutes = bookedMinutes + i * 30;
          const nextHour = Math.floor(nextMinutes / 60);
          const nextMinute = nextMinutes % 60;
          const nextSlot = `${nextHour.toString().padStart(2, '0')}:${nextMinute.toString().padStart(2, '0')}`;
          if (allSlots.includes(nextSlot)) {
            blockedSlots.add(nextSlot);
          }
        }
      });
      
      // Оновлюємо select: показуємо всі слоти, але заброньовані/заблоковані — неактивні
      timeSelectElem.innerHTML = "";
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "Оберіть час";
      placeholder.disabled = true;
      placeholder.selected = true;
      timeSelectElem.appendChild(placeholder);
      
      allSlots.forEach(slot => {
        const [hour, minute] = slot.split(":").map(Number);
        const slotInMinutes = hour * 60 + minute;
        const isPast = selectedDate === todayStr && slotInMinutes < currentMinutes;
        const isBooked = bookedSet.has(slot);
        const isBlocked = blockedSlots.has(slot);
        
        const option = document.createElement("option");
        option.value = slot;
        option.textContent = slot;
        if (isPast || isBooked || isBlocked) {
          option.disabled = true;
        }
        timeSelectElem.appendChild(option);
      });
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
  
  const serviceNames = {
    classic: "Класичний манікюр",
    gel: "Гель-лак",
    design: "Манікюр із дизайном"
  };
  
  const data = {
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
      if (result === "Success") {
        document.getElementById("confirmation").textContent =
          `Ви записані на ${data.service} до Оксани Черній на ${date} о ${time}. Дякуємо, ${name}!`;
        document.getElementById("confirmation").style.display = "block";
        setTimeout(updateTimeSlots, 1000);
      } else {
        throw new Error(result);
      }
    })
    .catch(error => {
      alert("Помилка запису: " + error);
      console.error("Помилка запису:", error);
    });
  
  document.getElementById("name").value = "";
  document.getElementById("phone").value = "";
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
  const fields = row.querySelectorAll("td:not(:last-child)");
  const editButton = row.querySelector("button");
  
  fields.forEach(field => {
    const isEditable = field.getAttribute("contenteditable") === "true";
    field.setAttribute("contenteditable", !isEditable);
    field.style.backgroundColor = isEditable ? "" : "#f9f9f9";
  });
  
  if (editButton.textContent === "Редагувати") {
    editButton.textContent = "Зберегти";
    editButton.removeEventListener("click", saveChanges); // Видаляємо старий обробник
    editButton.addEventListener("click", () => saveChanges(row, originalData));
  } else {
    editButton.textContent = "Редагувати";
  }
}

function saveChanges(row, originalData) {
  const updatedData = [];
  const fields = row.querySelectorAll("td:not(:last-child)");
  
  fields.forEach(field => {
    updatedData.push(field.textContent.trim());
  });
  
  fetch("https://script.google.com/macros/s/AKfycbx_Sjqds2oIId57hsSTh2tgDTY8NuW6MxoBEYc5g3VhRC9dlumHhch0q1INORNVcoy3/exec", {
    method: "POST",
    body: JSON.stringify({ original: originalData, updated: updatedData }),
    headers: {
      "Content-Type": "application/json"
    }
  })
    .then(response => response.text())
    .then(result => {
      if (result === "Updated") {
        alert("Запис успішно оновлено!");
        showAppointments(); // Оновлюємо таблицю
      } else {
        throw new Error(result);
      }
    })
    .catch(error => {
      console.error("Помилка оновлення запису:", error);
      alert("Не вдалося оновити запис: " + error);
    });
}

function showAppointments() {
  fetch("https://script.google.com/macros/s/AKfycbx_Sjqds2oIId57hsSTh2tgDTY8NuW6MxoBEYc5g3VhRC9dlumHhch0q1INORNVcoy3/exec")
    .then(response => response.json())
    .then(data => {
      const container = document.getElementById("appointments-list");
      container.innerHTML = "";
      
      const table = document.createElement("table");
      table.classList.add("appointments-table");
      
      const headers = ["№", "Дата", "Час", "Послуга", "Ім’я", "Телефон", "Дії"];
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
        
        // Колонка: №
        const tdIndex = document.createElement("td");
        tdIndex.textContent = index + 1;
        tr.appendChild(tdIndex);
        
        // Колонка: Дата
        const tdDate = document.createElement("td");
        tdDate.textContent = row[0]; // yyyy-MM-dd
        tr.appendChild(tdDate);
        
        // Колонка: Час
        const tdTime = document.createElement("td");
        tdTime.textContent = row[1]; // HH:mm
        tr.appendChild(tdTime);
        
        // Колонка: Послуга
        const tdService = document.createElement("td");
        tdService.textContent = row[2];
        tr.appendChild(tdService);
        
        // Колонка: Ім’я
        const tdName = document.createElement("td");
        tdName.textContent = row[3];
        tr.appendChild(tdName);
        
 soport        // Колонка: Телефон
        const tdPhone = document.createElement("td");
        tdPhone.textContent = row[4];
        tr.appendChild(tdPhone);
        
        // Колонка: Дії
        const tdActions = document.createElement("td");
        const editButton = document.createElement("button");
        editButton.textContent = "Редагувати";
        editButton.addEventListener("click", () => enableEditing(tr, row));
        tdActions.appendChild(editButton);
        tr.appendChild(tdActions);
        
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      container.appendChild(table);
    })
    .catch(error => {
      console.error("Помилка завантаження записів:", error);
      const container = document.getElementById("appointments-list");
      container.innerHTML = "<p>Помилка завантаження записів.</p>";
    });
}

document.querySelector("h1").addEventListener("click", () => {
  document.querySelector(".admin-login").style.display = "block";
});
