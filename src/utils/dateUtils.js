/**
 * Formats a Firestore Timestamp to a readable date string
 * @param {Object} timestamp - A Firestore Timestamp object
 * @returns {string} Formatted date string
 */
export const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  // Check if it's a Firestore Timestamp and convert to JS Date
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  
  if (isNaN(date.getTime())) return 'Invalid date';
  
  // Format options
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return date.toLocaleDateString(undefined, options);
};