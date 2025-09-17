// Debug endpoint to check database
import { createSupabaseClient } from './shared.js';

function maskPhoneNumber(phone) {
  if (!phone) return 'Unknown';
  const cleaned = phone.replace(/\s+/g, '');
  if (cleaned.length < 4) return '***';

  // Show only last 4 digits: +1234567890 → +1234***7890
  const start = cleaned.slice(0, -4);
  const end = cleaned.slice(-4);
  const masked = start.slice(0, 2) + '***' + end;
  return masked;
}

export default async function handler(req, res) {
  // Add basic authentication check
  const authHeader = req.headers.authorization;
  const expectedAuth = process.env.DEBUG_AUTH_TOKEN;

  if (expectedAuth && authHeader !== `Bearer ${expectedAuth}`) {
    return res.status(401).json({ error: 'Unauthorized - Debug access restricted' });
  }

  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .limit(10);

    if (error) {
      res.status(500).json({ error: error.message });
    } else {
      // Mask phone numbers for privacy
      const maskedSessions = data.map(session => ({
        id: session.id,
        phone_number: maskPhoneNumber(session.phone_number),
        current_node: session.current_node,
        created_at: session.created_at,
        updated_at: session.updated_at
      }));

      res.status(200).json({
        sessions: maskedSessions,
        count: data.length,
        supabase_url: process.env.SUPABASE_URL ? 'Set' : 'Missing',
        note: 'Phone numbers are masked for privacy'
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}