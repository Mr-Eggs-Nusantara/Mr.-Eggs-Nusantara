
CREATE TABLE system_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  data_type TEXT NOT NULL DEFAULT 'string',
  is_public BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE system_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  user_id TEXT,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default system settings
INSERT INTO system_settings (key, value, category, description, data_type, is_public) VALUES
('app_name', 'EggPro', 'company', 'Nama aplikasi', 'string', 1),
('company_name', 'PT. Telur Sejahtera', 'company', 'Nama perusahaan', 'string', 1),
('company_address', 'Jl. Industri No. 123, Jakarta', 'company', 'Alamat perusahaan', 'string', 1),
('company_phone', '+62-21-1234567', 'company', 'Telepon perusahaan', 'string', 1),
('company_email', 'info@eggpro.com', 'company', 'Email perusahaan', 'string', 1),
('currency', 'IDR', 'general', 'Mata uang sistem', 'string', 1),
('timezone', 'Asia/Jakarta', 'general', 'Zona waktu sistem', 'string', 0),
('tax_rate', '10', 'general', 'Persentase pajak default (%)', 'number', 1),
('low_stock_threshold', '10', 'general', 'Threshold stok rendah', 'number', 0),
('auto_backup', 'true', 'maintenance', 'Backup otomatis aktif', 'boolean', 0),
('backup_retention_days', '30', 'maintenance', 'Lama penyimpanan backup (hari)', 'number', 0),
('session_timeout', '24', 'security', 'Timeout sesi pengguna (jam)', 'number', 0),
('max_login_attempts', '5', 'security', 'Maksimum percobaan login', 'number', 0),
('enable_notifications', 'true', 'notification', 'Aktifkan notifikasi sistem', 'boolean', 1),
('email_notifications', 'true', 'notification', 'Aktifkan notifikasi email', 'boolean', 0),
('performance_monitoring', 'true', 'performance', 'Monitoring performa aktif', 'boolean', 0);
