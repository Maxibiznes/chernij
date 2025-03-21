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

    // Отримуємо сьогоднішню дату у форматі "YYYY-MM-DD"
    const todayDateObj = new Date();
    const todayStr = todayDateObj.toISOString().split('T')[0];

    if (dateInput) {
        const url = `https://script.google.com/macros/s/AKfycbx_Sjqds2oIId57hsSTh2tgDTY8NuW6MxoBEYc5g3VhRC9dlumHhch0q1INORNVcoy3/exec?date=${dateInput}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                console.log("Дані, отримані від API:", data);

                // Фільтруємо дані, щоб отримати записи лише для вибраної дати.
                const filteredData = data.filter(row => {
                    // Припускаємо, що row[0] містить дату у форматі, який можна перетворити у "YYYY-MM-DD"
                    const dateFromRow = new Date(row[0]);
                    const year = dateFromRow.getFullYear();
                    const month = (dateFromRow.getMonth() + 1).toString().padStart(2, '0');
                    const day = dateFromRow.getDate().toString().padStart(2, '0');
                    const rowDateStr = `${year}-${month}-${day}`;
                    return rowDateStr === dateInput;
                });

                // Перетворення заброньованих часів у формат HH:mm із відфільтрованих даних
                const bookedTimes = filteredData.map(row => {
                    const time = new Date(row[1]);
                    const hours = time.getHours().toString().padStart(2, '0');
                    const minutes = time.getMinutes().toString().padStart(2, '0');
                    return `${hours}:${minutes}`;
                });
                console.log("Заброньовані часи (відфільтровані):", bookedTimes);

                const allTimes = [
                    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
                    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
                    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
                    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
                ];

                // Якщо дата вибрана зараз (сьогодні), визначаємо нинішній час у хвилинах
                let currentMinutes = 0;
                if (dateInput === todayStr) {
                    const now = new Date();
                    currentMinutes = now.getHours() * 60 + now.getMinutes();
                }

                // Створюємо опції для кожного слота
                allTimes.forEach(time => {
                    const option = document.createElement('option');
                    option.value = time;
                    option.textContent = time;

                    const [slotHours, slotMinutes] = time.split(':').map(Number);
                    const timeInMinutes = slotHours * 60 + slotMinutes;

                    // Перевірка: чи вже заброньований для цієї дати
                    const isBooked = bookedTimes.some(bookedTime => {
                        const [bookedHours, bookedMinutes] = bookedTime.split(':').map(Number);
                        const bookedTimeInMinutes = bookedHours * 60 + bookedMinutes;
                        // Якщо різниця менша за 90 хвилин, вважаємо слот заброньованим
                        return Math.abs(timeInMinutes - bookedTimeInMinutes) < 90;
                    });

                    // Якщо обрана дата сьогодні - вимикаємо і ті слоти, що вже минули по часу
                    const isPast = dateInput === todayStr && timeInMinutes < currentMinutes;

                    // Якщо слот заброньований або вже в минулому, робимо його неактивним
                    option.disabled = isBooked || isPast;

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
    fetch('https://script.google.com/macros/s/AKfycbx_Sjqds2oIId57hsSTh2tgDTY8NuW6MxoBEYc5g3VhRC9dlumHhch0q1INORNVcoy3/exec')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('appointments-list');
            container.innerHTML = ''; // Очищення контейнера

            // Створення таблиці
            const table = document.createElement('table');
            table.classList.add('appointments-table');

            // Заголовок таблиці
            const headers = ['№', 'Дата', 'Час', 'Послуга', 'Ім’я', 'Телефон', 'Дії'];
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            headers.forEach(headerText => {
                const th = document.createElement('th');
                th.textContent = headerText;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);

            // Тіло таблиці
            const tbody = document.createElement('tbody');
            data.forEach((row, index) => {
                const tr = document.createElement('tr');

                // Стовпець з номером запису
                const tdIndex = document.createElement('td');
                tdIndex.textContent = index + 1;
                tr.appendChild(tdIndex);

                // Інші дані
                ['Дата', 'Час', 'Послуга', 'Ім’я', 'Телефон'].forEach((field, fieldIndex) => {
                    const td = document.createElement('td');
                    td.textContent = row[fieldIndex];
                    td.setAttribute('contenteditable', false); // Для редагування пізніше
                    td.classList.add(`field-${fieldIndex}`); // Додаємо клас для зручності
                    tr.appendChild(td);
                });

                // Стовпець дій
                const tdActions = document.createElement('td');
                const editButton = document.createElement('button');
                editButton.textContent = 'Редагувати';
                editButton.addEventListener('click', () => enableEditing(tr, row)); // Додаємо подію
                tdActions.appendChild(editButton);
                tr.appendChild(tdActions);

                tbody.appendChild(tr);
            });
            table.appendChild(tbody);
            container.appendChild(table);
        })
        .catch(error => {
            console.error('Помилка завантаження записів:', error);
        });
}



// Відкриваємо форму входу для адміна при кліку на заголовок (h1)  
document.querySelector('h1').addEventListener('click', () => {  
    document.querySelector('.admin-login').style.display = 'block';  
});  
