import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Inicializar clientes
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

// Middleware para verificar admin
const verifyAdmin = (req, res, next) => {
  const { adminPassword } = req.body;
  if (adminPassword !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Admin password incorrect' });
  }
  next();
};

// Enviar email de notificación de registro al admin
router.post('/send-registration-email', async (req, res) => {
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
            <a href="https://tu-dominio.com/admin.html" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Ir al Panel Admin</a>
          </p>
        </div>
      `
    });

    console.log(`✅ Email enviado a ${process.env.ADMIN_EMAIL}`);
    res.json({ success: true, messageId: result.id });
  } catch (error) {
    console.error('Error enviando email:', error);
    res.status(500).json({ error: error.message });
  }
});

// Aprobar registro
router.post('/approve-registration', verifyAdmin, async (req, res) => {
  try {
    const { registrationId, email, name, passwordHash } = req.body;

    // 1. Crear usuario
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
          <p><a href="https://tu-dominio.com/index.html" style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Acceder a MANGO</a></p>
        </div>
      `
    });

    console.log(`✅ Usuario ${email} aprobado`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error aprobando:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rechazar registro
router.post('/reject-registration', verifyAdmin, async (req, res) => {
  try {
    const { registrationId, email } = req.body;

    // 1. Eliminar de pending_registrations
    const { error: deleteError } = await supabase
      .from('pending_registrations')
      .delete()
      .eq('id', registrationId);

    if (deleteError) throw deleteError;

    // 2. Enviar email de rechazo
    await resend.emails.send({
      from: 'noreply@mango-automation.com',
      to: email,
      subject: '❌ Tu solicitud de registro ha sido rechazada',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #232a42;">Solicitud de Registro Rechazada</h2>
          <p>Tu solicitud de registro en MANGO Marketing Automation ha sido rechazada.</p>
          <p>Si crees que esto es un error, por favor contacta con el administrador.</p>
        </div>
      `
    });

    console.log(`❌ Usuario ${email} rechazado`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error rechazando:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verificar admin password
router.post('/verify-admin', (req, res) => {
  const { adminPassword } = req.body;
  if (adminPassword === process.env.ADMIN_PASSWORD) {
    res.json({ valid: true });
  } else {
    res.status(401).json({ valid: false });
  }
});

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

export default router;
