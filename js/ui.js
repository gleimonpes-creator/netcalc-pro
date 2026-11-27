'use strict';

/* -------------------------------------------------------------------
 * 5. INTERFACE DO USUÁRIO & RENDERIZAÇÃO
 * ------------------------------------------------------------------- */
function populateCidrSelect() {
  const select = document.getElementById('select-cidr');
  const vlsmSelect = document.getElementById('vlsm-base-cidr');
  select.innerHTML = '';
  vlsmSelect.innerHTML = '';
  for (let c = 0; c <= 32; c++) {
    const mask = intToIp(cidrToMaskInt(c));
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = `/${c} (${mask})`;
    if (c === state.cidr) opt.selected = true;
    select.appendChild(opt);

    const optVlsm = document.createElement('option');
    optVlsm.value = c;
    optVlsm.textContent = `/${c}`;
    if (c === state.vlsm.baseCidr) optVlsm.selected = true;
    vlsmSelect.appendChild(optVlsm);
  }
}

function populateSubnetsOptions() {
  const select = document.getElementById('select-target-subnets');
  const currentVal = Number(state.targetSubnets) || 4;
  select.innerHTML = '';
  const maxBits = Math.min(16, 32 - state.cidr);
  if (maxBits <= 0) {
    const opt = document.createElement('option');
    opt.value = 1;
    opt.textContent = '1 sub-rede (Limite /32 atingido)';
    select.appendChild(opt);
    return;
  }
  for (let b = 1; b <= maxBits; b++) {
    const count = Math.pow(2, b);
    const resultingCidr = state.cidr + b;
    const opt = document.createElement('option');
    opt.value = count;
    opt.textContent = `${count.toLocaleString('pt-BR')} sub-redes (/${resultingCidr})`;
    if (count === currentVal) opt.selected = true;
    select.appendChild(opt);
  }
}

function syncActiveNetworkIndicators(net) {
  const label = `${net.networkStr}/${net.cidr}`;
  const topEl = document.getElementById('header-active-network-text');
  const mobEl = document.getElementById('mobile-active-network-text');
  const sideCidrEl = document.getElementById('sidebar-focus-cidr');
  const sideMaskEl = document.getElementById('sidebar-focus-mask');
  const sideHostsEl = document.getElementById('sidebar-focus-hosts');

  if (topEl) topEl.textContent = label;
  if (mobEl) mobEl.textContent = label;
  if (sideCidrEl) sideCidrEl.textContent = label;
  if (sideMaskEl) sideMaskEl.textContent = `Máscara: ${net.maskStr}`;
  if (sideHostsEl) sideHostsEl.textContent = `${net.usableHosts.toLocaleString('pt-BR')} hosts`;
}

function updateUI() {
  const ipInput = document.getElementById('input-ip');
  const validBadge = document.getElementById('ip-valid-badge');
  const errorMsg = document.getElementById('ip-error-msg');

  const validation = validateIPv4Input(state.ip, state.cidr);
  if (!validation.valid) {
    ipInput.classList.add('border-rose-500', 'dark:border-rose-500');
    ipInput.classList.remove('border-slate-200', 'dark:border-slate-700');
    validBadge.textContent = 'Inválido';
    validBadge.className = 'absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400';
    errorMsg.textContent = validation.message;
    errorMsg.classList.remove('hidden');
    return;
  }

  if (validation.hasInlineCidr) {
    state.ip = validation.ip;
    state.cidr = validation.cidr;
    ipInput.value = validation.ip;
    populateSubnetsOptions();
  }

  ipInput.classList.remove('border-rose-500', 'dark:border-rose-500');
  ipInput.classList.add('border-slate-200', 'dark:border-slate-700');
  validBadge.textContent = 'Válido';
  validBadge.className = 'absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400';
  errorMsg.classList.add('hidden');

  // Sincroniza controles
  document.getElementById('select-cidr').value = state.cidr;
  document.getElementById('slider-cidr').value = state.cidr;

  const calc = performFullCalculation();
  if (!calc) return;

  const net = calc.baseNet;
  syncActiveNetworkIndicators(net);

  // Cabeçalho de Resultado Principal
  document.getElementById('res-cidr-notation').textContent = `${net.networkStr}/${net.cidr}`;
  document.getElementById('res-ip-class').textContent = net.ipClass;
  document.getElementById('res-ip-scope').textContent = net.scope;

  // Cards de Resultados
  const cardsData = [
    { label: 'Endereço de Rede', value: net.networkStr, highlight: 'text-blue-600 dark:text-blue-400' },
    { label: 'Endereço de Broadcast', value: net.broadcastStr, highlight: 'text-amber-600 dark:text-amber-400' },
    { label: 'Primeiro Host Válido', value: net.firstHostStr, highlight: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Último Host Válido', value: net.lastHostStr, highlight: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Máscara de Sub-rede', value: net.maskStr, highlight: '' },
    { label: 'Máscara Coringa (Wildcard)', value: net.wildcardStr, highlight: '' },
    { label: 'Hosts Utilizáveis', value: net.usableHosts.toLocaleString('pt-BR'), highlight: 'text-indigo-600 dark:text-indigo-400' },
    { label: 'Total de Endereços IP', value: net.totalIps.toLocaleString('pt-BR'), highlight: '' },
    { label: 'Rede / Máscara (Hex)', value: `${net.networkHex} / ${net.maskHex}`, highlight: 'text-slate-600 dark:text-slate-300 text-xs sm:text-sm' },
    { label: 'Broadcast / Wildcard (Hex)', value: `${net.broadcastHex} / ${net.wildcardHex}`, highlight: 'text-slate-600 dark:text-slate-300 text-xs sm:text-sm' }
  ];

  const grid = document.getElementById('results-cards-grid');
  grid.innerHTML = cardsData.map(item => `
    <div class="group flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition">
      <div class="min-w-0">
        <span class="block text-[11px] font-medium text-slate-500 dark:text-slate-400">${item.label}</span>
        <span class="font-mono text-sm sm:text-base font-bold ${item.highlight} truncate block mt-0.5">${item.value}</span>
      </div>
      <button type="button" data-copy="${item.value}" title="Copiar ${item.label}" class="btn-copy-val p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-800 active:scale-90 transition shrink-0">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
        </svg>
      </button>
    </div>
  `).join('');

  // Binário
  document.getElementById('bin-ip').innerHTML = intToBinaryOctets(net.ipInt, net.cidr);
  document.getElementById('bin-mask').innerHTML = intToBinaryOctets(net.maskInt, net.cidr);
  document.getElementById('bin-network').innerHTML = intToBinaryOctets(net.networkInt, net.cidr);
  document.getElementById('bin-broadcast').innerHTML = intToBinaryOctets(net.broadcastInt, net.cidr);

  // Helpers da Divisão
  const divBadge = document.getElementById('division-badge');
  const subnetsHelper = document.getElementById('subnets-helper-text');
  const hostsHelper = document.getElementById('hosts-helper-text');
  const tableSection = document.getElementById('subnets-table-section');

  if (calc.divisionError) {
    divBadge.textContent = 'Capacidade Excedida';
    divBadge.className = 'text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400';
    subnetsHelper.textContent = calc.divisionError;
    hostsHelper.textContent = calc.divisionError;
    tableSection.classList.add('hidden');
  } else if (calc.divisionActive) {
    divBadge.textContent = `${calc.totalSubnets.toLocaleString('pt-BR')}x /${calc.newCidr}`;
    divBadge.className = 'text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400';
    
    const infoStr = `Máscara resultante: ${calc.newMaskStr} (/${calc.newCidr}) • ${calc.hostsPerSubnet.toLocaleString('pt-BR')} hosts úteis/rede.`;
    subnetsHelper.textContent = infoStr;
    hostsHelper.textContent = `Geradas ${calc.totalSubnets.toLocaleString('pt-BR')} sub-redes /${calc.newCidr} (${calc.hostsPerSubnet.toLocaleString('pt-BR')} hosts úteis cada).`;

    tableSection.classList.remove('hidden');
    renderSubnetsTable(calc);
  } else {
    divBadge.textContent = 'Sem divisão';
    divBadge.className = 'text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400';
    subnetsHelper.textContent = '';
    hostsHelper.textContent = '';
    tableSection.classList.add('hidden');
  }

  updateProjectHeaderUI();
}

