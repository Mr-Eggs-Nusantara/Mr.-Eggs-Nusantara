import { useState, useEffect } from 'react';
import { useAuth } from "@getmocha/users-service/react";
import { usePermissions } from "@/react-app/hooks/usePermissions";
import LoadingSpinner from "@/react-app/components/LoadingSpinner";
import { 
  User, 
  Mail, 
  Shield, 
  Bell, 
  Save, 
  Settings,
  Globe,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Check,
  X
} from "lucide-react";

interface UserProfile {
  id: number;
  mocha_user_id: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  is_active: boolean;
  last_login_at?: string;
  created_at?: string;
}

interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  sound_enabled: boolean;
  auto_logout: number; // minutes
}

export default function UserSettingsPage() {
  const { user: mochaUser } = useAuth();
  const { appUser, getRoleLabel } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: ''
  });
  
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'auto',
    language: 'id',
    notifications_enabled: true,
    email_notifications: true,
    sound_enabled: true,
    auto_logout: 60
  });

  useEffect(() => {
    loadUserData();
  }, [appUser]);

  const loadUserData = async () => {
    if (!appUser) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Get user profile from app_users table
      const response = await fetch(`/api/users`);
      if (response.ok) {
        const users = await response.json();
        const userProfile = users.find((u: any) => u.mocha_user_id === mochaUser?.id);
        
        if (userProfile) {
          setProfile(userProfile);
          setProfileForm({
            name: userProfile.name || '',
            phone: userProfile.phone || ''
          });
        }
      }

      // Load user settings from localStorage or defaults
      const savedSettings = localStorage.getItem('user_settings');
      if (savedSettings) {
        setSettings({ ...settings, ...JSON.parse(savedSettings) });
      }
      
    } catch (error) {
      console.error('Error loading user data:', error);
      setMessage({ type: 'error', text: 'Gagal memuat data user' });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async () => {
    if (!profile) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/users/${profile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profile,
          name: profileForm.name,
          phone: profileForm.phone
        })
      });

      if (response.ok) {
        setProfile(prev => prev ? { ...prev, name: profileForm.name, phone: profileForm.phone } : null);
        setMessage({ type: 'success', text: 'Profile berhasil diperbarui' });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Gagal memperbarui profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleSettingsSave = async () => {
    try {
      setSaving(true);
      localStorage.setItem('user_settings', JSON.stringify(settings));
      
      // Apply theme changes
      if (settings.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (settings.theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        // Auto - follow system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      
      setMessage({ type: 'success', text: 'Pengaturan berhasil disimpan' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Gagal menyimpan pengaturan' });
    } finally {
      setSaving(false);
    }
  };

  const clearMessage = () => {
    setTimeout(() => setMessage(null), 3000);
  };

  useEffect(() => {
    if (message) clearMessage();
  }, [message]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'preferences', name: 'Preferensi', icon: Settings },
    { id: 'notifications', name: 'Notifikasi', icon: Bell },
    { id: 'security', name: 'Keamanan', icon: Shield }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Pengaturan User</h1>
            <p className="text-gray-600">Kelola profile dan preferensi akun Anda</p>
          </div>
        </div>
        
        {/* User Info Card */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">{profile?.name || mochaUser?.google_user_data?.name}</h3>
              <p className="text-gray-600">{profile?.email || mochaUser?.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-sm font-medium">
                  {getRoleLabel()}
                </span>
                <span className={`px-2 py-0.5 rounded text-sm font-medium ${
                  profile?.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {profile?.is_active ? 'Aktif' : 'Tidak Aktif'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {message.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
              <span className="font-medium">{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-gray-500 hover:text-gray-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Informasi Profile</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Masukkan nama lengkap"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor Telepon
                </label>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="08123456789"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">Email tidak dapat diubah</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <input
                  type="text"
                  value={getRoleLabel()}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-500 mt-1">Role ditentukan oleh administrator</p>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleProfileSave}
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Profile</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Preferensi Aplikasi</h3>
            
            <div className="space-y-6">
              {/* Theme Setting */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tema Tampilan
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'light', label: 'Terang', icon: Sun },
                    { value: 'dark', label: 'Gelap', icon: Moon },
                    { value: 'auto', label: 'Otomatis', icon: Globe }
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setSettings({ ...settings, theme: value as any })}
                      className={`p-4 border rounded-lg text-center transition-colors ${
                        settings.theme === value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Icon className="w-6 h-6 mx-auto mb-2" />
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Language Setting */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bahasa
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="id">Bahasa Indonesia</option>
                  <option value="en">English</option>
                </select>
              </div>
              
              {/* Auto Logout */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto Logout (menit)
                </label>
                <select
                  value={settings.auto_logout}
                  onChange={(e) => setSettings({ ...settings, auto_logout: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={15}>15 menit</option>
                  <option value={30}>30 menit</option>
                  <option value={60}>1 jam</option>
                  <option value={120}>2 jam</option>
                  <option value={0}>Tidak pernah</option>
                </select>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleSettingsSave}
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Preferensi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Pengaturan Notifikasi</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-800">Notifikasi Aplikasi</p>
                    <p className="text-sm text-gray-600">Tampilkan notifikasi di dalam aplikasi</p>
                  </div>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, notifications_enabled: !settings.notifications_enabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    settings.notifications_enabled ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      settings.notifications_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-800">Notifikasi Email</p>
                    <p className="text-sm text-gray-600">Kirim notifikasi melalui email</p>
                  </div>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, email_notifications: !settings.email_notifications })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    settings.email_notifications ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      settings.email_notifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {settings.sound_enabled ? <Volume2 className="w-5 h-5 text-gray-600" /> : <VolumeX className="w-5 h-5 text-gray-600" />}
                  <div>
                    <p className="font-medium text-gray-800">Suara Notifikasi</p>
                    <p className="text-sm text-gray-600">Putar suara saat ada notifikasi</p>
                  </div>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, sound_enabled: !settings.sound_enabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                    settings.sound_enabled ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                      settings.sound_enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleSettingsSave}
                disabled={saving}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Notifikasi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Keamanan Akun</h3>
            
            <div className="space-y-6">
              {/* Account Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-3">Informasi Akun</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-600">Mocha User ID:</span>
                    <span className="font-mono text-blue-800">{profile?.mocha_user_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">Bergabung:</span>
                    <span className="text-blue-800">
                      {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('id-ID') : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">Login Terakhir:</span>
                    <span className="text-blue-800">
                      {profile?.last_login_at ? new Date(profile.last_login_at).toLocaleDateString('id-ID') : '-'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Session Info */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-3">Status Sesi</h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-700 font-medium">Sesi Aktif</span>
                  </div>
                  <span className="text-green-600 text-sm">
                    Auto logout: {settings.auto_logout === 0 ? 'Tidak pernah' : `${settings.auto_logout} menit`}
                  </span>
                </div>
              </div>
              
              {/* Security Notice */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Catatan Keamanan</h4>
                <div className="text-sm text-yellow-700 space-y-1">
                  <p>• Autentikasi menggunakan Google OAuth yang aman</p>
                  <p>• Role dan permissions dikelola oleh administrator</p>
                  <p>• Sesi akan otomatis logout setelah periode tidak aktif</p>
                  <p>• Jangan bagikan informasi akun Anda kepada orang lain</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
