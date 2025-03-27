// ===============================================================
// КОНФІГУРАЦІЯ
// ===============================================================

// ВАЖЛИВО: URL твого розгорнутого Google Apps Script
const scriptURL = 'https://script.google.com/macros/s/AKfycbyLg8tUqX_s18Ule4t91m_sJ3y8v_V1YyW1hV8P1R2G9s8s7D0V7c6v/exec'; // <- Твій URL тут

// Налаштування доступних часових слотів
const timeSlotsConfig = {
    startHour: 9,  // Початок роботи (години, 24-годинний формат)
    endHour: 18,   // Кінець роботи (година, до якої включно можна записатись, наприклад 18 означає останній слот о 17:30 або 17:00 залежно від interval)
    interval: 30   // Інтервал між слотами у хвилинах (наприклад, 30)
};

// ===============================================================
// ОТРИМАННЯ ЕЛЕМЕНТІВ DOM
// ===============================================================
const form = document.forms['submit-to-google-sheet'];
const msg = document.getElementById("msg");
const dateInput = document.getElementById('date-visit');
const timeSelect = document.getElementById('time-select'); // Випадаючий список часу
const timeStatus = document.getElementById('time-status'); // Для повідомлень під полем часу

// ===============================================================
// ГЕНЕРАЦІЯ ЧАСОВИХ СЛОТІВ
// ===============================================================

/**
 * Генерує список всіх можливих часових слотів за день у форматі HH:MM.
 * @returns {string[]} Масив рядків часу, наприклад ["09:00", "09:30", ...]
 */
function generateAllPossibleTimes() {
    const times = [];
    const { startHour, endHour, interval } = timeSlotsConfig;

    for (let h = startHour; h < endHour; h++) { // < endHour, щоб не створювати слот точно о endHour
        for (let m = 0; m < 60; m += interval) {
            // Форматуємо години та хвилини з ведучими нулями
            const hourFormatted = h.toString().padStart(2, '0');
            const minuteFormatted = m.toString().padStart(2, '0');
            times.push(`${hourFormatted}:${minuteFormatted}`);
        }
    }
    // Перевіряємо, чи потрібно додати слот рівно о endHour:00 (якщо інтервал це дозволяє)
    // Наприклад, якщо endHour=18, interval=30, то останній слот буде 17:30.
    // Якщо endHour=18, interval=60, то останній буде 17:00.
    // Якщо потрібен слот рівно о endHour:00, зміни логіку або збільш endHour.

    console.log("Згенеровано можливі слоти:", times);
    return times;
}

// ===============================================================
// РОБОТА З ФОРМОЮ ТА ЧАСОМ
// ===============================================================

/**
 * Оновлює випадаючий список часу на основі вибраної дати.
 * @param {string} selectedDate - Дата у форматі YYYY-MM-DD.
 */
