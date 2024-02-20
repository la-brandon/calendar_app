document.addEventListener("DOMContentLoaded", async function () {
  // This here is creating containers/buttons/displays
  const calendarContainer = document.querySelector("#calendar");
  const monthYearDisplay = document.querySelector("#month-year-display");
  const prevBtn = document.querySelector(".prev-btn");
  const nextBtn = document.querySelector(".next-btn");

  // This is interchangeable values for months and years for the calendar
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();

  // Photo files and container
  const photoFiles = [];
  let journalEntryContainer;

  // The journal data is stored here
  const journalData = {};

  // Sidebar stuff...
  const toggleButton = document.getElementById("toggleSidebar");
  const sidebar = document.querySelector(".sidebar");
  const contentContainer = document.querySelector(".calendar-container");

  async function initializeApp() {
    // Event listener for the previous button
    prevBtn.addEventListener("click", function () {
      currentMonth--;
      if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
      }
      generateCalendar(currentMonth, currentYear);
    });

    // Event listener for the next button
    nextBtn.addEventListener("click", function () {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
      generateCalendar(currentMonth, currentYear);
    });

    // Event listener for the sidebar toggle button
    toggleButton.addEventListener("click", function () {
      sidebar.classList.toggle("hidden");
      contentContainer.classList.toggle("hidden");
    });

    // Fetch existing journal entries
    await fetchExistingJournalEntries();
  }

  // Function to fetch existing journal entries
  async function fetchExistingJournalEntries() {
    try {
      const response = await fetch("/api/journal/all");
      console.log("Response status:", response.status);

      if (response.ok) {
        const contentLength = response.headers.get("Content-Length");
        if (contentLength === "0") {
          console.log("No journal entries found.");
          // Handle the case when there are no entries (you can display a message or simply return and do nothing)
          return;
        }

        const text = await response.text();
        try {
          const jsonData = JSON.parse(text);
          if (Array.isArray(jsonData)) {
            // Process the entries...
            jsonData.forEach((entry) => {
              const date = entry.date.split("T")[0]; // Extract the date part
              // console.log(date);
              // console.log(entry);
              journalData[date] = entry;
            });
            generateCalendar(currentMonth, currentYear);
          } else {
            console.error("Invalid JSON format in response:", jsonData);
          }
        } catch (parseError) {
          console.error("Error parsing JSON in response:", parseError);
        }
      } else {
        console.error(
          "Error fetching existing journal entries:",
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error fetching existing journal entries:", error);
    }
    generateSideData();
  }

  // Function to generate the calendar for a specific month and year
  function generateCalendar(month, year) {
    // Create an array to store the days of the week
    const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];

    // Generate the HTML for the days of the week row
    const daysOfWeekHTML = daysOfWeek
      .map((day) => `<div class="date-cell">${day}</div>`)
      .join("");

    // console.log(daysOfWeekHTML);

    const firstDay = new Date(year, month, 1);
    const startingDay = firstDay.getDay();
    const lastDay = new Date(year, month + 1, 0);
    const numDays = lastDay.getDate();

    const dates = [];
    // Generate dates from previous month...
    for (let i = 0; i < startingDay; i++) {
      const prevMonthDate = new Date(year, month, 0 - i);
      const prevMonthDateString = `${prevMonthDate.getFullYear()}-${(
        prevMonthDate.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}-${prevMonthDate
        .getDate()
        .toString()
        .padStart(2, "0")}`;
      const prevMonthDateCellHtml = `<div class='date-cell previous-month' data-date='${prevMonthDateString}'>${prevMonthDate.getDate()}</div>`;
      dates.unshift(prevMonthDateCellHtml);
    }

    // Generate dates from current month...
    for (let date = 1; date <= numDays; date++) {
      const dateString = `${year}-${(month + 1)
        .toString()
        .padStart(2, "0")}-${date.toString().padStart(2, "0")}`;
      const journalEntry = journalData[dateString];

      // Determine if the date is from the current month, previous month, or next month
      const currentDate = new Date(year, month, date);
      const cellClass =
        currentDate.getMonth() === currentMonth
          ? "current-month"
          : currentDate < firstDay
          ? "previous-month"
          : "next-month";

      const dateCellHtml = `<div class='date-cell ${cellClass} ${
        journalEntry ? "has-entry" : ""
      }' data-date='${dateString}'>${date}</div>`;
      dates.push(dateCellHtml);
    }

    // Generate dates from next month...
    while (dates.length < 42) {
      // Dates from the next month
      const nextMonthDate = new Date(
        year,
        month + 1,
        dates.length - numDays + 1 - startingDay
      );
      const nextMonthDateString = `${nextMonthDate.getFullYear()}-${(
        nextMonthDate.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}-${nextMonthDate
        .getDate()
        .toString()
        .padStart(2, "0")}`;
      const nextMonthDateCellHtml = `<div class='date-cell next-month' data-date='${nextMonthDateString}'>${nextMonthDate.getDate()}</div>`;
      dates.push(nextMonthDateCellHtml);
    }

    calendarContainer.innerHTML = `
    ${daysOfWeekHTML}
    ${dates.join("")}
  `;

    // Update the month and year display
    const monthName = new Date(year, month).toLocaleString("default", {
      month: "long",
    });
    monthYearDisplay.textContent = `${monthName} ${year}`;

    // Grab each date and add an event click listener to it
    // For the days with an entry the display journal popup on click and add thumbtack
    // For the days without an entry display the submission form on click
    const dateCells = calendarContainer.querySelectorAll(".date-cell");
    dateCells.forEach((dateCell) => {
      dateCell.addEventListener("click", function () {
        const date = dateCell.getAttribute("data-date");
        if (dateCell.classList.contains("has-entry")) {
          generateThumbtack(dateCell);
          displayJournalPopup(date);
        } else {
          console.log("No entry for this date... Should show submission form");
          showSubmissionForm(date);
        }
      });
    });
  }

  // Function to display the journal entry form for a specific date
  function showSubmissionForm(date) {
    const popupContainer = document.getElementById("popup-container");
    const popupContent = document.getElementById("popup-content");

    const journalEntryFormHTML = `
        <form id="journal-form">
            <input type="text" id="journal-title" placeholder="Title (optional)">
            <input type="text" id="journal-time" placeholder="Time (optional)">
            <textarea id="journal-text" placeholder="Enter your journal entry for ${date}..."></textarea>
            <input type="file" id="photo-upload" accept="image/*" multiple>
            <input type="button" id="save-button" value="Save">
        </form>  
    `;

    popupContent.innerHTML = journalEntryFormHTML;
    popupContainer.style.display = "block";
    console.log("Getting here?");
    const saveButton = document.querySelector("#save-button");
    saveButton.addEventListener("click", async (event) => {
      event.preventDefault(); // Prevent the default form submission

      const journalTitle = document.querySelector("#journal-title").value;
      const journalTime = document.querySelector("#journal-time").value;
      const journalText = document.querySelector("#journal-text").value;
      const photoUpload = document.querySelector("#photo-upload");
      const photoFiles = Array.from(photoUpload.files);

      const formData = new FormData();
      formData.append("date", date);
      formData.append("title", journalTitle);
      formData.append("time", journalTime);
      formData.append("text", journalText);
      photoFiles.forEach((file) => {
        formData.append("photos", file);
      });

      try {
        const result = await fetch("/api/journal", {
          method: "POST",
          body: formData, // Use the FormData object for file uploads
        });

        if (result.ok) {
          const responseData = await result.json();
          console.log("Saved journal entry:", responseData);

          // Close the pop-up
          closePopup();

          // Update the calendar to reflect the new added entry
          fetchExistingJournalEntries();
          generateCalendar(currentMonth, currentYear);
        }
      } catch (error) {
        console.error("Error saving journal entry:", error);
        // Handle error and update UI accordingly
      }
    });

    // Store selected files in the photoFiles array
    const photoUpload = document.querySelector("#photo-upload");
    photoUpload.addEventListener("change", function (event) {
      const files = Array.from(event.target.files);
      photoFiles.push(...files);
      console.log("Selected photo files:", photoFiles);
    });
  }

  // Function to generate date links in the sidebar
  async function generateSideData() {
    // Get the memories list element and also the reminders list element
    // These were created in the html
    const memoriesList = document.querySelector("#memories ul");
    const remindersList = document.querySelector("#reminders ul");

    // Formatting of our list...
    // Want to remove the existing links and recalculate the list
    memoriesList.innerHTML = "";
    remindersList.innerHTML = "";

    // Extracting the journal entries
    const journalEntries = Object.values(journalData);

    // Sort the entries by date...
    journalEntries.sort((a, b) => new Date(a.date) - new Date(b.date));
    // console.log(journalEntries);

    // Iterate through sorted date strings and add date links for entries
    journalEntries.forEach((dateEntry) => {
      // Create a new <li> element for the date link
      const dateLink = document.createElement("li");

      // Retrieve current date
      const currentDate = new Date();

      // Display title and date for reminders
      dateLink.innerHTML = `<a href="#" class="date-link" data-date="${
        dateEntry.date
      }">${dateEntry.title || dateEntry.date}</a>`;

      // If date is older than current date, then it is saved as a memory... YAY
      if (new Date(dateEntry.date) < currentDate) {
        memoriesList.appendChild(dateLink);
        console.log("Rendered as memory");
      }
      // If data is newer than current date, then it is saved as a reminder... YAY
      else {
        remindersList.appendChild(dateLink);
        console.log("Rendered as reminder");
      }

      // Add a click event listener to each date link
      dateLink.addEventListener("click", handleDateLinkClick);
    });

    // Define an async function to handle the click event
    async function handleDateLinkClick(event) {
      event.preventDefault();
      const selectedDate = event.target.getAttribute("data-date");
      // Display pop-up when date clicked
      displayJournalPopup(selectedDate);
    }
  }

  // Function to generate thumbtacks
  function generateThumbtack(dateCell) {
    // Create a new <i> element for the thumbtack icon
    const thumbtackIcon = document.createElement("i");
    thumbtackIcon.classList.add("fa-solid", "fa-thumbtack");
    // Create a container element for the icon and set its style
    const iconContainer = document.createElement("div");
    iconContainer.classList.add("icon-container");
    // Append the thumbtack icon to the container and the container to the date cell
    iconContainer.appendChild(thumbtackIcon);
    dateCell.appendChild(iconContainer);
  }

  // Function to display the journal entry as a pop-up
  function displayJournalPopup(selectedDate) {
    const journalEntry = journalData[selectedDate];
    const popupContainer = document.getElementById("popup-container");
    const popupContent = document.getElementById("popup-content");

    if (journalEntry) {
      const journalEntryHTML = `
      <div class="journal-entry">${journalEntry.text}</div>
      <div class="journal-photo">
        ${journalEntry.photos
          .map((photoUrl) => `<img src="${photoUrl}" alt="Journal Photo">`)
          .join("")}
      </div>
    `;
      popupContent.innerHTML = journalEntryHTML;
    } else {
      popupContent.innerHTML = "<p>No journal entry for this date.</p>";
    }

    // Calculate the position of the selected date cell
    console.log(selectedDate);
    const dateCell = document.querySelector(`[data-date="${selectedDate}"]`);

    popupContainer.style.display = "block";
  }

  // Function to close the pop-up
  function closePopup() {
    const popupContainer = document.getElementById("popup-container");
    popupContainer.style.display = "none";
  }

  // Initialize the app !!
  initializeApp();
});
