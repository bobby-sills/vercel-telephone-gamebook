// Health check endpoint
export default function handler(req, res) {
  res.status(200).json({
    status: 'running',
    message: 'Twilio Adventure Game with Supabase (Serverless)',
    timestamp: new Date().toISOString()
  });
}
