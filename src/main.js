const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

// Mobile navigation
const menuToggle = $('.mobile-menu-toggle');
const mobileNav = $('#mobile-nav');
menuToggle?.addEventListener('click', () => {
  const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
  mobileNav.hidden = isOpen;
});
$$('.mobile-nav a').forEach((link) => link.addEventListener('click', () => {
  mobileNav.hidden = true;
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Open navigation');
}));

// Respect reduced-motion preferences while revealing sections.
const revealItems = $$('.reveal');
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => revealObserver.observe(item));
} else revealItems.forEach((item) => item.classList.add('is-visible'));

// Reusable toast announcement.
const toast = $('#toast');
const toastMessage = $('#toast-message');
let toastTimer;
function showToast(message) {
  toastMessage.textContent = message;
  toast.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('show'), 5200);
}
$('#toast-close')?.addEventListener('click', () => toast.classList.remove('show'));

// Sample findings contain no real scan results. This is all local demo data.
const findings = [
  { title: 'Exposed admin panel', type: 'Access control', id: 'OBS-0021', asset: 'admin.acme.example', severity: 'Critical', status: 'Open', summary: 'A management interface appears publicly reachable in the sample environment.', suggestion: 'Restrict public access' },
  { title: 'Expired TLS certificate', type: 'Certificate', id: 'OBS-0018', asset: 'api.acme.example', severity: 'High', status: 'Triaging', summary: 'The sample certificate record is past its indicated validity date.', suggestion: 'Renew and verify certificate chain' },
  { title: 'Public staging environment', type: 'Infrastructure', id: 'OBS-0016', asset: 'staging.acme.example', severity: 'High', status: 'Open', summary: 'A non-production hostname is shown as publicly reachable in this fictional inventory.', suggestion: 'Restrict public access' },
  { title: 'Missing security headers', type: 'Web configuration', id: 'OBS-0014', asset: 'www.acme.example', severity: 'Medium', status: 'Open', summary: 'The sample HTTP response is missing one or more recommended browser security headers.', suggestion: 'Review and configure response headers' },
  { title: 'Stale DNS record', type: 'DNS hygiene', id: 'OBS-0011', asset: 'legacy.acme.example', severity: 'Medium', status: 'Resolved', summary: 'A legacy DNS entry remains in the sample inventory after service retirement.', suggestion: 'Remove or document the stale record' }
];
let activeFilter = 'All';
let showFullSample = false;
let scanComplete = false;
const body = $('#findings-body');
const searchInput = $('#finding-search');
const emptyState = $('#table-empty');
const rowButtons = () => $$('.row-more', body);

