import { query as _query } from '../config/db.config.js'; 
import { compare, hash } from 'bcrypt';

export async function updatePassword(req, res) {
    const { email, currentPassword, newPassword, confirmNewPassword } = req.body;

    try {
        const query = 'SELECT * FROM user WHERE email = ?';
        _query(query, [email], async (err, result) => {
            if (err) {
                console.error('Error retrieving user data:', err);
                return res.status(500).json({ error: "An error occurred while retrieving user data" });
            }
            if (result.length === 0) {
                return res.status(401).json({ error: "User not found" });
            }

            const user = result[0];

            const passwordMatch = await compare(currentPassword, user.password);
            if (!passwordMatch) {
                return res.status(401).json({ error: "Current password is incorrect" });
            }

            if (newPassword === currentPassword) {
                return res.status(400).json({ error: "New password cannot be the same as the current password" });
            }

            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

            if (newPassword !== confirmNewPassword) {
                return res.status(400).json({ error: "New password and confirm new password do not match" });
            }

            if (!passwordRegex.test(newPassword)) {
                return res.status(400).json({ error: "New password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)" });
            }

            const hashedNewPassword = await hash(newPassword, 10);

            const updateQuery = 'UPDATE user SET password = ? WHERE email = ?';
            _query(updateQuery, [hashedNewPassword, email], (err, result) => {
                if (err) {
                    console.error('Error updating password:', err);
                    return res.status(500).json({ error: "An error occurred while updating password" });
                }
                res.status(200).json({ message: "Password updated successfully" });
            });
        });
    } catch (error) {
        console.error('Error updating password:', error);
        return res.status(500).json({ error: "An error occurred while updating password" });
    }
}
