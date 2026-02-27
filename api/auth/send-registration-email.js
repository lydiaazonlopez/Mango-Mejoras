import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email required' });
    }

    const result = await resend.emails.send({
      from: 'noreply@mango-automation.com',
      to: process.env.ADMIN_EMAIL,
      subject: `📝 Nueva solicitud de registro - ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #232a42;">Nueva Solicitud de Registro</h2>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p style="margin: 0;"><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
          </div>
          <p style="margin-top: 30px;">
            <a href="${process.env.VERCEL_URL || 'https://tu-dominio.com'}/admin.html" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Ir al Panel Admin</a>
          </p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">© 2024 MANGO. Todos los derechos reservados.</p>
        </div>
      `
    });

    console.log(`✅ Email enviado a ${process.env.ADMIN_EMAIL}`);
    res.status(200).json({ success: true, messageId: result.id });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
