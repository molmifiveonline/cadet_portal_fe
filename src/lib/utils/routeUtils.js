/**
 * Utility functions for routing overrides based on user intent.
 * The backend sets `intent` in the user object for institute temp logins.
 */

// Map intent values (from backend) to their allowed frontend routes.
// `primary` is the default landing page for the intent.
// `allowed` is a list of additional route patterns the user can navigate to.
// Patterns support simple prefix matching with `*` (e.g. '/cadets/view/*').
const INTENT_ROUTE_CONFIG = {
  institute_submit: {
    primary: '/institute/submit-excel',
    allowed: [],
  },
  institute_shortlist: {
    primary: '/institute/shortlisted-cadets',
    allowed: ['/cadets/fill-details/*'],
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
