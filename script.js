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

function updateTimeSlots() {
  const dateInputElem = document.getElementById('date');
  const timeSelectElem = document.getElementById('time');
  timeSelectElem.innerHTML = ''; // Очистка списку слотів

  const selectedDate = dateInputElem.value;
  if (!selectedDate) {
    const option = document.createElement('option');
    option.textContent = 'Спочатку оберіть дату';
    option.disabled = true;
    timeSelectElem.appendChild(option);
    return;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  let currentMinutes = 0;
  if (selectedDate === todayStr) {
    const now = new Date();
    currentMinutes = now.getHours() * 60 + now.getMinutes();
  }

  // Додаємо часову мітку, щоб уникнути кешування
  const url = `https://script.google.com/macros/s/AKfycbx_Sjqds2oIId57hsSTh2tgDTY8NuW6MxoBEYc5g3VhRC9dlumHhch0q1INORNVcoy3/exec?date=${selectedDate}&t=${new Date().getTime()}`;

  fetch(url)
    .then(response => response.json())
    .then(data => {
      console.log('Дані з GET:', data);
      
      // Оскільки GET повертає лише записи для вибраної дати, заброньовані часові слоти — це час із другого стовпця
      const bookedTimes = data.map(row => row[1]); 
      console.log('Заброньовані часові слоти:', bookedTimes);

      const allSlots = [
        '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
        '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
        '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
        '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
      ];

      // Фільтруємо доступні слоти: вилучаємо ті, що вже заброньовані або минули (якщо сьогодні)
      const availableSlots = allSlots.filter(slot => {
        const [hour, minute] = slot.split(':').map(Number);
        const slotInMinutes = hour * 60 + minute;
        const isPast = (selectedDate === todayStr && slotInMinutes < currentMinutes);
        return (!isPast && !bookedTimes.includes(slot));
      });

      // Будуємо список для select
      timeSelectElem.innerHTML = '';
      if (availableSlots.length === 0) {
        const option = document.createElement('option');
        option.textContent = 'Немає доступних слотів';
        option.disabled = true;
        timeSelectElem.appendChild(option);
      } else {
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'Оберіть час';
        placeholder.disabled = true;
        placeholder.selected = true;
        timeSelectElem.appendChild(placeholder);
        availableSlots.forEach(slot => {
          const option = document.createElement('option');
          option.value = slot;
          option.textContent = slot;
          timeSelectElem.appendChild(option);
        });
      }
    })
    .catch(err => {
      console.error('Помилка отримання записів:', err);
      timeSelectElem.innerHTML = '';
      const option = document.createElement('option');
      option.textContent = 'Не вдалося завантажити слоти';
      option.disabled = true;
      timeSelectElem.appendChild(option);
    });
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

  fetch('https://script.google.com/macros/s/AKfycbx_Sjqds2oIId57hsSTh2tgDTY8NuW6MxoBEYc5g3VhRC9dlumHhch0q1INORNVcoy3/exec', {  
    method: 'POST',  
    body: JSON.stringify(data)  
  })
    .then(response => response.text())
    .then(result => {  
      document.getElementById('confirmation').textContent =
        `Ви записані на ${data.service} до Оксани Черній на ${date} о ${time}. Дякуємо, ${name}!`;  
      document.getElementById('confirmation').style.display = 'block';  
      setTimeout(updateTimeSlots, 1000);  
    })
    .catch(error => {  
      alert('Помилка запису: ' + error);  
      console.error('Помилка запису:', error);  
    });

  document.getElementById('name').value = '';  
  document.getElementById('phone').value = '';  
}

// ... решта функцій (вхід/вихід для адміна, редагування тощо) залишаються без змін ...

