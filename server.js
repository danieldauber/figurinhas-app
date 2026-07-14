import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';
const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS groups (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        group_id VARCHAR(50) REFERENCES groups(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(group_id, name)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS stickers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        sticker_code VARCHAR(50) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('faltante', 'repetida')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, sticker_code, type)
      )
    `);

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_users_group ON users(group_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_stickers_user ON stickers(user_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_stickers_type ON stickers(type)`);

    console.log('✅ Database initialized');
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
}

// Middleware
app.use(express.json());
app.use(express.static(join(__dirname, 'dist')));

// API Routes

// Create group
app.post('/api/groups', async (req, res) => {
  try {
    const { id, name } = req.body;
    const result = await pool.query(
      'INSERT INTO groups (id, name) VALUES ($1, $2) RETURNING *',
      [id, name]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ error: 'Failed to create group' });
  }
});

// Get group info
app.get('/api/groups/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM groups WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ error: 'Failed to fetch group' });
  }
});

// Get all users in a group
app.get('/api/groups/:groupId/users', async (req, res) => {
  try {
    const { groupId } = req.params;

    const usersResult = await pool.query(
      'SELECT id, name, created_at FROM users WHERE group_id = $1 ORDER BY created_at',
      [groupId]
    );

    const users = await Promise.all(usersResult.rows.map(async (user) => {
      const stickersResult = await pool.query(
        'SELECT sticker_code, type FROM stickers WHERE user_id = $1',
        [user.id]
      );

      const faltantes = stickersResult.rows
        .filter(s => s.type === 'faltante')
        .map(s => s.sticker_code);

      const repetidas = stickersResult.rows
        .filter(s => s.type === 'repetida')
        .map(s => s.sticker_code);

      return {
        name: user.name,
        faltantes,
        repetidas,
        password: '***' // Never send real password
      };
    }));

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create user
app.post('/api/groups/:groupId/users', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, password } = req.body;

    const result = await pool.query(
      'INSERT INTO users (group_id, name, password) VALUES ($1, $2, $3) RETURNING id, name, created_at',
      [groupId, name, password]
    );

    res.json({
      name: result.rows[0].name,
      faltantes: [],
      repetidas: [],
      password: '***'
    });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'User already exists' });
    }
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Verify password
app.post('/api/groups/:groupId/users/:userName/verify', async (req, res) => {
  try {
    const { groupId, userName } = req.params;
    const { password } = req.body;

    const result = await pool.query(
      'SELECT password FROM users WHERE group_id = $1 AND name = $2',
      [groupId, userName]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const valid = result.rows[0].password === password;
    res.json({ valid });
  } catch (error) {
    console.error('Error verifying password:', error);
    res.status(500).json({ error: 'Failed to verify password' });
  }
});

// Add sticker
app.post('/api/groups/:groupId/users/:userName/stickers', async (req, res) => {
  try {
    const { groupId, userName } = req.params;
    const { sticker_code, type } = req.body;

    // Get user id
    const userResult = await pool.query(
      'SELECT id FROM users WHERE group_id = $1 AND name = $2',
      [groupId, userName]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userResult.rows[0].id;

    // Check if sticker exists in opposite type
    const oppositeType = type === 'faltante' ? 'repetida' : 'faltante';
    const checkResult = await pool.query(
      'SELECT * FROM stickers WHERE user_id = $1 AND sticker_code = $2 AND type = $3',
      [userId, sticker_code, oppositeType]
    );

    if (checkResult.rows.length > 0) {
      return res.status(409).json({ error: 'Sticker exists in opposite list' });
    }

    await pool.query(
      'INSERT INTO stickers (user_id, sticker_code, type) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [userId, sticker_code, type]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error adding sticker:', error);
    res.status(500).json({ error: 'Failed to add sticker' });
  }
});

// Remove sticker
app.delete('/api/groups/:groupId/users/:userName/stickers/:stickerCode/:type', async (req, res) => {
  try {
    const { groupId, userName, stickerCode, type } = req.params;

    const userResult = await pool.query(
      'SELECT id FROM users WHERE group_id = $1 AND name = $2',
      [groupId, userName]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userResult.rows[0].id;

    await pool.query(
      'DELETE FROM stickers WHERE user_id = $1 AND sticker_code = $2 AND type = $3',
      [userId, stickerCode, type]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error removing sticker:', error);
    res.status(500).json({ error: 'Failed to remove sticker' });
  }
});

// Clear all stickers for user
app.delete('/api/groups/:groupId/users/:userName/stickers', async (req, res) => {
  try {
    const { groupId, userName } = req.params;

    const userResult = await pool.query(
      'SELECT id FROM users WHERE group_id = $1 AND name = $2',
      [groupId, userName]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userResult.rows[0].id;

    await pool.query('DELETE FROM stickers WHERE user_id = $1', [userId]);

    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing stickers:', error);
    res.status(500).json({ error: 'Failed to clear stickers' });
  }
});

// Delete user (admin only)
app.delete('/api/groups/:groupId/users/:userName', async (req, res) => {
  try {
    const { groupId, userName } = req.params;

    await pool.query(
      'DELETE FROM users WHERE group_id = $1 AND name = $2',
      [groupId, userName]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

// Initialize database and start server
initDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎴 App de Figurinhas rodando na porta ${PORT}`);
    console.log(`🚀 Acesse: http://localhost:${PORT}`);
  });
});
