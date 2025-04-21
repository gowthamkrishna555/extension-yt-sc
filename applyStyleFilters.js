function applyStyleFilters(analysis, text) {
    try {
      // Create a copy of the analysis to modify
      const filteredAnalysis = {
        spelling: [...analysis.spelling],
        grammar: [...analysis.grammar],
        style: [...analysis.style]
      };
      
      // Check if style-based corrections function is available from customization.js
      if (window.getStyleBasedCorrections && typeof window.getStyleBasedCorrections === 'function') {
        // Apply style-based filtering to each issue
        
        // Process spelling issues
        filteredAnalysis.spelling = filteredAnalysis.spelling.filter(issue => {
          const styledCorrection = window.getStyleBasedCorrections(text, {
            ...issue,
            type: 'spelling'
          });
          
          // Skip if the style says to ignore this issue
          return !styledCorrection.ignore;
        });
        
        // Process grammar issues
        filteredAnalysis.grammar = filteredAnalysis.grammar.filter(issue => {
          const styledCorrection = window.getStyleBasedCorrections(text, {
            ...issue,
            type: issue.type || 'grammar'  
          });
          
          // Skip if the style says to ignore this issue
          return !styledCorrection.ignore;
        });
        
        // Process style issues
        filteredAnalysis.style = filteredAnalysis.style.filter(issue => {
          const styledCorrection = window.getStyleBasedCorrections(text, {
            ...issue,
            type: issue.type || 'style'
          });
          
          // Skip if the style says to ignore this issue
          return !styledCorrection.ignore;
        });
      }
      
      return filteredAnalysis;
    } catch (error) {
      console.error("Error applying style filters:", error);
      return analysis; // Return original analysis if there's an error
    }
  }

window.applyStyleFilters = applyStyleFilters; 