window.onload = function() {  
    let dateInput = document.getElementById("date");  
    let today = new Date();  
    let dd = String(today.getDate()).padStart(2, '0');  
    let mm = String(today.getMonth() + 1).padStart(2, '0'); // Січень - 0!  
    let yyyy = today.getFullYear();  

    today = yyyy + '-' + mm + '-' + dd;  
    dateInput.setAttribute("min", today);  
    updateTimeSlots(); // Added to load initial time slots  
};  

function updateTimeSlots() {
    const dateInput = document.getElementById('date').value;
    const timeSelect = document.getElementById('time');
    timeSelect.innerHTML = ''; // Очищуємо список часових слотів

    if (dateInput) {
        // URL твого Google Apps Script
        const url = `https://script.google.com/macros/s/AKfycbx_Sjqds2oIId57hsSTh2tgDTY8NuW6MxoBEYc5g3VhRC9dlumHhch0q1INORNVcoy3/exec?date=${dateInput}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                const allTimes = [
                    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', 
                    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', 
                    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', 
                    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
                ];

                const bookedTimes = data.map(row => row[1]); // Масив заброньованих часів

                allTimes.forEach(time => {
                    const option = document.createElement('option');
                    option.value = time;
                    option.textContent = time;

                    // Переводимо час у хвилини для перевірки
                    const [hours, minutes] = time.split(':').map(Number);
                    const timeInMinutes = hours * 60 + minutes;

                    const isBooked = bookedTimes.some(bookedTime => {
                        const [bookedHours, bookedMinutes] = bookedTime.split(':').map(Number);
                        const bookedTimeInMinutes = bookedHours * 60 + bookedMinutes;

                        // Перевіряємо збіг із заброньованим часом або відстань менш ніж 2 години
                        return Math.abs(timeInMinutes - bookedTimeInMinutes) < 120;
                    });

                    option.disabled = isBooked; // Дезактивуємо, якщо час уже заброньований
                    timeSelect.appendChild(option);
                });
            })
            .catch(error => {
                console.error('Помилка завантаження слотів:', error);
                const option = document.createElement('option');
                option.textContent = 'Не вдалося завантажити слоти';
                timeSelect.appendChild(option);
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
