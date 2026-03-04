const {
    findMatchingContacts,
    createPrimaryContact,
    createSecondaryContact,
    fetchContactGroup,
} = require("../services/contactService");

/**
 * Builds the standard contact response object from a group of contacts.
 */
const buildContactResponse = (contacts) => {
    const primary = contacts.find((c) => c.linkprecedence === "primary");

    const emails = [
        ...new Set(contacts.map((c) => c.email).filter(Boolean)),
    ];

    const phoneNumbers = [
        ...new Set(contacts.map((c) => c.phonenumber).filter(Boolean)),
    ];

    const secondaryContactIds = contacts
        .filter((c) => c.linkprecedence === "secondary")
        .map((c) => c.id);

    return {
        primaryContactId: primary.id,
        emails,
        phoneNumbers,
        secondaryContactIds,
    };
};

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

        // Step 1: Query existing contacts matching email OR phoneNumber
        const existingContacts = await findMatchingContacts(email, phoneNumber);

        // --- Scenario 1: No existing contacts → create new primary ---
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

        // --- Scenario 2: Existing contacts found ---

        // Step 2: Determine the primary contact
        // Prefer contacts with linkPrecedence = 'primary'; among those pick the oldest
        const primaries = existingContacts.filter(
            (c) => c.linkprecedence === "primary"
        );

        let primaryContact =
            primaries.length > 0
                ? primaries.reduce((oldest, c) =>
                    new Date(c.createdat) < new Date(oldest.createdat) ? c : oldest
                )
                : existingContacts.reduce((oldest, c) =>
                    new Date(c.createdat) < new Date(oldest.createdat) ? c : oldest
                );

        // Step 3: Check if incoming data introduces new information
        const allEmails = existingContacts.map((c) => c.email).filter(Boolean);
        const allPhones = existingContacts.map((c) => c.phonenumber).filter(Boolean);

        const isNewEmail = email && !allEmails.includes(email);
        const isNewPhone = phoneNumber && !allPhones.includes(phoneNumber);

        // Step 4: If new info found → create a secondary contact
        if (isNewEmail || isNewPhone) {
            await createSecondaryContact(email, phoneNumber, primaryContact.id);
        }

        // Step 5: Fetch the full contact group (primary + all its secondaries)
        const contactGroup = await fetchContactGroup(primaryContact.id);

        // Step 6: Build and return the response
        return res.status(200).json({
            contact: buildContactResponse(contactGroup),
        });
    } catch (err) {
        console.error("identifyContact error:", err.message);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { identifyContact };
