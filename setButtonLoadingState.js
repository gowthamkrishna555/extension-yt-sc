function setButtonLoadingState(button, isLoading) {
    if (!button) return;
    
    if (isLoading) {
      // Store original image source
      if (!button.hasAttribute('data-original-src')) {
        button.setAttribute('data-original-src', button.src);
      }
      
      // Apply loading spinner effect
      button.classList.add('spinner-active');
      
      // Create or update loading spinner
      if (!button.querySelector('.loading-spinner')) {
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        Object.assign(spinner.style, {
          position: 'absolute',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          border: '2px solid rgba(0,0,0,0.1)',
          borderTopColor: '#00a67d',
          animation: 'spell-check-spin 0.8s linear infinite'
        });
        
        // Add animation keyframes if they don't exist
        if (!document.getElementById('spell-check-spinner-style')) {
          const styleSheet = document.createElement('style');
          styleSheet.id = 'spell-check-spinner-style';
          styleSheet.textContent = `
            @keyframes spell-check-spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .spinner-active {
              opacity: 0.7;
            }
          `;
          document.head.appendChild(styleSheet);
        }
        
        button.appendChild(spinner);
      }
    } else {
      // Remove loading spinner
      button.querySelectorAll('.loading-spinner').forEach(spinner => spinner.remove());
      button.classList.remove('spinner-active');
      
      // Restore original appearance
      if (button.hasAttribute('data-original-src')) {
        button.src = button.getAttribute('data-original-src');
      }
    }
  }
window.setButtonLoadingState = setButtonLoadingState;