// Debug endpoint to check database
import { createSupabaseClient } from './shared.js';

export default async function handler(req, res) {
  try {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .limit(10);

    if (error) {
      res.status(500).json({ error: error.message });
    } else {
      res.status(200).json({
        sessions: data,
        count: data.length,
        supabase_url: process.env.SUPABASE_URL ? 'Set' : 'Missing'
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}