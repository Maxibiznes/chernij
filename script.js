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
    const dateValue = document.getElementById('date').value;
    const timeSelect = document.getElementById('time');
    timeSelect.innerHTML = ''; // Очищення списку часових слотів

    // Допоміжна функція для форматування дати у вигляді YYYY-MM-DD
    function formatDateFromObj(dateObj) {
        const year = dateObj.getFullYear();
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const day = dateObj.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Допоміжна функція для форматування часу у вигляді HH:mm
    function formatTimeFromObj(dateObj) {
        const hours = dateObj.getHours().toString().padStart(2, '0');
        const minutes = dateObj.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    if (!dateValue) {
        const option = document.createElement('option');
        option.textContent = 'Спочатку оберіть дату';
        timeSelect.appendChild(option);
        return;
    }

    // Отримуємо сьогоднішню дату (у форматі YYYY-MM-DD)
    const todayDateObj = new Date();
    const todayStr = todayDateObj.toISOString().split('T')[0];

    // Формуємо URL для отримання записів за вибраною датою
    const url = `https://script.google.com/macros/s/AKfycbx_Sjqds2oIId57hsSTh2tgDTY8NuW6MxoBEYc5g3VhRC9dlumHhch0q1INORNVcoy3/exec?date=${dateValue}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log("Дані, отримані від API:", data);
            
            // Фільтруємо записи, щоб залишити лише ті, що стосуються вибраної дати
            const filteredData = data.filter(row => {
                let rowDateStr;
                if (row[0] instanceof Date) {
                    rowDateStr = formatDateFromObj(row[0]);
                } else {
                    rowDateStr = formatDateFromObj(new Date(row[0]));
                }
                return rowDateStr === dateValue;
            });
            
            // Отримуємо заброньовані часи та нормалізуємо їх до формату "HH:mm"
            const bookedTimes = filteredData.map(row => {
                let timeStr;
                if (row[1] instanceof Date) {
                    timeStr = formatTimeFromObj(row[1]);
                } else if (typeof row[1] === 'string') {
                    // Якщо час може містити секунди, беремо лише перші 5 символів
                    timeStr = row[1].trim().substring(0, 5);
                } else {
                    timeStr = row[1];
                }
                return timeStr;
            });
            console.log("Нормалізовані заброньовані часи:", bookedTimes);

            // Масив усіх можливих часових слотів
            const allTimes = [
                '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
                '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
                '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
                '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
            ];

            // Для сьогоднішньої дати визначаємо поточний час (в хвилинах)
            let currentMinutes = 0;
            if (dateValue === todayStr) {
                const now = new Date();
                currentMinutes = now.getHours() * 60 + now.getMinutes();
            }

            // Створюємо опції для кожного слота
            allTimes.forEach(slot => {
                const option = document.createElement('option');
                option.value = slot;
                option.textContent = slot;

                // Перевірка – чи цей слот точно зустрічається в заброньованих?
                const isBooked = bookedTimes.includes(slot);

                // Якщо вибрана дата – сьогодні, вимикаємо слоти, що вже минули за часом
                const [slotHours, slotMinutes] = slot.split(':').map(Number);
                const slotTimeInMinutes = slotHours * 60 + slotMinutes;
                const isPast = (dateValue === todayStr && slotTimeInMinutes < currentMinutes);

                // Деактивуємо слот, якщо він заброньований або вже минув
                option.disabled = isBooked || isPast;
                timeSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Помилка завантаження слотів:', error);
            timeSelect.innerHTML = '';
            const option = document.createElement('option');
            option.textContent = 'Не вдалося завантажити слоти';
            timeSelect.appendChild(option);
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
function enableEditing(row, originalData) {
    const fields = row.querySelectorAll('td:not(:last-child)'); // Всі комірки, окрім дій
    const editButton = row.querySelector('button'); // Кнопка "Редагувати"

    fields.forEach(field => {
        const isEditable = field.getAttribute('contenteditable') === 'true';
        field.setAttribute('contenteditable', !isEditable);
        field.style.backgroundColor = isEditable ? '' : '#f9f9f9'; // Виділення фону при редагуванні
    });

    if (editButton.textContent === 'Редагувати') {
        editButton.textContent = 'Зберегти';
        editButton.addEventListener('click', () => saveChanges(row, originalData)); // Додаємо подію збереження
    } else {
        editButton.textContent = 'Редагувати';
    }
}
function saveChanges(row, originalData) {
    const updatedData = [];
    const fields = row.querySelectorAll('td:not(:last-child)');

    fields.forEach((field, index) => {
        updatedData.push(field.textContent);
    });

    // Відправлення даних у Google Apps Script
    fetch('https://script.google.com/macros/s/AKfycbx_Sjqds2oIId57hsSTh2tgDTY8NuW6MxoBEYc5g3VhRC9dlumHhch0q1INORNVcoy3/exec', {
        method: 'POST',
        body: JSON.stringify({
            original: originalData, // Передаємо оригінальні дані для пошуку
            updated: updatedData // Передаємо оновлені дані
        }),
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(result => {
        console.log('Успішно оновлено:', result);
        alert('Запис успішно оновлено!');
    })
    .catch(error => {
        console.error('Помилка оновлення запису:', error);
        alert('Не вдалося оновити запис.');
    });
}



// Відкриваємо форму входу для адміна при кліку на заголовок (h1)  
document.querySelector('h1').addEventListener('click', () => {  
    document.querySelector('.admin-login').style.display = 'block';  
});  
