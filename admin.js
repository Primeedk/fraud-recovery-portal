document.addEventListener('DOMContentLoaded', () => {

  // Global Submissions Data State
  let submissions = [];
  let activeCaseRef = null;
  const LOCAL_SUBMISSIONS_KEY = 'frip_submissions';

  // DOM Elements
  const dbStatusPill = document.getElementById('db-status-pill');
  const dbStatusText = document.getElementById('db-status-text');
  
  // Analytics
  const countTotal = document.getElementById('count-total');
  const countPending = document.getElementById('count-pending');
  const countInvestigating = document.getElementById('count-investigating');
  const countLoss = document.getElementById('count-loss');

  // Controls
  const searchInput = document.getElementById('search-input');
  const filterStatus = document.getElementById('filter-status');
  const filterType = document.getElementById('filter-type');
  const sortDate = document.getElementById('sort-date');
  const refreshDataBtn = document.getElementById('refresh-data-btn');

  // Table & Empty State
  const tableBody = document.getElementById('submissions-table-body');
  const emptyState = document.getElementById('table-empty-state');
  const submissionsTable = document.getElementById('submissions-data-table');

  // Case Detail Modal
  const caseDetailModal = document.getElementById('case-detail-modal');
  const closeDetailModalBtn = document.getElementById('close-detail-modal-btn');
  const closeModalFooterBtn = document.getElementById('close-modal-footer-btn');
  const saveStatusBtn = document.getElementById('save-status-btn');
  const modalUpdateStatus = document.getElementById('modal-update-status');

  // Case Modal Dynamic Value Targets
  const modalCaseTitle = document.getElementById('modal-case-title');
  const modalSubmitDate = document.getElementById('modal-submit-date');
  const valVictimName = document.getElementById('val-victim-name');
  const valVictimDob = document.getElementById('val-victim-dob');
  const valVictimId = document.getElementById('val-victim-id');
  const valVictimOccupation = document.getElementById('val-victim-occupation');
  const valVictimPhone = document.getElementById('val-victim-phone');
  const valVictimEmail = document.getElementById('val-victim-email');
  const valVictimAddress = document.getElementById('val-victim-address');
  
  const repDisplayBox = document.getElementById('rep-display-box');
  const valRepRelation = document.getElementById('val-rep-relation');
  const valRepAuth = document.getElementById('val-rep-auth');

  const valFraudType = document.getElementById('val-fraud-type');
  const valContactMethod = document.getElementById('val-contact-method');
  const valDateStart = document.getElementById('val-date-start');
  const valDateEnd = document.getElementById('val-date-end');
  const valOngoingStatus = document.getElementById('val-ongoing-status');
  const valLossAmount = document.getElementById('val-loss-amount');
  const valNarrative = document.getElementById('val-narrative');
  const valTransactionsBody = document.getElementById('val-transactions-body');
  
  const valVictimBank = document.getElementById('val-victim-bank');
  const valVictimBankAcc = document.getElementById('val-victim-bank-acc');
  const valVictimBankNum = document.getElementById('val-victim-bank-num');
  const valVictimBankRef = document.getElementById('val-victim-bank-ref');

  const valFraudsterName = document.getElementById('val-fraudster-name');
  const valFraudsterCompany = document.getElementById('val-fraudster-company');
  const valFraudsterPlatform = document.getElementById('val-fraudster-platform');
  const valFraudsterPhone = document.getElementById('val-fraudster-phone');
  const valFraudsterEmail = document.getElementById('val-fraudster-email');
  const valFraudsterWebsite = document.getElementById('val-fraudster-website');
  const valFraudsterSocial = document.getElementById('val-fraudster-social');
  const valFraudsterBankName = document.getElementById('val-fraudster-bank-name');
  const valFraudsterBankNum = document.getElementById('val-fraudster-bank-num');
  const valFraudsterSwift = document.getElementById('val-fraudster-swift');
  const valFraudsterWallet = document.getElementById('val-fraudster-wallet');

  const valContactedBank = document.getElementById('val-contacted-bank');
  const valBankRefCode = document.getElementById('val-bank-ref-code');
  const valContactedPolice = document.getElementById('val-contacted-police');
  const valPoliceRefCode = document.getElementById('val-police-ref-code');
  const valFilesList = document.getElementById('val-files-list');
  const valSignatureImg = document.getElementById('val-signature-img');
  const valSignatureDate = document.getElementById('val-signature-date');

  // Setup DB Modal
  const setupDbModal = document.getElementById('setup-db-modal');
  const setupDbBtn = document.getElementById('setup-db-btn');
  const closeSetupModalBtn = document.getElementById('close-setup-modal-btn');
  const closeSetupBtn = document.getElementById('close-setup-btn');
  const btnCopySql = document.getElementById('btn-copy-sql');
  const sqlSetupCode = document.getElementById('sql-setup-code');

  // Toast
  const toast = document.getElementById('toast-message-box');
  const toastText = document.getElementById('toast-text');

  // ==========================================
  // Supabase Initialization & Detection
  // ==========================================
  let supabaseClient = window.getSupabaseClient ? window.getSupabaseClient() : null;

  function updateDBConnectionStatus() {
    if (supabaseClient) {
      dbStatusPill.className = 'db-status-pill connected';
      dbStatusText.textContent = 'Supabase Cloud Connected';
    } else {
      dbStatusPill.className = 'db-status-pill local';
      dbStatusText.textContent = 'LocalStorage Mode';
    }
  }

  // Reload data dynamically when local .env file loads successfully
  window.addEventListener('supabase-ready', () => {
    supabaseClient = window.getSupabaseClient ? window.getSupabaseClient() : null;
    updateDBConnectionStatus();
    fetchSubmissions();
  });

  // ==========================================
  // Fetch Data Pipeline
  // ==========================================
  async function fetchSubmissions() {
    refreshDataBtn.disabled = true;
    refreshDataBtn.querySelector('span').textContent = 'Loading...';

    try {
      if (supabaseClient) {
        // Fetch from Supabase Table
        console.log("Fetching submissions from Supabase Cloud...");
        const { data, error } = await supabaseClient
          .from('frip_submissions')
          .select('*')
          .order('submitted_at', { ascending: false });

        if (error) {
          throw error;
        }
        submissions = data || [];
        console.log("Successfully loaded from Supabase:", submissions);
      } else {
        // Fallback to LocalStorage
        loadFromLocalStorage();
      }
    } catch (err) {
      console.error("Supabase load failed. Falling back to LocalStorage:", err);
      showToast("Cloud sync failed. Loading local data.");
      loadFromLocalStorage();
    } finally {
      refreshDataBtn.disabled = false;
      refreshDataBtn.querySelector('span').textContent = 'Refresh';
      
      calculateAnalytics();
      filterAndRenderTable();
    }
  }

  function loadFromLocalStorage() {
    console.log("Loading submissions from LocalStorage...");
    const localData = localStorage.getItem(LOCAL_SUBMISSIONS_KEY);
    try {
      submissions = localData ? JSON.parse(localData) : [];
      // Sort newest first by default
      submissions.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));
    } catch (e) {
      console.error("Failed to parse local submissions:", e);
      submissions = [];
    }
  }

  // ==========================================
  // Analytics Calculations
  // ==========================================
  function calculateAnalytics() {
    const total = submissions.length;
    let pending = 0;
    let investigating = 0;
    let totalLossUSD = 0;

    submissions.forEach(sub => {
      if (sub.status === 'Pending Review') pending++;
      if (sub.status === 'Under Investigation') investigating++;
      
      // Calculate loss (normalize currencies approximately for stats card)
      let amount = parseFloat(sub.loss_amount) || 0;
      const currency = sub.loss_currency || 'USD';
      if (currency === 'BTC') amount *= 65000; // Simulated constant rate
      else if (currency === 'ETH') amount *= 3500;
      else if (currency === 'EUR') amount *= 1.08;
      else if (currency === 'GBP') amount *= 1.28;
      
      totalLossUSD += amount;
    });

    countTotal.textContent = total;
    countPending.textContent = pending;
    countInvestigating.textContent = investigating;
    
    // Format USD total loss
    countLoss.textContent = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(totalLossUSD);
  }

  // ==========================================
  // Table Filtering & Rendering
  // ==========================================
  function filterAndRenderTable() {
    const query = searchInput.value.toLowerCase().trim();
    const statusVal = filterStatus.value;
    const typeVal = filterType.value;
    const sortVal = sortDate.value;

    // Filter
    let filtered = submissions.filter(sub => {
      // Search keywords match Case ID, Victim Name, or Email
      const matchQuery = !query || 
        sub.case_ref.toLowerCase().includes(query) ||
        sub.victim_name.toLowerCase().includes(query) ||
        sub.victim_email.toLowerCase().includes(query);

      // Status match
      const matchStatus = statusVal === 'all' || sub.status === statusVal;

      // Type match
      const matchType = typeVal === 'all' || sub.fraud_type === typeVal;

      return matchQuery && matchStatus && matchType;
    });

    // Sort
    filtered.sort((a, b) => {
      const dateA = new Date(a.submitted_at);
      const dateB = new Date(b.submitted_at);
      return sortVal === 'newest' ? dateB - dateA : dateA - dateB;
    });

    // Render Table Rows
    tableBody.innerHTML = '';

    if (filtered.length === 0) {
      submissionsTable.style.display = 'none';
      emptyState.style.display = 'flex';
      return;
    }

    submissionsTable.style.display = '';
    emptyState.style.display = 'none';

    filtered.forEach(sub => {
      const row = document.createElement('tr');
      
      // Status pill class mapping
      let statusClass = 'pending';
      if (sub.status === 'Under Investigation') statusClass = 'investigating';
      else if (sub.status === 'Recovering Funds') statusClass = 'recovering';
      else if (sub.status === 'Resolved') statusClass = 'resolved';
      else if (sub.status === 'Closed') statusClass = 'closed';

      // Date parsing
      const formattedDate = new Date(sub.submitted_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      // Loss formatting
      const formattedLoss = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: sub.loss_currency || 'USD',
        maximumFractionDigits: 2
      }).format(sub.loss_amount || 0);

      row.innerHTML = `
        <td><strong>${escapeHTML(sub.case_ref)}</strong></td>
        <td>${formattedDate}</td>
        <td>
          <div style="font-weight: 600;">${escapeHTML(sub.victim_name)}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHTML(sub.victim_occupation)}</div>
        </td>
        <td>
          <div style="font-size: 0.9rem; font-weight: 500;">${escapeHTML(sub.victim_email)}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHTML(sub.victim_phone)}</div>
        </td>
        <td>
          <div style="font-weight: 600;">${escapeHTML(sub.fraud_type)}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">Platform: ${escapeHTML(sub.fraudster_comm_platform)}</div>
        </td>
        <td>
          <div style="font-weight: 700; color: var(--primary);">${formattedLoss}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHTML(sub.loss_currency)}</div>
        </td>
        <td>
          <div style="font-weight: 500;">${escapeHTML(sub.victim_bank_name)}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">Acc: ${escapeHTML(sub.victim_bank_acc_num)}</div>
        </td>
        <td>
          <div style="font-weight: 500;">${escapeHTML(sub.fraudster_name)}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHTML(sub.fraudster_company || 'Independent')}</div>
        </td>
        <td>
          <span class="status-badge ${statusClass}">${escapeHTML(sub.status)}</span>
        </td>
        <td style="text-align: center;">
          <button type="button" class="btn-view-details" data-ref="${sub.case_ref}">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
            <span>View Folder</span>
          </button>
        </td>
      `;

      tableBody.appendChild(row);
    });

    // Attach View Detail listeners
    tableBody.querySelectorAll('.btn-view-details').forEach(btn => {
      btn.addEventListener('click', () => {
        const caseRef = btn.getAttribute('data-ref');
        openCaseDetail(caseRef);
      });
    });
  }

  // Helper to prevent XSS
  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }

  // ==========================================
  // Case Detail Modal Interactions
  // ==========================================
  function openCaseDetail(caseRef) {
    const caseData = submissions.find(s => s.case_ref === caseRef);
    if (!caseData) return;

    activeCaseRef = caseRef;
    
    // Set headers
    modalCaseTitle.textContent = `Case ${caseData.case_ref}`;
    modalSubmitDate.textContent = `Date Submitted: ${new Date(caseData.submitted_at).toLocaleString()}`;

    // Populating Tab 1 (Victim details)
    valVictimName.textContent = caseData.victim_name;
    valVictimDob.textContent = caseData.victim_dob;
    valVictimId.textContent = caseData.victim_id_num;
    valVictimOccupation.textContent = caseData.victim_occupation;
    valVictimPhone.textContent = caseData.victim_phone;
    valVictimEmail.textContent = caseData.victim_email;
    valVictimAddress.textContent = caseData.victim_address;

    if (caseData.behalf_toggle) {
      repDisplayBox.style.display = 'block';
      valRepRelation.textContent = caseData.rep_relationship || 'Not specified';
      valRepAuth.textContent = caseData.rep_auth || 'Not specified';
    } else {
      repDisplayBox.style.display = 'none';
    }

    // Populating Tab 2 (Incident & loss)
    valFraudType.textContent = caseData.fraud_type;
    valContactMethod.textContent = caseData.fraud_contact_method;
    valDateStart.textContent = caseData.fraud_start_date;
    valDateEnd.textContent = caseData.fraud_end_date || 'Ongoing';
    valOngoingStatus.textContent = caseData.fraud_ongoing ? 'Yes, still active' : 'No, active contact terminated';
    valNarrative.textContent = caseData.fraud_narrative;

    valLossAmount.textContent = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: caseData.loss_currency || 'USD'
    }).format(caseData.loss_amount || 0);

    // Populate transaction logs
    valTransactionsBody.innerHTML = '';
    if (caseData.transactions && caseData.transactions.length > 0) {
      caseData.transactions.forEach(txn => {
        const row = document.createElement('tr');
        const formattedAmount = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: caseData.loss_currency || 'USD'
        }).format(txn.amount || 0);
        
        row.innerHTML = `
          <td>${txn.date}</td>
          <td><strong>${formattedAmount}</strong></td>
          <td>${escapeHTML(txn.method)}</td>
          <td><span style="font-family:monospace; font-size:0.85rem;">${escapeHTML(txn.ref)}</span></td>
        `;
        valTransactionsBody.appendChild(row);
      });
    } else {
      valTransactionsBody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);">No transactions recorded.</td></tr>';
    }

    valVictimBank.textContent = caseData.victim_bank_name;
    valVictimBankAcc.textContent = caseData.victim_bank_acc_name;
    valVictimBankNum.textContent = caseData.victim_bank_acc_num;
    valVictimBankRef.textContent = caseData.victim_bank_ref || 'None';

    // Populating Tab 3 (Fraudster profile)
    valFraudsterName.textContent = caseData.fraudster_name;
    valFraudsterCompany.textContent = caseData.fraudster_company || 'None / Not declared';
    valFraudsterPlatform.textContent = caseData.fraudster_comm_platform;
    valFraudsterPhone.textContent = caseData.fraudster_phone || 'None';
    valFraudsterEmail.textContent = caseData.fraudster_email || 'None';
    valFraudsterWebsite.textContent = caseData.fraudster_website || 'None';
    valFraudsterSocial.textContent = caseData.fraudster_social || 'None';
    valFraudsterBankName.textContent = caseData.fraudster_bank || 'Not disclosed';
    valFraudsterBankNum.textContent = caseData.fraudster_acc_num || 'Not disclosed';
    valFraudsterSwift.textContent = caseData.fraudster_swift || 'Not disclosed';
    valFraudsterWallet.textContent = caseData.fraudster_wallet || 'None provided';

    // Populating Tab 4 (Evidence & signature)
    valContactedBank.textContent = caseData.contacted_bank === 'yes' ? 'Yes' : 'No';
    valBankRefCode.textContent = caseData.bank_ref_num || 'N/A';
    valContactedPolice.textContent = caseData.contacted_police === 'yes' ? 'Yes' : 'No';
    valPoliceRefCode.textContent = caseData.police_ref_num || 'N/A';

    // Uploaded files list render
    valFilesList.innerHTML = '';
    if (caseData.uploaded_files && caseData.uploaded_files.length > 0) {
      caseData.uploaded_files.forEach(file => {
        const item = document.createElement('div');
        item.className = 'file-item';
        item.innerHTML = `
          <div class="file-info" style="border:none; padding:0; background:none;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--primary);"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
            <span class="file-name">${escapeHTML(file.name)}</span>
            <span class="file-size">(${escapeHTML(file.size)})</span>
          </div>
        `;
        valFilesList.appendChild(item);
      });
    } else {
      valFilesList.innerHTML = '<p class="input-hint">No evidence documents uploaded.</p>';
    }

    // Render Canvas image URL
    if (caseData.signature_data) {
      valSignatureImg.src = caseData.signature_data;
      valSignatureImg.style.display = 'block';
    } else {
      valSignatureImg.style.display = 'none';
    }
    valSignatureDate.textContent = caseData.consent_date;

    // Load status select input
    modalUpdateStatus.value = caseData.status;

    // Switch to first tab in detail modal
    switchTab('tab-victim');

    // Open Modal overlay
    caseDetailModal.classList.add('open');
    document.body.style.overflow = 'hidden'; // Lock background scroll
  }

  function closeCaseDetail() {
    caseDetailModal.classList.remove('open');
    document.body.style.overflow = ''; // Restore background scroll
    activeCaseRef = null;
  }

  // Modal Tab Switching Manager
  const tabButtons = caseDetailModal.querySelectorAll('.modal-tab');
  const tabPanels = caseDetailModal.querySelectorAll('.modal-tab-panel');

  function switchTab(tabId) {
    tabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    tabPanels.forEach(panel => {
      panel.classList.toggle('active', panel.id === tabId);
    });
  }

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // ==========================================
  // Update Case Pipeline State (Status)
  // ==========================================
  async function updateCaseStatus() {
    if (!activeCaseRef) return;
    const newStatus = modalUpdateStatus.value;
    
    saveStatusBtn.disabled = true;
    saveStatusBtn.textContent = 'Updating...';

    try {
      if (supabaseClient) {
        // Update in Supabase
        console.log(`Syncing status update to Supabase for ${activeCaseRef}...`);
        const { error } = await supabaseClient
          .from('frip_submissions')
          .update({ status: newStatus })
          .eq('case_ref', activeCaseRef);

        if (error) throw error;
        
        // Update local object array state
        const subIndex = submissions.findIndex(s => s.case_ref === activeCaseRef);
        if (subIndex !== -1) {
          submissions[subIndex].status = newStatus;
        }
        showToast("Pipeline state successfully synced to Cloud.");
      } else {
        // Update in LocalStorage
        const localDataStr = localStorage.getItem(LOCAL_SUBMISSIONS_KEY);
        if (localDataStr) {
          const localSubmissions = JSON.parse(localDataStr);
          const subIndex = localSubmissions.findIndex(s => s.case_ref === activeCaseRef);
          if (subIndex !== -1) {
            localSubmissions[subIndex].status = newStatus;
            localStorage.setItem(LOCAL_SUBMISSIONS_KEY, JSON.stringify(localSubmissions));
            
            // Sync current active array
            const activeIndex = submissions.findIndex(s => s.case_ref === activeCaseRef);
            if (activeIndex !== -1) {
              submissions[activeIndex].status = newStatus;
            }
            showToast("Pipeline status updated locally.");
          }
        }
      }
      
      calculateAnalytics();
      filterAndRenderTable();
      closeCaseDetail();
    } catch (err) {
      console.error("Status update failure:", err);
      showToast("Error updating status: " + err.message);
    } finally {
      saveStatusBtn.disabled = false;
      saveStatusBtn.textContent = 'Save Pipeline State';
    }
  }

  // ==========================================
  // Supabase Setup Panel Modal Actions
  // ==========================================
  setupDbBtn.addEventListener('click', () => {
    setupDbModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  });

  function closeSetupModal() {
    setupDbModal.classList.remove('open');
    document.body.style.overflow = '';
  }

  closeSetupModalBtn.addEventListener('click', closeSetupModal);
  closeSetupBtn.addEventListener('click', closeSetupModal);

  // SQL Copy trigger
  btnCopySql.addEventListener('click', () => {
    const codeText = sqlSetupCode.textContent;
    navigator.clipboard.writeText(codeText).then(() => {
      btnCopySql.textContent = 'Copied!';
      showToast("SQL script copied to clipboard.");
      setTimeout(() => {
        btnCopySql.textContent = 'Copy SQL';
      }, 2000);
    }).catch(err => {
      console.error("Failed to copy text:", err);
    });
  });

  // ==========================================
  // Event Attachments
  // ==========================================
  closeDetailModalBtn.addEventListener('click', closeCaseDetail);
  closeModalFooterBtn.addEventListener('click', closeCaseDetail);
  saveStatusBtn.addEventListener('click', updateCaseStatus);
  
  // Close modals when clicking backdrop
  window.addEventListener('click', (e) => {
    if (e.target === caseDetailModal) closeCaseDetail();
    if (e.target === setupDbModal) closeSetupModal();
  });

  // Controls Event Triggers
  searchInput.addEventListener('input', filterAndRenderTable);
  filterStatus.addEventListener('change', filterAndRenderTable);
  filterType.addEventListener('change', filterAndRenderTable);
  sortDate.addEventListener('change', filterAndRenderTable);
  refreshDataBtn.addEventListener('click', fetchSubmissions);

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
  // App Initializer
  // ==========================================
  updateDBConnectionStatus();
  fetchSubmissions();

});
