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
    const { registrationId, email, adminPassword } = req.body;

    // Verificar admin password
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Admin password incorrect' });
    }

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
          <p style="color: #999; font-size: 12px; margin-top: 30px;">© 2024 MANGO. Todos los derechos reservados.</p>
        </div>
      `
    });

    console.log(`❌ Usuario ${email} rechazado`);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
