// pages/api/private-rpc.js
import { createClient } from '@supabase/supabase-js';

const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE; // NOT NEXT_PUBLIC

const supabaseAdmin = createClient(serviceUrl, serviceKey);

export default async function handler(req, res) {
  const { train_no } = req.body;
  const { data, error } = await supabaseAdmin
    .rpc('rpc_get_sensitive_data', { p_train_no: train_no });
  if (error) return res.status(500).json({ error });
  return res.json(data);
}
