'use strict';

/* -------------------------------------------------------------------
 * 1. CHAVES DE ARMAZENAMENTO & ESTADO GLOBAL DA APLICAÇÃO
 * ------------------------------------------------------------------- */
const STORAGE_KEYS = {
  PROJECTS: 'netcalc_pro_projects_v1',
  HISTORY: 'netcalc_pro_history_v1',
  THEME: 'netcalc_pro_theme_v1'
};

const state = {
  currentProjectId: null, // null = rascunho não salvo
  projectName: 'Projeto Sem Título',
  projectDesc: '',
  ip: '192.168.1.0',
  cidr: 24,
  divMode: 'none', // 'none' | 'subnets' | 'hosts'
  targetSubnets: 4,
  targetHosts: 30,
  subnetsRenderLimit: 100,
  subnetFilter: '',
  lastCalculation: null,
  projects: [],
  history: [],
  vlsm: {
    baseIp: '192.168.1.0',
    baseCidr: 24,
    subnets: [
      { id: 'v1', name: 'Administração', hosts: 60 },
      { id: 'v2', name: 'Wi-Fi Corporativo', hosts: 100 },
      { id: 'v3', name: 'Servidores', hosts: 12 },
      { id: 'v4', name: 'Link Matriz-Filial', hosts: 2 }
    ],
    lastPlan: null
  }
};

/* -------------------------------------------------------------------
 * 2. VALIDAÇÃO ESTRITA & MATEMÁTICA DE REDE IPv4 (32-BIT UNSIGNED)
 * ------------------------------------------------------------------- */
function validateIPv4Input(rawStr, currentCidr = 24) {
  if (!rawStr || typeof rawStr !== 'string') {
    return { valid: false, message: 'Informe um endereço IPv4 válido (ex: 192.168.1.0).' };
  }
  const trimmed = rawStr.trim();
  if (!trimmed) {
    return { valid: false, message: 'O campo de endereço IPv4 não pode ficar vazio.' };
  }

  const slashParts = trimmed.split('/');
  if (slashParts.length > 2) {
    return { valid: false, message: 'Formato inválido: múltiplas barras "/" detectadas.' };
  }

  const ipPart = slashParts[0].trim();
  let parsedCidr = currentCidr;

  if (slashParts.length === 2) {
    const cidrRaw = slashParts[1].trim();
    if (!/^\d{1,2}$/.test(cidrRaw)) {
      return { valid: false, message: 'Prefixo CIDR inválido. Use um número inteiro entre /0 e /32.' };
    }
    parsedCidr = Number(cidrRaw);
    if (parsedCidr < 0 || parsedCidr > 32) {
      return { valid: false, message: `Prefixo /${parsedCidr} fora do intervalo permitido (0 a 32).` };
    }
  }

  const octets = ipPart.split('.');
  if (octets.length !== 4) {
    return { valid: false, message: 'Endereço IPv4 incompleto. Digite exatamente 4 octetos separados por ponto.' };
  }

  for (let i = 0; i < 4; i++) {
    const part = octets[i];
    if (!/^\d{1,3}$/.test(part)) {
      return { valid: false, message: `Octeto ${i + 1} inválido ("${part}"). Use apenas números de 0 a 255.` };
    }
    if (part.length > 1 && part.startsWith('0')) {
      return { valid: false, message: `Octeto ${i + 1} ("${part}") não deve conter zeros à esquerda.` };
    }
    const num = Number(part);
    if (num < 0 || num > 255) {
      return { valid: false, message: `Octeto ${i + 1} (${num}) fora do limite permitido (0–255).` };
    }
  }

  return { valid: true, ip: ipPart, cidr: parsedCidr, hasInlineCidr: slashParts.length === 2 };
}

function isValidIPv4(ipStr) {
  return validateIPv4Input(ipStr).valid;
}

function ipToInt(ipStr) {
  const parts = ipStr.trim().split('.').map(Number);
  return (((parts[0] << 24) >>> 0) + ((parts[1] << 16) >>> 0) + ((parts[2] << 8) >>> 0) + (parts[3] >>> 0)) >>> 0;
}

function intToIp(intVal) {
  const u = intVal >>> 0;
  return [
    (u >>> 24) & 255,
    (u >>> 16) & 255,
    (u >>> 8) & 255,
    u & 255
  ].join('.');
}

function intToHex(intVal) {
  return '0x' + ((intVal >>> 0).toString(16).toUpperCase().padStart(8, '0'));
}

