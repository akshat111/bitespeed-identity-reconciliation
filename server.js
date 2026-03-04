require("dotenv").config();
const app = require("./src/app");
const { createContactsTable } = require("./src/models/contactModel");

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // Initialise DB table
        await createContactsTable();

        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error("Failed to start server:", err.message);
        process.exit(1);
    }
};

startServer();
