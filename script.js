window.onload = function() {  
    let dateInput = document.getElementById("date");  
    let today = new Date();  
    let dd = String(today.getDate()).padStart(2, '0');  
    let mm = String(today.getMonth() + 1).padStart(2, '0'); // Січень — 0  
    let yyyy = today.getFullYear();  
    let todayStr = `${yyyy}-${mm}-${dd}`;  
    dateInput.setAttribute("min", todayStr);  
    updateTimeSlots(); // Завантаження початкових часових слотів  
};  

// Допоміжна функція для нормалізації часу у формат HH:mm  
function normalizeTimeProper(timeStr) {
    timeStr = timeStr.trim();
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;  
    let hour = parts[0].padStart(2, '0');  
    let minute = parts[1].padStart(2, '0');  
    return `${hour}:${minute}`;  
}

function updateTimeSlots() {
    const dateInputElem = document.getElementById('date');
    const timeSelectElem = document.getElementById('time');
    timeSelectElem.innerHTML = ''; // Очищення списку часових слотів

    const selectedDate = dateInputElem.value;
    if (!selectedDate) {
        const option = document.createElement('option');
        option.textContent = 'Спочатку оберіть дату';
        option.disabled = true;
        timeSelectElem.appendChild(option);
        return;
    }

    // Отримуємо сьогоднішню дату у форматі YYYY-MM-DD та поточний час (у хвилинах), якщо обрана дата — сьогодні
    const todayStr = new Date().toISOString().split('T')[0];
    let currentMinutes = 0;
    if (selectedDate === todayStr) {
        const now = new Date();
        currentMinutes = now.getHours() * 60 + now.getMinutes();
    }

    // Формуємо URL для GET-запиту до Google Apps Script із заданою датою
    const url = `https://script.google.com/macros/s/AKfycbx_Sjqds2oIId57hsSTh2tgDTY8NuW6MxoBEYc5g3VhRC9dlumHhch0q1INORNVcoy3/exec?date=${selectedDate}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            // Фільтруємо записи, залишаючи ті, що відповідають обраній даті  
            function formatDate(dateObj) {
                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const day = String(dateObj.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            }
            const appointmentsForDate = data.filter(row => {
                let rowDate = row[0];
                if (typeof rowDate !== 'string') {
                    rowDate = formatDate(new Date(rowDate));
                }
                return rowDate === selectedDate;
            });

            // Отримуємо масив заброньованих часів, нормалізованих до формату HH:mm  
            const bookedTimes = appointmentsForDate.map(row => {
                let t = row[1];
                if (typeof t !== 'string') {
                    t = new Date(t).toTimeString().substring(0, 5);
                }
                return normalizeTimeProper(t);
            });
            console.log('Booked times (normalized):', bookedTimes);

            // Визначаємо усі можливі часові слоти  
            const allSlots = [
                '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
                '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
                '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
                '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
            ];

            // Створюємо опції — для кожного слота перевіряємо, чи він уже заброньований або лежить у минулому  
            allSlots.forEach(slot => {
                const option = document.createElement('option');
                option.value = slot;
                option.textContent = slot;

                // Обчислюємо час слота в хвилинах  
                const [slotHour, slotMinute] = slot.split(':').map(Number);
                const slotInMinutes = slotHour * 60 + slotMinute;
                // Якщо обрана дата — сьогодні, перевіряємо, чи слот уже минув  
                const isPast = (selectedDate === todayStr && slotInMinutes < currentMinutes);
                // Перевіряємо, чи цей слот вже заброньований  
                const isBooked = bookedTimes.includes(slot);

                if (isPast || isBooked) {
                    option.disabled = true;
                }
                timeSelectElem.appendChild(option);
            });
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

    // Відправка даних на сервер (Google Apps Script endpoint)  
    fetch('https://script.google.com/macros/s/AKfycbx_Sjqds2oIId57hsSTh2tgDTY8NuW6MxoBEYc5g3VhRC9dlumHhch0q1INORNVcoy3/exec', {  
        method: 'POST',  
        body: JSON.stringify(data),  
        headers: {
            'Content-Type': 'application/json'
        }
    })  
    .then(response => response.text())  
    .then(result => {  
        document.getElementById('confirmation').textContent =  
          `Ви записані на ${data.service} до Оксани Черній на ${date} о ${time}. Дякуємо, ${name}!`;  
        document.getElementById('confirmation').style.display = 'block';  
        updateTimeSlots(); // Оновлення часових слотів після запису  
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
    fetch('https://script.google.com/macros/s/AKfycbx_Sjqds2oIId57hsSTh2tgDTY8NuW6MxoBEYc5g3VhRC9dlumHhch0q1INORNVcoy3/exec')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('appointments-list');
            container.innerHTML = '';
            const table = document.createElement('table');
            table.classList.add('appointments-table');
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
            const tbody = document.createElement('tbody');
            data.forEach((row, index) => {
                const tr = document.createElement('tr');

                const tdIndex = document.createElement('td');
                tdIndex.textContent = index + 1;
                tr.appendChild(tdIndex);

                ['Дата', 'Час', 'Послуга', 'Ім’я', 'Телефон'].forEach((field, fieldIndex) => {
                    const td = document.createElement('td');
                    td.textContent = row[fieldIndex];
                    td.setAttribute('contenteditable', false);
                    td.classList.add(`field-${fieldIndex}`);
                    tr.appendChild(td);
                });

                const tdActions = document.createElement('td');
                const editButton = document.createElement('button');
                editButton.textContent = 'Редагувати';
                editButton.addEventListener('click', () => enableEditing(tr, row));
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
    const fields = row.querySelectorAll('td:not(:last-child)');
    const editButton = row.querySelector('button');

    fields.forEach(field => {
        const isEditable = field.getAttribute('contenteditable') === 'true';
        field.setAttribute('contenteditable', !isEditable);
        field.style.backgroundColor = isEditable ? '' : '#f9f9f9';
    });

    if (editButton.textContent === 'Редагувати') {
        editButton.textContent = 'Зберегти';
        editButton.addEventListener('click', () => saveChanges(row, originalData));
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

    fetch('https://script.google.com/macros/s/AKfycbx_Sjqds2oIId57hsSTh2tgDTY8NuW6MxoBEYc5g3VhRC9dlumHhch0q1INORNVcoy3/exec', {
        method: 'POST',
        body: JSON.stringify({
            original: originalData,
            updated: updatedData
        }),
        headers: {
            'Content-Type': 'application/json'
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

document.querySelector('h1').addEventListener('click', () => {  
    document.querySelector('.admin-login').style.display = 'block';  
});