function cidrToMaskInt(cidr) {
  const c = Number(cidr);
  if (c <= 0) return 0 >>> 0;
  if (c >= 32) return 0xFFFFFFFF >>> 0;
  return (0xFFFFFFFF << (32 - c)) >>> 0;
}

function intToBinaryOctets(intVal, cidrHighlight = 0) {
  const binStr = (intVal >>> 0).toString(2).padStart(32, '0');
  let html = '';
  for (let i = 0; i < 32; i++) {
    if (i > 0 && i % 8 === 0) {
      html += '<span class="text-slate-400 mx-0.5">.</span>';
    }
    const bit = binStr[i];
    if (cidrHighlight >= 0) {
      if (i < cidrHighlight) {
        html += `<span class="text-blue-600 dark:text-blue-400 font-semibold">${bit}</span>`;
      } else {
        html += `<span class="text-emerald-600 dark:text-emerald-400">${bit}</span>`;
      }
    } else {
      html += `<span>${bit}</span>`;
    }
  }
  return html;
}

function getIpClassAndScope(ipInt) {
  const u = ipInt >>> 0;
  const firstOctet = (u >>> 24) & 255;
  const secondOctet = (u >>> 16) & 255;

  let ipClass = 'Classe E (Experimental)';
  if (firstOctet >= 1 && firstOctet <= 126) ipClass = 'Classe A';
  else if (firstOctet === 127) ipClass = 'Loopback (127.0.0.0/8)';
  else if (firstOctet >= 128 && firstOctet <= 191) ipClass = 'Classe B';
  else if (firstOctet >= 192 && firstOctet <= 223) ipClass = 'Classe C';
  else if (firstOctet >= 224 && firstOctet <= 239) ipClass = 'Classe D (Multicast)';
  else if (firstOctet === 0) ipClass = 'Rede Atual (0.0.0.0/8)';

  let scope = 'Público (Roteável)';
  if (firstOctet === 10) {
    scope = 'Privado (RFC 1918)';
  } else if (firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31) {
    scope = 'Privado (RFC 1918)';
  } else if (firstOctet === 192 && secondOctet === 168) {
    scope = 'Privado (RFC 1918)';
  } else if (firstOctet === 100 && secondOctet >= 64 && secondOctet <= 127) {
    scope = 'CGNAT (RFC 6598)';
  } else if (firstOctet === 169 && secondOctet === 254) {
    scope = 'Link-Local (APIPA)';
  } else if (firstOctet === 127) {
    scope = 'Reservado Loopback';
  } else if (firstOctet >= 224) {
    scope = 'Reservado / Especial';
  }

  return { ipClass, scope };
}

function calculateSingleNetwork(ipInt, cidr) {
  const uIp = ipInt >>> 0;
  const c = Math.max(0, Math.min(32, Number(cidr) || 0));
  const maskInt = cidrToMaskInt(c);
  const wildcardInt = (~maskInt) >>> 0;
  const networkInt = (uIp & maskInt) >>> 0;
  const broadcastInt = (networkInt | wildcardInt) >>> 0;
  const totalIps = Math.pow(2, 32 - c);

  let usableHosts = 0;
  let firstHostInt = networkInt;
  let lastHostInt = broadcastInt;

  if (c === 32) {
    usableHosts = 1;
    firstHostInt = networkInt;
    lastHostInt = networkInt;
  } else if (c === 31) {
    // RFC 3021 Ponto-a-Ponto
    usableHosts = 2;
    firstHostInt = networkInt;
    lastHostInt = broadcastInt;
  } else {
    usableHosts = Math.max(0, totalIps - 2);
    firstHostInt = (networkInt + 1) >>> 0;
    lastHostInt = (broadcastInt - 1) >>> 0;
  }

  const { ipClass, scope } = getIpClassAndScope(uIp);

  return {
    ipInt: uIp,
    ipStr: intToIp(uIp),
    ipHex: intToHex(uIp),
    cidr: c,
    maskInt,
    maskStr: intToIp(maskInt),
    maskHex: intToHex(maskInt),
    wildcardInt,
    wildcardStr: intToIp(wildcardInt),
    wildcardHex: intToHex(wildcardInt),
    networkInt,
    networkStr: intToIp(networkInt),
    networkHex: intToHex(networkInt),
    broadcastInt,
    broadcastStr: intToIp(broadcastInt),
    broadcastHex: intToHex(broadcastInt),
    firstHostStr: intToIp(firstHostInt),
    lastHostStr: intToIp(lastHostInt),
    totalIps,
    usableHosts,
    ipClass,
    scope
  };
}

