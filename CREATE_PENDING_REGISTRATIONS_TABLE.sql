-- SQL para crear tabla pending_registrations en Supabase

CREATE TABLE pending_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas rápidas
CREATE INDEX idx_pending_registrations_email ON pending_registrations(email);
CREATE INDEX idx_pending_registrations_created_at ON pending_registrations(created_at);

-- RLS (Row Level Security) - Permitir lectura a cualquiera
ALTER TABLE pending_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert pending registrations" ON pending_registrations
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow read pending registrations" ON pending_registrations
FOR SELECT USING (true);

CREATE POLICY "Allow delete pending registrations" ON pending_registrations
FOR DELETE USING (true);
