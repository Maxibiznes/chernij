window.onload = function() {  
    let dateInput = document.getElementById("date");  
    let today = new Date();  
    let dd = String(today.getDate()).padStart(2, '0');  
    let mm = String(today.getMonth() + 1).padStart(2, '0');  
    let yyyy = today.getFullYear();  

    today = yyyy + '-' + mm + '-' + dd;  
    dateInput.setAttribute("min", today);  
    updateTimeSlots();  
};  

function updateTimeSlots() {
    const dateInput = document.getElementById('date').value;
    const timeSelect = document.getElementById('time');
    timeSelect.innerHTML = '';

    const todayDateObj = new Date();
    const todayStr = todayDateObj.toISOString().split('T')[0];

    if (dateInput) {
        const url = `https://script.google.com/macros/s/AKfycbx_Sjqds2oIId57hsSTh2tgDTY8NuW6MxoBEYc5g3VhRC9dlumHhch0q1INORNVcoy3/exec?date=${dateInput}`;

        fetch(url, {
            method: 'GET', // Явно вказуємо метод
            headers: { 'Content-Type': 'application/json' }
        })
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                console.log("Дані, отримані від API:", data);
                const filteredData = data.filter(row => {
                    const dateFromRow = new Date(row.date); // Змінено row[0] на row.date
                    const year = dateFromRow.getFullYear();
                    const month = (dateFromRow.getMonth() + 1).toString().padStart(2, '0');
                    const day = dateFromRow.getDate().toString().padStart(2, '0');
                    const rowDateStr = `${year}-${month}-${day}`;
                    return rowDateStr === dateInput;
                });

                const bookedTimes = filteredData.map(row => row.time); // Змінено row[1] на row.time
                console.log("Заброньовані часи (відфільтровані):", bookedTimes);

                const allTimes = [
                    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
                    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
                    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
                    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
                ];

                let currentMinutes = 0;
                if (dateInput === todayStr) {
                    const now = new Date();
                    currentMinutes = now.getHours() * 60 + now.getMinutes();
                }

                allTimes.forEach(time => {
                    const option = document.createElement('option');
                    option.value = time;
                    option.textContent = time;

                    const [slotHours, slotMinutes] = time.split(':').map(Number);
                    const timeInMinutes = slotHours * 60 + slotMinutes;

                    const isBooked = bookedTimes.some(bookedTime => {
                        const [bookedHours, bookedMinutes] = bookedTime.split(':').map(Number);
                        const bookedTimeInMinutes = bookedHours * 60 + bookedMinutes;
                        return Math.abs(timeInMinutes - bookedTimeInMinutes) < 90;
                    });

                    const isPast = dateInput === todayStr && timeInMinutes < currentMinutes;
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

    fetch('https://script.google.com/macros/s/AKfycbx_Sjqds2oIId57hsSTh2tgDTY8NuW6MxoBEYc5g3VhRC9dlumHhch0q1INORNVcoy3/exec', {  
        method: 'POST',  
        headers: { 'Content-Type': 'application/json' }, // Додано заголовок
        body: JSON.stringify(data)  
    })  
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json(); // Змінено на json()
    })
    .then(result => {  
        if (result.status === "Success") {
            document.getElementById('confirmation').textContent =  
              `Ви записані на ${data.service} до Оксани Черній на ${date} о ${time}. Дякуємо, ${name}!`;  
            document.getElementById('confirmation').style.display = 'block';  
            updateTimeSlots();  
        } else {
            throw new Error(result.message || 'Unknown error');
        }
    })  
    .catch(error => {  
        alert('Помилка запису: ' + error);  
        console.error('Помилка запису:', error);  
    });  

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
    fetch('https://script.google.com/macros/s/AKfycbx_Sjqds2oIId57hsSTh2tgDTY8NuW6MxoBEYc5g3VhRC9dlumHhch0q1INORNVcoy3/exec', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    })
    .then(data => {
        const container = document.getElementById('appointments-list');
        container.innerHTML = '';

        const table = document.createElement('table');
        table.classList.add('appointments-table');

        const headers = ['№', 'ID', 'Дата', 'Час', 'Послуга', 'Ім’я', 'Телефон', 'Дії'];
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

            const fields = [row.id, row.date, row.time, row.service, row.name, row.phone];
            fields.forEach((field, fieldIndex) => {
                const td = document.createElement('td');
                td.textContent = field;
                td.setAttribute('contenteditable', false);
                td.classList.add(`field-${fieldIndex}`);
                tr.appendChild(td);
            });

            const tdActions = document.createElement('td');
            const editButton = document.createElement('button');
            editButton.textContent = 'Редагувати';
            editButton.addEventListener('click', () => enableEditing(tr));
            tdActions.appendChild(editButton);
            tr.appendChild(tdActions);

            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        container.appendChild(table);
    })
    .catch(error => console.error('Помилка завантаження записів:', error));
}

function enableEditing(row) {
    const fields = row.querySelectorAll('td:not(:last-child)');
    const editButton = row.querySelector('button');

    const isEditing = editButton.textContent === 'Зберегти';

    fields.forEach(field => {
        field.setAttribute('contenteditable', !isEditing);
        field.style.backgroundColor = isEditing ? '' : '#f9f9f9';
    });

    if (isEditing) {
        editButton.textContent = 'Редагувати';
        saveChanges(row);
    } else {
        editButton.textContent = 'Зберегти';
    }
}

function saveChanges(row) {
    const updatedData = [];
    const fields = row.querySelectorAll('td:not(:last-child)');

    fields.forEach(field => {
        updatedData.push(field.textContent);
    });

    fetch('https://script.google.com/macros/s/AKfycbx_Sjqds2oIId57hsSTh2tgDTY8NuW6MxoBEYc5g3VhRC9dlumHhch0q1INORNVcoy3/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updated: updatedData })
    })
    .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
    })
    .then(result => {
        if (result.status === "Success") {
            alert('Запис успішно оновлено!');
            showAppointments();
        } else {
            alert('Помилка: ' + result.message);
        }
    })
    .catch(error => {
        console.error('Помилка оновлення запису:', error);
        alert('Не вдалося оновити запис.');
    });
}

document.querySelector('h1').addEventListener('click', () => {  
    document.querySelector('.admin-login').style.display = 'block';  
});
