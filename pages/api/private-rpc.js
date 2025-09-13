// pages/api/private-rpc.js  (server-only)
import { supabaseAdmin } from '../../lib/supabaseAdmin'; // pages/api -> ../../lib

export default async function handler(req, res) {
  try {
    const { train_no } = req.body;
    if (!train_no) return res.status(400).json({ error: 'train_no required' });

    const { data, error } = await supabaseAdmin.rpc('rpc_get_sensitive_data', { p_train_no: train_no });
    if (error) {
      console.error('private-rpc error:', error);
      return res.status(500).json({ error: String(error) });
    }
    return res.json({ data });
  } catch (err) {
    console.error('private-rpc exception:', err);
    return res.status(500).json({ error: String(err) });
  }
}