function performFullCalculation() {
  const validation = validateIPv4Input(state.ip, state.cidr);
  if (!validation.valid) return null;

  const ipInt = ipToInt(validation.ip);
  const baseNet = calculateSingleNetwork(ipInt, state.cidr);

  let newCidr = state.cidr;
  let divisionActive = false;
  let divisionError = null;

  if (state.divMode === 'subnets') {
    const desiredSubnets = Math.max(1, Number(state.targetSubnets) || 1);
    const borrowedBits = Math.ceil(Math.log2(desiredSubnets));
    newCidr = state.cidr + borrowedBits;
    if (newCidr > 32) {
      divisionError = `Não é possível criar ${desiredSubnets} sub-redes a partir de /${state.cidr}.`;
      newCidr = state.cidr;
    } else if (borrowedBits > 0) {
      divisionActive = true;
    }
  } else if (state.divMode === 'hosts') {
    const desiredHosts = Math.max(1, Number(state.targetHosts) || 1);
    let hostBits = 0;
    if (desiredHosts === 1) {
      hostBits = 0; // /32
    } else if (desiredHosts === 2) {
      hostBits = 2; // /30 (2 hosts úteis padrão)
    } else {
      hostBits = Math.ceil(Math.log2(desiredHosts + 2));
    }
    newCidr = 32 - hostBits;
    if (newCidr < state.cidr) {
      divisionError = `A rede /${state.cidr} não comporta ${desiredHosts.toLocaleString('pt-BR')} hosts por sub-rede.`;
      newCidr = state.cidr;
    } else if (newCidr > state.cidr) {
      divisionActive = true;
    }
  }

  const totalSubnets = divisionActive ? Math.pow(2, newCidr - state.cidr) : 1;
  const subnetSize = Math.pow(2, 32 - newCidr);

  const result = {
    timestamp: new Date().toISOString(),
    baseNet,
    divisionActive,
    divisionError,
    divMode: state.divMode,
    newCidr,
    newMaskStr: intToIp(cidrToMaskInt(newCidr)),
    totalSubnets,
    subnetSize,
    hostsPerSubnet: newCidr === 32 ? 1 : (newCidr === 31 ? 2 : Math.max(0, subnetSize - 2))
  };

  state.lastCalculation = result;
  return result;
}

/* Gera sob demanda a sub-rede de índice `index` */
function getSubnetByIndex(baseNetworkInt, newCidr, index) {
  const step = Math.pow(2, 32 - newCidr);
  const subNetInt = (baseNetworkInt + index * step) >>> 0;
  return calculateSingleNetwork(subNetInt, newCidr);
}

/* -------------------------------------------------------------------
 * 3. PLANEJADOR VLSM COMPLETO
 * ------------------------------------------------------------------- */
function hostsToVlsmCidr(requiredHosts) {
  const req = Math.max(1, Math.floor(Number(requiredHosts) || 1));
  if (req === 1) return 32;
  if (req === 2) return 30; // Reserva rede e broadcast por padrão
  const hostBits = Math.ceil(Math.log2(req + 2));
  return Math.max(0, 32 - hostBits);
}

