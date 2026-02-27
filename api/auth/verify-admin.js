import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Verificar admin password
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { adminPassword } = req.body;

    if (!adminPassword) {
      return res.status(400).json({ error: 'Admin password required' });
    }

    const isValid = adminPassword === process.env.ADMIN_PASSWORD;
    res.status(200).json({ valid: isValid });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
