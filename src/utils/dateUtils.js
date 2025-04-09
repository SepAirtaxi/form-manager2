/**
 * Formats a Firebase Timestamp object into a readable date string
 * @param {Timestamp} timestamp - The Firebase Timestamp object
 * @returns {string} Formatted date string
 */
export const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  // Convert Firestore timestamp to JavaScript Date
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  
  // Format as a readable string
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  return date.toLocaleDateString(undefined, options);
};

/**
 * Gets the relative time (e.g. "2 days ago") from a timestamp
 * @param {Timestamp} timestamp - The Firebase Timestamp object
 * @returns {string} Relative time string
 */
export const getRelativeTime = (timestamp) => {
  if (!timestamp) return 'N/A';
  
  // Convert Firestore timestamp to JavaScript Date
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  
  // Calculate the difference in milliseconds
  const now = new Date();
  const diffMs = now - date;
  
  // Convert to seconds, minutes, hours, etc.
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffMonth / 12);
  
  // Return the appropriate relative time string
  if (diffYear > 0) {
    return diffYear === 1 ? '1 year ago' : `${diffYear} years ago`;
  } else if (diffMonth > 0) {
    return diffMonth === 1 ? '1 month ago' : `${diffMonth} months ago`;
  } else if (diffDay > 0) {
    return diffDay === 1 ? '1 day ago' : `${diffDay} days ago`;
  } else if (diffHour > 0) {
    return diffHour === 1 ? '1 hour ago' : `${diffHour} hours ago`;
  } else if (diffMin > 0) {
    return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
  } else {
    return 'Just now';
  }
};