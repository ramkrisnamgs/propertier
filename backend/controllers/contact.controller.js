import Contact from '../models/contact.model.js';
import sendEmail from '../utils/sendEmail.js';

// Create a contact
export const createContact = async (req, res) => {
    try {
        const { name, email, phone, role, message } = req.body;
        const contact = new Contact({ name, email, phone, role, message });

        await contact.save();

        // Notify Admin
        const adminEmail = process.env.SMTP_USER;
        const adminMessage = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
                <h2 style="color: #0d9488;">New Contact Request</h2>
                <p>You have received a new message from the platform.</p>
                <div style="background: #f8fafc; padding: 20px; border-radius: 10px; border: 1px solid #e2e8f0;">
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Phone:</strong> ${phone || 'N/A'}</p>
                    <p><strong>Role:</strong> ${role}</p>
                    <p style="margin-top: 15px;"><strong>Message:</strong></p>
                    <p style="font-style: italic; color: #475569;">"${message}"</p>
                </div>
                </div>
            </div>
        `;

        try {
            await sendEmail({
                email: adminEmail,
                subject: `New Contact Message from ${name}`,
                message: adminMessage
            })
        } catch (emailErr) {
            console.error("Admin notification email failed: ", emailErr.message);
        }

        res.status(201).json({
            success: true,
            message: "Email send successfully!"
        });
    } catch (error) {
        console.error("Contact Error: ", error)
        res.status(500).json({
            success: false,
            message: error.message || "Failed to send message!"
        });
    }
};

// Get all contacts (admin)
export const getAllContacts = async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            contacts
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch contacts!"
        });
    }
}