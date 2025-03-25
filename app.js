/**
 * CipherWrite - Main Application Script
 * 
 * This script handles the user interface interactions and connects
 * with the AI detection algorithm.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize UI elements
  const textInput = document.getElementById('text-input');
  const analyzeBtn = document.getElementById('analyze-btn');
  const clearBtn = document.getElementById('clear-btn');
  const fileInput = document.getElementById('file-input');
  const exampleBtn = document.getElementById('example-btn');
  const charCount = document.getElementById('char-count');
  const resultsPlaceholder = document.querySelector('.results-placeholder');
  const resultsContent = document.querySelector('.results-content');
  const aiScoreElement = document.getElementById('ai-score');
  const confidenceBadge = document.getElementById('confidence-badge');
  const gaugeFill = document.getElementById('gauge-fill');
  const resultExplanation = document.getElementById('result-explanation');
  const confidenceText = document.getElementById('confidence-text');
  const factorBars = document.getElementById('factor-bars');
  const suggestionsList = document.getElementById('suggestions-list');
  const suggestionsContainer = document.getElementById('suggestions-container');
  const copyResultsBtn = document.getElementById('copy-results-btn');
  const newAnalysisBtn = document.getElementById('new-analysis-btn');
  
  // Add char progress bar
  const inputFeedback = document.querySelector('.input-feedback');
  const charProgressContainer = document.createElement('div');
  charProgressContainer.className = 'char-progress-container';
  const charProgressBar = document.createElement('div');
  charProgressBar.className = 'char-progress-bar';
  charProgressBar.style.width = '0%';
  charProgressContainer.appendChild(charProgressBar);
  inputFeedback.appendChild(charProgressContainer);
  
  // Example text for demo purposes
  const exampleText = `This technology leverages sophisticated natural language processing algorithms to analyze patterns in text composition, syntax, and stylistic elements. It identifies characteristics that are typically more common in AI-generated content versus human writing. The system evaluates factors such as repetitive patterns, sentence structure diversity, punctuation usage, and stylistic consistency to produce a probability score.`;
  
  // Set current year in footer
  document.getElementById('current-year').textContent = new Date().getFullYear();
  
  // Initialize AI detector
  const detector = new AITextDetector();
  
  // Add event listeners
  analyzeBtn.addEventListener('click', analyzeText);
  clearBtn.addEventListener('click', clearText);
  textInput.addEventListener('input', handleTextInput);
  fileInput.addEventListener('change', handleFileUpload);
  exampleBtn.addEventListener('click', loadExampleText);
  copyResultsBtn.addEventListener('click', copyResults);
  newAnalysisBtn.addEventListener('click', startNewAnalysis);
  
  // Add drag and drop functionality
  setupDragAndDrop();
  
  // Update character count and enable/disable analyze button
  function handleTextInput() {
    const text = textInput.value;
    const count = text.length;
    charCount.textContent = `${count} character${count !== 1 ? 's' : ''}`;
    
    // Add appropriate class for visual feedback
    charCount.className = 'char-counter';
    charProgressBar.className = 'char-progress-bar';
    
    // Update progress bar
    const progressPercentage = Math.min(100, count / 200 * 100);
    charProgressBar.style.width = `${progressPercentage}%`;
    
    if (count > 0 && count < 100) {
      charCount.classList.add('warning');
      charProgressBar.classList.add('warning');
    } else if (count >= 100) {
      charCount.classList.add('valid');
      charProgressBar.classList.add('valid');
    }
    
    // Enable/disable analyze button
    analyzeBtn.disabled = count === 0;
    
    // Update aria-label for accessibility
    if (count > 0) {
      textInput.setAttribute('aria-label', `Text to analyze. Current character count: ${count}`);
    } else {
      textInput.setAttribute('aria-label', 'Text to analyze');
    }
  }
  
  // Setup drag and drop file upload
  function setupDragAndDrop() {
    const fileUpload = document.querySelector('.file-upload');
    const fileLabel = document.querySelector('.file-label');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      fileLabel.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
      fileLabel.addEventListener(eventName, () => {
        fileUpload.classList.add('drag-active');
      });
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
      fileLabel.addEventListener(eventName, () => {
        fileUpload.classList.remove('drag-active');
      });
    });
    
    fileLabel.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
      const dt = e.dataTransfer;
      const files = dt.files;
      
      if (files.length) {
        fileInput.files = files;
        handleFileUpload({ target: { files } });
      }
    }
  }
  
  // Handle file upload
  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file type and size
    if (file.type !== 'text/plain' && 
        file.type !== 'text/markdown' && 
        file.type !== 'application/rtf' &&
        !file.name.endsWith('.txt') && 
        !file.name.endsWith('.md') && 
        !file.name.endsWith('.rtf')) {
      alert('Please upload a text file (.txt, .md, or .rtf)');
      fileInput.value = '';
      return;
    }
    
    if (file.size > 1024 * 1024) { // 1MB limit
      alert('File size exceeds 1MB limit');
      fileInput.value = '';
      return;
    }
    
    // Read file
    const reader = new FileReader();
    reader.onload = function(e) {
      textInput.value = e.target.result;
      handleTextInput();
      analyzeBtn.focus();
    };
    reader.onerror = function() {
      alert('Error reading file');
    };
    reader.readAsText(file);
  }
  
  // Load example text
  function loadExampleText() {
    textInput.value = exampleText;
    handleTextInput();
    textInput.focus();
  }
  
  // Initialize button state
  handleTextInput();
  
  // Analyze text function
  function analyzeText() {
    // Show loading state
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<span class="btn-icon">⏳</span> Analyzing...';
    
    // Get text from input
    const text = textInput.value.trim();
    
    // Use setTimeout to allow UI to update before heavy computation
    setTimeout(() => {
      // Analyze the text
      const result = detector.analyze(text);
      
      // Display results
      displayResults(result, text);
      
      // Reset button state
      analyzeBtn.disabled = false;
      analyzeBtn.innerHTML = '<span class="btn-icon">🔍</span> Analyze';
    }, 500);
  }
  
  // Calculate text statistics
  function calculateTextStatistics(text) {
    // Characters
    const characters = text.length;
    
    // Non-blank characters (excluding whitespace)
    const nonBlankCharacters = text.replace(/\s/g, '').length;
    
    // Words (split by whitespace and filter empty strings)
    const words = text.split(/\s+/).filter(word => word.length > 0).length;
    
    // Spaces (count all whitespace characters)
    const spaces = (text.match(/\s/g) || []).length;
    
    // Sentences (split by period, exclamation mark, or question mark followed by space or end of text)
    // This is a simplified approach and may not catch all edge cases
    const sentences = (text.match(/[.!?]+(?=\s|$)/g) || []).length;
    
    // Lines (split by newline characters)
    const lines = text.split(/\n/).length;
    
    // Non-empty lines (filter out empty lines)
    const nonEmptyLines = text.split(/\n/).filter(line => line.trim().length > 0).length;
    
    // Pages (estimate based on average of 250 words per page)
    const pages = Math.max(1, Math.ceil(words / 250));
    
    return {
      characters,
      nonBlankCharacters,
      words,
      spaces,
      sentences,
      lines,
      nonEmptyLines,
      pages
    };
  }
  
  // Update text statistics in UI
  function updateTextStatistics(text) {
    const stats = calculateTextStatistics(text);
    
    // Update each stat in the UI
    document.getElementById('stat-characters').textContent = stats.characters.toLocaleString();
    document.getElementById('stat-nonblank').textContent = stats.nonBlankCharacters.toLocaleString();
    document.getElementById('stat-words').textContent = stats.words.toLocaleString();
    document.getElementById('stat-spaces').textContent = stats.spaces.toLocaleString();
    document.getElementById('stat-sentences').textContent = stats.sentences.toLocaleString();
    document.getElementById('stat-lines').textContent = stats.lines.toLocaleString();
    document.getElementById('stat-nonemptylines').textContent = stats.nonEmptyLines.toLocaleString();
    document.getElementById('stat-pages').textContent = stats.pages.toLocaleString();
  }
  
  // Display the analysis results
  function displayResults(result, text) {
    // Hide placeholder, show results
    resultsPlaceholder.classList.add('hidden');
    resultsContent.classList.remove('hidden');
    resultsContent.classList.add('fade-in');
    
    // Update score display (ensure it never exceeds 100%)
    const displayScore = Math.min(100, result.score);
    aiScoreElement.textContent = `${displayScore}%`;
    
    // Update gauge
    gaugeFill.style.width = `${displayScore}%`;
    
    // Set result colors based on score
    const scoreCircle = aiScoreElement.parentNode;
    scoreCircle.className = 'score-circle';
    
    if (displayScore >= 80) {
      scoreCircle.classList.add('ai');
    } else if (displayScore <= 20) {
      scoreCircle.classList.add('human');
    } else {
      scoreCircle.classList.add('neutral');
    }
    
    // Update confidence badge
    confidenceBadge.textContent = result.confidence.charAt(0).toUpperCase() + result.confidence.slice(1);
    confidenceBadge.className = 'confidence-badge ' + result.confidence;
    
    // Update explanation
    resultExplanation.textContent = result.explanation;
    
    // Update confidence text
    let confidenceMessage = '';
    switch(result.confidence) {
      case 'high':
        confidenceMessage = 'Multiple consistent indicators were found in the text, leading to a high confidence assessment.';
        break;
      case 'medium':
        confidenceMessage = 'Some indicators were found, but the pattern is not conclusive. Consider providing more text for a more accurate analysis.';
        break;
      case 'low':
        confidenceMessage = 'The text contains mixed or conflicting indicators, resulting in lower confidence in this assessment.';
        break;
      case 'insufficient':
        confidenceMessage = 'Unable to provide reliable analysis. Please provide longer text (at least 100 characters).';
        break;
    }
    confidenceText.textContent = confidenceMessage;
    
    // Update text statistics
    updateTextStatistics(text);
    
    // Create factor bars
    createFactorBars(result.details);
    
    // Create improvement suggestions
    createImprovementSuggestions(result);
    
    // Announce result for screen readers
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('class', 'visually-hidden');
    announcement.textContent = `Analysis complete. AI probability: ${displayScore}%. Confidence: ${result.confidence}. ${result.explanation}`;
    document.body.appendChild(announcement);
    
    // Remove announcement after it's been read
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 3000);
  }
  
  // Create factor bars for detailed view
  function createFactorBars(factors) {
    // Clear previous factors
    factorBars.innerHTML = '';
    
    // Create a sorted array of factors
    const sortedFactors = Object.entries(factors)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    
    // Create a factor bar for each factor
    sortedFactors.forEach(factor => {
      const factorItem = document.createElement('div');
      factorItem.className = 'factor-item';
      
      const header = document.createElement('div');
      header.className = 'factor-header';
      
      const nameSpan = document.createElement('span');
      nameSpan.className = 'factor-name';
      
      // Format factor name for display
      let displayName = factor.name
        .replace(/([A-Z])/g, ' $1') // Add space before capitals
        .replace(/^./, str => str.toUpperCase()); // Capitalize first letter
      
      // Special case for specific factors
      if (factor.name === 'repetitivePatterns') {
        displayName = 'Repetitive Patterns';
      } else if (factor.name === 'humanStyle') {
        displayName = 'Human Style Markers';
      }
      
      nameSpan.textContent = displayName;
      
      // Add info icon with tooltip
      const infoIcon = document.createElement('span');
      infoIcon.className = 'factor-info';
      infoIcon.textContent = 'i';
      infoIcon.setAttribute('aria-label', `Information about ${displayName}`);
      
      const tooltip = document.createElement('div');
      tooltip.className = 'factor-tooltip';
      tooltip.textContent = getFactorDescription(factor.name);
      
      nameSpan.appendChild(infoIcon);
      nameSpan.appendChild(tooltip);
      
      const valueSpan = document.createElement('span');
      valueSpan.className = 'factor-value';
      valueSpan.textContent = `${Math.round(factor.value)}%`;
      
      header.appendChild(nameSpan);
      header.appendChild(valueSpan);
      
      const barContainer = document.createElement('div');
      barContainer.className = 'factor-bar-container';
      
      const barFill = document.createElement('div');
      barFill.className = 'factor-bar-fill';
      barFill.style.width = `${factor.value}%`;
      
      // Color the bar based on value
      if (factor.value >= 80) {
        barFill.style.backgroundColor = 'var(--color-ai)';
      } else if (factor.value >= 50) {
        barFill.style.backgroundColor = 'var(--color-primary)';
      } else {
        barFill.style.backgroundColor = 'var(--color-human)';
      }
      
      barContainer.appendChild(barFill);
      factorItem.appendChild(header);
      factorItem.appendChild(barContainer);
      factorBars.appendChild(factorItem);
    });
  }
  
  // Create improvement suggestions based on analysis
  function createImprovementSuggestions(result) {
    // Clear previous suggestions
    suggestionsList.innerHTML = '';
    
    // Determine if we should show suggestions
    if (result.score < 30) {
      // If text is already very human-like, hide suggestions
      suggestionsContainer.style.display = 'none';
      return;
    }
    
    suggestionsContainer.style.display = 'block';
    
    // Generate suggestions based on factor scores
    const suggestions = [];
    const factors = result.details;
    
    if (factors.repetitivePatterns > 60) {
      suggestions.push({
        icon: '🔄',
        text: 'Reduce repetitive phrases and find synonyms for words that appear multiple times.'
      });
    }
    
    if (factors.sentenceStructure > 60) {
      suggestions.push({
        icon: '📝',
        text: 'Vary your sentence structures. Mix short sentences with longer ones, and use different ways to start sentences.'
      });
    }
    
    if (factors.punctuationDiversity > 60) {
      suggestions.push({
        icon: '❗',
        text: 'Add more variety to your punctuation. Try using question marks, exclamation points, em dashes, or semicolons occasionally.'
      });
    }
    
    if (factors.passiveVoice > 60) {
      suggestions.push({
        icon: '🗣️',
        text: 'Use more active voice instead of passive voice. For example, say "We analyzed the data" instead of "The data was analyzed."'
      });
    }
    
    if (factors.humanStyle > 50) {
      suggestions.push({
        icon: '👤',
        text: 'Add personal opinions or experiences. Use informal phrases occasionally, like "I think" or "in my opinion."'
      });
      
      suggestions.push({
        icon: '🗨️',
        text: 'Include some conversational elements like contractions (don\'t, I\'m, we\'ve) or casual transitions ("anyway", "actually", "by the way").'
      });
    }
    
    if (suggestions.length === 0) {
      // Add generic suggestions if none were generated
      suggestions.push({
        icon: '📚',
        text: 'Consider adding a personal anecdote or example that illustrates your point.'
      });
      
      suggestions.push({
        icon: '🔍',
        text: 'Try varying your vocabulary with more specific or unconventional word choices occasionally.'
      });
    }
    
    // Add suggestions to the list
    suggestions.forEach((suggestion, index) => {
      const li = document.createElement('li');
      li.className = 'suggestion-item';
      li.style.animationDelay = `${index * 0.1}s`;
      
      const icon = document.createElement('span');
      icon.className = 'suggestion-icon';
      icon.textContent = suggestion.icon;
      icon.setAttribute('aria-hidden', 'true');
      
      const text = document.createElement('span');
      text.className = 'suggestion-text';
      text.textContent = suggestion.text;
      
      li.appendChild(icon);
      li.appendChild(text);
      suggestionsList.appendChild(li);
    });
  }
  
  // Get description for each factor
  function getFactorDescription(factorName) {
    const descriptions = {
      repetitivePatterns: 'Analyzes how often words and phrases are repeated throughout the text. AI tends to reuse similar patterns more frequently than humans.',
      sentenceStructure: 'Examines the variety of sentence constructions and transition phrases. AI often uses more formal and predictable structures.',
      punctuationDiversity: 'Measures how varied the punctuation usage is. Humans typically use a wider range of punctuation marks with less predictable patterns.',
      passiveVoice: 'Evaluates the balance of passive vs. active voice. AI-generated text often contains more passive voice constructions.',
      humanStyle: 'Identifies conversational elements, personal opinions, and informal expressions that are more common in human writing.',
      styleConsistency: 'Analyzes how consistent the writing style remains throughout the text. AI typically maintains a more uniform style.'
    };
    
    return descriptions[factorName] || 'This factor contributes to the overall AI probability score.';
  }
  
  // Clear text function
  function clearText() {
    textInput.value = '';
    handleTextInput();
    textInput.focus();
  }
  
  // Copy results function
  function copyResults() {
    const resultScore = aiScoreElement.textContent;
    const confidenceLevel = confidenceBadge.textContent;
    const resultExpl = resultExplanation.textContent;
    const confidenceInfo = confidenceText.textContent;
    
    // Get statistics text
    let statsText = '\n\nText Statistics:\n';
    statsText += `Characters: ${document.getElementById('stat-characters').textContent}\n`;
    statsText += `Words: ${document.getElementById('stat-words').textContent}\n`;
    statsText += `Sentences: ${document.getElementById('stat-sentences').textContent}\n`;
    statsText += `Pages (est.): ${document.getElementById('stat-pages').textContent}`;
    
    // Get suggestions text
    let suggestionsText = '';
    if (suggestionsContainer.style.display !== 'none') {
      suggestionsText = '\n\nImprovement Suggestions:\n';
      const suggestionItems = suggestionsList.querySelectorAll('.suggestion-item');
      suggestionItems.forEach(item => {
        suggestionsText += `• ${item.querySelector('.suggestion-text').textContent}\n`;
      });
    }
    
    const textToCopy = `CipherWrite Analysis Results\n\nAI Probability: ${resultScore}\nConfidence: ${confidenceLevel}\n\n${resultExpl}\n\n${confidenceInfo}${statsText}${suggestionsText}\n\nAnalyzed on: ${new Date().toLocaleString()}`;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
      // Show confirmation
      const originalText = copyResultsBtn.innerHTML;
      copyResultsBtn.innerHTML = '<span class="btn-icon">✓</span> Copied!';
      
      setTimeout(() => {
        copyResultsBtn.innerHTML = originalText;
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      alert('Unable to copy results. Please select and copy manually.');
    });
  }
  
  // Start new analysis function
  function startNewAnalysis() {
    // Hide results, show placeholder
    resultsContent.classList.add('hidden');
    resultsPlaceholder.classList.remove('hidden');
    
    // Clear text
    clearText();
  }
  
  // Add keyboard shortcut for analyze (Ctrl+Enter)
  textInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (!analyzeBtn.disabled) {
        analyzeText();
      }
    }
  });
  
  // Add accessibility enhancements for keyboard navigation
  document.querySelectorAll('button, .file-label').forEach(element => {
    element.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        element.click();
      }
    });
  });
  
  // MOBILE ENHANCEMENTS
  
  // Text Statistics Show More/Less toggle
  function setupStatisticsToggle() {
    const statsContainer = document.querySelector('.text-stats-container');
    if (!statsContainer) return;
    
    // Add the collapsed class by default
    statsContainer.classList.add('collapsed');
    
    // Create toggle button
    const toggleBtn = document.createElement('div');
    toggleBtn.className = 'text-stats-toggle';
    toggleBtn.textContent = 'Show More';
    toggleBtn.setAttribute('aria-label', 'Toggle statistics visibility');
    toggleBtn.setAttribute('role', 'button');
    toggleBtn.setAttribute('tabindex', '0');
    
    statsContainer.appendChild(toggleBtn);
    
    // Add click handler
    toggleBtn.addEventListener('click', function() {
      statsContainer.classList.toggle('collapsed');
      this.textContent = statsContainer.classList.contains('collapsed') ? 'Show More' : 'Show Less';
    });
    
    // Also toggle on keyboard enter/space
    toggleBtn.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.click();
      }
    });
  }

  // FAQ Accordion functionality
  function setupFaqAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');
    if (faqItems.length === 0) return;
    
    faqItems.forEach(item => {
      const heading = item.querySelector('h3');
      if (!heading) return;
      
      // By default, all panels are closed
      item.classList.remove('active');
      
      // Add click handler to heading
      heading.addEventListener('click', function() {
        // If it's already active, close it
        if (item.classList.contains('active')) {
          item.classList.remove('active');
          heading.setAttribute('aria-expanded', 'false');
        } else {
          // Optional: close other open items
          /*
          faqItems.forEach(otherItem => {
            if (otherItem !== item) {
              otherItem.classList.remove('active');
              otherItem.querySelector('h3').setAttribute('aria-expanded', 'false');
            }
          });
          */
          
          // Open the clicked item
          item.classList.add('active');
          heading.setAttribute('aria-expanded', 'true');
        }
      });
      
      // Add accessibility attributes
      const content = item.querySelector('p');
      if (content) {
        const id = 'faq-' + Math.random().toString(36).substring(2, 9);
        content.id = id;
        heading.setAttribute('aria-controls', id);
        heading.setAttribute('aria-expanded', 'false');
      }
      
      // Allow keyboard navigation
      heading.setAttribute('tabindex', '0');
      heading.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.click();
        }
      });
    });
  }

  // Add visual touch feedback
  function addTouchFeedback() {
    const touchElements = document.querySelectorAll('button, .text-btn, .file-label, .factor-info');
    
    touchElements.forEach(el => {
      el.addEventListener('touchstart', function() {
        this.classList.add('touch-active');
      }, { passive: true });
      
      el.addEventListener('touchend', function() {
        this.classList.remove('touch-active');
      }, { passive: true });
      
      el.addEventListener('touchcancel', function() {
        this.classList.remove('touch-active');
      }, { passive: true });
    });
  }

  // Initialize mobile enhancements
  function initializeMobileEnhancements() {
    setupStatisticsToggle();
    setupFaqAccordion();
    addTouchFeedback();
  }
  
  // Initialize mobile enhancements
  initializeMobileEnhancements();
});
