/**
 * Utility functions for routing overrides based on user intent.
 * The backend sets `intent` in the user object for institute temp logins.
 */

// Map intent values (from backend) to their allowed frontend routes.
// To add new routes in the future, simply add to this object: { 'intent_key': '/route/path' }
const INTENT_ROUTES = {
  institute_submit: '/institute/submit-excel',
  institute_shortlist: '/institute/shortlisted-cadets',
};

/**
 * Returns the override route for a given user based on their intent.
 * Institute users logging in with temp credentials (SUB-, SHOR-) will have
 * an `intent` field set by the backend to restrict them to a specific route.
 * @param {Object} user User object from AuthContext
 * @returns {string|null} The route path if an intent matches, otherwise null.
 */
export const getPrefixRoute = (user) => {
  if (user?.intent && INTENT_ROUTES[user.intent]) {
    return INTENT_ROUTES[user.intent];
  }
  return null;
};
