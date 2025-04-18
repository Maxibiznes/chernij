function saveChanges(row, originalData) {
  const fields = row.querySelectorAll("td:not(:last-child):not(:first-child)");
  const updatedData = [originalData[0]]; // Зберігаємо номер рядка
  fields.forEach(field => updatedData.push(field.textContent.trim()));
  
  if (!/^\d{4}-\d{2}-\d{2}$/.test(updatedData[1])) {
    alert("Невірний формат дати (yyyy-MM-dd).");
    return;
  }
  if (!/^\d{2}:\d{2}$/.test(updatedData[2])) {
    alert("Невірний формат часу (HH:mm).");
    return;
  }
  if (!updatedData[4]) {
    alert("Ім’я не може бути порожнім.");
    return;
  }
  if (!/^\+?\d{10,12}$/.test(updatedData[5])) {
    alert("Невірний формат телефону.");
    return;
  }
  
  // Логування для дебагу
  console.log("Original Data:", originalData);
  console.log("Updated Data:", updatedData);
  
  // Перевірка коректності originalData
  if (!originalData || !Array.isArray(originalData) || originalData.length !== 6) {
    console.error("Некоректний originalData:", originalData);
    alert("Помилка: Некоректні дані для оновлення.");
    return;
  }
  
  const data = {
    action: "update",
    original: originalData.slice(1),
    updated: updatedData.slice(1)
  };
  
  console.log("Data sent to server:", JSON.stringify(data));

  fetch("https://script.google.com/macros/s/AKfycbx_Sjqds2oIId57hsSTh2tgDTY8NuW6MxoBEYc5g3VhRC9dlumHhch0q1INORNVcoy3/exec", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  })
  .then(response => response.text())
  .then(result => {
    if (result !== "Success") throw new Error(result);
    alert("Запис успішно оновлено!");
    showAppointments();
  })
  .catch(error => {
    console.error("Fetch error:", error);
    alert("Помилка оновлення запису: " + error.message);
  });
}
