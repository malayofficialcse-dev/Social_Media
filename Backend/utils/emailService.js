import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const sendWelcomeEmail = async (userEmail, username) => {
  const mailOptions = {
    from: `"Innobytes" <${process.env.MAIL_USER}>`,
    to: userEmail,
    subject: 'Welcome to Innobytes! 🚀',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #4f46e5; padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0;">Welcome to Innobytes!</h1>
        </div>
        <div style="padding: 20px;">
          <p>Hi <strong>${username}</strong>,</p>
          <p>We're thrilled to have you join our community! Innobytes is the place where connections grow and ideas flourish.</p>
          <p>You can now start sharing your stories, connecting with others, and exploring what's new in the world of tech and social networking.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Explore Your Feed</a>
          </div>
          <p>If you have any questions, feel free to reply to this email. We're here to help!</p>
          <p>Best regards,<br>The Innobytes Team</p>
        </div>
        <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>&copy; 2025 Innobytes. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent to:', userEmail);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};

export const sendLoginNotificationEmail = async (userEmail, username) => {
  const mailOptions = {
    from: `"Innobytes" <${process.env.MAIL_USER}>`,
    to: userEmail,
    subject: 'New Login Detected - Innobytes',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
        <div style="background-color: #111827; padding: 20px; text-align: center; color: white;">
          <h1 style="margin: 0;">Security Alert: New Login</h1>
        </div>
        <div style="padding: 20px;">
          <p>Hi <strong>${username}</strong>,</p>
          <p>We noticed a new login to your Innobytes account on <strong>${new Date().toLocaleString()}</strong>.</p>
          <p>If this was you, you can safely ignore this email. No further action is required.</p>
          <p>If you did not authorize this login, please change your password immediately to secure your account.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Secure My Account</a>
          </div>
          <p>Stay safe,<br>The Innobytes Team</p>
        </div>
        <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>&copy; 2025 Innobytes. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Login notification email sent to:', userEmail);
  } catch (error) {
    console.error('Error sending login notification email:', error);
  }
};