function computeVlsmPlan() {
  const val = validateIPv4Input(state.vlsm.baseIp, state.vlsm.baseCidr);
  const errEl = document.getElementById('vlsm-base-error');
  const overflowEl = document.getElementById('vlsm-overflow-alert');

  if (!val.valid) {
    errEl.textContent = val.message;
    errEl.classList.remove('hidden');
    return null;
  }
  errEl.classList.add('hidden');

  const baseNet = calculateSingleNetwork(ipToInt(val.ip), state.vlsm.baseCidr);
  document.getElementById('vlsm-aligned-network').textContent = `${baseNet.networkStr}/${baseNet.cidr} (${baseNet.totalIps.toLocaleString('pt-BR')} endereços)`;

  // Ordenação decrescente por tamanho de bloco (demanda de hosts)
  const sortedReqs = state.vlsm.subnets
    .map((item, originalIndex) => {
      const reqHosts = Math.max(1, Math.floor(Number(item.hosts) || 1));
      const neededCidr = hostsToVlsmCidr(reqHosts);
      const blockSize = Math.pow(2, 32 - neededCidr);
      return {
        ...item,
        originalIndex,
        reqHosts,
        neededCidr,
        blockSize
      };
    })
    .sort((a, b) => b.blockSize - a.blockSize || b.reqHosts - a.reqHosts);

  let pointer = baseNet.networkInt >>> 0;
  const baseEnd = (baseNet.networkInt + baseNet.totalIps); // Pode atingir 2^32 em /0
  let totalAllocatedIps = 0;
  let hasOverflow = false;
  const allocatedRows = [];

  for (const req of sortedReqs) {
    const step = req.blockSize;
    // Alinhamento estrito ao limite do bloco (múltiplo de step)
    const remainder = pointer % step;
    if (remainder !== 0) {
      pointer = (pointer + (step - remainder)) >>> 0;
    }

    const fitsInBase = req.neededCidr >= baseNet.cidr && (pointer + step) <= baseEnd;
    if (!fitsInBase) {
      hasOverflow = true;
      allocatedRows.push({
        ...req,
        overflow: true,
        net: null,
        utilization: 0
      });
      continue;
    }

    const netInfo = calculateSingleNetwork(pointer >>> 0, req.neededCidr);
    const utilization = netInfo.usableHosts > 0 ? Math.min(100, Math.round((req.reqHosts / netInfo.usableHosts) * 100)) : 100;

    allocatedRows.push({
      ...req,
      overflow: false,
      net: netInfo,
      utilization
    });

    totalAllocatedIps += step;
    pointer = (pointer + step) >>> 0;
  }

  const freeIps = Math.max(0, baseNet.totalIps - totalAllocatedIps);
  const efficiencyPct = baseNet.totalIps > 0 ? ((totalAllocatedIps / baseNet.totalIps) * 100).toFixed(1).replace('.0', '') : '0';

  document.getElementById('vlsm-stat-total').textContent = baseNet.totalIps.toLocaleString('pt-BR');
  document.getElementById('vlsm-stat-allocated').textContent = totalAllocatedIps.toLocaleString('pt-BR');
  document.getElementById('vlsm-stat-free').textContent = freeIps.toLocaleString('pt-BR');
  document.getElementById('vlsm-stat-efficiency').textContent = `${efficiencyPct}%`;

  if (hasOverflow) {
    overflowEl.textContent = `Atenção: Uma ou mais sub-redes excedem a capacidade da rede base ${baseNet.networkStr}/${baseNet.cidr}. Reduza a demanda ou amplie o prefixo base.`;
    overflowEl.classList.remove('hidden');
  } else {
    overflowEl.classList.add('hidden');
  }

  const tbody = document.getElementById('vlsm-results-tbody');
  if (allocatedRows.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-6 text-center text-slate-400 font-sans">Adicione ao menos uma sub-rede para calcular o plano VLSM.</td></tr>`;
  } else {
    tbody.innerHTML = allocatedRows.map(row => {
      if (row.overflow) {
        return `
          <tr class="bg-rose-50/70 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300">
            <td class="py-2.5 px-3 font-sans font-semibold">${escapeHtml(row.name || 'Sub-rede')}</td>
            <td class="py-2.5 px-3">${row.reqHosts} / -</td>
            <td colspan="5" class="py-2.5 px-3 font-sans text-xs">Capacidade insuficiente no bloco base (requer /${row.neededCidr})</td>
          </tr>
        `;
      }
      const n = row.net;
      return `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
          <td class="py-2.5 px-3 font-sans font-semibold text-slate-800 dark:text-slate-200">${escapeHtml(row.name || 'Sub-rede')}</td>
          <td class="py-2.5 px-3 whitespace-nowrap">${row.reqHosts} / <span class="text-emerald-600 dark:text-emerald-400 font-semibold">${n.usableHosts}</span></td>
          <td class="py-2.5 px-3 font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">${n.networkStr}/${n.cidr}</td>
          <td class="py-2.5 px-3 whitespace-nowrap">${n.maskStr}</td>
          <td class="py-2.5 px-3 whitespace-nowrap">${n.firstHostStr} - ${n.lastHostStr}</td>
          <td class="py-2.5 px-3 text-amber-600 dark:text-amber-400 whitespace-nowrap">${n.broadcastStr}</td>
          <td class="py-2.5 px-3 text-right font-semibold">${row.utilization}%</td>
        </tr>
      `;
    }).join('');
  }

  state.vlsm.lastPlan = { baseNet, rows: allocatedRows, totalAllocatedIps, freeIps, efficiencyPct };
  return state.vlsm.lastPlan;
}

