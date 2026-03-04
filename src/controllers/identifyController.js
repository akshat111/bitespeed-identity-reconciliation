const {
    findMatchingContacts,
    createPrimaryContact,
} = require("../services/contactService");

/**
 * POST /identify
 * Identifies and reconciles contact based on email and/or phoneNumber.
 */
const identifyContact = async (req, res) => {
    try {
        const { email, phoneNumber } = req.body;

        // Validate: at least one must be provided
        if (!email && !phoneNumber) {
            return res.status(400).json({
                error: "Either email or phoneNumber must be provided",
            });
        }

        // Query existing contacts matching email OR phoneNumber
        const existingContacts = await findMatchingContacts(email, phoneNumber);

        // --- Scenario 1: No existing contacts → new primary contact ---
        if (existingContacts.length === 0) {
            const newContact = await createPrimaryContact(email, phoneNumber);

            return res.status(200).json({
                contact: {
                    primaryContactId: newContact.id,
                    emails: newContact.email ? [newContact.email] : [],
                    phoneNumbers: newContact.phonenumber ? [newContact.phonenumber] : [],
                    secondaryContactIds: [],
                },
            });
        }

        // TODO: implement merging logic for existing contacts
        return res.status(200).json({ message: "Existing contact found — merging logic coming soon" });
    } catch (err) {
        console.error("identifyContact error:", err.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { identifyContact };
