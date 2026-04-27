/**
 * Utility functions for routing overrides based on user intent.
 * The backend sets `intent` in the user object for institute temp logins.
 */

// Map intent values (from backend) to their allowed frontend routes.
// `primary` is the default landing page for the intent.
// `allowed` is a list of additional route patterns the user can navigate to.
// Patterns support simple prefix matching with `*` (e.g. '/cadets/view/*').
const INTENT_ROUTE_CONFIG = {
  institute_drives: {
    primary: '/drives',
    allowed: [
      '/drives',
      '/drives/*',
      '/institute/submit-excel',
      '/institute/shortlisted-cadets',
      '/cadets/fill-details/*',
    ],
  },
  institute_submit: {
    primary: '/drives',
    allowed: ['/drives', '/drives/*', '/institute/submit-excel'],
  },
  institute_shortlist: {
    primary: '/drives',
    allowed: ['/cadets/fill-details/*', '/drives', '/drives/*', '/institute/shortlisted-cadets'],
  },
};

/**
 * Returns the primary (landing) route for a given user based on their intent.
 * @param {Object} user User object from AuthContext
 * @returns {string|null} The route path if an intent matches, otherwise null.
 */
export const getPrefixRoute = (user) => {
  if (user?.intent && INTENT_ROUTE_CONFIG[user.intent]) {
    return INTENT_ROUTE_CONFIG[user.intent].primary;
  }
  return null;
};

/**
 * Checks if the given pathname is allowed for the user's intent.
 * Returns true if:
 *  - The user has no intent (normal admin user)
 *  - The path matches the primary route
 *  - The path matches any of the allowed route patterns
 * @param {Object} user User object from AuthContext
 * @param {string} pathname Current location pathname
 * @returns {boolean}
 */
export const isAllowedRoute = (user, pathname) => {
  if (!user?.intent) return true; // No intent restriction
  if (!pathname) return false; // If pathname is undefined, don't crash

  const config = INTENT_ROUTE_CONFIG[user.intent];
  if (!config) return true; // Unknown intent, allow

  // Check primary route
  if (pathname === config.primary) return true;

  // Check allowed patterns
  return config.allowed.some((pattern) => {
    if (pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -1); // Remove the '*'
      return pathname.startsWith(prefix);
    }
    return pathname === pattern;
  });
};

/**
 * Returns the correct login redirect path based on the current context.
 * Only routes that explicitly start with '/institute/' are treated as institute
 * routes. All other routes (including admin pages accessed on port 3001)
 * redirect to the standard admin login page.
 * @param {string} pathname Current location pathname
 * @returns {string} '/institute-login' or '/login'
 */
export const getLoginRedirectPath = (pathname) => {
  // Only redirect to institute-login for institute-specific paths
  if (pathname && pathname.startsWith('/institute/')) {
    return '/institute-login';
  }

  return '/login';
};

/**
 * Returns the correct destination after explicit or automatic logout.
 * Institute users should return to the institute OTP login, not admin login.
 * @param {Object} user User object from AuthContext
 * @returns {string} '/institute-login' or '/login'
 */
export const getLogoutRedirectPath = (user) => {
  const role = String(user?.role || '').toLowerCase();
  const intent = String(user?.intent || '').toLowerCase();
  const workflowIntent = String(user?.workflowIntent || '').toLowerCase();

  if (
    role === 'institute' ||
    intent.startsWith('institute') ||
    workflowIntent.startsWith('institute')
  ) {
    return '/institute-login';
  }

  return '/login';
};
