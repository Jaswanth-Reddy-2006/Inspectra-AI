const SEVERITY = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low'
};

const PENALTIES = {
  [SEVERITY.CRITICAL]: 20,
  [SEVERITY.HIGH]: 10,
  [SEVERITY.MEDIUM]: 5,
  [SEVERITY.LOW]: 2
};

module.exports = {
  SEVERITY,
  PENALTIES
};
