const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx_Sjqds2oIId57hsSTh2tgDTY8NuW6MxoBEYc5g3VhRC9dlumHhch0q1INORNVcoy3/exec';  

window.onload = function() {  
  let dateInput = document.getElementById("date");  
  let today = new Date();  
  let dd = String(today.getDate()).padStart(2, '0');  
  let mm = String(today.getMonth() + 1).padStart(2, '0');  
  let yyyy = today.getFullYear();  

  today = yyyy + '-' + mm + '-' + dd;  
  dateInput.setAttribute("min", today);  
};  

function updateTimeSlots() {  
  const dateInput = document.getElementById('date').value;  
  const timeSelect = document.getElementById('time');  
  const errorContainer = document.getElementById('time-slots-error'); // Додано контейнер для помилок  
  timeSelect.innerHTML = '';  
  errorContainer.style.display = 'none'; // Приховуємо контейнер помилок при кожному оновленні  

  if (dateInput) {  
    fetch(SCRIPT_URL)  
      .then(response => response.json())  
      .then(data => {  
        const bookedTimes = data.filter(row => row && row[0] === dateInput).map(row => row[1]); // Перевірка на null  
        const times = ['10:00', '12:00', '14:00', '16:00', '18:00'];  
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
        errorContainer.style.display = 'block'; // Показуємо контейнер помилок  
      });  
  } else {  
    const option = document.createElement('option');  
    option.textContent = 'Спочатку оберіть дату';  
    timeSelect.appendChild(option);  
  }  
}  

function bookAppointment() {  
  const service = document.getElementById('service').value;  
  const date = document.getElementById('date').value;  
  const time = document.getElementById('time').value;  
  const name = document.getElementById('name').value.trim();  
  const phone = document.getElementById('phone').value.trim();  
  const confirmation = document.getElementById('confirmation');  
  const errorContainer = document.getElementById('booking-error'); // Додано контейнер для помилок  
  errorContainer.style.display = 'none'; // Приховуємо контейнер помилок  

  if (!name || !phone || !date || !time) {  
    alert('Будь ласка, заповніть усі поля!');  
    return;  
  }  

  // Додано валідацію формату телефону (приклад)  
  const phoneRegex = /^\+?380\d{9}$/; // Приклад для українських номерів  
  if (!phoneRegex.test(phone)) {  
    alert('Будь ласка, введіть коректний номер телефону у форматі +380XXXXXXXXX');  
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

  fetch(SCRIPT_URL, {  
    method: 'POST',  
    body: JSON.stringify(data)  
  })  
  .then(response => response.text())  
  .then(result => {  
    confirmation.textContent = `Ви записані на ${data.service} до Оксани Черній на ${date} о ${time}. Дякуємо, ${name}!`;  
    confirmation.style.display = 'block';  
    updateTimeSlots();  
    // Очищення полів для імені та телефону після запису  
    document.getElementById('name').value = '';  
    document.getElementById('phone').value = '';  
  })  
  .catch(error => {  
    console.error('Помилка запису:', error);  
    errorContainer.textContent = 'Помилка запису: ' + error;  
    errorContainer.style.display = 'block'; // Показуємо контейнер помилок  
  });  
}  

function loginAdmin() {  
  const passwordInput = document.getElementById('admin-password');  
  const password = passwordInput.value;  
  if (password === 'admin123') {  
    document.querySelector('.admin-login').style.display = 'none';  
    document.querySelector('.admin-panel').style.display = 'block';  
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
  const list = document.getElementById('appointments-list');  
  const errorContainer = document.getElementById('appointments-error'); // Додано контейнер для помилок  
  errorContainer.style.display = 'none'; // Приховуємо контейнер помилок  
  list.innerHTML = '';  

  fetch(SCRIPT_URL)  
    .then(response => response.json())  
    .then(data => {  
      if (!Array.isArray(data)) {  
        throw new Error('Отримано невірний формат даних з сервера');  
      }  
      data.forEach(row => {  
        if (row && row.length >= 5) { // Перевірка на null та достатню кількість елементів  
          const li = document.createElement('li');  
          // Екранування даних для запобігання XSS  
          const date = escapeHTML(row[0]);  
          const time = escapeHTML(row[1]);  
          const service = escapeHTML(row[2]);  
          const name = escapeHTML(row[3]);  
          const phone = escapeHTML(row[4]);  
          li.textContent = `${date} о ${time} - ${service} для ${name} (${phone})`;  
          list.appendChild(li);  
        } else {  
          console.warn('Невірний формат рядка даних:', row);  
        }  
      });  
    })  
    .catch(error => {  
      console.error('Помилка завантаження записів:', error);  
      errorContainer.textContent = 'Помилка завантаження записів: ' + error;  
      errorContainer.style.display = 'block'; // Показуємо контейнер помилок  
    });  
}  

// Функція для екранування HTML  
function escapeHTML(str) {  
  let p = document.createElement("p");  
  p.appendChild(document.createTextNode(str));  
  return p.innerHTML;  
}  

document.querySelector('h1').addEventListener('click', () => {  
  document.querySelector('.admin-login').style.display = 'block';  
});  