function renderVlsmInputs() {
  const container = document.getElementById('vlsm-inputs-list');
  container.innerHTML = state.vlsm.subnets.map((item, idx) => `
    <div class="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
      <span class="text-xs font-mono font-bold text-slate-400 w-5 text-center">${idx + 1}</span>
      <input type="text" data-vlsm-name="${item.id}" value="${escapeHtml(item.name)}" placeholder="Nome da sub-rede" class="flex-1 min-w-0 text-xs font-medium px-2.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-blue-600 focus:outline-none">
      <input type="number" data-vlsm-hosts="${item.id}" min="1" value="${item.hosts}" placeholder="Hosts" class="w-24 font-mono text-xs font-semibold px-2.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-blue-600 focus:outline-none">
      <button type="button" data-vlsm-remove="${item.id}" title="Remover sub-rede" class="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-800 transition">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
    </div>
  `).join('');
  computeVlsmPlan();
}

function exportVlsmCSV() {
  const plan = computeVlsmPlan();
  if (!plan) {
    showToast('Corrija a rede base do VLSM antes de exportar.', 'error');
    return;
  }
  const rows = [
    ['Sub_rede', 'Hosts_Requisitados', 'Hosts_Disponiveis', 'Rede', 'CIDR', 'Mascara', 'Primeiro_Host', 'Ultimo_Host', 'Broadcast', 'Utilizacao_Pct']
  ];

  plan.rows.forEach(r => {
    if (r.overflow || !r.net) {
      rows.push([r.name, r.reqHosts, 0, 'EXCEDE_CAPACIDADE', `/${r.neededCidr}`, '-', '-', '-', '-', '0%']);
    } else {
      const n = r.net;
      rows.push([r.name, r.reqHosts, n.usableHosts, n.networkStr, `/${n.cidr}`, n.maskStr, n.firstHostStr, n.lastHostStr, n.broadcastStr, `${r.utilization}%`]);
    }
  });

  rows.push([]);
  rows.push(['Resumo_Rede_Base', `${plan.baseNet.networkStr}/${plan.baseNet.cidr}`, 'Total_IPs', plan.baseNet.totalIps, 'Alocados', plan.totalAllocatedIps, 'Livres', plan.freeIps, 'Aproveitamento', `${plan.efficiencyPct}%`]);

  const csvContent = '﻿' + rows.map(r => r.join(';')).join('\n');
  const safeName = state.projectName.replace(/[^a-z0-9_-]/gi, '_').toLowerCase() || 'planejamento';
  downloadFile(`${safeName}_vlsm.csv`, csvContent, 'text/csv;charset=utf-8;');
  showToast('Plano VLSM exportado em CSV!');
}

/* -------------------------------------------------------------------
 * 4. TABELA DE REFERÊNCIA CIDR (/0 A /32)
 * ------------------------------------------------------------------- */
function renderCidrReferenceTable(filter = '') {
  const tbody = document.getElementById('cidr-reference-tbody');
  const q = filter.trim().toLowerCase();
  const rows = [];

  for (let c = 0; c <= 32; c++) {
    const maskInt = cidrToMaskInt(c);
    const wildInt = (~maskInt) >>> 0;
    const maskStr = intToIp(maskInt);
    const wildStr = intToIp(wildInt);
    const hexStr = intToHex(maskInt);
    const totalIps = Math.pow(2, 32 - c);
    const usable = c === 32 ? 1 : (c === 31 ? 2 : Math.max(0, totalIps - 2));

    if (q && !`/${c}`.includes(q) && !maskStr.includes(q) && !wildStr.includes(q) && !hexStr.toLowerCase().includes(q)) {
      continue;
    }

    rows.push(`
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
        <td class="py-2.5 px-3 font-bold text-blue-600 dark:text-blue-400">/${c}</td>
        <td class="py-2.5 px-3">${maskStr}</td>
        <td class="py-2.5 px-3 text-slate-500 dark:text-slate-400">${wildStr}</td>
        <td class="py-2.5 px-3 text-slate-500 dark:text-slate-400">${hexStr}</td>
        <td class="py-2.5 px-3 text-right">${totalIps.toLocaleString('pt-BR')}</td>
        <td class="py-2.5 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">${usable.toLocaleString('pt-BR')}</td>
        <td class="py-2.5 px-3 text-right font-sans">
          <button type="button" data-apply-cidr="${c}" class="btn-apply-cidr px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-600 hover:text-white text-blue-600 dark:text-blue-300 text-xs font-semibold transition">
            Usar
          </button>
        </td>
      </tr>
    `);
  }

  tbody.innerHTML = rows.length ? rows.join('') : `<tr><td colspan="7" class="py-6 text-center text-slate-400 font-sans">Nenhum prefixo CIDR encontrado.</td></tr>`;
}
