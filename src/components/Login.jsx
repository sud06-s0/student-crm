import React, { useState } from 'react';
import { Sparkles, Hand } from 'lucide-react';
import { authService } from '../services/authService';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted with:', { email, password });
    console.log('onLogin function received:', typeof onLogin);
    setIsLoading(true);
    
    try {
      console.log('Attempting login with authService...');
      const userData = await authService.login(email, password);
      console.log('Login successful:', userData);
      console.log('Calling onLogin with user data...');
      onLogin(userData); // Pass user data to parent component
    } catch (error) {
      console.error('Login failed:', error.message);
      alert('Login failed: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      alert('Please enter your email address first');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('Sending password reset request...');
      const result = await authService.resetPassword(email);
      
      // 🔧 FIX: Use the message returned by authService instead of hardcoded text
      console.log('Reset password result:', result);
      alert(result.message); // This will show the generic security message
      
      setShowForgotPassword(false);
    } catch (error) {
      console.error('Password reset failed:', error.message);
      
      // 🔧 FIX: Show generic message even on error for security
      alert('If this email address exists in our system, you will receive a password reset link shortly.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-content">
        {/* Left Side */}
        <div className="login-left">
          <div className="logo">
            <Sparkles className="star-icon" size={48} />
          </div>
          <div className="welcome-text">
            <h1>Hello<br />Nova International School! <Hand className="hand-icon" size={36} /></h1>
            <p>
              Streamline your academic journey with our comprehensive student 
              management system. Connect with teachers, track your progress, 
              access resources, and stay updated with school activities all in 
              one place. Education made simple, efficient, and accessible.
            </p>
          </div>
          <div className="copyright">
            © 2025 Nova International School. All rights reserved.
          </div>
        </div>

        {/* Right Side */}
        <div className="login-right">
          <div className="login-form-container">
            <h2>Welcome Back!</h2>
            <p className="login-subtitle">
              Thank you for visiting again!
            </p>

            {!showForgotPassword ? (
              <>
                <form onSubmit={handleSubmit} className="login-form">
                  <div className="input-group">
                    <input
                      type="email"
                      placeholder="student.email@novaintl.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="input-group">
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="login-button"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Logging in...' : 'Login Now'}
                  </button>
                </form>

                <div className="forgot-password">
                  <span>Forgot password? </span>
                  <a 
                    href="#" 
                    className="forgot-link"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowForgotPassword(true);
                    }}
                  >
                    Click here
                  </a>
                </div>
              </>
            ) : (
              <>
                <form onSubmit={handleForgotPassword} className="login-form">
                  <h3 style={{ marginBottom: '20px' }}>Reset Password</h3>
                  <p style={{ marginBottom: '20px', fontSize: '14px', color: '#666' }}>
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                  
                  <div className="input-group">
                    <input
                      type="email"
                      placeholder="student.email@novaintl.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="login-button"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Email'}
                  </button>
                </form>

                <div className="forgot-password">
                  <span>Remember your password? </span>
                  <a 
                    href="#" 
                    className="forgot-link"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowForgotPassword(false);
                    }}
                  >
                    Back to Login
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;