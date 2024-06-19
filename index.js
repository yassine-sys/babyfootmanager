const express = require('express');
const { Pool } = require('pg');
const WebSocket = require('ws');
const app = express();
const port = 3000;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'babyfoot_manager',
  password: 'root',
  port: 5432,
});

app.use(express.json());
app.use(express.static('public'));

const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('New client connected');
});

function broadcast(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

app.post('/parties', async (req, res) => {
  const { nom } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO parties (nom) VALUES ($1) RETURNING *',
      [nom]
    );
    const partie = result.rows[0];
    console.log(partie);  // Ajoutez ce log pour vérifier les données
    broadcast({ type: 'CREATE', partie });
    res.status(201).json(partie);
  } catch (error) {
    console.error(`Erreur lors de l'ajout de la partie : ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/parties/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM parties WHERE id = $1', [id]);
    broadcast({ type: 'DELETE', id: parseInt(id) });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/parties/:id/terminee', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('UPDATE parties SET terminee = TRUE WHERE id = $1 RETURNING *', [id]);
    const partie = result.rows[0];
    broadcast({ type: 'UPDATE', partie });
    res.json(partie);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/parties', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM parties ORDER BY date_creation DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/compteur', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM parties WHERE terminee = FALSE');
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
