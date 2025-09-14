// pages/api/run-heavy.js
import db from '../../lib/db';

export default async function handler(req, res) {
  try {
    const { rows } = /* db.query removed: use RPC or pg client */ null FROM outlets');
    res.status(200).json({ ok: true, rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'query failed' });
  }
}
