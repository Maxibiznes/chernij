window.onload = function() {  
    let dateInput = document.getElementById("date");  
    let today = new Date();  
    let dd = String(today.getDate()).padStart(2, '0');  
    let mm = String(today.getMonth() + 1).padStart(2, '0'); // Січень - 0!  
    let yyyy = today.getFullYear();  

    today = yyyy + '-' + mm + '-' + dd;  
    dateInput.setAttribute("min", today);  
    updateTimeSlots(); // Завантаження початкових часових слотів  
};  

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

    const url = `https://script.google.com/macros/s/AKfycbx_Sjqds2oIId57hsSTh2tgDTY8NuW6MxoBEYc5g3VhRC9dlumHhch0q1INORNVcoy3/exec?date=${selectedDate}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const bookedTimes = data.map(row => row[1]); // Отримання заброньованих часів

            const allSlots = [
                '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
                '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
                '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
                '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
            ];

            allSlots.forEach(slot => {
                const option = document.createElement('option');
                option.value = slot;
                option.textContent = slot;

                const isBooked = bookedTimes.includes(slot); // Перевірка заброньованості

                if (isBooked) {
                    option.disabled = true;
                }
                timeSelectElem.appendChild(option);
            });
        })
        .catch(err => {
            console.error('Помилка отримання записів:', err);
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
        updateTimeSlots(); // Оновлення часових слотів після запису  
    })  
    .catch(error => {  
        alert('Помилка запису: ' + error);  
        console.error('Помилка запису:', error);  
    });  

    document.getElementById('name').value = '';  
    document.getElementById('phone').value = '';  
}