function renderSubnetsTable(calc) {
  const tbody = document.getElementById('subnets-tbody');
  const totalEl = document.getElementById('generated-subnets-total');
  const subEl = document.getElementById('generated-subnets-subtitle');
  const limitBanner = document.getElementById('subnets-limit-banner');
  const limitText = document.getElementById('subnets-limit-text');

  totalEl.textContent = calc.totalSubnets.toLocaleString('pt-BR');
  subEl.textContent = `Novo prefixo /${calc.newCidr} (${calc.newMaskStr}) • ${calc.hostsPerSubnet.toLocaleString('pt-BR')} hosts úteis por sub-rede`;

  const filter = state.subnetFilter.trim().toLowerCase();
  const maxToScan = Math.min(calc.totalSubnets, filter ? 2000 : state.subnetsRenderLimit);
  const rows = [];

  for (let i = 0; i < maxToScan; i++) {
    const sub = getSubnetByIndex(calc.baseNet.networkInt, calc.newCidr, i);
    const idxLabel = `#${i + 1}`;
    if (filter) {
      const match = idxLabel.includes(filter) || 
                    sub.networkStr.includes(filter) || 
                    sub.firstHostStr.includes(filter) || 
                    sub.broadcastStr.includes(filter);
      if (!match) continue;
      if (rows.length >= state.subnetsRenderLimit) break;
    }

    const rangeStr = `${sub.firstHostStr} - ${sub.lastHostStr}`;
    const copySummary = `Sub-rede ${idxLabel}: ${sub.networkStr}/${sub.cidr} | Hosts: ${rangeStr} | Broadcast: ${sub.broadcastStr}`;

    rows.push(`
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
        <td class="py-2.5 px-3 font-semibold text-slate-400">${idxLabel}</td>
        <td class="py-2.5 px-3 font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">${sub.networkStr}/${sub.cidr}</td>
        <td class="py-2.5 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">${rangeStr}</td>
        <td class="py-2.5 px-3 text-amber-600 dark:text-amber-400 whitespace-nowrap">${sub.broadcastStr}</td>
        <td class="py-2.5 px-3 text-right">
          <button type="button" data-copy="${copySummary}" title="Copiar Sub-rede" class="btn-copy-val p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
            <svg class="w-4 h-4 inline" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
          </button>
        </td>
      </tr>
    `);
  }

  tbody.innerHTML = rows.length ? rows.join('') : `
    <tr>
      <td colspan="5" class="py-6 text-center text-slate-400 font-sans">Nenhuma sub-rede encontrada para o filtro "${escapeHtml(state.subnetFilter)}".</td>
    </tr>
  `;

  if (calc.totalSubnets > state.subnetsRenderLimit && !filter) {
    limitBanner.classList.remove('hidden');
    limitText.textContent = `Exibindo ${state.subnetsRenderLimit} de ${calc.totalSubnets.toLocaleString('pt-BR')} sub-redes para desempenho ideal no celular.`;
  } else {
    limitBanner.classList.add('hidden');
  }
}

/* -------------------------------------------------------------------
 * 6. GERENCIAMENTO DE PROJETOS & HISTÓRICO (LOCALSTORAGE)
 * ------------------------------------------------------------------- */
function loadStorageData() {
  try {
    const savedProjects = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    state.projects = savedProjects ? JSON.parse(savedProjects) : [];
  } catch (e) {
    state.projects = [];
  }

  try {
    const savedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
    state.history = savedHistory ? JSON.parse(savedHistory) : [];
  } catch (e) {
    state.history = [];
  }
}

function persistProjects() {
  try {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(state.projects));
  } catch (e) {
    showToast('Erro ao salvar no armazenamento local.', 'error');
  }
  renderProjectsLists();
}

function recordHistoryEntry() {
  const val = validateIPv4Input(state.ip, state.cidr);
  if (!val.valid) return;
  const signature = `${val.ip}/${state.cidr}|${state.divMode}|${state.targetSubnets}|${state.targetHosts}`;
  if (state.history.length > 0 && state.history[0].signature === signature) return;

  state.history.unshift({
    signature,
    ip: val.ip,
    cidr: state.cidr,
    divMode: state.divMode,
    targetSubnets: state.targetSubnets,
    targetHosts: state.targetHosts,
    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  });

  if (state.history.length > 6) state.history.pop();
  try {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(state.history));
  } catch (e) {}
  renderHistoryList();
}

function clearRecentHistory() {
  state.history = [];
  try {
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
  } catch (e) {}
  renderHistoryList();
  showToast('Histórico de cálculos recentes limpo.');
}

