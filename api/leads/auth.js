// auth.js - Authentication utility for API endpoints
// Place this file in your project structure (e.g., /utils/auth.js or /api/auth.js)

/**
 * Authenticates incoming API requests using Basic Authentication
 * @param {Object} req - The request object from Next.js API handler
 * @returns {Object} Authentication result with success status and error message
 */
export function authenticateRequest(req) {
  // Get the Authorization header from the request
  const authHeader = req.headers.authorization;
  
  // Check if Authorization header exists and starts with 'Basic '
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return { 
      authenticated: false, 
      error: 'Missing or invalid authorization header. Please provide Basic Authentication.' 
    };
  }

  try {
    // Extract the base64 encoded credentials from the header
    // Authorization header format: "Basic <base64-encoded-username:password>"
    const base64Credentials = authHeader.split(' ')[1];
    
    // Decode the base64 credentials
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    
    // Split the credentials into username and password
    const [username, password] = credentials.split(':');

    // Get API credentials from environment variables
    // Make sure to set these in your .env file
    const API_USERNAME = process.env.API_USERNAME;
    const API_PASSWORD = process.env.API_PASSWORD;

    // Check if environment variables are set
    if (!API_USERNAME || !API_PASSWORD) {
      console.error('API credentials not configured in environment variables');
      return { 
        authenticated: false, 
        error: 'Server configuration error. API credentials not set.' 
      };
    }

    // Validate the provided credentials against environment variables
    if (username === API_USERNAME && password === API_PASSWORD) {
      return { 
        authenticated: true,
        username: username // Optional: return username for logging
      };
    } else {
      // Log failed authentication attempts (without exposing credentials)
      console.warn(`Failed authentication attempt for username: ${username}`);
      return { 
        authenticated: false, 
        error: 'Invalid username or password.' 
      };
    }
  } catch (error) {
    // Handle any errors in parsing the authorization header
    console.error('Error parsing authorization header:', error.message);
    return { 
      authenticated: false, 
      error: 'Invalid authorization format. Please check your credentials encoding.' 
    };
  }
}

/**
 * Middleware wrapper for API authentication
 * Usage: const authResult = await authenticateAPIRequest(req, res);
 * @param {Object} req - Request object
 * @param {Object} res - Response object  
 * @returns {Object} Authentication result or sends error response
 */
export function authenticateAPIRequest(req, res) {
  const authResult = authenticateRequest(req);
  
  if (!authResult.authenticated) {
    // Set WWW-Authenticate header for proper Basic Auth challenge
    res.setHeader('WWW-Authenticate', 'Basic realm="API Access"');
    
    // Return 401 Unauthorized with error details
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: authResult.error,
      timestamp: new Date().toISOString()
    });
    
    return false; // Authentication failed
  }
  
  return authResult; // Authentication successful
}

/**
 * Generate Basic Auth header for testing
 * @param {string} username - API username
 * @param {string} password - API password
 * @returns {string} Authorization header value
 */
export function generateBasicAuthHeader(username, password) {
  const credentials = `${username}:${password}`;
  const encodedCredentials = Buffer.from(credentials).toString('base64');
  return `Basic ${encodedCredentials}`;
}

/**
 * Rate limiting helper (basic implementation)
 * You can extend this for more sophisticated rate limiting
 * @param {string} identifier - Client identifier (IP, username, etc.)
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Object} Rate limit result
 */
const requestCounts = new Map();

export function checkRateLimit(identifier, maxRequests = 100, windowMs = 60000) {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Get existing requests for this identifier
  let requests = requestCounts.get(identifier) || [];
  
  // Filter out requests outside the time window
  requests = requests.filter(timestamp => timestamp > windowStart);
  
  // Check if rate limit exceeded
  if (requests.length >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: requests[0] + windowMs
    };
  }
  
  // Add current request
  requests.push(now);
  requestCounts.set(identifier, requests);
  
  return {
    allowed: true,
    remaining: maxRequests - requests.length,
    resetTime: now + windowMs
  };
}

// Default export for convenience
export default {
  authenticateRequest,
  authenticateAPIRequest,
  generateBasicAuthHeader,
  checkRateLimit
};