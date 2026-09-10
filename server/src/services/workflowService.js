/**
 * Centralized state transition service for Provider Applications
 */

const VALID_TRANSITIONS = {
  'draft': ['pending'],
  'pending': ['approved', 'rejected'],
  'approved': [],
  'rejected': ['pending']
};

/**
 * Checks if a transition from one status to another is valid.
 * @param {string} fromStatus - The current status of the application
 * @param {string} toStatus - The desired next status
 * @returns {boolean} - True if the transition is allowed
 */
const canTransition = (fromStatus, toStatus) => {
  if (!fromStatus || !toStatus) return false;
  
  const allowedNextStates = VALID_TRANSITIONS[fromStatus];
  if (!allowedNextStates) return false;

  return allowedNextStates.includes(toStatus);
};

/**
 * Checks if the provider is currently allowed to edit their profile.
 * @param {string} currentStatus - The current status of the application
 * @returns {boolean} - True if editing is allowed
 */
const canEditProfile = (currentStatus) => {
  return currentStatus === 'draft' || currentStatus === 'rejected';
};

/**
 * Checks if the provider is currently allowed to upload/delete files.
 * @param {string} currentStatus - The current status of the application
 * @returns {boolean} - True if uploading is allowed
 */
const canUploadFiles = (currentStatus) => {
  return currentStatus === 'draft' || currentStatus === 'rejected';
};

module.exports = {
  canTransition,
  canEditProfile,
  canUploadFiles
};