function updateProjectHeaderUI() {
  const isSaved = Boolean(state.currentProjectId);
  document.getElementById('current-project-title').textContent = state.projectName;
  document.getElementById('current-project-desc').textContent = state.projectDesc || 
    (isSaved ? `Rede base: ${state.ip}/${state.cidr}` : 'Rascunho não salvo — toque em Salvar Projeto');
  
  document.getElementById('header-project-badge').textContent = isSaved 
    ? `Projeto: ${state.projectName}` 
    : `Rascunho • ${state.ip}/${state.cidr}`;

  document.getElementById('btn-bar-save').textContent = isSaved ? 'Atualizar Projeto' : 'Salvar Projeto';
  document.getElementById('drawer-projects-count').textContent = state.projects.length;
  document.getElementById('bar-projects-count').textContent = state.projects.length;
}

function saveOrUpdateProject(name, desc, forceNew = false) {
  const cleanName = name.trim();
  if (!cleanName) return;

  const now = new Date().toISOString();

  if (!forceNew && state.currentProjectId) {
    const idx = state.projects.findIndex(p => p.id === state.currentProjectId);
    if (idx !== -1) {
      state.projects[idx] = {
        ...state.projects[idx],
        name: cleanName,
        desc: desc.trim(),
        ip: state.ip,
        cidr: state.cidr,
        divMode: state.divMode,
        targetSubnets: state.targetSubnets,
        targetHosts: state.targetHosts,
        updatedAt: now
      };
      state.projectName = cleanName;
      state.projectDesc = desc.trim();
      persistProjects();
      updateProjectHeaderUI();
      showToast(`Projeto "${cleanName}" atualizado!`);
      return;
    }
  }

  // Criar novo projeto
  const newId = 'proj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const newProj = {
    id: newId,
    name: cleanName,
    desc: desc.trim(),
    ip: state.ip,
    cidr: state.cidr,
    divMode: state.divMode,
    targetSubnets: state.targetSubnets,
    targetHosts: state.targetHosts,
    createdAt: now,
    updatedAt: now
  };

  state.projects.unshift(newProj);
  state.currentProjectId = newId;
  state.projectName = cleanName;
  state.projectDesc = desc.trim();
  persistProjects();
  updateProjectHeaderUI();
  showToast(`Projeto "${cleanName}" salvo com sucesso!`);
}

function loadProjectById(id) {
  const proj = state.projects.find(p => p.id === id);
  if (!proj) return;

  state.currentProjectId = proj.id;
  state.projectName = proj.name;
  state.projectDesc = proj.desc || '';
  state.ip = proj.ip;
  state.cidr = proj.cidr;
  state.divMode = proj.divMode || 'none';
  state.targetSubnets = proj.targetSubnets || 4;
  state.targetHosts = proj.targetHosts || 30;
  state.subnetsRenderLimit = 100;
  state.subnetFilter = '';

  document.getElementById('input-ip').value = state.ip;
  document.getElementById('input-target-hosts').value = state.targetHosts;
  document.getElementById('input-filter-subnets').value = '';

  populateSubnetsOptions();
  setDivisionModeUI(state.divMode);
  updateUI();
  renderProjectsLists();
  closeDrawer();
  closeAllModals();
  switchView('calculator');
  showToast(`Projeto "${proj.name}" carregado.`);
}

function renameProjectById(id, newName) {
  const clean = newName.trim();
  if (!clean) return;
  const proj = state.projects.find(p => p.id === id);
  if (!proj) return;

  proj.name = clean;
  proj.updatedAt = new Date().toISOString();

  if (state.currentProjectId === id) {
    state.projectName = clean;
    updateProjectHeaderUI();
  }
  persistProjects();
  showToast(`Projeto renomeado para "${clean}".`);
}

function deleteProjectById(id) {
  const proj = state.projects.find(p => p.id === id);
  if (!proj) return;

  state.projects = state.projects.filter(p => p.id !== id);
  if (state.currentProjectId === id) {
    state.currentProjectId = null;
    state.projectName = 'Projeto Sem Título';
    state.projectDesc = '';
    updateProjectHeaderUI();
  }
  persistProjects();
  showToast(`Projeto "${proj.name}" excluído.`);
}

function resetNewCalculation() {
  state.currentProjectId = null;
  state.projectName = 'Projeto Sem Título';
  state.projectDesc = '';
  state.ip = '192.168.1.0';
  state.cidr = 24;
  state.divMode = 'none';
  state.targetSubnets = 4;
  state.targetHosts = 30;
  state.subnetsRenderLimit = 100;
  state.subnetFilter = '';

  document.getElementById('input-ip').value = state.ip;
  document.getElementById('input-target-hosts').value = state.targetHosts;
  document.getElementById('input-filter-subnets').value = '';
  document.getElementById('check-ip-result').classList.add('hidden');

  populateSubnetsOptions();
  setDivisionModeUI('none');
  updateUI();
  renderProjectsLists();
  closeDrawer();
  switchView('calculator');
  showToast('Novo cálculo iniciado.');
}

function formatDateBR(isoStr) {
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) + 
           ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '';
  }
}

