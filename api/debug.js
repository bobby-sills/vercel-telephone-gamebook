// Debug endpoint to check database
import { createSupabaseClient } from './shared.js';


export default async function handler(req, res) {
  // Require authentication - no public access
  const authHeader = req.headers.authorization;
  const expectedAuth = process.env.DEBUG_AUTH_TOKEN;

  if (!expectedAuth) {
    return res.status(503).json({ error: 'Debug endpoint not configured' });
  }

  if (!authHeader || authHeader !== `Bearer ${expectedAuth}`) {
    return res.status(401).json({ error: 'Unauthorized - Authentication required' });
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
      // Show real data since you're authenticated
      res.status(200).json({
        sessions: data,
        count: data.length,
        supabase_url: process.env.SUPABASE_URL ? 'Set' : 'Missing',
        note: 'Authenticated access - showing full data'
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
