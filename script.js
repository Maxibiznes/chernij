window.onload = function() {  
  let dateInput = document.getElementById("date");  
  let today = new Date();  
  let dd = String(today.getDate()).padStart(2, '0');  
  let mm = String(today.getMonth() + 1).padStart(2, '0'); // Січень - 0!  
  let yyyy = today.getFullYear();  

  today = yyyy + '-' + mm + '-' + dd;  
  dateInput.setAttribute("min", today);  
};  
function updateTimeSlots() {  
  const dateInput = document.getElementById('date').value;  
  const timeSelect = document.getElementById('time');  
  const errorContainer = document.getElementById('time-slots-error');  
  timeSelect.innerHTML = '';  
  errorContainer.style.display = 'none';  

  if (dateInput) {  
    fetch(SCRIPT_URL)  
      .then(response => response.json())  
      .then(data => {  
        const bookedTimes = data.filter(row => row && row[0] === dateInput).map(row => row[1]);  
        const times = generateTimeSlots('08:00', '20:00', 30);  
        times.forEach(time => {  
          const option = document.createElement('option');  
          option.value = time;  
          option.textContent = time;  
          option.disabled = bookedTimes.includes(time);  
          timeSelect.appendChild(option);  
        });  
      })  
      .catch(error => {  
        console.error('Помилка завантаження слотів:', error);  
        errorContainer.textContent = 'Не вдалося завантажити слоти. Спробуйте пізніше.';  
        errorContainer.style.display = 'block';  
      });  
  } else {  
    const option = document.createElement('option');  
    option.textContent = 'Спочатку оберіть дату';  
    timeSelect.appendChild(option);  
  }  
}  

function generateTimeSlots(startTime, endTime, interval) {  
  const timeSlots = [];  
  let currentTime = startTime;  

  while (currentTime <= endTime) {  
    timeSlots.push(currentTime);  
    const [hours, minutes] = currentTime.split(':').map(Number);  
    const nextMinutes = minutes + interval;  
    const nextHours = hours + Math.floor(nextMinutes / 60);  
    const nextTime = String(nextHours).padStart(2, '0') + ':' + String(nextMinutes % 60).padStart(2, '0');  
    currentTime = nextTime;  

    if (currentTime.length > 5) {  
      break; // Завершити, якщо час стає недійсним  
    }  
  }  
  return timeSlots;  
}  

function bookAppointment() {
  const service = document.getElementById('service').value;
  const date = document.getElementById('date').value;
  const time = document.getElementById('time').value;
  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();

  if (!name || !phone || !date || !time) {
    alert('Будь ласка, заповніть усі поля!');
    return;
  }

  const serviceNames = {
    classic: 'Класичний манікюр',
    gel: 'Гель-лак',
    design: 'Манікюр із дизайном'
  };

  const data = {
    service: serviceNames[service] || service,
    date,
    time,
    name,
    phone
  };

  // Відправка даних на сервер (Google Apps Script endpoint)
  fetch('https://script.google.com/macros/s/AKfycbx_Sjqds2oIId57hsSTh2tgDTY8NuW6MxoBEYc5g3VhRC9dlumHhch0q1INORNVcoy3/exec', {
    method: 'POST',
    body: JSON.stringify(data)
})
  .then(response => response.text())
  .then(result => {
    document.getElementById('confirmation').textContent =
      `Ви записані на ${data.service} до Оксани Черній на ${date} о ${time}. Дякуємо, ${name}!`;
    document.getElementById('confirmation').style.display = 'block';
    updateTimeSlots(); // Оновлюємо слоти після запису
  })
  .catch(error => {
    alert('Помилка запису: ' + error);
    console.error('Помилка запису:', error);
  });

  // Очищення полів для імені та телефону після запису
  document.getElementById('name').value = '';
  document.getElementById('phone').value = '';
}

function loginAdmin() {
  const passwordInput = document.getElementById('admin-password');
  const password = passwordInput.value;
  // Перевірка правильності пароля для адміна (змініть за потребою)
  if (password === 'admin123') {
    document.querySelector('.admin-login').style.display = 'none';
    document.querySelector('.admin-panel').style.display = 'block';
    // Скидання повідомлення про помилку та поля пароля
    document.getElementById('admin-error').style.display = 'none';
    passwordInput.value = '';
    showAppointments();
  } else {
    document.getElementById('admin-error').style.display = 'block';
  }
}

function logoutAdmin() {
  document.querySelector('.admin-panel').style.display = 'none';
  document.querySelector('.admin-login').style.display = 'block';
  document.getElementById('admin-password').value = '';
  document.getElementById('admin-error').style.display = 'none';
}

function showAppointments() {
  // Отримання записів із Google Sheets через Google Apps Script endpoint
  fetch('https://script.google.com/macros/s/AKfycbx_Sjqds2oIId57hsSTh2tgDTY8NuW6MxoBEYc5g3VhRC9dlumHhch0q1INORNVcoy3/exec')
    .then(response => response.json())
    .then(data => {
      const list = document.getElementById('appointments-list');
      list.innerHTML = '';
      // Припускаємо, що структура data наступна:
      // row[0] - дата, row[1] - час, row[2] - послуга, row[3] - ім’я, row[4] - телефон
      data.forEach(row => {
        const li = document.createElement('li');
        li.textContent = `${row[0]} о ${row[1]} - ${row[2]} для ${row[3]} (${row[4]})`;
        list.appendChild(li);
      });
    })
    .catch(error => console.error('Помилка завантаження записів:', error));
}

// Відкриваємо форму входу для адміна при кліку на заголовок (h1)
document.querySelector('h1').addEventListener('click', () => {
  document.querySelector('.admin-login').style.display = 'block';
});
