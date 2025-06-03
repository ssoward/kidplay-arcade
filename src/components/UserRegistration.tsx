import React, { useState } from 'react';
import { useUser, RegisterData } from '../contexts/UserContext';

interface UserRegistrationProps {
  onClose?: () => void;
  onSwitchToLogin?: () => void;
}

interface RegistrationStep {
  step: number;
  title: string;
  description: string;
}

const registrationSteps: RegistrationStep[] = [
  { step: 1, title: 'Account Type', description: 'Choose the type of account you need' },
  { step: 2, title: 'Account Details', description: 'Enter your information' },
  { step: 3, title: 'Preferences', description: 'Customize your experience' },
  { step: 4, title: 'Verification', description: 'Verify your email address' }
];

const UserRegistration: React.FC<UserRegistrationProps> = ({ 
  onClose, 
  onSwitchToLogin 
}) => {
  const { register, isLoading } = useUser();
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    displayName: '',
    dateOfBirth: undefined,
    accountType: 'child',
    parentEmail: undefined
  });
  
  const [confirmPassword, setConfirmPassword] = useState('');
  const [preferences, setPreferences] = useState({
    theme: 'light' as const,
    soundEnabled: true,
    difficulty: 'adaptive' as const,
    aiInteraction: true,
    notificationsEnabled: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'confirmPassword') {
      setConfirmPassword(value);
    } else if (name === 'dateOfBirth') {
      setFormData(prev => ({
        ...prev,
        [name]: value ? new Date(value) : undefined
      }));
    } else if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setPreferences(prev => ({
        ...prev,
        [name]: target.checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    if (error) setError('');
  };

  const validateStep = (step: number): boolean => {
    setError('');
    
    switch (step) {
      case 1:
        return true; // Account type is always set to a default value
      
      case 2:
        if (!formData.email || !formData.password || !formData.displayName) {
          setError('Please fill in all required fields');
          return false;
        }
        
        if (formData.password.length < 8) {
          setError('Password must be at least 8 characters long');
          return false;
        }
        
        if (formData.password !== confirmPassword) {
          setError('Passwords do not match');
          return false;
        }
        
        if (formData.accountType === 'child' && !formData.parentEmail) {
          setError('Parent email is required for child accounts');
          return false;
        }
        
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          setError('Please enter a valid email address');
          return false;
        }
        
        return true;
      
      case 3:
        return true; // Preferences are optional
      
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
    setError('');
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) return;
    
    try {
      const success = await register(formData);
      
      if (success) {
        setSuccess(true);
        setCurrentStep(4);
        // Close modal after successful registration and auto-login
        setTimeout(() => {
          onClose?.();
        }, 2000); // Give user time to see success message
      } else {
        setError('Registration failed. Please try again or use a different email address.');
      }
    } catch (error) {
      setError('Registration failed. Please try again.');
    }
  };

  const renderStepIndicator = () => (
    <div className="mb-6">
      <div className="flex items-center justify-center space-x-2 md:space-x-4 overflow-x-auto">
        {registrationSteps.map((step, index) => (
          <div key={step.step} className="flex items-center flex-shrink-0">
            <div className={`
              flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
              ${currentStep >= step.step 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-500'
              }
            `}>
              {step.step}
            </div>
            {index < registrationSteps.length - 1 && (
              <div className={`
                w-8 md:w-12 h-0.5 mx-1 md:mx-2
                ${currentStep > step.step ? 'bg-blue-600' : 'bg-gray-200'}
              `} />
            )}
          </div>
        ))}
      </div>
      <div className="text-center mt-4">
        <h3 className="text-lg font-medium text-gray-900">
          {registrationSteps[currentStep - 1]?.title}
        </h3>
        <p className="text-sm text-gray-600">
          {registrationSteps[currentStep - 1]?.description}
        </p>
      </div>
    </div>
  );

  const renderAccountType = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {['child', 'parent', 'educator'].map((type) => (
          <div
            key={type}
            className={`
              relative rounded-lg border-2 p-4 cursor-pointer transition-all
              ${formData.accountType === type
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
            onClick={() => setFormData(prev => ({ ...prev, accountType: type as any }))}
          >
            <div className="flex items-center">
              <input
                type="radio"
                name="accountType"
                value={type}
                checked={formData.accountType === type}
                onChange={handleInputChange}
                className="sr-only"
              />
              <div className="flex-1">
                <div className="flex items-center">
                  <div className={`
                    w-4 h-4 rounded-full border-2 mr-3
                    ${formData.accountType === type
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                    }
                  `}>
                    {formData.accountType === type && (
                      <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {type}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {type === 'child' && 'For kids under 13 with parental oversight'}
                  {type === 'parent' && 'Manage family accounts and parental controls'}
                  {type === 'educator' && 'Classroom management and educational features'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {formData.accountType === 'child' && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Parental Consent Required
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Child accounts require parental email verification and ongoing supervision per COPPA requirements.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAccountDetails = () => (
    <div className="space-y-4">
      <div>
        <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
          Display Name *
        </label>
        <input
          type="text"
          id="displayName"
          name="displayName"
          required
          className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Enter your display name"
          value={formData.displayName}
          onChange={handleInputChange}
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email Address *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Enter your email address"
          value={formData.email}
          onChange={handleInputChange}
        />
      </div>

      {formData.accountType === 'child' && (
        <div>
          <label htmlFor="parentEmail" className="block text-sm font-medium text-gray-700">
            Parent Email Address *
          </label>
          <input
            type="email"
            id="parentEmail"
            name="parentEmail"
            required
            className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Enter parent's email address"
            value={formData.parentEmail || ''}
            onChange={handleInputChange}
          />
        </div>
      )}

      <div>
        <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
          Date of Birth {formData.accountType === 'child' ? '*' : '(Optional)'}
        </label>
        <input
          type="date"
          id="dateOfBirth"
          name="dateOfBirth"
          required={formData.accountType === 'child'}
          className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          value={formData.dateOfBirth ? formData.dateOfBirth.toISOString().split('T')[0] : ''}
          onChange={handleInputChange}
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password *
        </label>
        <input
          type="password"
          id="password"
          name="password"
          required
          className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Create a secure password"
          value={formData.password}
          onChange={handleInputChange}
        />
        <p className="mt-1 text-xs text-gray-500">
          Must be at least 8 characters long
        </p>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirm Password *
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          required
          className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={handleInputChange}
        />
      </div>
    </div>
  );

  const renderPreferences = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Theme Preference
        </label>
        <select
          name="theme"
          value={preferences.theme}
          onChange={handleInputChange}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="light">Light Theme</option>
          <option value="dark">Dark Theme</option>
          <option value="auto">Auto (System)</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Difficulty Level
        </label>
        <select
          name="difficulty"
          value={preferences.difficulty}
          onChange={handleInputChange}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        >
          <option value="adaptive">Adaptive (Recommended)</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      <div className="space-y-4">
        <div className="flex items-center">
          <input
            id="soundEnabled"
            name="soundEnabled"
            type="checkbox"
            checked={preferences.soundEnabled}
            onChange={handleInputChange}
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
            checked={preferences.aiInteraction}
            onChange={handleInputChange}
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
            checked={preferences.notificationsEnabled}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="notificationsEnabled" className="ml-2 block text-sm text-gray-900">
            Receive progress updates and reminders
          </label>
        </div>
      </div>
    </div>
  );

  const renderVerification = () => (
    <div className="text-center">
      <div className="mx-auto h-12 w-12 flex items-center justify-center bg-green-100 rounded-full">
        <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-medium text-gray-900">Registration Successful!</h3>
      <p className="mt-2 text-sm text-gray-600">
        We've sent a verification email to <strong>{formData.email}</strong>
      </p>
      {formData.accountType === 'child' && (
        <p className="mt-2 text-sm text-gray-600">
          We've also sent parental consent information to <strong>{formData.parentEmail}</strong>
        </p>
      )}
      <div className="mt-6">
        <button
          onClick={onSwitchToLogin}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Continue to Login
        </button>
      </div>
    </div>
  );

  if (success && currentStep === 4) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {renderVerification()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center bg-blue-100 rounded-full">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create Your Account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join KidPlay Arcade and start your learning adventure!
          </p>
        </div>

        {renderStepIndicator()}

        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 1 && renderAccountType()}
          {currentStep === 2 && renderAccountDetails()}
          {currentStep === 3 && renderPreferences()}

          <div className="mt-6 flex justify-between">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                Back
              </button>
            )}
            
            <div className="flex-1"></div>
            
            {currentStep < 3 && (
              <button
                type="button"
                onClick={handleNext}
                className="flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                Next
              </button>
            )}
            
            {currentStep === 3 && (
              <button
                type="button"
                onClick={handleSubmit}
                className="flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            )}
          </div>

          {onSwitchToLogin && (
            <div className="mt-6 text-center">
              <span className="text-sm text-gray-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="font-medium text-blue-600 hover:text-blue-500"
                  disabled={isLoading}
                >
                  Sign in here
                </button>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserRegistration;
