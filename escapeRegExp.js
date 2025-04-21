  /**
   * Helper function to escape special characters in regex
   * @param {string} string - String to escape
   * @returns {string} - Escaped string for regex
   */
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  window.escapeRegExp = escapeRegExp;