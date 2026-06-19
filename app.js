document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================
  // State Variables
  // ==========================================
  let currentStep = 1;
  const totalSteps = 6;
  let uploadedFiles = [];
  let transactionsCount = 0;

  // ==========================================
  // DOM Elements Selection
  // ==========================================
  const form = document.getElementById('recovery-report-form');
  const panels = document.querySelectorAll('.form-step-panel');
  const progressSteps = document.querySelectorAll('.progress-step');
  const progressBar = document.getElementById('progress-bar-fill');
  
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const saveProgressBtn = document.getElementById('save-progress-btn');
  const wizardActionsBar = document.getElementById('wizard-actions-bar');
  const successPanel = document.getElementById('success-panel');
  
  // Accordion components
  const behalfToggle = document.getElementById('behalf-toggle');
  const behalfPanel = document.getElementById('behalf-panel');
  
  const bankRadios = document.getElementsByName('contacted_bank');
  const bankRefPanel = document.getElementById('bank-ref-panel');
  const bankRefInput = document.getElementById('bank-ref-num');
  
  const policeRadios = document.getElementsByName('contacted_police');
  const policeRefPanel = document.getElementById('police-ref-panel');
  const policeRefInput = document.getElementById('police-ref-num');
  
  // Transactions elements
  const transactionTableBody = document.getElementById('transaction-table-body');
  const addTransactionBtn = document.getElementById('add-transaction-btn');
  
  // Upload elements
  const dropZone = document.getElementById('upload-drop-zone');
  const fileInput = document.getElementById('evidence-files-input');
  const fileList = document.getElementById('uploaded-files-list');
  
  // Canvas Elements
  const canvas = document.getElementById('signature-pad');
  const clearCanvasBtn = document.getElementById('clear-signature-btn');
  const signatureInput = document.getElementById('signature-data');
  const consentDateInput = document.getElementById('consent-date');
  
  // Toast Elements
  const toast = document.getElementById('toast-message-box');
  const toastText = document.getElementById('toast-text');
  
  // FAQ accordion
  const faqQuestions = document.querySelectorAll('.faq-question');

  // Success screen items
  const caseReferenceVal = document.getElementById('case-reference-val');
  const downloadReceiptBtn = document.getElementById('download-receipt-btn');
  const fileAnotherReportBtn = document.getElementById('file-another-report-btn');

  // ==========================================
  // Date of Signature Default
  // ==========================================
  const today = new Date().toISOString().split('T')[0];
  consentDateInput.value = today;

  // ==========================================
  // FAQ Accordion Handler
  // ==========================================
  faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
      const item = question.parentElement;
      const answer = item.querySelector('.faq-answer');
      const isExpanded = question.getAttribute('aria-expanded') === 'true';

      // Toggle current
      question.setAttribute('aria-expanded', !isExpanded);
      item.classList.toggle('active');

      if (!isExpanded) {
        answer.style.maxHeight = answer.scrollHeight + 'px';
      } else {
        answer.style.maxHeight = '0';
      }
    });
  });

  // ==========================================
  // Dynamic Accordion Panel Toggle Utility
  // ==========================================
  function toggleAccordionPanel(panel, show) {
    if (show) {
      panel.classList.add('open');
      panel.style.maxHeight = panel.scrollHeight + 'px';
      // Enable required constraints if applicable
      const inputs = panel.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        if (input.id === 'bank-ref-num' || input.id === 'police-ref-num') {
          input.setAttribute('required', 'required');
        }
      });
    } else {
      panel.style.maxHeight = '0';
      panel.classList.remove('open');
      // Disable required constraints
      const inputs = panel.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        input.removeAttribute('required');
        input.classList.remove('has-error');
        const errSpan = document.getElementById(`error-${input.id}`);
        if (errSpan) errSpan.textContent = '';
      });
    }
  }

  // Toggle "Reporting on Behalf" section
  behalfToggle.addEventListener('change', () => {
    toggleAccordionPanel(behalfPanel, behalfToggle.checked);
  });

  // Toggle bank reference field
  bankRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      const show = radio.value === 'yes';
      toggleAccordionPanel(bankRefPanel, show);
    });
  });

  // Toggle police reference field
  policeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      const show = radio.value === 'yes';
      toggleAccordionPanel(policeRefPanel, show);
    });
  });

  // ==========================================
  // Dynamic Transactions Table Manager
  // ==========================================
  function createTransactionRow(date = '', amount = '', method = 'Bank Transfer', ref = '') {
    transactionsCount++;
    const rowId = `txn-row-${transactionsCount}`;
    const row = document.createElement('tr');
    row.id = rowId;
    
    row.innerHTML = `
      <td>
        <input type="date" name="txn_date[]" value="${date}" class="input-control txn-input" required aria-label="Transaction Date">
      </td>
      <td>
        <input type="number" name="txn_amount[]" value="${amount}" min="1" step="any" placeholder="10000" class="input-control txn-input" required aria-label="Amount">
      </td>
      <td>
        <select name="txn_method[]" class="input-control txn-input" required aria-label="Payment Method">
          <option value="Bank Transfer" ${method === 'Bank Transfer' ? 'selected' : ''}>Bank Transfer</option>
          <option value="Wire Transfer" ${method === 'Wire Transfer' ? 'selected' : ''}>Wire Transfer</option>
          <option value="Cryptocurrency" ${method === 'Cryptocurrency' ? 'selected' : ''}>Cryptocurrency</option>
          <option value="Gift Cards" ${method === 'Gift Cards' ? 'selected' : ''}>Gift Cards</option>
          <option value="Cash" ${method === 'Cash' ? 'selected' : ''}>Cash</option>
          <option value="Other" ${method === 'Other' ? 'selected' : ''}>Other</option>
        </select>
      </td>
      <td>
        <input type="text" name="txn_ref[]" value="${ref}" placeholder="TXN-ID / Hash" class="input-control txn-input" required aria-label="Reference or Hash">
      </td>
      <td>
        <button type="button" class="btn btn-danger btn-sm delete-txn-btn" style="min-height:38px; padding: 0 0.5rem;" aria-label="Delete transaction row">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
        </button>
      </td>
    `;
    
    // Attach delete handler
    row.querySelector('.delete-txn-btn').addEventListener('click', () => {
      // Ensure at least 1 transaction remains
      const rows = transactionTableBody.querySelectorAll('tr');
      if (rows.length > 1) {
        row.remove();
        saveFormDataToLocal();
      } else {
        showToast("At least one transaction record must remain.");
      }
    });

    // Attach local save triggers on blur
    row.querySelectorAll('.txn-input').forEach(input => {
      input.addEventListener('blur', () => {
        validateField(input);
        saveFormDataToLocal();
      });
      input.addEventListener('input', () => {
        clearFieldErrors(input);
      });
    });

    transactionTableBody.appendChild(row);
  }

  addTransactionBtn.addEventListener('click', () => {
    createTransactionRow();
    saveFormDataToLocal();
  });

  // Inject initial default transaction
  createTransactionRow();

  // ==========================================
  // Drag & Drop File Upload Simulator
  // ==========================================
  function preventDropDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDropDefaults, false);
  });

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
  });

  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
  });

  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => handleFiles(fileInput.files));

  function handleFiles(files) {
    [...files].forEach(file => {
      // Validation Check: File type & size limit 15MB
      const maxSize = 15 * 1024 * 1024; // 15MB
      if (file.size > maxSize) {
        showToast(`File ${file.name} exceeds the 15MB limit.`);
        return;
      }
      
      const fileId = `file-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const fileRecord = {
        id: fileId,
        name: file.name,
        size: formatBytes(file.size)
      };
      
      uploadedFiles.push(fileRecord);
      renderFileItem(fileRecord);
    });
    saveFormDataToLocal();
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function renderFileItem(file) {
    const item = document.createElement('div');
    item.className = 'file-item';
    item.id = file.id;
    
    item.innerHTML = `
      <div class="file-info">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--accent);"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        <span class="file-name">${file.name}</span>
        <span class="file-size">(${file.size})</span>
      </div>
      <div style="display: flex; align-items: center;">
        <div class="file-progress" id="progress-container-${file.id}">
          <div class="file-progress-bar" id="progress-bar-${file.id}"></div>
        </div>
        <button type="button" class="btn btn-text btn-sm delete-file-btn" style="min-height: auto; padding: 0.25rem 0.5rem;" aria-label="Remove file">
          Remove
        </button>
      </div>
    `;
    
    fileList.appendChild(item);

    // Simulate upload progress
    const pBar = document.getElementById(`progress-bar-${file.id}`);
    const pCont = document.getElementById(`progress-container-${file.id}`);
    setTimeout(() => {
      pBar.style.width = '100%';
      // Fade progress bar out after upload completes
      setTimeout(() => {
        pCont.style.opacity = '0';
        setTimeout(() => pCont.style.display = 'none', 300);
      }, 900);
    }, 100);

    // Remove file event
    item.querySelector('.delete-file-btn').addEventListener('click', () => {
      uploadedFiles = uploadedFiles.filter(f => f.id !== file.id);
      item.remove();
      saveFormDataToLocal();
    });
  }

  // ==========================================
  // Canvas Signature Pad
  // ==========================================
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;
  const ctx = canvas.getContext('2d');

  function initCanvas() {
    // Resize coordinates to map screen dimensions (avoid warping)
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = 180;
    
    // Canvas context settings for premium line rendering
    ctx.strokeStyle = '#0f172a'; // Deep slate ink
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Clear canvas when re-initialized to clear any rendering glitch
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    signatureInput.value = '';
  }

  function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }

  function startDrawing(e) {
    isDrawing = true;
    const pos = getMousePos(e);
    lastX = pos.x;
    lastY = pos.y;
    e.preventDefault();
  }

  function draw(e) {
    if (!isDrawing) return;
    const pos = getMousePos(e);
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    
    lastX = pos.x;
    lastY = pos.y;
    e.preventDefault();
  }

  function stopDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
    
    // Update hidden field state
    signatureInput.value = canvas.toDataURL();
    validateField(signatureInput);
  }

  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseout', stopDrawing);

  // Touch triggers
  canvas.addEventListener('touchstart', startDrawing, {passive: false});
  canvas.addEventListener('touchmove', draw, {passive: false});
  canvas.addEventListener('touchend', stopDrawing);

  clearCanvasBtn.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    signatureInput.value = '';
    validateField(signatureInput);
  });

  // ==========================================
  // Validation Event Timing Logic
  // ==========================================
  
  // Validation constraints helper
  function validateField(input) {
    const errorSpan = document.getElementById(`error-${input.id || input.name}`);
    if (!errorSpan && input.type !== 'radio' && input.type !== 'checkbox') return true;

    let isValid = true;
    let message = '';

    // Handle Required check
    if (input.hasAttribute('required')) {
      if (input.type === 'checkbox') {
        if (!input.checked) {
          isValid = false;
          message = 'You must accept this field to proceed.';
        }
      } else if (input.type === 'radio') {
        const radios = document.getElementsByName(input.name);
        let checked = false;
        radios.forEach(r => { if (r.checked) checked = true; });
        if (!checked) {
          isValid = false;
          message = 'Please select an option.';
        }
      } else if (!input.value.trim()) {
        isValid = false;
        message = 'This field is required.';
      }
    }

    // Email format check
    if (isValid && input.type === 'email' && input.value.trim()) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(input.value)) {
        isValid = false;
        message = 'Please enter a valid email address.';
      }
    }

    // Number validity
    if (isValid && input.type === 'number' && input.value) {
      if (input.min && parseFloat(input.value) < parseFloat(input.min)) {
        isValid = false;
        message = `Value must be at least ${input.min}.`;
      }
    }

    // Update UI states
    const targetSpan = errorSpan || document.getElementById(`error-${input.name}`);
    if (!isValid) {
      input.classList.add('has-error');
      if (targetSpan) {
        targetSpan.textContent = message;
      }
    } else {
      input.classList.remove('has-error');
      if (targetSpan) {
        targetSpan.textContent = '';
      }
    }

    return isValid;
  }

  // Clear errors on typing (input event)
  function clearFieldErrors(input) {
    input.classList.remove('has-error');
    const errorSpan = document.getElementById(`error-${input.id || input.name}`) || document.getElementById(`error-${input.name}`);
    if (errorSpan) {
      errorSpan.textContent = '';
    }
  }

  // Attach blur and input handlers to static forms
  const allInputs = form.querySelectorAll('input, select, textarea');
  allInputs.forEach(input => {
    input.addEventListener('blur', () => {
      validateField(input);
      saveFormDataToLocal();
    });
    
    input.addEventListener('input', () => {
      clearFieldErrors(input);
    });
  });

  // Validate entire panel before next step
  function validateCurrentStep() {
    const currentPanel = panels[currentStep - 1];
    const inputs = currentPanel.querySelectorAll('input, select, textarea');
    let isStepValid = true;
    let firstInvalid = null;

    inputs.forEach(input => {
      // Skip disabled validation elements
      if (input.closest('.accordion-panel') && !input.closest('.accordion-panel').classList.contains('open')) {
        return;
      }
      
      const isInputValid = validateField(input);
      if (!isInputValid) {
        isStepValid = false;
        if (!firstInvalid) firstInvalid = input;
      }
    });

    // Special check for Step 6 Signature canvas validation
    if (currentStep === 6) {
      if (!signatureInput.value) {
        isStepValid = false;
        signatureInput.classList.add('has-error');
        const errSpan = document.getElementById('error-signature-data');
        if (errSpan) errSpan.textContent = 'Please draw your legal signature.';
        if (!firstInvalid) firstInvalid = canvas;
      }
    }

    if (firstInvalid) {
      firstInvalid.focus();
      // Scroll to invalid element
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return isStepValid;
  }

  // ==========================================
  // LocalStorage Caching Mechanism
  // ==========================================
  const LOCAL_STORAGE_KEY = 'fraud_report_cache';

  function saveFormDataToLocal() {
    // Don't save if submission completes
    if (currentStep > totalSteps) return;

    const formData = {};
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
      // Skip files, signature data and password types
      if (input.type === 'file' || input.id === 'signature-data') return;

      if (input.type === 'checkbox') {
        formData[input.name || input.id] = input.checked;
      } else if (input.type === 'radio') {
        if (input.checked) {
          formData[input.name] = input.value;
        }
      } else {
        formData[input.name || input.id] = input.value;
      }
    });

    // Save transactions
    const transactions = [];
    const rows = transactionTableBody.querySelectorAll('tr');
    rows.forEach(row => {
      const date = row.querySelector('[name="txn_date[]"]').value;
      const amount = row.querySelector('[name="txn_amount[]"]').value;
      const method = row.querySelector('[name="txn_method[]"]').value;
      const ref = row.querySelector('[name="txn_ref[]"]').value;
      transactions.push({ date, amount, method, ref });
    });
    formData['transactions_log'] = transactions;
    formData['step_index'] = currentStep;

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formData));
  }

  function loadFormDataFromLocal() {
    const cachedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!cachedData) return;

    try {
      const data = JSON.parse(cachedData);
      
      const inputs = form.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        const name = input.name || input.id;
        if (data[name] !== undefined) {
          if (input.type === 'checkbox') {
            input.checked = data[name];
          } else if (input.type === 'radio') {
            if (input.value === data[name]) {
              input.checked = true;
            }
          } else {
            input.value = data[name];
          }
        }
      });

      // Recover dynamic panel states
      if (behalfToggle.checked) {
        toggleAccordionPanel(behalfPanel, true);
      }
      
      const contactedBankVal = data['contacted_bank'];
      if (contactedBankVal === 'yes') {
        toggleAccordionPanel(bankRefPanel, true);
      }

      const contactedPoliceVal = data['contacted_police'];
      if (contactedPoliceVal === 'yes') {
        toggleAccordionPanel(policeRefPanel, true);
      }

      // Recover transactions
      if (data['transactions_log'] && data['transactions_log'].length > 0) {
        // Clear default
        transactionTableBody.innerHTML = '';
        data['transactions_log'].forEach(txn => {
          createTransactionRow(txn.date, txn.amount, txn.method, txn.ref);
        });
      }

      // Restore step position
      if (data['step_index']) {
        currentStep = parseInt(data['step_index']);
        if (currentStep < 1) currentStep = 1;
        if (currentStep > totalSteps) currentStep = 1;
        updateStepUI();
      }

      showToast("Progress restored from your last visit.");
    } catch (e) {
      console.error("Error loading cached report data", e);
    }
  }

  // Save progress trigger on header button
  saveProgressBtn.addEventListener('click', () => {
    saveFormDataToLocal();
    showToast("Progress saved locally.");
  });

  // ==========================================
  // Toast Alert Notification
  // ==========================================
  let toastTimeout;
  function showToast(message) {
    toastText.textContent = message;
    toast.classList.add('show');
    
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  // ==========================================
  // Wizard Navigation Manager
  // ==========================================
  function updateStepUI() {
    // Update step visibility
    panels.forEach((panel, index) => {
      panel.classList.remove('active');
      if (index === currentStep - 1) {
        panel.classList.add('active');
      }
    });

    // Update progress tracker bubble classes
    progressSteps.forEach((step, index) => {
      const stepNum = index + 1;
      step.classList.remove('active', 'completed');
      
      if (stepNum === currentStep) {
        step.classList.add('active');
      } else if (stepNum < currentStep) {
        step.classList.add('completed');
      }
    });

    // Adjust connecting progress bar fill width
    const percentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
    progressBar.style.width = percentage + '%';
    progressBar.setAttribute('aria-valuenow', percentage);

    // Update actions buttons state
    prevBtn.disabled = currentStep === 1;

    if (currentStep === totalSteps) {
      nextBtn.querySelector('span').textContent = 'Submit Report Securely';
      // Change icon to lock shield
      nextBtn.querySelector('svg').innerHTML = '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>';
    } else {
      nextBtn.querySelector('span').textContent = 'Next';
      // Change icon back to arrow right
      nextBtn.querySelector('svg').innerHTML = '<line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline>';
    }

    // Dynamic init of canvas signature pad when entering Step 6
    if (currentStep === 6) {
      // Delay slightly to ensure layout completes and offsetWidth is accurate
      setTimeout(initCanvas, 150);
    }
  }

  nextBtn.addEventListener('click', () => {
    // Validate current panel constraints
    if (!validateCurrentStep()) return;

    if (currentStep < totalSteps) {
      currentStep++;
      updateStepUI();
      saveFormDataToLocal();
      // Scroll wizard area into view
      document.getElementById('wizard').scrollIntoView({ behavior: 'smooth' });
    } else {
      // Final Submit Execution
      executeReportSubmit();
    }
  });

  prevBtn.addEventListener('click', () => {
    if (currentStep > 1) {
      currentStep--;
      updateStepUI();
      saveFormDataToLocal();
      document.getElementById('wizard').scrollIntoView({ behavior: 'smooth' });
    }
  });

  // Add click events directly to progress steps bubbles for backward traversal
  progressSteps.forEach(stepBubble => {
    stepBubble.addEventListener('click', () => {
      const targetStep = parseInt(stepBubble.getAttribute('data-step'));
      if (targetStep < currentStep) {
        currentStep = targetStep;
        updateStepUI();
        saveFormDataToLocal();
        document.getElementById('wizard').scrollIntoView({ behavior: 'smooth' });
      } else if (targetStep > currentStep) {
        // Only allow jumping forward if current step is fully valid
        if (validateCurrentStep()) {
          // If jumping multiple steps, we must validate sequentially.
          // For UX simplicity, we validate the current step and jump only to next available.
          if (targetStep === currentStep + 1) {
            currentStep = targetStep;
            updateStepUI();
            saveFormDataToLocal();
            document.getElementById('wizard').scrollIntoView({ behavior: 'smooth' });
          } else {
            showToast("Please use the 'Next' button to navigate forward through validations.");
          }
        }
      }
    });
  });

  // Re-init signature pad on window resize to keep strokes aligned
  window.addEventListener('resize', () => {
    if (currentStep === 6) {
      initCanvas();
    }
  });

  // ==========================================
  // Report Submission Handler
  // ==========================================
  function executeReportSubmit() {
    // Show spinner/loading on button
    nextBtn.disabled = true;
    nextBtn.querySelector('span').textContent = 'Encrypting & Submitting...';
    
    // Generate Unique Case Reference Code
    const randNum = Math.floor(10000 + Math.random() * 90000);
    const caseRef = `FR-2026-${randNum}`;
    const submissionTime = new Date().toISOString();
    
    // 1. Gather all form inputs into a structured submission object
    const submission = {
      case_ref: caseRef,
      submitted_at: submissionTime,
      status: 'Pending Review',
      
      // Step 1: Personal Info
      victim_name: document.getElementById('victim-name').value,
      victim_dob: document.getElementById('victim-dob').value,
      victim_id_num: document.getElementById('victim-id-num').value,
      victim_phone: document.getElementById('victim-phone').value,
      victim_email: document.getElementById('victim-email').value,
      victim_address: document.getElementById('victim-address').value,
      victim_occupation: document.getElementById('victim-occupation').value,
      behalf_toggle: document.getElementById('behalf-toggle').checked,
      rep_relationship: document.getElementById('rep-relationship').value || '',
      rep_auth: document.getElementById('rep-auth').value || '',

      // Step 2: Incident Details
      fraud_type: document.getElementById('fraud-type').value,
      fraud_contact_method: document.getElementById('fraud-contact-method').value,
      fraud_start_date: document.getElementById('fraud-start-date').value,
      fraud_end_date: document.getElementById('fraud-end-date').value || '',
      fraud_ongoing: document.getElementById('fraud-ongoing').checked,
      fraud_narrative: document.getElementById('fraud-narrative').value,

      // Step 3: Financial Details
      loss_amount: parseFloat(document.getElementById('loss-amount').value) || 0,
      loss_currency: document.getElementById('loss-currency').value,
      victim_bank_name: document.getElementById('victim-bank-name').value,
      victim_bank_acc_name: document.getElementById('victim-bank-acc-name').value,
      victim_bank_acc_num: document.getElementById('victim-bank-acc-num').value,
      victim_bank_ref: document.getElementById('victim-bank-ref').value || '',
      
      // Step 4: Perpetrator Info
      fraudster_name: document.getElementById('fraudster-name').value,
      fraudster_company: document.getElementById('fraudster-company').value || '',
      fraudster_phone: document.getElementById('fraudster-phone').value || '',
      fraudster_email: document.getElementById('fraudster-email').value || '',
      fraudster_website: document.getElementById('fraudster-website').value || '',
      fraudster_social: document.getElementById('fraudster-social').value || '',
      fraudster_comm_platform: document.getElementById('fraudster-comm-platform').value,
      fraudster_bank: document.getElementById('fraudster-bank').value || '',
      fraudster_acc_num: document.getElementById('fraudster-acc-num').value || '',
      fraudster_swift: document.getElementById('fraudster-swift').value || '',
      fraudster_wallet: document.getElementById('fraudster-wallet').value || '',

      // Step 5: Evidence & References
      contacted_bank: form.querySelector('[name="contacted_bank"]:checked')?.value || 'no',
      bank_ref_num: document.getElementById('bank-ref-num').value || '',
      contacted_police: form.querySelector('[name="contacted_police"]:checked')?.value || 'no',
      police_ref_num: document.getElementById('police-ref-num').value || '',

      // Step 6: Consent & Biometrics
      consent_auth: document.getElementById('consent-auth').checked,
      consent_gdpr: document.getElementById('consent-gdpr').checked,
      consent_accuracy: document.getElementById('consent-accuracy').checked,
      consent_date: document.getElementById('consent-date').value,
      signature_data: signatureInput.value // Base64 Canvas data URL
    };

    // Gather Transactions Table Data
    const transactions = [];
    const rows = transactionTableBody.querySelectorAll('tr');
    rows.forEach(row => {
      const date = row.querySelector('[name="txn_date[]"]').value;
      const amount = parseFloat(row.querySelector('[name="txn_amount[]"]').value) || 0;
      const method = row.querySelector('[name="txn_method[]"]').value;
      const ref = row.querySelector('[name="txn_ref[]"]').value;
      transactions.push({ date, amount, method, ref });
    });
    submission.transactions = transactions;

    // Gather Uploaded Files Meta-data
    submission.uploaded_files = uploadedFiles;

    // 2. Save locally to LocalStorage
    try {
      const existingSubmissionsStr = localStorage.getItem('frip_submissions');
      const existingSubmissions = existingSubmissionsStr ? JSON.parse(existingSubmissionsStr) : [];
      existingSubmissions.push(submission);
      localStorage.setItem('frip_submissions', JSON.stringify(existingSubmissions));
      console.log("Saved submission locally to LocalStorage.");
    } catch (e) {
      console.error("LocalStorage save failed:", e);
    }

    // 3. Sync to Supabase (if database credentials are provided)
    const supabaseClient = window.getSupabaseClient ? window.getSupabaseClient() : null;
    let syncPromise = Promise.resolve();

    if (supabaseClient) {
      console.log("Supabase config detected, attempting cloud sync...");
      syncPromise = supabaseClient
        .from('frip_submissions')
        .insert([submission])
        .then(({ error }) => {
          if (error) {
            console.error("Supabase sync failed:", error);
            showToast("Synced locally. Cloud write failed: " + error.message);
          } else {
            console.log("Successfully synced submission to Supabase.");
          }
        })
        .catch(err => {
          console.error("Supabase sync error:", err);
          showToast("Network error: Case saved locally.");
        });
    }

    // 4. Update the UI after storage operations complete
    // Use a small delay for a professional encryption/submission loading screen
    setTimeout(() => {
      syncPromise.finally(() => {
        // Update success panels
        caseReferenceVal.textContent = caseRef;
        
        // Clear draft cache
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        
        // Hide inputs and navigation buttons
        panels.forEach(p => p.style.display = 'none');
        wizardActionsBar.style.display = 'none';
        progressSteps.forEach(s => s.classList.add('completed'));
        progressBar.style.width = '100%';
        
        // Reveal Success UI card
        successPanel.style.display = 'block';
        successPanel.scrollIntoView({ behavior: 'smooth' });
        
        // Reset variables
        currentStep = 1; 
        nextBtn.disabled = false;
        
        showToast("Case submitted successfully.");
      });
    }, 1500);
  }

  // File another report action reset
  fileAnotherReportBtn.addEventListener('click', () => {
    // Reset form contents
    form.reset();
    uploadedFiles = [];
    fileList.innerHTML = '';
    transactionTableBody.innerHTML = '';
    createTransactionRow();
    
    // Clear panels displays
    panels.forEach(p => p.style.display = '');
    wizardActionsBar.style.display = 'flex';
    successPanel.style.display = 'none';
    
    // Restore toggle accords
    toggleAccordionPanel(behalfPanel, false);
    toggleAccordionPanel(bankRefPanel, false);
    toggleAccordionPanel(policeRefPanel, false);
    
    // Set step to 1
    currentStep = 1;
    updateStepUI();
    document.getElementById('wizard').scrollIntoView({ behavior: 'smooth' });
  });

  // ==========================================
  // Download Receipt (Plaintext Summary File)
  // ==========================================
  downloadReceiptBtn.addEventListener('click', () => {
    const caseRef = caseReferenceVal.textContent;
    const name = document.getElementById('victim-name').value;
    const type = document.getElementById('fraud-type').value;
    const amount = document.getElementById('loss-amount').value;
    const currency = document.getElementById('loss-currency').value;
    
    const receiptContent = `=====================================================
FRAUD RECOVERY & INVESTIGATION PROGRAM (FRIP)
SECURE CASE SUBMISSION RECEIPT
=====================================================
Reference ID: ${caseRef}
Date Submitted: ${new Date().toLocaleString()}
Encryption Key: AES-256-GCM (Vault Tokenized)

VICITM INFORMATION:
Legal Name: ${name}
Filing Date: ${consentDateInput.value}

INCIDENT LOG SUMMARY:
Category: ${type}
Total Financial Loss: ${amount} ${currency}
Status: Under Audit (Queue Assigned)

DECLARATION & CONSENT:
Signed digitally and securely logged via biometric trace canvas.
Compliance Framework: GDPR (EU 2016/679) Cryptographic Sign.

Thank you. A specialist will call you shortly.
=====================================================`;

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `FRIP-Receipt-${caseRef}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // ==========================================
  // Initialize App state
  // ==========================================
  loadFormDataFromLocal();
  updateStepUI();

});