async function updateAvailableTimes(selectedDate) {
    // Блокуємо список часу і показуємо статус завантаження
    timeSelect.disabled = true;
    timeSelect.innerHTML = '<option value="" disabled selected>Завантаження...</option>';
    timeStatus.textContent = 'Отримання даних про зайнятість...';
    timeStatus.style.color = '#888'; // Сірий колір для статусу
    msg.textContent = ''; // Очищаємо загальне повідомлення форми

    try {
        // 1. Формуємо URL для GET-запиту з датою
        const url = `${scriptURL}?date=${selectedDate}`;
        console.log("Запит на URL:", url);

        // 2. Робимо запит до Apps Script для отримання зайнятих часів
        const response = await fetch(url);

        // 3. Обробляємо відповідь
        if (!response.ok) {
            // Спробуємо отримати деталі помилки з JSON відповіді сервера
            let errorDetails = `HTTP статус ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData && errorData.error) {
                    errorDetails = errorData.error;
                }
            } catch (e) { /* Не вдалося розпарсити JSON помилки */ }
            throw new Error(`Помилка отримання даних: ${errorDetails}`);
        }

        const bookedTimes = await response.json(); // Очікуємо масив рядків ["HH:MM", "HH:MM", ...] або об'єкт з помилкою

        // Перевіряємо, чи відповідь є масивом (успіх) чи об'єктом (можливо, помилка з doGet)
        if (!Array.isArray(bookedTimes)) {
            if (bookedTimes && bookedTimes.error) {
                 throw new Error(`Помилка сервера: ${bookedTimes.error}`);
            } else {
                 throw new Error("Сервер повернув неочікувану відповідь.");
            }
        }

        console.log(`Отримано зайняті слоти для ${selectedDate}:`, bookedTimes);

        // 4. Генеруємо всі можливі слоти часу
        const allPossibleTimes = generateAllPossibleTimes();

        // 5. Визначаємо доступні слоти (всі можливі мінус зайняті)
        const availableTimes = allPossibleTimes.filter(time => !bookedTimes.includes(time));
        console.log("Доступні слоти:", availableTimes);

        // 6. Оновлюємо випадаючий список <select>
        timeSelect.innerHTML = ''; // Очищаємо старі опції

        if (availableTimes.length > 0) {
            // Додаємо опцію за замовчуванням
            timeSelect.innerHTML += '<option value="" disabled selected>Оберіть вільний час</option>';
            // Додаємо доступні слоти
            availableTimes.forEach(time => {
                timeSelect.innerHTML += `<option value="${time}">${time}</option>`;
            });
            timeSelect.disabled = false; // Розблоковуємо список
            timeStatus.textContent = ''; // Прибираємо статус завантаження
        } else {
            // Якщо вільних слотів немає
            timeSelect.innerHTML = '<option value="" disabled selected>На цю дату вільних годин немає</option>';
            timeStatus.textContent = 'Немає вільних годин';
            timeStatus.style.color = '#cc0000'; // Червоний колір
            timeSelect.disabled = true; // Залишаємо заблокованим
        }

    } catch (error) {
        console.error('Помилка при оновленні доступного часу:', error);
        // Показуємо помилку користувачеві
        timeSelect.innerHTML = '<option value="" disabled selected>Помилка завантаження</option>';
        timeStatus.textContent = `Помилка: ${error.message}`;
        timeStatus.style.color = '#cc0000'; // Червоний колір
        timeSelect.disabled = true;
    }
}

// ===============================================================
// ОБРОБНИКИ ПОДІЙ
// ===============================================================

// Обробник зміни дати
dateInput.addEventListener('change', (event) => {
    const selectedDate = event.target.value;
    if (selectedDate) {
        updateAvailableTimes(selectedDate);
    } else {
        // Якщо дату очистили
        timeSelect.disabled = true;
        timeSelect.innerHTML = '<option value="" disabled selected>Спочатку оберіть дату</option>';
        timeStatus.textContent = '';
        msg.textContent = '';
    }
});

// Обробник відправки форми
form.addEventListener('submit', e => {
    e.preventDefault(); // Запобігаємо стандартній відправці

    // Перевіряємо, чи обрано час (додаткова перевірка, хоча select required)
    if (!timeSelect.value) {
        msg.textContent = 'Будь ласка, оберіть доступний час візиту.';
        msg.style.color = 'red';
        // Встановлюємо фокус на вибір часу, якщо можливо
        timeSelect.focus();
        return;
    }

    // Показуємо статус відправки
    msg.textContent = 'Відправка даних...';
    msg.style.color = 'orange'; // Помаранчевий колір для статусу
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true; // Блокуємо кнопку під час відправки

    fetch(scriptURL, { method: 'POST', body: new FormData(form)})
        .then(response => response.json()) // Очікуємо JSON відповідь від doPost
        .then(data => {
            console.log('Відповідь сервера (doPost):', data);
            if (data.result === 'Success') {
                msg.textContent = data.message || 'Дякуємо! Ваш запис успішно відправлено.';
                msg.style.color = 'green'; // Зелений колір успіху
                form.reset(); // Очищаємо форму
                // Скидаємо список часу до початкового стану
                timeSelect.disabled = true;
                timeSelect.innerHTML = '<option value="" disabled selected>Спочатку оберіть дату</option>';
                timeStatus.textContent = '';
            } else {
                // Якщо doPost повернув помилку
                msg.textContent = 'Помилка запису: ' + (data.message || 'Не вдалося відправити дані.');
                msg.style.color = 'red'; // Червоний колір помилки
            }
        })
        .catch(error => {
            console.error('Помилка fetch при відправці форми!', error);
            msg.textContent = 'Помилка мережі або сервера при відправці! Спробуйте пізніше.';
            msg.style.color = 'red';
        })
        .finally(() => {
             // Розблоковуємо кнопку відправки незалежно від результату
            if (submitButton) submitButton.disabled = false;
        });
});

// Опціонально: Встановлення мінімальної дати для dateInput на сьогодні
const today = new Date().toISOString().split('T')[0];
dateInput.setAttribute('min', today);

// Початкове скидання поля часу, якщо сторінка перезавантажилась зі старими значеннями
timeSelect.disabled = true;
timeSelect.innerHTML = '<option value="" disabled selected>Спочатку оберіть дату</option>';
timeStatus.textContent = '';
// Якщо дата вже вибрана при завантаженні (наприклад, браузер відновив), завантажуємо час
if (dateInput.value) {
   updateAvailableTimes(dateInput.value);
}
