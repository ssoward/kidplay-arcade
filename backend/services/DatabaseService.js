const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

class DatabaseService {
  constructor() {
    this.db = null;
    this.initialize();
  }

  initialize() {
    // Create database file in backend directory
    const dbPath = path.join(__dirname, '..', 'kidplay_arcade.db');
    console.log('🗄️ Initializing database at:', dbPath);

    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Error opening database:', err.message);
      } else {
        console.log('✅ Connected to SQLite database');
        this.createTables();
      }
    });
  }

  createTables() {
    // Users table
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        display_name TEXT NOT NULL,
        date_of_birth TEXT,
        avatar TEXT,
        preferences TEXT DEFAULT '{}',
        game_stats TEXT DEFAULT '{}',
        parental_controls TEXT DEFAULT '{}',
        privacy_settings TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        is_active BOOLEAN DEFAULT 1
      )
    `;

    // Game sessions table
    const createGameSessionsTable = `
      CREATE TABLE IF NOT EXISTS game_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        game_type TEXT NOT NULL,
        score INTEGER,
        duration_seconds INTEGER,
        completed BOOLEAN DEFAULT 0,
        metadata TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `;

    // Achievements table
    const createAchievementsTable = `
      CREATE TABLE IF NOT EXISTS achievements (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        achievement_type TEXT NOT NULL,
        earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT DEFAULT '{}',
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `;

    // Password reset tokens table
    const createPasswordResetTable = `
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        used BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `;

    // Create all tables
    this.db.serialize(() => {
      this.db.run(createUsersTable, (err) => {
        if (err) console.error('❌ Error creating users table:', err.message);
        else console.log('✅ Users table ready');
      });

      this.db.run(createGameSessionsTable, (err) => {
        if (err) console.error('❌ Error creating game_sessions table:', err.message);
        else console.log('✅ Game sessions table ready');
      });

      this.db.run(createAchievementsTable, (err) => {
        if (err) console.error('❌ Error creating achievements table:', err.message);
        else console.log('✅ Achievements table ready');
      });

      this.db.run(createPasswordResetTable, (err) => {
        if (err) console.error('❌ Error creating password_reset_tokens table:', err.message);
        else console.log('✅ Password reset tokens table ready');
      });

      // Create default admin user if it doesn't exist
      this.createDefaultAdmin();
    });
  }

  async createDefaultAdmin() {
    const adminEmail = 'scott.soward@gmail.com';
    const adminPassword = 'Amorvivir@82';
    
    try {
      const existingAdmin = await this.getUserByEmail(adminEmail);
      if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        const adminUser = {
          id: 'admin-' + Date.now(),
          email: adminEmail,
          password_hash: hashedPassword,
          display_name: 'Admin User',
          preferences: JSON.stringify({
            theme: 'light',
            soundEnabled: true,
            difficulty: 'medium',
            aiInteraction: true,
            notificationsEnabled: true,
            language: 'en'
          }),
          game_stats: JSON.stringify({
            gamesPlayed: 0,
            totalScore: 0,
            averageScore: 0,
            favoriteGames: [],
            achievements: [],
            streaks: { current: 0, longest: 0 },
            skillLevels: {}
          }),
          privacy_settings: JSON.stringify({
            dataCollection: true,
            analytics: true,
            personalization: true,
            shareProgress: false
          })
        };

        await this.createUser(adminUser);
        console.log('✅ Default admin user created');
      } else {
        console.log('✅ Admin user already exists');
      }
    } catch (error) {
      console.error('❌ Error creating default admin:', error.message);
    }
  }

  // User CRUD operations
  async createUser(userData) {
    return new Promise((resolve, reject) => {
      const {
        id, email, password_hash, display_name, date_of_birth,
        avatar, preferences, game_stats, parental_controls, privacy_settings
      } = userData;

      const stmt = this.db.prepare(`
        INSERT INTO users (
          id, email, password_hash, display_name, date_of_birth,
          avatar, preferences, game_stats, parental_controls, privacy_settings
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run([
        id, email, password_hash, display_name, date_of_birth,
        avatar, preferences, game_stats, parental_controls, privacy_settings
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id, ...userData });
        }
      });

      stmt.finalize();
    });
  }

  async getUserByEmail(email) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM users WHERE email = ? AND is_active = 1',
        [email],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            if (row) {
              // Parse JSON fields
              row.preferences = JSON.parse(row.preferences || '{}');
              row.game_stats = JSON.parse(row.game_stats || '{}');
              row.parental_controls = JSON.parse(row.parental_controls || '{}');
              row.privacy_settings = JSON.parse(row.privacy_settings || '{}');
            }
            resolve(row);
          }
        }
      );
    });
  }

  async getUserById(id) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM users WHERE id = ? AND is_active = 1',
        [id],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            if (row) {
              // Parse JSON fields
              row.preferences = JSON.parse(row.preferences || '{}');
              row.game_stats = JSON.parse(row.game_stats || '{}');
              row.parental_controls = JSON.parse(row.parental_controls || '{}');
              row.privacy_settings = JSON.parse(row.privacy_settings || '{}');
            }
            resolve(row);
          }
        }
      );
    });
  }

  async updateUser(id, updates) {
    return new Promise((resolve, reject) => {
      // Convert objects to JSON strings
      const processedUpdates = { ...updates };
      if (processedUpdates.preferences) {
        processedUpdates.preferences = JSON.stringify(processedUpdates.preferences);
      }
      if (processedUpdates.game_stats) {
        processedUpdates.game_stats = JSON.stringify(processedUpdates.game_stats);
      }
      if (processedUpdates.parental_controls) {
        processedUpdates.parental_controls = JSON.stringify(processedUpdates.parental_controls);
      }
      if (processedUpdates.privacy_settings) {
        processedUpdates.privacy_settings = JSON.stringify(processedUpdates.privacy_settings);
      }

      const fields = Object.keys(processedUpdates);
      const values = Object.values(processedUpdates);
      const setClause = fields.map(field => `${field} = ?`).join(', ');

      const stmt = this.db.prepare(`
        UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);

      stmt.run([...values, id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });

      stmt.finalize();
    });
  }

  async updateLastLogin(userId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [userId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ changes: this.changes });
          }
        }
      );
    });
  }

  // Game session operations
  async createGameSession(sessionData) {
    return new Promise((resolve, reject) => {
      const { id, user_id, game_type, score, duration_seconds, completed, metadata } = sessionData;

      const stmt = this.db.prepare(`
        INSERT INTO game_sessions (id, user_id, game_type, score, duration_seconds, completed, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run([
        id, user_id, game_type, score, duration_seconds, completed,
        JSON.stringify(metadata || {})
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id, ...sessionData });
        }
      });

      stmt.finalize();
    });
  }

  async getUserGameSessions(userId, limit = 50) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM game_sessions WHERE user_id = ? 
         ORDER BY created_at DESC LIMIT ?`,
        [userId, limit],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            const sessions = rows.map(row => ({
              ...row,
              metadata: JSON.parse(row.metadata || '{}')
            }));
            resolve(sessions);
          }
        }
      );
    });
  }

  // Achievement operations
  async addAchievement(achievementData) {
    return new Promise((resolve, reject) => {
      const { id, user_id, achievement_type, metadata } = achievementData;

      const stmt = this.db.prepare(`
        INSERT INTO achievements (id, user_id, achievement_type, metadata)
        VALUES (?, ?, ?, ?)
      `);

      stmt.run([
        id, user_id, achievement_type, JSON.stringify(metadata || {})
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id, ...achievementData });
        }
      });

      stmt.finalize();
    });
  }

  async getUserAchievements(userId) {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM achievements WHERE user_id = ? ORDER BY earned_at DESC',
        [userId],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            const achievements = rows.map(row => ({
              ...row,
              metadata: JSON.parse(row.metadata || '{}')
            }));
            resolve(achievements);
          }
        }
      );
    });
  }

  // Statistics and analytics
  async getUserStats() {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN last_login > datetime('now', '-7 days') THEN 1 END) as active_users_7d,
          COUNT(CASE WHEN last_login > datetime('now', '-30 days') THEN 1 END) as active_users_30d
        FROM users WHERE is_active = 1
      `, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows[0]);
        }
      });
    });
  }

  async getGameStats() {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          game_type,
          COUNT(*) as sessions_count,
          AVG(score) as avg_score,
          AVG(duration_seconds) as avg_duration,
          COUNT(CASE WHEN completed = 1 THEN 1 END) as completed_count
        FROM game_sessions 
        WHERE created_at > datetime('now', '-30 days')
        GROUP BY game_type
        ORDER BY sessions_count DESC
      `, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Cleanup and maintenance
  async cleanupOldSessions(daysOld = 90) {
    return new Promise((resolve, reject) => {
      this.db.run(
        `DELETE FROM game_sessions 
         WHERE created_at < datetime('now', '-${daysOld} days')`,
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ deleted: this.changes });
          }
        }
      );
    });
  }

  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('❌ Error closing database:', err.message);
        } else {
          console.log('✅ Database connection closed');
        }
      });
    }
  }
}

// Export singleton instance
module.exports = new DatabaseService();
