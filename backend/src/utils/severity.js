const SEVERITY = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low'
};

<<<<<<< HEAD
=======
const SEVERITY_METADATA = {
  [SEVERITY.CRITICAL]: {
    reason: 'Blocks core functionality or severely impacts accessibility compliance.',
    impact: 'Users may be unable to complete primary tasks or use assistive technologies effectively.'
  },
  [SEVERITY.HIGH]: {
    reason: 'Significantly impacts user experience or accessibility compliance.',
    impact: 'Users will encounter significant friction or major accessibility barriers.'
  },
  [SEVERITY.MEDIUM]: {
    reason: 'Moderate structural or performance concern.',
    impact: 'Users may experience delays or minor accessibility challenges.'
  },
  [SEVERITY.LOW]: {
    reason: 'Minor improvement opportunity.',
    impact: 'Minimal impact on core functionality or accessibility.'
  }
};

>>>>>>> localcode
const PENALTIES = {
  [SEVERITY.CRITICAL]: 20,
  [SEVERITY.HIGH]: 10,
  [SEVERITY.MEDIUM]: 5,
  [SEVERITY.LOW]: 2
};

module.exports = {
  SEVERITY,
<<<<<<< HEAD
=======
  SEVERITY_METADATA,
>>>>>>> localcode
  PENALTIES
};
