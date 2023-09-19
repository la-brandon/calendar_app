document.addEventListener("DOMContentLoaded", async function () {
  // This here is creating containers/buttons/displays
  const calendarContainer = document.querySelector("#calendar");
  const monthYearDisplay = document.querySelector("#month-year-display");
  const prevBtn = document.querySelector(".prev-btn");
  const nextBtn = document.querySelector(".next-btn");
  const journalContainer = document.querySelector("#journal-container");

  // This is interchangeable values for months and years for the calendar
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();

  // Photo files and container
  const photoFiles = [];
  let journalEntryContainer;

  // The journal data is stored here
  const journalData = {};

  async function initializeApp() {
    // Event listener for the date of when a cell is clicked
    calendarContainer.addEventListener("click", async function (event) {
      const dateCell = event.target.closest(".date-cell");
      const isCurrentMonth = dateCell.classList.contains("current-month");

      if (isCurrentMonth) {
        // Handle click only for dates in the current month
        const date = dateCell.getAttribute("data-date");
        generateDayData(dateCell);
      }
    });

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
      if (
        currentMonth == new Date().getMonth() &&
        currentYear == new Date().getFullYear()
      ) {
      } else {
        currentMonth++;
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear++;
        }
        generateCalendar(currentMonth, currentYear);
      }
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
    generateSidebar();
  }

  // Function to display data for that day...
  async function generateDayData(dateCell) {
    console.log("Got into generating day data !!");
    if (dateCell) {
      const date = dateCell.getAttribute("data-date");
      if (!dateCell.classList.contains("has-entry")) {
        console.log("Going here??? AKA no entry but calling method");
        showSubmissionForm(date);
      } else {
        try {
          console.log("Fetching the data for date...");
          const response = await fetch(`/api/journal/${date}`);

          if (response.ok) {
            const journalEntry = await response.json();
            console.log("Journal entry:", journalEntry);
            showJournalEntry(date, journalEntry);
          } else {
            console.error("Error fetching journal entry:", response.statusText);
            showJournalEntry(date, null);
          }
        } catch (error) {
          console.error("Error fetching journal entry:", error);
          showJournalEntry(date, null); // No need to pass connection here
        }
      }
    }
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

    // Insert the thumbtack icon into date cells with entries
    const dateCells = calendarContainer.querySelectorAll(".date-cell");
    dateCells.forEach((dateCell) => {
      if (dateCell.classList.contains("has-entry")) {
        generateThumbtack(dateCell);
      }
    });
  }

  function showJournalEntry(date, journalEntry) {
    console.log("Should be showing something...");
    // Clear previous entries
    journalContainer.innerHTML = "";

    journalEntryContainer = document.createElement("div");
    journalEntryContainer.classList.add("journal-entry-container");
    console.log(journalEntry);

    if (journalEntry) {
      const journalEntryHTML = `
      <div class="journal-entry">${journalEntry.text}</div>
      <div class="journal-photo">
        ${journalEntry.photos
          .map((photoUrl) => `<img src="${photoUrl}" alt="Journal Photo">`)
          .join("")}
      </div>
    `;

      journalEntryContainer.innerHTML = journalEntryHTML;
    }
    journalContainer.appendChild(journalEntryContainer);
  }

  // Function to display the journal entry form for a specific date
  function showSubmissionForm(date) {
    const journalEntryFormHTML = `
    <form id="journal-form">
      <input type="text" id="journal-title" placeholder="Title (optional)">
      <input type="text" id="journal-time" placeholder="Time (optional)">
      <textarea id="journal-text" placeholder="Enter your journal entry for ${date}..."></textarea>
      <input type="file" id="photo-upload" accept="image/*" multiple>
      <button type="submit">Save</button>
    </form>  
  `;

    journalContainer.innerHTML = journalEntryFormHTML;

    const form = document.querySelector("#journal-form");
    form.addEventListener("submit", async (event) => {
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
          // Find the date cell corresponding to the saved entry
          const dateCell = document.querySelector(`[data-date="${date}"]`);

          if (dateCell) {
            // Add the "has-entry" class to the date cell
            dateCell.classList.add("has-entry");
            generateThumbtack(dateCell);
            console.log("Refetching data");
            fetchExistingJournalEntries();
          }

          // Remove the form container after saving
          journalContainer.innerHTML = "";
        } else {
          console.error("Error saving journal entry:", result.status);
          // Handle error and update UI accordingly
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
  async function generateSidebar() {
    const sidebar = document.querySelector("#sidebar ul");
    sidebar.innerHTML = ""; // Clear existing links

    const journalEntries = Object.values(journalData);

    journalEntries.sort((a, b) => new Date(a.date) - new Date(b.date));
    console.log(journalEntries);

    // Iterate through sorted date strings and add date links for entries
    journalEntries.forEach((dateEntry) => {
      const dateLink = document.createElement("li");
      if (dateEntry.title != "") {
        // Display title and date instead if there is a title...
        // console.log("Getting here?");
        dateLink.innerHTML = `<a href="#" class="date-link" data-date="${dateEntry.date}">${dateEntry.title} - ${dateEntry.date}</a>`;
      } else {
        dateLink.innerHTML = `<a href="#" class="date-link" data-date="${dateEntry.date}">${dateEntry.date}</a>`;
      }

      // Add a click event listener to each date link
      dateLink.addEventListener("click", handleDateLinkClick);
      // console.log(dateLink);
      sidebar.appendChild(dateLink);
    });

    // Define an async function to handle the click event
    async function handleDateLinkClick(event) {
      event.preventDefault();
      const selectedDate = event.target.getAttribute("data-date");
      const dateCell = calendarContainer.querySelector(
        `[data-date="${selectedDate}"]`
      );
      // console.log(dateCell);

      // If sidebar date is on the calendar month currently...
      if (dateCell != null) {
        generateDayData(dateCell);
      }
      // If sidebar date is not on the current calendar month...
      else {
        console.log("Retrieving from month not shown on calendar");
        const response = await fetch(`/api/journal/${selectedDate}`);
        const journalEntry = await response.json();
        showJournalEntry(selectedDate, journalEntry);
      }
    }
  }

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

  // Initialize the app !!
  initializeApp();
});