function normalize(value) { return (value || '').toLocaleLowerCase().trim(); }
function renderFindings() {
  const query = normalize(searchInput.value);
  let visible = 0;
  let visibleCritical = 0;
  let visibleHigh = 0;
  let visibleMedium = 0;
  const rows = $$('tr', body);
  rows.forEach((row) => {
    const severity = row.dataset.severity || '';
    const haystack = normalize(`${row.dataset.search} ${row.textContent}`);
    const matchesSeverity = activeFilter === 'All' || severity === activeFilter;
    const matchesSearch = !query || haystack.includes(query);
    const matchesDemoCount = showFullSample || visible < 5;
    const shouldShow = matchesSeverity && matchesSearch && (matchesDemoCount || query.length > 0 || activeFilter !== 'All');
    row.hidden = !shouldShow;
    if (shouldShow) {
      visible += 1;
      if (severity === 'Critical') visibleCritical += 1;
      if (severity === 'High') visibleHigh += 1;
      if (severity === 'Medium') visibleMedium += 1;
    }
  });
  emptyState.hidden = visible > 0;
  $('#finding-count').textContent = activeFilter === 'All' && !query ? (scanComplete ? '26' : '23') : String(visible);
  $('#side-count').textContent = activeFilter === 'All' && !query ? (scanComplete ? '26' : '23') : String(visible);
  $('#table-footer-text').textContent = query || activeFilter !== 'All'
    ? `Showing ${visible} matching sample finding${visible === 1 ? '' : 's'}`
    : `Showing ${visible} sample findings of ${scanComplete ? '26' : '23'} open exposures`;
  $$('.filter-chip').forEach((button) => {
    const selected = button.dataset.filter === activeFilter;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
}
$$('.filter-chip').forEach((button) => button.addEventListener('click', () => {
  activeFilter = button.dataset.filter;
  showFullSample = activeFilter !== 'All';
  renderFindings();
}));
searchInput.addEventListener('input', () => { showFullSample = true; renderFindings(); });
$('#reset-filters').addEventListener('click', () => {
  searchInput.value = '';
  activeFilter = 'All';
  showFullSample = false;
  renderFindings();
});
$('#show-all-findings').addEventListener('click', () => {
  showFullSample = true;
  activeFilter = 'All';
  searchInput.value = '';
  renderFindings();
  showToast('Displaying all available sample findings.');
});
$('#filter-menu-button').addEventListener('click', (event) => {
  const button = event.currentTarget;
  const currentlyExpanded = button.getAttribute('aria-expanded') === 'true';
  button.setAttribute('aria-expanded', String(!currentlyExpanded));
  const filters = $('#severity-filters');
  if (window.matchMedia('(max-width: 600px)').matches) {
    filters.classList.toggle('filters-emphasized', !currentlyExpanded);
    if (!currentlyExpanded) filters.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
});

// All sample table detail buttons open a useful local detail view.
const findingDialog = $('#finding-dialog');
function openFinding(finding) {
  if (!finding) return;
  $('#finding-dialog-title').textContent = finding.title;
  $('#detail-asset').textContent = finding.asset;
  $('#detail-id').textContent = finding.id;
  $('#detail-severity').textContent = finding.severity;
  $('#detail-severity').className = `detail-severity severity-pill ${finding.severity.toLowerCase()}-pill`;
  const detailRows = $$('.detail-row', findingDialog);
  if (detailRows[2]) detailRows[2].lastElementChild.textContent = finding.suggestion;
  const recordSummary = $('.detail-record-summary', findingDialog);
  if (recordSummary) recordSummary.textContent = finding.summary;
  if (typeof findingDialog.showModal === 'function') findingDialog.showModal();
  else showToast(`${finding.title}: ${finding.summary}`);
  document.body.classList.add('dialog-open');
}
function addFindingDetailButtons() {
  rowButtons().forEach((button) => button.addEventListener('click', () => {
    const found = findings.find((item) => item.title === button.dataset.finding);
    openFinding(found);
  }));
}
addFindingDetailButtons();
$('#finding-close').addEventListener('click', () => findingDialog.close());
findingDialog.addEventListener('click', (event) => { if (event.target === findingDialog) findingDialog.close(); });
findingDialog.addEventListener('close', () => document.body.classList.remove('dialog-open'));

// Simulated scan. It never sends network requests or touches real hosts.
const scanButton = $('#run-scan');
scanButton.addEventListener('click', () => {
  if (scanButton.disabled) return;
  scanButton.disabled = true;
  scanButton.classList.add('is-scanning');
  scanButton.innerHTML = '<span class="scan-button-icon">↻</span> Scanning sample…';
  $('#demo-status').hidden = false;
  $('#demo-status').innerHTML = '<span class="status-check">↻</span><span>Simulating discovery against the fictional sample inventory…</span><button aria-label="Dismiss message" id="dismiss-status">×</button>';
  $('#dismiss-status').addEventListener('click', () => { $('#demo-status').hidden = true; });
  window.setTimeout(() => {
    if (scanComplete) {
      scanButton.disabled = false;
      scanButton.classList.remove('is-scanning');
      scanButton.innerHTML = '<span class="scan-button-icon">↻</span> Run sample scan';
      $('#demo-status').hidden = false;
      $('#demo-status').innerHTML = '<span class="status-check">✓</span><span>Sample environment is already up to date. No duplicate findings added.</span><button aria-label="Dismiss message" id="dismiss-status">×</button>';
      $('#dismiss-status').addEventListener('click', () => { $('#demo-status').hidden = true; });
      showToast('The sample environment is already up to date.');
      return;
    }
    scanComplete = true;
    $('#metric-assets').textContent = '131';
    $('#metric-open').textContent = '26';
    $('#metric-score').textContent = '35';
    $('#side-count').textContent = '26';
    $('#chip-all-count').textContent = '26';
    $('#chip-critical-count').textContent = '03';
    $('#chip-high-count').textContent = '08';
    $('#chip-medium-count').textContent = '15';
    const tr1 = document.createElement('tr');
    tr1.dataset.severity = 'High';
    tr1.dataset.search = 'development port exposed dev-tools.acme.example services';
    tr1.innerHTML = '<td><span class="finding-symbol high-symbol">↗</span><span class="finding-name">Development port exposed<small>Service exposure · OBS-0027</small></span></td><td><code>dev-tools.acme.example</code></td><td><span class="severity-pill high-pill">High</span></td><td><span class="status-tag status-open"><i></i> Open</span></td><td><button class="row-more" aria-label="View development port exposed details" data-finding="Development port exposed">↗</button></td>';
    tr1.querySelector('.row-more').addEventListener('click', () => openFinding({ title: 'Development port exposed', type: 'Service exposure', id: 'OBS-0027', asset: 'dev-tools.acme.example', severity: 'High', status: 'Open', summary: 'An exposed development service is included in this simulated scan.', suggestion: 'Restrict service access' }));
    const tr2 = document.createElement('tr');
    tr2.dataset.severity = 'Medium';
    tr2.dataset.search = 'certificate transparency subdomain reports.acme.example discovery';
    tr2.innerHTML = '<td><span class="finding-symbol medium-symbol">·</span><span class="finding-name">Unexpected subdomain discovered<small>Asset discovery · OBS-0028</small></span></td><td><code>reports.acme.example</code></td><td><span class="severity-pill medium-pill">Medium</span></td><td><span class="status-tag status-triage"><i></i> Triaging</span></td><td><button class="row-more" aria-label="View unexpected subdomain details" data-finding="Unexpected subdomain discovered">↗</button></td>';
    tr2.querySelector('.row-more').addEventListener('click', () => openFinding({ title: 'Unexpected subdomain discovered', type: 'Asset discovery', id: 'OBS-0028', asset: 'reports.acme.example', severity: 'Medium', status: 'Triaging', summary: 'The discovery simulation found another hostname in the fictional inventory.', suggestion: 'Confirm ownership and business purpose' }));
    const tr3 = document.createElement('tr');
    tr3.dataset.severity = 'Critical';
    tr3.dataset.search = 'debug endpoint publicly exposed debug.acme.example application security';
    tr3.innerHTML = '<td><span class="finding-symbol critical-symbol">!</span><span class="finding-name">Debug endpoint publicly exposed<small>Application security · OBS-0029</small></span></td><td><code>debug.acme.example</code></td><td><span class="severity-pill critical-pill">Critical</span></td><td><span class="status-tag status-open"><i></i> Open</span></td><td><button class="row-more" aria-label="View debug endpoint details" data-finding="Debug endpoint publicly exposed">↗</button></td>';
    tr3.querySelector('.row-more').addEventListener('click', () => openFinding({ title: 'Debug endpoint publicly exposed', type: 'Application security', id: 'OBS-0029', asset: 'debug.acme.example', severity: 'Critical', status: 'Open', summary: 'A fictional debug endpoint was added to the sample findings by the simulated scan.', suggestion: 'Disable or restrict the debug endpoint' }));
    body.prepend(tr3);
    body.prepend(tr2);
    body.prepend(tr1);
    showFullSample = true;
    activeFilter = 'All';
    searchInput.value = '';
    renderFindings();
    scanButton.disabled = false;
    scanButton.classList.remove('is-scanning');
    scanButton.innerHTML = '<span class="scan-button-icon">↻</span> Run sample scan';
    $('#demo-status').hidden = false;
    $('#demo-status').innerHTML = '<span class="status-check">✓</span><span>Demo scan complete. 3 fictional exposures added; no external systems contacted.</span><button aria-label="Dismiss message" id="dismiss-status">×</button>';
    $('#dismiss-status').addEventListener('click', () => { $('#demo-status').hidden = true; });
    showToast('Sample scan complete — demo data only.');
  }, 1600);
});
$('#dismiss-status').addEventListener('click', () => { $('#demo-status').hidden = true; });

// Walkthrough dialog uses front-end-only validation and confirmation.
const contactDialog = $('#contact-dialog');
function openContactDialog() {
  if (typeof contactDialog.showModal === 'function') contactDialog.showModal();
  else showToast('This browser does not support the demo dialog.');
  document.body.classList.add('dialog-open');
}
$$('[data-open-dialog]').forEach((button) => button.addEventListener('click', openContactDialog));
$('#dialog-close').addEventListener('click', () => contactDialog.close());
$('#success-close').addEventListener('click', () => contactDialog.close());
contactDialog.addEventListener('click', (event) => { if (event.target === contactDialog) contactDialog.close(); });
contactDialog.addEventListener('close', () => document.body.classList.remove('dialog-open'));
$('#walkthrough-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  $('#form-success').hidden = false;
  form.querySelectorAll('.form-label, input, select, .dialog-submit, .form-privacy, .dialog-intro').forEach((element) => { element.hidden = true; });
  $('#dialog-title').hidden = true;
  $('#form-success').scrollIntoView({ block: 'nearest' });
});

// Escape the custom scroll lock for browsers without native dialog close handling.
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') document.body.classList.remove('dialog-open');
});
