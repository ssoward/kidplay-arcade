import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';

interface UserProfileProps {
  onClose?: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ onClose }) => {
  const { user, updateProfile, updatePreferences, logout, isLoading } = useUser();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  const [profileForm, setProfileForm] = useState({
    displayName: user?.displayName || '',
    dateOfBirth: user?.dateOfBirth ? (user.dateOfBirth instanceof Date ? user.dateOfBirth.toISOString().split('T')[0] : new Date(user.dateOfBirth).toISOString().split('T')[0]) : '',
    avatar: user?.avatar || ''
  });

  const [preferencesForm, setPreferencesForm] = useState({
    theme: user?.preferences.theme || 'light',
    soundEnabled: user?.preferences.soundEnabled || true,
    difficulty: user?.preferences.difficulty || 'adaptive',
    aiInteraction: user?.preferences.aiInteraction || true,
    notificationsEnabled: user?.preferences.notificationsEnabled || false,
    language: user?.preferences.language || 'en'
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        displayName: user.displayName || '',
        dateOfBirth: user.dateOfBirth ? (user.dateOfBirth instanceof Date ? user.dateOfBirth.toISOString().split('T')[0] : new Date(user.dateOfBirth).toISOString().split('T')[0]) : '',
        avatar: user.avatar || ''
      });
      setPreferencesForm({
        theme: user.preferences.theme || 'light',
        soundEnabled: user.preferences.soundEnabled || true,
        difficulty: user.preferences.difficulty || 'adaptive',
        aiInteraction: user.preferences.aiInteraction || true,
        notificationsEnabled: user.preferences.notificationsEnabled || false,
        language: user.preferences.language || 'en'
      });
    }
  }, [user]);

  const handleProfileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
    setSaveMessage('');
  };

  const handlePreferencesInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setPreferencesForm(prev => ({
        ...prev,
        [name]: target.checked
      }));
    } else {
      setPreferencesForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
    setSaveMessage('');
  };

  const handleProfileSave = async () => {
    setIsSaving(true);
    try {
      const updates: any = {
        displayName: profileForm.displayName
      };
      
      if (profileForm.dateOfBirth) {
        updates.dateOfBirth = new Date(profileForm.dateOfBirth);
      }
      
      if (profileForm.avatar) {
        updates.avatar = profileForm.avatar;
      }

      const success = await updateProfile(updates);
      
      if (success) {
        setSaveMessage('Profile updated successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('Failed to update profile. Please try again.');
      }
    } catch (error) {
      setSaveMessage('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreferencesSave = async () => {
    setIsSaving(true);
    try {
      const success = await updatePreferences(preferencesForm);
      
      if (success) {
        setSaveMessage('Preferences updated successfully!');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('Failed to update preferences. Please try again.');
      }
    } catch (error) {
      setSaveMessage('Failed to update preferences. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    onClose?.();
  };

  const formatAccountType = (accountType: string) => {
    return accountType.charAt(0).toUpperCase() + accountType.slice(1);
  };

  const formatDate = (date: Date | string) => {
    if (!date) return 'Not set';
    const d = new Date(date);
    return d.toLocaleDateString();
  };

  const getAccountTypeIcon = (accountType: string) => {
    switch (accountType) {
      case 'child':
        return (
          <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-10 5h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'parent':
        return (
          <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        );
      case 'educator':
        return (
          <svg className="h-5 w-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No User Found</h2>
          <p className="text-gray-600">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  {user.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{user.displayName}</h1>
                  <div className="flex items-center space-x-2">
                    {getAccountTypeIcon(user.accountType)}
                    <span className="text-sm text-gray-600">{formatAccountType(user.accountType)} Account</span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                {onClose && (
                  <button
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Close
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Email:</span>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <span className="text-gray-500">Member Since:</span>
                <p className="font-medium">{formatDate(user.createdAt)}</p>
              </div>
              <div>
                <span className="text-gray-500">Last Active:</span>
                <p className="font-medium">{formatDate(user.lastActive)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {[
                { id: 'profile', name: 'Profile', icon: 'user' },
                { id: 'preferences', name: 'Preferences', icon: 'cog' },
                { id: 'stats', name: 'Game Stats', icon: 'chart' },
                { id: 'privacy', name: 'Privacy', icon: 'shield' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {saveMessage && (
              <div className={`mb-4 p-3 rounded-md ${
                saveMessage.includes('successfully') 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {saveMessage}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Profile Information</h3>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                      Display Name
                    </label>
                    <input
                      type="text"
                      id="displayName"
                      name="displayName"
                      value={profileForm.displayName}
                      onChange={handleProfileInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      id="dateOfBirth"
                      name="dateOfBirth"
                      value={profileForm.dateOfBirth}
                      onChange={handleProfileInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="avatar" className="block text-sm font-medium text-gray-700">
                      Avatar URL
                    </label>
                    <input
                      type="url"
                      id="avatar"
                      name="avatar"
                      value={profileForm.avatar}
                      onChange={handleProfileInputChange}
                      placeholder="https://example.com/avatar.jpg"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleProfileSave}
                    disabled={isSaving}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Profile'}
                  </button>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Game Preferences</h3>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="theme" className="block text-sm font-medium text-gray-700">
                      Theme
                    </label>
                    <select
                      id="theme"
                      name="theme"
                      value={preferencesForm.theme}
                      onChange={handlePreferencesInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700">
                      Difficulty Level
                    </label>
                    <select
                      id="difficulty"
                      name="difficulty"
                      value={preferencesForm.difficulty}
                      onChange={handlePreferencesInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="adaptive">Adaptive</option>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                      Language
                    </label>
                    <select
                      id="language"
                      name="language"
                      value={preferencesForm.language}
                      onChange={handlePreferencesInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      id="soundEnabled"
                      name="soundEnabled"
                      type="checkbox"
                      checked={preferencesForm.soundEnabled}
                      onChange={handlePreferencesInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="soundEnabled" className="ml-2 block text-sm text-gray-900">
                      Enable sound effects and music
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="aiInteraction"
                      name="aiInteraction"
                      type="checkbox"
                      checked={preferencesForm.aiInteraction}
                      onChange={handlePreferencesInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="aiInteraction" className="ml-2 block text-sm text-gray-900">
                      Enable AI-powered learning assistance
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="notificationsEnabled"
                      name="notificationsEnabled"
                      type="checkbox"
                      checked={preferencesForm.notificationsEnabled}
                      onChange={handlePreferencesInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="notificationsEnabled" className="ml-2 block text-sm text-gray-900">
                      Receive progress updates and reminders
                    </label>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handlePreferencesSave}
                    disabled={isSaving}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Preferences'}
                  </button>
                </div>
              </div>
            )}

            {/* Game Stats Tab */}
            {activeTab === 'stats' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Game Statistics</h3>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-blue-600">Games Played</p>
                        <p className="text-2xl font-semibold text-blue-900">{user.gameStats.gamesPlayed}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-600">Total Score</p>
                        <p className="text-2xl font-semibold text-green-900">{user.gameStats.totalScore.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-yellow-600">Current Streak</p>
                        <p className="text-2xl font-semibold text-yellow-900">{user.gameStats.streaks.current}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-purple-600">Achievements</p>
                        <p className="text-2xl font-semibold text-purple-900">{user.gameStats.achievements.length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {user.gameStats.favoriteGames.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Favorite Games</h4>
                    <div className="flex flex-wrap gap-2">
                      {user.gameStats.favoriteGames.map((game, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {game}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Privacy Settings</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Data Collection</h4>
                      <p className="text-sm text-gray-600">Allow collection of gameplay data for improvement</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={user.privacySettings.dataCollection}
                      readOnly
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Analytics</h4>
                      <p className="text-sm text-gray-600">Share anonymous usage analytics</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={user.privacySettings.analytics}
                      readOnly
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Personalization</h4>
                      <p className="text-sm text-gray-600">Use data to personalize game experience</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={user.privacySettings.personalization}
                      readOnly
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Share Progress</h4>
                      <p className="text-sm text-gray-600">Allow sharing progress with friends and family</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={user.privacySettings.shareProgress}
                      readOnly
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>

                {user.accountType === 'child' && user.parentalControls && (
                  <div className="border-t pt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-3">Parental Controls</h4>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-yellow-800">
                            Parental Controls Active
                          </h3>
                          <div className="mt-2 text-sm text-yellow-700">
                            <p>Time limit: {user.parentalControls.timeLimit} minutes per day</p>
                            <p>Session reminders: {user.parentalControls.sessionReminders ? 'Enabled' : 'Disabled'}</p>
                            <p>Reporting: {user.parentalControls.reportingEnabled ? 'Enabled' : 'Disabled'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