function renderProjectsLists() {
  const drawerList = document.getElementById('drawer-projects-list');
  const modalList = document.getElementById('modal-projects-list');
  const searchQuery = (document.getElementById('input-search-projects')?.value || '').toLowerCase();

  // Renderiza no Menu Lateral (Drawer)
  if (state.projects.length === 0) {
    drawerList.innerHTML = `
      <div class="p-4 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
        Nenhum projeto salvo ainda.<br>Salve um cálculo para acessá-lo aqui.
      </div>
    `;
  } else {
    drawerList.innerHTML = state.projects.map(p => {
      const active = p.id === state.currentProjectId;
      return `
        <div class="group flex items-center justify-between gap-1 p-2.5 rounded-xl border ${active ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800' : 'bg-slate-50/70 dark:bg-slate-800/40 border-transparent hover:border-slate-200 dark:hover:border-slate-700'} transition">
          <button type="button" data-load-proj="${p.id}" class="btn-load-proj flex-1 text-left min-w-0">
            <div class="font-semibold text-xs truncate ${active ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}">
              ${escapeHtml(p.name)}
            </div>
            <div class="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate mt-0.5">
              ${p.ip}/${p.cidr} • ${formatDateBR(p.updatedAt)}
            </div>
          </button>
          <div class="flex items-center shrink-0">
            <button type="button" data-rename-proj="${p.id}" title="Renomear" class="btn-rename-proj p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
              </svg>
            </button>
            <button type="button" data-delete-proj="${p.id}" title="Excluir" class="btn-delete-proj p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-700">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Renderiza no Modal Gerenciador Completo
  const filtered = state.projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery) || 
    p.ip.includes(searchQuery) ||
    (p.desc && p.desc.toLowerCase().includes(searchQuery))
  );

  if (filtered.length === 0) {
    modalList.innerHTML = `
      <div class="py-10 text-center text-sm text-slate-400">
        Nenhum projeto encontrado.
      </div>
    `;
  } else {
    modalList.innerHTML = filtered.map(p => `
      <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <span class="font-bold text-sm truncate">${escapeHtml(p.name)}</span>
            <span class="font-mono text-xs px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold">
              ${p.ip}/${p.cidr}
            </span>
          </div>
          ${p.desc ? `<p class="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">${escapeHtml(p.desc)}</p>` : ''}
          <p class="text-[11px] text-slate-400 mt-1">Atualizado em ${formatDateBR(p.updatedAt)}</p>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <button type="button" data-load-proj="${p.id}" class="btn-load-proj px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition">
            Abrir
          </button>
          <button type="button" data-rename-proj="${p.id}" class="btn-rename-proj p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800" title="Renomear">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
            </svg>
          </button>
          <button type="button" data-delete-proj="${p.id}" class="btn-delete-proj p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50" title="Excluir">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
          </button>
        </div>
      </div>
    `).join('');
  }

  updateProjectHeaderUI();
}

function renderHistoryList() {
  const container = document.getElementById('drawer-history-list');
  const clearBtn = document.getElementById('btn-clear-history');

  if (state.history.length === 0) {
    if (clearBtn) clearBtn.classList.add('hidden');
    container.innerHTML = `<p class="px-2 text-[11px] text-slate-400">Sem histórico recente.</p>`;
    return;
  }

  if (clearBtn) clearBtn.classList.remove('hidden');
  container.innerHTML = state.history.map((h, idx) => `
    <button type="button" data-hist-idx="${idx}" class="btn-load-hist w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-mono text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition">
      <span>${h.ip}/${h.cidr}</span>
      <span class="text-[10px] font-sans text-slate-400">${h.time}</span>
    </button>
  `).join('');
}

/* -------------------------------------------------------------------
 * 7. RELATÓRIO TÉCNICO & EXPORTAÇÕES (PDF/PRINT, CSV, TXT, CLIPBOARD)
 * ------------------------------------------------------------------- */
function renderReportView() {
  const calc = state.lastCalculation || performFullCalculation();
  const doc = document.getElementById('report-document');
  if (!calc) {
    doc.innerHTML = `<p class="text-sm text-rose-600">Corrija o endereço IP antes de gerar o relatório.</p>`;
    return;
  }

  const net = calc.baseNet;
  const nowStr = new Date().toLocaleString('pt-BR');

  let subnetsHtml = '';
  if (calc.divisionActive && !calc.divisionError) {
    const maxReportRows = Math.min(calc.totalSubnets, 512);
    let rowsHtml = '';
    for (let i = 0; i < maxReportRows; i++) {
      const sub = getSubnetByIndex(net.networkInt, calc.newCidr, i);
      rowsHtml += `
        <tr class="border-b border-slate-200 dark:border-slate-800">
          <td class="py-2 px-3 font-semibold">#${i + 1}</td>
          <td class="py-2 px-3 font-bold">${sub.networkStr}/${sub.cidr}</td>
          <td class="py-2 px-3">${sub.firstHostStr}</td>
          <td class="py-2 px-3">${sub.lastHostStr}</td>
          <td class="py-2 px-3">${sub.broadcastStr}</td>
          <td class="py-2 px-3 text-right">${sub.usableHosts.toLocaleString('pt-BR')}</td>
        </tr>
      `;
    }

    subnetsHtml = `
      <div class="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="font-bold text-base">Plano de Sub-redes Geradas (${calc.totalSubnets.toLocaleString('pt-BR')} sub-redes /${calc.newCidr})</h3>
          <span class="text-xs text-slate-500">Máscara das Sub-redes: ${calc.newMaskStr}</span>
        </div>
        ${calc.totalSubnets > 512 ? `<p class="text-xs text-amber-600">Nota: Exibindo as primeiras 512 sub-redes no relatório visual. Use a exportação CSV para obter todas.</p>` : ''}
        <div class="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table class="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr class="bg-slate-100 dark:bg-slate-800 text-[11px] font-sans uppercase text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <th class="py-2.5 px-3">ID</th>
                <th class="py-2.5 px-3">Rede / CIDR</th>
                <th class="py-2.5 px-3">Primeiro Host</th>
                <th class="py-2.5 px-3">Último Host</th>
                <th class="py-2.5 px-3">Broadcast</th>
                <th class="py-2.5 px-3 text-right">Hosts</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  doc.innerHTML = `
    <div class="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
      <div>
        <span class="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">Relatório Técnico de Endereçamento IPv4</span>
        <h2 class="text-xl sm:text-2xl font-bold mt-1">${escapeHtml(state.projectName)}</h2>
        ${state.projectDesc ? `<p class="text-sm text-slate-500 dark:text-slate-400 mt-1">${escapeHtml(state.projectDesc)}</p>` : ''}
      </div>
      <div class="text-left sm:text-right text-xs text-slate-500 dark:text-slate-400 space-y-1">
        <p><strong>Gerado em:</strong> ${nowStr}</p>
        <p><strong>Ferramenta:</strong> NetCalc Pro IPv4/VLSM</p>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 print-break-inside">
      <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-sm">
        <h4 class="font-bold text-xs uppercase tracking-wider text-slate-400">Parâmetros da Rede Base</h4>
        <div class="flex justify-between"><span>Endereço Informado:</span> <strong class="font-mono">${net.ipStr}/${net.cidr}</strong></div>
        <div class="flex justify-between"><span>Endereço de Rede:</span> <strong class="font-mono">${net.networkStr}</strong></div>
        <div class="flex justify-between"><span>Endereço Broadcast:</span> <strong class="font-mono">${net.broadcastStr}</strong></div>
        <div class="flex justify-between"><span>Faixa de Hosts Válidos:</span> <strong class="font-mono">${net.firstHostStr} - ${net.lastHostStr}</strong></div>
      </div>

      <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-sm">
        <h4 class="font-bold text-xs uppercase tracking-wider text-slate-400">Máscaras & Capacidade</h4>
        <div class="flex justify-between"><span>Máscara Decimal:</span> <strong class="font-mono">${net.maskStr}</strong></div>
        <div class="flex justify-between"><span>Máscara Coringa:</span> <strong class="font-mono">${net.wildcardStr}</strong></div>
        <div class="flex justify-between"><span>Classe / Escopo:</span> <strong>${net.ipClass} • ${net.scope}</strong></div>
        <div class="flex justify-between"><span>Hosts Úteis / Total IPs:</span> <strong class="font-mono">${net.usableHosts.toLocaleString('pt-BR')} / ${net.totalIps.toLocaleString('pt-BR')}</strong></div>
      </div>
    </div>

    ${subnetsHtml}
  `;
}

function generatePlainTextReport() {
  const calc = state.lastCalculation || performFullCalculation();
  if (!calc) return '';
  const net = calc.baseNet;
  const lines = [
    '====================================================',
    `RELATÓRIO DE SUB-REDES IPv4 - ${state.projectName.toUpperCase()}`,
    '====================================================',
    state.projectDesc ? `Descrição: ${state.projectDesc}` : null,
    `Data/Hora: ${new Date().toLocaleString('pt-BR')}`,
    '',
    '[ REDE PRINCIPAL ]',
    `IP Base / CIDR : ${net.ipStr}/${net.cidr}`,
    `Endereço Rede  : ${net.networkStr}`,
    `Primeiro Host  : ${net.firstHostStr}`,
    `Último Host    : ${net.lastHostStr}`,
    `Broadcast      : ${net.broadcastStr}`,
    `Máscara        : ${net.maskStr}`,
    `Wildcard       : ${net.wildcardStr}`,
    `Classe/Escopo  : ${net.ipClass} (${net.scope})`,
    `Hosts Úteis    : ${net.usableHosts.toLocaleString('pt-BR')} (Total IPs: ${net.totalIps.toLocaleString('pt-BR')})`,
  ].filter(Boolean);

  if (calc.divisionActive && !calc.divisionError) {
    lines.push('');
    lines.push(`[ SUB-REDES GERADAS: ${calc.totalSubnets}x /${calc.newCidr} (${calc.newMaskStr}) ]`);
    const limit = Math.min(calc.totalSubnets, 1000);
    for (let i = 0; i < limit; i++) {
      const s = getSubnetByIndex(net.networkInt, calc.newCidr, i);
      lines.push(`#${String(i + 1).padStart(3, '0')} | Rede: ${s.networkStr}/${s.cidr} | Hosts: ${s.firstHostStr} - ${s.lastHostStr} | Bcast: ${s.broadcastStr}`);
    }
  }
  return lines.join('\n');
}

function generateShortCidrSummary() {
  const calc = state.lastCalculation || performFullCalculation();
  if (!calc) return '';
  const n = calc.baseNet;
  return `Rede: ${n.networkStr}/${n.cidr} | Máscara: ${n.maskStr} | Hosts: ${n.firstHostStr} - ${n.lastHostStr} (${n.usableHosts.toLocaleString('pt-BR')} úteis) | Broadcast: ${n.broadcastStr}`;
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportReportCSV() {
  const calc = state.lastCalculation || performFullCalculation();
  if (!calc) return;
  const net = calc.baseNet;
  const rows = [
    ['ID', 'Rede', 'CIDR', 'Mascara', 'Primeiro_Host', 'Ultimo_Host', 'Broadcast', 'Hosts_Uteis']
  ];

  if (calc.divisionActive && !calc.divisionError) {
    const limit = Math.min(calc.totalSubnets, 4096);
    for (let i = 0; i < limit; i++) {
      const s = getSubnetByIndex(net.networkInt, calc.newCidr, i);
      rows.push([i + 1, s.networkStr, `/${s.cidr}`, s.maskStr, s.firstHostStr, s.lastHostStr, s.broadcastStr, s.usableHosts]);
    }
  } else {
    rows.push([1, net.networkStr, `/${net.cidr}`, net.maskStr, net.firstHostStr, net.lastHostStr, net.broadcastStr, net.usableHosts]);
  }

  const csvContent = '﻿' + rows.map(r => r.join(';')).join('\n');
  const safeName = state.projectName.replace(/[^a-z0-9_-]/gi, '_').toLowerCase() || 'subredes';
  downloadFile(`${safeName}_relatorio.csv`, csvContent, 'text/csv;charset=utf-8;');
  showToast('Arquivo CSV exportado!');
}

/* -------------------------------------------------------------------
 * 8. UTILITÁRIOS DE UI (COPIAR, TOAST, DRAWER, MODAIS, TEMA)
 * ------------------------------------------------------------------- */
function copyToClipboard(text) {
  if (!text) return;
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    showToast(`Copiado: ${text.length > 36 ? text.substring(0, 36) + '...' : text}`);
  } catch (err) {
    showToast('Não foi possível copiar.', 'error');
  }
  document.body.removeChild(textarea);
}

let toastTimer = null;
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const bgClass = type === 'error' ? 'bg-rose-600' : 'bg-slate-900 dark:bg-slate-800 border border-slate-700';
  container.innerHTML = `
    <div class="toast-enter ${bgClass} text-white text-xs sm:text-sm font-medium px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 max-w-[90vw]">
      <span>${escapeHtml(message)}</span>
    </div>
  `;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    container.innerHTML = '';
  }, 2800);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function openDrawer() {
  document.getElementById('drawer-overlay').classList.remove('hidden');
  document.getElementById('navigation-drawer').classList.remove('-translate-x-full');
}

function closeDrawer() {
  document.getElementById('drawer-overlay').classList.add('hidden');
  document.getElementById('navigation-drawer').classList.add('-translate-x-full');
}

function switchView(viewName) {
  const calcView = document.getElementById('main-calculator-view');
  const vlsmView = document.getElementById('vlsm-planner-view');
  const cidrTableView = document.getElementById('cidr-table-view');
  const reportView = document.getElementById('report-view');

  calcView.classList.add('hidden');
  vlsmView.classList.add('hidden');
  cidrTableView.classList.add('hidden');
  reportView.classList.add('hidden');

  if (viewName === 'report') {
    renderReportView();
    reportView.classList.remove('hidden');
  } else if (viewName === 'vlsm') {
    computeVlsmPlan();
    vlsmView.classList.remove('hidden');
  } else if (viewName === 'cidr-table') {
    cidrTableView.classList.remove('hidden');
  } else {
    calcView.classList.remove('hidden');
  }

  // Sincroniza estado ativo nos links do menu lateral
  document.querySelectorAll('.nav-item').forEach(btn => {
    const isMatch = btn.dataset.nav === viewName;
    if (isMatch) {
      btn.className = 'nav-item w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 transition';
    } else {
      btn.className = 'nav-item w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition';
    }
  });

  // Sincroniza estado ativo no top-nav
  document.querySelectorAll('.top-nav-item').forEach(btn => {
    const isMatch = btn.dataset.nav === viewName;
    const isMobile = btn.closest('.md\\:hidden');
    if (isMobile) {
      btn.className = isMatch
        ? 'top-nav-item px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs whitespace-nowrap transition'
        : 'top-nav-item px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap transition';
    } else {
      btn.className = isMatch
        ? 'top-nav-item px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs transition'
        : 'top-nav-item px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition';
    }
  });
}

function openProjectModal(mode, projectId = null) {
  const modal = document.getElementById('modal-project-form');
  const titleEl = document.getElementById('modal-form-title');
  const modeInput = document.getElementById('form-project-mode');
  const idInput = document.getElementById('form-project-id');
  const nameInput = document.getElementById('input-project-name');
  const descInput = document.getElementById('input-project-desc');
  const descGroup = document.getElementById('group-project-desc');

  modeInput.value = mode;
  idInput.value = projectId || '';

  if (mode === 'rename' && projectId) {
    const proj = state.projects.find(p => p.id === projectId);
    titleEl.textContent = 'Renomear Projeto';
    nameInput.value = proj ? proj.name : state.projectName;
    descGroup.classList.add('hidden');
  } else if (mode === 'save_as') {
    titleEl.textContent = 'Salvar Como Novo Projeto';
    nameInput.value = state.currentProjectId ? `${state.projectName} (Cópia)` : `Sub-rede ${state.ip}/${state.cidr}`;
    descInput.value = state.projectDesc;
    descGroup.classList.remove('hidden');
  } else {
    titleEl.textContent = 'Salvar Projeto';
    nameInput.value = state.currentProjectId ? state.projectName : `Sub-rede ${state.ip}/${state.cidr}`;
    descInput.value = state.projectDesc;
    descGroup.classList.remove('hidden');
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  setTimeout(() => nameInput.focus(), 50);
}

function openConfirmDialog(title, message, onConfirm) {
  const modal = document.getElementById('modal-confirm');
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-message').textContent = message;

  const okBtn = document.getElementById('btn-confirm-ok');
  const newOkBtn = okBtn.cloneNode(true);
  okBtn.parentNode.replaceChild(newOkBtn, okBtn);

  newOkBtn.addEventListener('click', () => {
    closeAllModals();
    onConfirm();
  });

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeAllModals() {
  document.querySelectorAll('#modals-container > div').forEach(m => {
    m.classList.add('hidden');
    m.classList.remove('flex');
  });
}

function setDivisionModeUI(mode) {
  state.divMode = mode;
  document.querySelectorAll('.div-mode-btn').forEach(btn => {
    if (btn.dataset.divmode === mode) {
      btn.className = 'div-mode-btn py-2 px-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs transition';
    } else {
      btn.className = 'div-mode-btn py-2 px-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition';
    }
  });

  document.getElementById('panel-div-subnets').classList.toggle('hidden', mode !== 'subnets');
  document.getElementById('panel-div-hosts').classList.toggle('hidden', mode !== 'hosts');
}

function initTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem(STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
}

/* -------------------------------------------------------------------
 * 9. EVENT LISTENERS E INICIALIZAÇÃO
 * ------------------------------------------------------------------- */
function bindEvents() {
  // Drawer / Menu Lateral
  document.getElementById('btn-open-drawer').addEventListener('click', openDrawer);
  document.getElementById('btn-close-drawer').addEventListener('click', closeDrawer);
  document.getElementById('drawer-overlay').addEventListener('click', closeDrawer);

  // Navegação entre Calculadora, VLSM, Tabela CIDR e Relatório
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      switchView(btn.dataset.nav);
      closeDrawer();
    });
  });

  document.querySelectorAll('.top-nav-item').forEach(btn => {
    btn.addEventListener('click', () => {
      switchView(btn.dataset.nav);
    });
  });

  // Atalhos rápidos no Menu Lateral
  document.getElementById('btn-shortcut-copy-cidr').addEventListener('click', () => {
    const summary = generateShortCidrSummary();
    if (summary) copyToClipboard(summary);
    closeDrawer();
  });

  document.getElementById('btn-shortcut-use-vlsm').addEventListener('click', () => {
    const calc = state.lastCalculation || performFullCalculation();
    if (calc) {
      state.vlsm.baseIp = calc.baseNet.networkStr;
      state.vlsm.baseCidr = calc.baseNet.cidr;
      document.getElementById('vlsm-base-ip').value = state.vlsm.baseIp;
      document.getElementById('vlsm-base-cidr').value = state.vlsm.baseCidr;
      computeVlsmPlan();
      showToast(`Rede ${calc.baseNet.networkStr}/${calc.baseNet.cidr} enviada ao VLSM.`);
    }
    closeDrawer();
    switchView('vlsm');
  });

  document.getElementById('btn-shortcut-export-vlsm').addEventListener('click', () => {
    closeDrawer();
    exportVlsmCSV();
  });

  // Limpar Histórico de Cálculos Recentes (com confirmação simples)
  document.getElementById('btn-clear-history').addEventListener('click', () => {
    openConfirmDialog(
      'Limpar Histórico Recente',
      'Deseja limpar a lista de cálculos recentes? Seus projetos salvos e configurações não serão afetados.',
      () => clearRecentHistory()
    );
  });

  document.getElementById('btn-header-report').addEventListener('click', () => switchView('report'));
  document.getElementById('btn-goto-report-from-table').addEventListener('click', () => switchView('report'));
  document.getElementById('btn-back-to-calc').addEventListener('click', () => switchView('calculator'));

  // Tema Claro / Escuro
  document.getElementById('btn-toggle-theme').addEventListener('click', toggleTheme);

  // Entradas de IP e CIDR
  let historyDebounce = null;
  document.getElementById('input-ip').addEventListener('input', (e) => {
    state.ip = e.target.value;
    state.subnetsRenderLimit = 100;
    updateUI();
    clearTimeout(historyDebounce);
    historyDebounce = setTimeout(recordHistoryEntry, 1200);
  });

  document.getElementById('select-cidr').addEventListener('change', (e) => {
    state.cidr = Number(e.target.value);
    state.subnetsRenderLimit = 100;
    populateSubnetsOptions();
    updateUI();
    recordHistoryEntry();
  });

  document.getElementById('slider-cidr').addEventListener('input', (e) => {
    state.cidr = Number(e.target.value);
    state.subnetsRenderLimit = 100;
    populateSubnetsOptions();
    updateUI();
  });
  document.getElementById('slider-cidr').addEventListener('change', recordHistoryEntry);

  // Presets de IP
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const [ip, cidr] = btn.dataset.preset.split('/');
      state.ip = ip;
      state.cidr = Number(cidr);
      document.getElementById('input-ip').value = ip;
      populateSubnetsOptions();
      updateUI();
      recordHistoryEntry();
    });
  });

  // Modos de Divisão
  document.querySelectorAll('.div-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setDivisionModeUI(btn.dataset.divmode);
      state.subnetsRenderLimit = 100;
      updateUI();
      recordHistoryEntry();
    });
  });

  document.getElementById('select-target-subnets').addEventListener('change', (e) => {
    state.targetSubnets = Number(e.target.value);
    state.subnetsRenderLimit = 100;
    updateUI();
    recordHistoryEntry();
  });

  document.getElementById('input-target-hosts').addEventListener('input', (e) => {
    state.targetHosts = Math.max(1, Number(e.target.value) || 1);
    state.subnetsRenderLimit = 100;
    updateUI();
  });

  // Filtro e Paginação da Tabela de Sub-redes
  document.getElementById('input-filter-subnets').addEventListener('input', (e) => {
    state.subnetFilter = e.target.value;
    if (state.lastCalculation) renderSubnetsTable(state.lastCalculation);
  });

  document.getElementById('btn-load-more-subnets').addEventListener('click', () => {
    state.subnetsRenderLimit += 100;
    if (state.lastCalculation) renderSubnetsTable(state.lastCalculation);
  });

  // Eventos do Planejador VLSM
  document.getElementById('vlsm-base-ip').addEventListener('input', (e) => {
    state.vlsm.baseIp = e.target.value;
    computeVlsmPlan();
  });
  document.getElementById('vlsm-base-cidr').addEventListener('change', (e) => {
    state.vlsm.baseCidr = Number(e.target.value);
    computeVlsmPlan();
  });
  document.getElementById('btn-vlsm-sync-base').addEventListener('click', () => {
    const calc = state.lastCalculation || performFullCalculation();
    if (calc) {
      state.vlsm.baseIp = calc.baseNet.networkStr;
      state.vlsm.baseCidr = calc.baseNet.cidr;
      document.getElementById('vlsm-base-ip').value = state.vlsm.baseIp;
      document.getElementById('vlsm-base-cidr').value = state.vlsm.baseCidr;
      computeVlsmPlan();
      showToast(`Rede base sincronizada: ${calc.baseNet.networkStr}/${calc.baseNet.cidr}`);
    }
  });
  document.getElementById('btn-vlsm-add-row').addEventListener('click', () => {
    const nextNum = state.vlsm.subnets.length + 1;
    state.vlsm.subnets.push({
      id: 'v_' + Date.now() + '_' + nextNum,
      name: `Sub-rede ${nextNum}`,
      hosts: 14
    });
    renderVlsmInputs();
  });
  document.getElementById('vlsm-inputs-list').addEventListener('input', (e) => {
    const nameId = e.target.dataset.vlsmName;
    const hostsId = e.target.dataset.vlsmHosts;
    if (nameId) {
      const sub = state.vlsm.subnets.find(s => s.id === nameId);
      if (sub) sub.name = e.target.value;
      computeVlsmPlan();
    } else if (hostsId) {
      const sub = state.vlsm.subnets.find(s => s.id === hostsId);
      if (sub) sub.hosts = Math.max(1, Number(e.target.value) || 1);
      computeVlsmPlan();
    }
  });
  document.getElementById('vlsm-inputs-list').addEventListener('click', (e) => {
    const remBtn = e.target.closest('[data-vlsm-remove]');
    if (remBtn) {
      const id = remBtn.dataset.vlsmRemove;
      state.vlsm.subnets = state.vlsm.subnets.filter(s => s.id !== id);
      renderVlsmInputs();
    }
  });
  document.getElementById('btn-vlsm-export-csv').addEventListener('click', exportVlsmCSV);

  // Filtro e aplicação da Tabela CIDR
  document.getElementById('input-filter-cidr-table').addEventListener('input', (e) => {
    renderCidrReferenceTable(e.target.value);
  });

  // Delegação de clique para botões de Copiar e Tabela CIDR
  document.body.addEventListener('click', (e) => {
    const copyBtn = e.target.closest('.btn-copy-val');
    if (copyBtn) {
      copyToClipboard(copyBtn.dataset.copy);
      return;
    }
    const applyCidrBtn = e.target.closest('.btn-apply-cidr');
    if (applyCidrBtn) {
      state.cidr = Number(applyCidrBtn.dataset.applyCidr);
      populateSubnetsOptions();
      updateUI();
      switchView('calculator');
      showToast(`Prefixo /${state.cidr} aplicado na calculadora.`);
    }
  });

  // Verificador de Pertencimento de IP
  document.getElementById('btn-check-ip').addEventListener('click', () => {
    const testIp = document.getElementById('input-check-ip').value.trim();
    const resBox = document.getElementById('check-ip-result');
    resBox.classList.remove('hidden');

    if (!isValidIPv4(testIp)) {
      resBox.className = 'p-3 rounded-xl text-xs font-medium bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800';
      resBox.textContent = 'Digite um endereço IPv4 válido para testar.';
      return;
    }

    const calc = state.lastCalculation;
    if (!calc) return;
    const testInt = ipToInt(testIp);
    const belongs = testInt >= calc.baseNet.networkInt && testInt <= calc.baseNet.broadcastInt;

    if (belongs) {
      let role = 'Host Válido';
      if (testInt === calc.baseNet.networkInt) role = 'Endereço de Rede';
      else if (testInt === calc.baseNet.broadcastInt) role = 'Endereço de Broadcast';

      resBox.className = 'p-3 rounded-xl text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
      resBox.innerHTML = `<strong>Pertence à rede ${calc.baseNet.networkStr}/${calc.baseNet.cidr}!</strong><br>Função: ${role}.`;
    } else {
      resBox.className = 'p-3 rounded-xl text-xs font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
      resBox.innerHTML = `<strong>Fora da rede!</strong> O IP ${testIp} não pertence à faixa ${calc.baseNet.networkStr} – ${calc.baseNet.broadcastStr}.`;
    }
  });

  // Ações de Projeto (Salvar, Novo, Renomear, Excluir)
  const handleQuickSave = () => {
    if (!isValidIPv4(state.ip)) {
      showToast('Corrija o endereço IP inválido antes de salvar.', 'error');
      return;
    }
    if (state.currentProjectId) {
      saveOrUpdateProject(state.projectName, state.projectDesc, false);
    } else {
      openProjectModal('create');
    }
  };

  document.getElementById('btn-header-save').addEventListener('click', handleQuickSave);
  document.getElementById('btn-bar-save').addEventListener('click', handleQuickSave);
  
  document.getElementById('btn-drawer-save-as').addEventListener('click', () => {
    closeDrawer();
    if (!isValidIPv4(state.ip)) {
      showToast('Corrija o endereço IP inválido antes de salvar.', 'error');
      return;
    }
    openProjectModal('save_as');
  });

  document.getElementById('btn-drawer-new').addEventListener('click', resetNewCalculation);
  document.getElementById('btn-bar-new').addEventListener('click', resetNewCalculation);

  document.getElementById('btn-quick-rename').addEventListener('click', () => {
    if (state.currentProjectId) {
      openProjectModal('rename', state.currentProjectId);
    } else {
      openProjectModal('create');
    }
  });

  // Formulário Modal Salvar / Renomear
  document.getElementById('form-save-project').addEventListener('submit', (e) => {
    e.preventDefault();
    const mode = document.getElementById('form-project-mode').value;
    const id = document.getElementById('form-project-id').value;
    const name = document.getElementById('input-project-name').value;
    const desc = document.getElementById('input-project-desc').value;

    if (mode === 'rename' && id) {
      renameProjectById(id, name);
    } else if (mode === 'save_as') {
      saveOrUpdateProject(name, desc, true);
    } else {
      saveOrUpdateProject(name, desc, false);
    }
    closeAllModals();
  });

  // Abrir Gerenciador Completo de Projetos
  const openProjectsManager = () => {
    closeDrawer();
    renderProjectsLists();
    const modal = document.getElementById('modal-projects-manager');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  };
  document.getElementById('btn-open-projects-modal').addEventListener('click', openProjectsManager);
  document.getElementById('btn-bar-projects').addEventListener('click', openProjectsManager);
  document.getElementById('input-search-projects').addEventListener('input', renderProjectsLists);

  // Delegação de eventos nas listas de projetos (Carregar, Renomear, Excluir) e Histórico
  document.body.addEventListener('click', (e) => {
    const loadBtn = e.target.closest('.btn-load-proj');
    if (loadBtn) {
      loadProjectById(loadBtn.dataset.loadProj);
      return;
    }

    const renameBtn = e.target.closest('.btn-rename-proj');
    if (renameBtn) {
      closeDrawer();
      openProjectModal('rename', renameBtn.dataset.renameProj);
      return;
    }

    const deleteBtn = e.target.closest('.btn-delete-proj');
    if (deleteBtn) {
      const id = deleteBtn.dataset.deleteProj;
      const proj = state.projects.find(p => p.id === id);
      openConfirmDialog(
        'Excluir Projeto',
        `Deseja realmente excluir o projeto "${proj ? proj.name : ''}"? Esta ação não pode ser desfeita.`,
        () => deleteProjectById(id)
      );
      return;
    }

    const histBtn = e.target.closest('.btn-load-hist');
    if (histBtn) {
      const h = state.history[Number(histBtn.dataset.histIdx)];
      if (h) {
        state.currentProjectId = null;
        state.projectName = 'Projeto Sem Título';
        state.projectDesc = '';
        state.ip = h.ip;
        state.cidr = h.cidr;
        state.divMode = h.divMode;
        state.targetSubnets = h.targetSubnets;
        state.targetHosts = h.targetHosts;
        document.getElementById('input-ip').value = state.ip;
        document.getElementById('input-target-hosts').value = state.targetHosts;
        populateSubnetsOptions();
        setDivisionModeUI(state.divMode);
        updateUI();
        closeDrawer();
        switchView('calculator');
      }
    }
  });

  // Fechar Modais
  document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', closeAllModals);
  });
  document.getElementById('btn-confirm-cancel').addEventListener('click', closeAllModals);

  // Exportações do Relatório
  document.getElementById('btn-print-report').addEventListener('click', () => window.print());
  document.getElementById('btn-copy-report').addEventListener('click', () => {
    const txt = generatePlainTextReport();
    copyToClipboard(txt);
  });
  document.getElementById('btn-export-txt').addEventListener('click', () => {
    const txt = generatePlainTextReport();
    const safeName = state.projectName.replace(/[^a-z0-9_-]/gi, '_').toLowerCase() || 'subredes';
    downloadFile(`${safeName}_relatorio.txt`, txt, 'text/plain;charset=utf-8;');
    showToast('Relatório TXT baixado!');
  });
  document.getElementById('btn-export-csv').addEventListener('click', exportReportCSV);

  // Backup e Restauração JSON
  document.getElementById('btn-export-backup').addEventListener('click', () => {
    const payload = {
      app: 'NetCalc Pro',
      version: 1,
      exportedAt: new Date().toISOString(),
      projects: state.projects
    };
    downloadFile(`netcalc_backup_${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(payload, null, 2), 'application/json');
    showToast('Backup JSON exportado!');
  });

  document.getElementById('input-import-backup').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!parsed || !Array.isArray(parsed.projects)) {
          throw new Error('Formato inválido');
        }
        const existingIds = new Set(state.projects.map(p => p.id));
        let added = 0;
        parsed.projects.forEach(p => {
          if (p.id && p.name && isValidIPv4(p.ip) && !existingIds.has(p.id)) {
            state.projects.push(p);
            added++;
          }
        });
        persistProjects();
        showToast(`Backup restaurado! ${added} projeto(s) importado(s).`);
      } catch (err) {
        showToast('Arquivo de backup JSON inválido.', 'error');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  });
}

// Inicialização Geral
window.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadStorageData();
  populateCidrSelect();
  populateSubnetsOptions();
  renderProjectsLists();
  renderHistoryList();
  renderVlsmInputs();
  renderCidrReferenceTable();
  bindEvents();
  updateUI();
  recordHistoryEntry();
});
