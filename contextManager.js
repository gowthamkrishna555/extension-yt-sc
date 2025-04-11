// New file: contextManager.js
window.ContextManager = (function() {
    // Document types
    const CONTEXTS = {
      FORMAL: 'formal',
      INFORMAL: 'informal',
      ACADEMIC: 'academic',
      BUSINESS: 'business',
      EMAIL: 'email',
      CREATIVE: 'creative'
    };
    
    let currentContext = CONTEXTS.FORMAL;
    
    function detectContext(text) {
      // This would ideally use API or ML for detection
      // For now, simple rule-based approach:
      
      if (/dear professor|university|abstract|thesis|hypothesis|methodology/i.test(text)) {
        return CONTEXTS.ACADEMIC;
      }
      
      if (/dear sir|meeting|regards|company|business|profit|quarterly/i.test(text)) {
        return CONTEXTS.BUSINESS;
      }
      
      if (/hi there|hey|what's up|thanks|cheers/i.test(text)) {
        return CONTEXTS.INFORMAL;
      }
      
      if (/gmail\.com|subject:|^hi|^hello|best,|regards,|sincerely,/i.test(text)) {
        return CONTEXTS.EMAIL;
      }
      
      if (/once upon a time|chapter|protagonist|character|story|plot/i.test(text)) {
        return CONTEXTS.CREATIVE;
      }
      
      return CONTEXTS.FORMAL;
    }
    
    function getContextSettings(text) {
      const detectedContext = detectContext(text);
      currentContext = detectedContext;
      
      // Return settings appropriate for the context
      switch (detectedContext) {
        case CONTEXTS.ACADEMIC:
          return {
            strictnessLevel: 'high',
            checkPassiveVoice: false, // Passive voice is often acceptable in academic writing
            formalityLevel: 'very_formal',
            checkClichés: true,
            checkJargon: false
          };
          
        case CONTEXTS.BUSINESS:
          return {
            strictnessLevel: 'medium',
            checkPassiveVoice: true,
            formalityLevel: 'formal',
            checkClichés: true,
            checkJargon: false
          };
          
        case CONTEXTS.INFORMAL:
          return {
            strictnessLevel: 'low',
            checkPassiveVoice: false,
            formalityLevel: 'casual',
            checkClichés: false,
            checkJargon: false
          };
          
        case CONTEXTS.EMAIL:
          return {
            strictnessLevel: 'medium',
            checkPassiveVoice: true,
            formalityLevel: 'neutral',
            checkClichés: false,
            checkJargon: true
          };
          
        case CONTEXTS.CREATIVE:
          return {
            strictnessLevel: 'low',
            checkPassiveVoice: false,
            formalityLevel: 'flexible',
            checkClichés: true,
            checkJargon: false
          };
          
        case CONTEXTS.FORMAL:
        default:
          return {
            strictnessLevel: 'high',
            checkPassiveVoice: true,
            formalityLevel: 'formal',
            checkClichés: true,
            checkJargon: true
          };
      }
    }
    
    function getCurrentContext() {
      return currentContext;
    }
    
    return {
      CONTEXTS,
      detectContext,
      getContextSettings,
      getCurrentContext
    };
  })();