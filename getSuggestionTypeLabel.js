 /**
   * Get user-friendly label for suggestion type
   * @param {string} type - Technical type
   * @returns {string} - User-friendly label
   */
 function getSuggestionTypeLabel(type) {
    const labels = {
      'spelling': 'Correct spelling',
      'grammar': 'Grammar suggestion',
      'article': 'Correct article usage',
      'style': 'Style suggestion',
      'punctuation': 'Punctuation correction'
    };
 }
window.getSuggestionTypeLabel = getSuggestionTypeLabel;