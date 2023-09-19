const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises; // Use the 'fs' module to read/write to text files

const app = express();

// Define multer storage
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix);
  },
});
const upload = multer({ storage: storage });

// Serve static files from the "public" folder
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

// Serve the client-side HTML and JavaScript
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "calendar.html"));
});

// API route to fetch all journal entries
app.get("/api/journal/all", async (req, res) => {
  try {
    const allEntries = await getAllJournalEntriesFromFile(); // Read data from the text file
    res.json(allEntries);
  } catch (error) {
    console.error("Error fetching all journal entries:", error);
    res.status(500).json({ error: "Failed to fetch journal entries" });
  }
});

// API route to get journal entry by date
app.get("/api/journal/:date", async (req, res) => {
  const date = req.params.date;
  try {
    const journalEntry = await getJournalEntryByDateFromFile(date); // Read data from the text file
    res.json(journalEntry);
  } catch (error) {
    console.error("Error fetching journal entry:", error);
    res.status(500).json({ error: "Failed to fetch journal entry" });
  }
});

// API route to create a new journal entry
app.post("/api/journal", upload.array("photos"), async (req, res) => {
  const { date, title, time, text } = req.body;
  const photoFiles = req.files;
  console.log(title);
  console.log(time);
  try {
    await createJournalEntryInFile(date, title, time, text, photoFiles); // Write data to the text file
    res.json({ success: true });
  } catch (error) {
    console.error("Error creating journal entry:", error);
    res.status(500).json({ error: "Failed to create journal entry" });
  }
});

// Function to read all journal entries from the text file
async function getAllJournalEntriesFromFile() {
  try {
    const data = await fs.readFile("journal_data.txt", "utf-8");
    return JSON.parse(data) || [];
  } catch (error) {
    throw error;
  }
}

// Function to read a journal entry by date from the text file
async function getJournalEntryByDateFromFile(date) {
  try {
    const data = await fs.readFile("journal_data.txt", "utf-8");
    const entries = JSON.parse(data) || [];
    return entries.find((entry) => entry.date === date) || null;
  } catch (error) {
    throw error;
  }
}

// Function to create a new journal entry and write it to the text file
async function createJournalEntryInFile(date, title, time, text, photoFiles) {
  try {
    const existingEntries = await getAllJournalEntriesFromFile();
    const photoReferences = [];

    // Save each photo as a separate file and store its reference
    await Promise.all(
      photoFiles.map(async (file) => {
        const uniqueFileName = `${Date.now()}-${file.originalname}`;
        const filePath = path.join(__dirname, "uploads", uniqueFileName);
        await fs.rename(file.path, filePath); // Move the uploaded file
        photoReferences.push(`/uploads/${uniqueFileName}`); // Store the reference
      })
    );
    const newEntry = { date, title, time, text, photos: photoReferences };
    existingEntries.push(newEntry);

    await fs.writeFile(
      "journal_data.txt",
      JSON.stringify(existingEntries, null, 2)
    );
  } catch (error) {
    throw error;
  }
}

// Start the server
const PORT = process.env.PORT || 3000; // Use Heroku's provided port or 3000 locally
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
