import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { registrationId, email, name, passwordHash, adminPassword } = req.body;

    // Verificar admin password
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Admin password incorrect' });
    }

    // 1. Crear usuario en tabla users
    const { error: insertError } = await supabase
      .from('users')
      .insert([{ email, name, password_hash: passwordHash }]);

    if (insertError) throw insertError;

    // 2. Eliminar de pending_registrations
    const { error: deleteError } = await supabase
      .from('pending_registrations')
      .delete()
      .eq('id', registrationId);

    if (deleteError) throw deleteError;

    // 3. Enviar email de bienvenida
    await resend.emails.send({
      from: 'noreply@mango-automation.com',
      to: email,
      subject: '✅ Tu registro ha sido aprobado - MANGO',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #232a42;">¡Bienvenido a MANGO! 🎉</h2>
          <p>Hola ${escapeHtml(name)},</p>
          <p>Tu solicitud de registro ha sido <strong>aprobada</strong>. Ya puedes acceder a MANGO Marketing Automation.</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p style="margin: 0;">Tu contraseña es la que registraste.</p>
          </div>
          <p><a href="${process.env.VERCEL_URL || 'https://tu-dominio.com'}/index.html" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Acceder a MANGO</a></p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">© 2024 MANGO. Todos los derechos reservados.</p>
        </div>
      `
    });

    console.log(`✅ Usuario ${email} aprobado`);
    res.status(200).json({ success: true });
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
