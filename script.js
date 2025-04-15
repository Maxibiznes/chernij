// При завантаженні сторінки встановлюємо мінімальну дату і завантажуємо часові слоти
window.onload = () => {
  const dateInput = document.getElementById("date");
  const todayStr = new Date().toISOString().split("T")[0];
  dateInput.setAttribute("min", todayStr);
  updateTimeSlots();
};

// Функція для оновлення списку доступних часових слотів
const updateTimeSlots = () => {
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

  // Формуємо URL для GET-запиту із зазначенням дати та унікальною міткою (щоб уникнути кешування)
  const url = `https://script.google.com/macros/s/AKfycbx_Sjqds2oIId57hsSTh2tgDTY8NuW6MxoBEYc5g3VhRC9dlumHhch0q1INORNVcoy3/exec?date=${encodeURIComponent(selectedDate)}&t=${Date.now()}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      console.log("Дані з GET:", data);
      // Отримуємо заброньовані слоти (час знаходиться у другому стовпці, формат "HH:mm")
      const bookedTimes = data.map(row => row[1].trim());
      console.log("BookedTimes:", bookedTimes);

      const allSlots = [
        "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
        "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
        "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
        "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00"
      ];

      // Фільтруємо, виключаючи заброньовані або минулі слоти (якщо вибрана сьогоднішня дата)
      const availableSlots = allSlots.filter(slot => {
        const [h, m] = slot.split(":").map(Number);
        const slotMinutes = h * 60 + m;
        const isPast = selectedDate === todayStr && slotMinutes < currentMinutes;
        return !isPast && !bookedTimes.includes(slot);
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
};

// Функція бронювання запису
const bookAppointment = () => {
  const service = document.getElementById("service").value;
  const dateValue = document.getElementById("date").value;
  const timeValue = document.getElementById("time").value;
  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();

  if (!name || !phone || !dateValue || !timeValue) {
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
    date: dateValue,    // Очікується формат "YYYY-MM-DD"
    time: timeValue,    // Очікується формат "HH:mm"
    name: name,
    phone: phone
  };

  fetch("https://script.google.com/macros/s/AKfycbx_Sjqds2oIId57hsSTh2tgDTY8NuW6MxoBEYc5g3VhRC9dlumHhch0q1INORNVcoy3/exec", {
    method: "POST",
    body: JSON.stringify(data)
  })
    .then(response => response.text())
    .then(result => {
      document.getElementById("confirmation").textContent =
        `Ви записані на ${data.service} до Оксани Черній на ${data.date} о ${data.time}. Дякуємо, ${name}!`;
      document.getElementById("confirmation").style.display = "block";
      setTimeout(updateTimeSlots, 1000);
    })
    .catch(error => {
      alert("Помилка запису: " + error);
      console.error("Помилка запису:", error);
    });

  document.getElementById("name").value = "";
  document.getElementById("phone").value = "";
};

// Функції для адмін-панелі
const loginAdmin = () => {
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
};

const logoutAdmin = () => {
  document.querySelector(".admin-panel").style.display = "none";
  document.querySelector(".admin-login").style.display = "block";
  document.getElementById("admin-password").value = "";
  document.getElementById("admin-error").style.display = "none";
};

const enableEditing = (row, originalData) => {
  const fields = row.querySelectorAll("td:not(:last-child)");
  const editButton = row.querySelector("button");

  fields.forEach(field => {
    const isEditable = field.getAttribute("contenteditable") === "true";
    field.setAttribute("contenteditable", !isEditable);
    field.style.backgroundColor = isEditable ? "" : "#f9f9f9";
  });

  if (editButton.textContent === "Редагувати") {
    editButton.textContent = "Зберегти";
    editButton.addEventListener("click", () => saveChanges(row, originalData));
  } else {
    editButton.textContent = "Редагувати";
  }
};

const saveChanges = (row, originalData) => {
  const updatedData = [];
  const fields = row.querySelectorAll("td:not(:last-child)");
  fields.forEach(field => {
    updatedData.push(field.textContent);
  });

  fetch("https://script.google.com/macros/s/AKfycbx_Sjqds2oIId57hsSTh2tgDTY8NuW6MxoBEYc5g3VhRC9dlumHhch0q1INORNVcoy3/exec", {
    method: "POST",
    body: JSON.stringify({ original: originalData, updated: updatedData }),
    headers: {
      "Content-Type": "application/json"
    }
  })
    .then(response => response.json())
    .then(result => {
      console.log("Успішно оновлено:", result);
      alert("Запис успішно оновлено!");
    })
    .catch(error => {
      console.error("Помилка оновлення запису:", error);
      alert("Не вдалося оновити запис.");
    });
};

const showAppointments = () => {
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

        const tdIndex = document.createElement("td");
        tdIndex.textContent = index + 1;
        tr.appendChild(tdIndex);

        const tdDate = document.createElement("td");
        const formattedDate = row[0].includes("T") ? row[0].split("T")[0] : row[0];
        tdDate.textContent = formattedDate;
        tr.appendChild(tdDate);

        const tdTime = document.createElement("td");
        let rawTime = row[1];
        if (typeof rawTime === "string" && rawTime.includes("T")) {
          rawTime = rawTime.split("T")[1].substring(0, 5);
        }
        tdTime.textContent = rawTime;
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
    });
};

document.querySelector("h1").addEventListener("click", () => {
  document.querySelector(".admin-login").style.display = "block";
});
document.querySelector("h1").addEventListener("click", () => {
  document.querySelector(".admin-login").style.display = "block";
});
