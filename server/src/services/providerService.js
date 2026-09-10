/**
 * Calculates whether a provider profile contains all required onboarding fields.
 * 
 * @param {Object} profile - The ProviderProfile document
 * @param {Object} user - The User document
 * @returns {Object} { isComplete: boolean, missingFields: string[] }
 */
const calculateProfileCompleteness = (profile, user) => {
  const missingFields = [];

  // 1. Check user basic info
  if (!user || !user.name) {
    missingFields.push('name');
  }

  // 2. Check profile basics
  if (!profile) {
    return {
      isComplete: false,
      missingFields: ['profile_missing']
    };
  }

  if (!profile.phone) {
    missingFields.push('phone');
  }

  // 3. Check categories and skills
  if (!profile.categories || profile.categories.length === 0) {
    missingFields.push('categories');
  }

  if (!profile.skills || profile.skills.length === 0) {
    missingFields.push('skills');
  }

  // 4. Check experience. 
  // IMPORTANT: 0 is valid experience. Missing/null/undefined is incomplete.
  if (profile.experience === undefined || profile.experience === null) {
    missingFields.push('experience');
  } else if (profile.experience < 0) {
    missingFields.push('experience_invalid'); // Technically shouldn't happen due to Mongoose min:0
  }

  // 5. Check service location
  const loc = profile.serviceLocation || {};
  if (!loc.address) missingFields.push('serviceLocation.address');
  if (!loc.city) missingFields.push('serviceLocation.city');
  if (!loc.state) missingFields.push('serviceLocation.state');
  if (!loc.pincode) missingFields.push('serviceLocation.pincode');

  return {
    isComplete: missingFields.length === 0,
    missingFields
  };
};

module.exports = {
  calculateProfileCompleteness
};
