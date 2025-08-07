import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Database configuration
const dbConfig: PoolConfig = {
  host: process.env['DB_HOST'] || 'localhost',
  port: parseInt(process.env['DB_PORT'] || '5432'),
  database: process.env['DB_NAME'] || 'tax_pwa',
  user: process.env['DB_USER'] || 'postgres',
  password: process.env['DB_PASSWORD'] || 'password',
  max: parseInt(process.env['DB_MAX_CONNECTIONS'] || '20'),
  idleTimeoutMillis: parseInt(process.env['DB_IDLE_TIMEOUT'] || '30000'),
  connectionTimeoutMillis: parseInt(process.env['DB_CONNECTION_TIMEOUT'] || '2000'),
  ssl: process.env['NODE_ENV'] === 'production' ? { rejectUnauthorized: false } : false,
};

// Create connection pool
export const pool = new Pool(dbConfig);

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Initialize database (create tables if they don't exist)
export const initializeDatabase = async (): Promise<void> => {
  try {
    const client = await pool.connect();
    
    // Check if users table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('📋 Creating database tables...');
      
      // Create basic tables for development
      await client.query(`
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          role VARCHAR(20) NOT NULL CHECK (role IN ('individual', 'business', 'consultant', 'admin')),
          is_active BOOLEAN DEFAULT true,
          is_email_verified BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS tax_forms (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(50) NOT NULL,
          status VARCHAR(20) DEFAULT 'DRAFT',
          tax_year INTEGER NOT NULL,
          tax_period_type VARCHAR(20) NOT NULL,
          tax_month INTEGER,
          tax_quarter INTEGER,
          period_start_date DATE NOT NULL,
          period_end_date DATE NOT NULL,
          total_tax_amount DECIMAL(15,2) DEFAULT 0,
          total_payable_amount DECIMAL(15,2) DEFAULT 0,
          submission_date TIMESTAMP,
          notes TEXT,
          version INTEGER DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_tax_forms_user_id ON tax_forms(user_id);
        CREATE INDEX IF NOT EXISTS idx_tax_forms_type ON tax_forms(type);
      `);
      
      console.log('✅ Database tables created successfully');
    } else {
      console.log('✅ Database tables already exist');
    }
    
    client.release();
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// Graceful shutdown
export const closeDatabase = async (): Promise<void> => {
  try {
    await pool.end();
    console.log('📴 Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, closing database connection...');
  await closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, closing database connection...');
  await closeDatabase();
  process.exit(0);
});

export default pool; 