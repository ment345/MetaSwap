const state = {
  connected: false,
  walletType: null,
  address: null,
  email: null,
  phone: null,
  twoFA: false,
  balances: {
    TON: 0,
    USDT: 0
  },
  kycStatus: 'Not started',
  tickets: [],
  history: [],
  operations: [],
  pendingWithdrawals: 0,
  pendingSwaps: 0,
  kycEvents: 0
};

const rateState = {
  price: 2.15,
  delta: 0.6,
  volume: 1.28,
  trades: 8294
};

const elements = {
  connectBtn: document.querySelector('#connectBtn'),
  loginBtn: document.querySelector('#loginBtn'),
  walletButtons: document.querySelectorAll('[data-wallet]'),
  walletStatus: document.querySelector('#walletStatus'),
  walletLabel: document.querySelector('#walletLabel'),
  profileAddress: document.querySelector('#profileAddress'),
  profileEmail: document.querySelector('#profileEmail'),
  profilePhone: document.querySelector('#profilePhone'),
  profile2fa: document.querySelector('#profile2fa'),
  balanceTon: document.querySelector('#balanceTon'),
  balanceUsdt: document.querySelector('#balanceUsdt'),
  activityFeed: document.querySelector('#activityFeed'),
  historyTable: document.querySelector('#historyTable'),
  adminOps: document.querySelector('#adminOps'),
  adminUsers: document.querySelector('#adminUsers'),
  adminWithdrawals: document.querySelector('#adminWithdrawals'),
  adminPendingSwaps: document.querySelector('#adminPendingSwaps'),
  adminKyc: document.querySelector('#adminKyc'),
  depositAddress: document.querySelector('#depositAddress'),
  opStatus: document.querySelector('#opStatus'),
  opProgress: document.querySelector('#opProgress'),
  opType: document.querySelector('#opType'),
  opFrom: document.querySelector('#opFrom'),
  opTo: document.querySelector('#opTo'),
  kycBadge: document.querySelector('#kycBadge'),
  kycStatusText: document.querySelector('#kycStatusText'),
  rateValue: document.querySelector('#rateValue'),
  rateDelta: document.querySelector('#rateDelta'),
  volumeValue: document.querySelector('#volumeValue'),
  tradesValue: document.querySelector('#tradesValue'),
  feeValue: document.querySelector('#feeValue'),
  ticketList: document.querySelector('#ticketList'),
  swapQuote: document.querySelector('#swapQuote')
};

document.querySelectorAll('[data-open]').forEach((trigger) => {
  trigger.addEventListener('click', () => openModal(trigger.dataset.open));
});

document.querySelectorAll('[data-close]').forEach((trigger) => {
  trigger.addEventListener('click', () => closeModal(trigger.closest('.modal')));
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    document.querySelectorAll('.modal').forEach((modal) => modal.classList.add('hidden'));
  }
});

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('hidden');
  }
}

function closeModal(modal) {
  if (modal) {
    modal.classList.add('hidden');
  }
}

function randomTonAddress() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let body = '';
  for (let i = 0; i < 46; i += 1) {
    body += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `EQ${body}`;
}

function pushHistory(entry) {
  state.history.unshift({ ...entry, timestamp: new Date() });
  state.history = state.history.slice(0, 15);
}

function pushActivity(message) {
  const item = document.createElement('li');
  const title = document.createElement('strong');
  title.textContent = message.title;
  const meta = document.createElement('small');
  meta.textContent = message.subtitle;
  item.append(title, meta);
  elements.activityFeed.prepend(item);
  if (elements.activityFeed.childElementCount > 10) {
    elements.activityFeed.removeChild(elements.activityFeed.lastElementChild);
  }
}

function formatDate(date) {
  return date.toLocaleString('ru-RU', {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function updateHistoryTable() {
  elements.historyTable.innerHTML = '';
  state.history.forEach((entry) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${formatDate(entry.timestamp)}</td>
      <td>${entry.type}</td>
      <td>${entry.details}</td>
      <td>${entry.status}</td>
    `;
    elements.historyTable.appendChild(row);
  });
}

function updateAdminOps() {
  elements.adminOps.innerHTML = '';
  state.operations.slice(0, 8).forEach((entry) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${entry.type}</td>
      <td>${entry.amount}</td>
      <td>${entry.status}</td>
      <td>${formatDate(entry.timestamp)}</td>
    `;
    elements.adminOps.appendChild(row);
  });
}

function updateAdminMetrics() {
  elements.adminUsers.textContent = state.connected ? 1 : 0;
  elements.adminWithdrawals.textContent = state.pendingWithdrawals;
  elements.adminPendingSwaps.textContent = state.pendingSwaps;
  elements.adminKyc.textContent = state.kycEvents;
}

function updateProfile() {
  elements.profileAddress.textContent = state.address ?? '—';
  elements.profileEmail.textContent = state.email ?? '—';
  elements.profilePhone.textContent = state.phone ?? '—';
  elements.profile2fa.textContent = state.twoFA ? 'Включена' : 'Отключена';
  elements.walletLabel.textContent = state.connected
    ? `${state.walletType ?? 'Wallet'} подключён`
    : 'Без кошелька';
  elements.walletLabel.classList.toggle('status-pill--success', state.connected);
  elements.walletStatus.textContent = state.connected
    ? `Подключен ${state.walletType ?? 'wallet'} — ${state.address}`
    : 'Кошелёк не подключён.';
  elements.balanceTon.textContent = state.balances.TON.toFixed(4);
  elements.balanceUsdt.textContent = state.balances.USDT.toFixed(2);

  elements.connectBtn.textContent = state.connected ? 'Сменить кошелёк' : 'Connect Wallet';
}

function updateKyc() {
  elements.kycBadge.textContent = `KYC: ${state.kycStatus}`;
  elements.kycBadge.classList.remove('status-pill--pending', 'status-pill--danger', 'status-pill--success');
  if (state.kycStatus === 'Verified') {
    elements.kycBadge.classList.add('status-pill--success');
  } else if (state.kycStatus === 'Pending') {
    elements.kycBadge.classList.add('status-pill--pending');
  } else if (state.kycStatus === 'Rejected') {
    elements.kycBadge.classList.add('status-pill--danger');
  }
  elements.kycStatusText.textContent = `Текущий статус: ${state.kycStatus}.`;
}

function updateRateCards() {
  elements.rateValue.textContent = `1 TON = ${rateState.price.toFixed(2)} USDT`;
  const sign = rateState.delta >= 0 ? '+' : '-';
  elements.rateDelta.textContent = `${sign}${Math.abs(rateState.delta).toFixed(2)}% за 24ч`;
  elements.volumeValue.textContent = `$${rateState.volume.toFixed(2)}M`;
  elements.tradesValue.textContent = rateState.trades.toLocaleString('ru-RU');
  elements.feeValue.textContent = '0.8% + 1.5 USDT';
}

function updateSwapQuote(amountTon) {
  const gross = amountTon * rateState.price;
  const fee = gross * 0.008 + 1.5;
  const net = Math.max(gross - fee, 0);
  elements.swapQuote.textContent = `${net.toFixed(2)} USDT`;
  return { gross, fee, net };
}

function simulateOperation({ type, from, to, duration = 3000 }) {
  elements.opStatus.textContent = 'Выполняется';
  elements.opStatus.classList.remove('status-pill--idle');
  elements.opStatus.classList.add('status-pill--pending');
  elements.opType.textContent = type;
  elements.opFrom.textContent = from;
  elements.opTo.textContent = to;
  elements.opProgress.style.width = '0%';

  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    elements.opProgress.style.width = `${progress * 100}%`;
    elements.opProgress.setAttribute('aria-valuenow', Math.floor(progress * 100));
    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      elements.opStatus.textContent = 'Завершено';
      elements.opStatus.classList.remove('status-pill--pending');
      elements.opStatus.classList.add('status-pill--success');
      setTimeout(() => {
        elements.opStatus.textContent = 'Ожидание';
        elements.opStatus.classList.remove('status-pill--success');
        elements.opStatus.classList.add('status-pill--idle');
        elements.opType.textContent = '—';
        elements.opFrom.textContent = '—';
        elements.opTo.textContent = '—';
        elements.opProgress.style.width = '0%';
        elements.opProgress.setAttribute('aria-valuenow', 0);
      }, 3000);
    }
  }
  requestAnimationFrame(tick);
}

function connectWallet(type) {
  state.connected = true;
  state.walletType = type;
  state.address = randomTonAddress();
  state.balances.TON = +(Math.random() * 120 + 25).toFixed(4);
  state.balances.USDT = +(Math.random() * 2500 + 200).toFixed(2);
  pushHistory({
    type: 'Wallet',
    details: `Подключён ${type}`,
    status: 'Success'
  });
  pushActivity({
    title: 'Кошелёк подключён',
    subtitle: `${type} — ${state.address}`
  });
  state.operations.unshift({
    type: 'Wallet connect',
    amount: '—',
    status: 'Success',
    timestamp: new Date()
  });
  updateProfile();
  updateHistoryTable();
  updateAdminOps();
  updateAdminMetrics();
  closeModal(document.getElementById('wallet-modal'));
}

elements.walletButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const type = button.dataset.wallet;
    connectWallet(type);
  });
});

elements.connectBtn.addEventListener('click', () => {
  openModal('wallet-modal');
});

elements.loginBtn.addEventListener('click', () => {
  openModal('login-modal');
});

document.getElementById('profileForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  state.email = formData.get('email');
  state.phone = formData.get('phone') || null;
  state.twoFA = Boolean(formData.get('twofa'));
  pushActivity({
    title: 'Профиль обновлён',
    subtitle: `${state.email ?? 'без email'}, 2FA: ${state.twoFA ? 'вкл' : 'выкл'}`
  });
  pushHistory({
    type: 'Profile',
    details: 'Обновление профиля',
    status: 'Success'
  });
  state.operations.unshift({
    type: 'Profile update',
    amount: '—',
    status: 'Success',
    timestamp: new Date()
  });
  updateProfile();
  updateHistoryTable();
  updateAdminOps();
  closeModal(document.getElementById('profile-modal'));
});

document.getElementById('generateDeposit').addEventListener('click', () => {
  if (!state.connected) {
    elements.depositAddress.textContent = 'Подключите кошелёк для генерации адреса';
    return;
  }
  const address = `${state.address.slice(0, 8)}:${Math.random().toString(36).slice(2, 10)}`;
  elements.depositAddress.textContent = address;
  pushActivity({
    title: 'Сгенерирован депозитный адрес',
    subtitle: address
  });
  pushHistory({
    type: 'Deposit address',
    details: address,
    status: 'Issued'
  });
  state.operations.unshift({
    type: 'Deposit address',
    amount: '—',
    status: 'Issued',
    timestamp: new Date()
  });
  updateHistoryTable();
  updateAdminOps();
});

document.getElementById('copyDeposit').addEventListener('click', async () => {
  const address = elements.depositAddress.textContent;
  if (!address || address === '—') return;
  try {
    await navigator.clipboard.writeText(address);
    pushActivity({ title: 'Адрес скопирован', subtitle: address });
  } catch (error) {
    console.error('Clipboard error', error);
  }
});

const swapForm = document.getElementById('swapForm');

swapForm.addEventListener('input', (event) => {
  if (event.target.name === 'amount') {
    const amount = Number(event.target.value) || 0;
    updateSwapQuote(amount);
  }
});

swapForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const amountTon = Number(formData.get('amount'));
  if (!state.connected) {
    pushActivity({ title: 'Swap невозможен', subtitle: 'Подключите кошелёк' });
    return;
  }
  if (Number.isNaN(amountTon) || amountTon <= 0) {
    pushActivity({ title: 'Swap отклонён', subtitle: 'Некорректная сумма' });
    return;
  }
  if (amountTon > state.balances.TON) {
    pushActivity({ title: 'Недостаточно TON', subtitle: 'Пополните баланс' });
    return;
  }

  const { net, fee } = updateSwapQuote(amountTon);
  state.balances.TON -= amountTon;
  state.balances.USDT += net;
  state.pendingSwaps += 1;
  state.operations.unshift({
    type: 'Swap',
    amount: `${amountTon} TON → ${net.toFixed(2)} USDT`,
    status: 'Pending',
    timestamp: new Date()
  });
  pushHistory({
    type: 'Swap',
    details: `${amountTon} TON, комиссия ${fee.toFixed(2)} USDT`,
    status: 'Pending'
  });
  pushActivity({
    title: 'Swap запущен',
    subtitle: `${amountTon} TON → ${net.toFixed(2)} USDT`
  });
  updateProfile();
  updateHistoryTable();
  updateAdminOps();
  updateAdminMetrics();
  simulateOperation({ type: 'Swap', from: `${amountTon} TON`, to: `${net.toFixed(2)} USDT` });

  setTimeout(() => {
    state.pendingSwaps = Math.max(state.pendingSwaps - 1, 0);
    const operation = state.operations.find((op) => op.status === 'Pending' && op.type === 'Swap');
    if (operation) operation.status = 'Completed';
    pushActivity({ title: 'Swap завершён', subtitle: `${net.toFixed(2)} USDT зачислено` });
    pushHistory({ type: 'Swap', details: `${amountTon} TON`, status: 'Completed' });
    updateHistoryTable();
    updateAdminOps();
    updateAdminMetrics();
  }, 3500);

  closeModal(document.getElementById('swap-modal'));
});

const withdrawForm = document.getElementById('withdrawForm');

withdrawForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const address = formData.get('address');
  const amount = Number(formData.get('amount'));
  if (!state.connected) {
    pushActivity({ title: 'Вывод невозможен', subtitle: 'Подключите кошелёк' });
    return;
  }
  if (state.kycStatus !== 'Verified') {
    pushActivity({ title: 'KYC требуется', subtitle: 'Пройдите верификацию для вывода' });
    return;
  }
  if (amount > state.balances.USDT) {
    pushActivity({ title: 'Недостаточно USDT', subtitle: 'Снизьте сумму или пополните баланс' });
    return;
  }

  state.pendingWithdrawals += 1;
  state.balances.USDT -= amount;
  state.operations.unshift({
    type: 'Withdraw',
    amount: `${amount.toFixed(2)} USDT`,
    status: 'Pending',
    timestamp: new Date()
  });
  pushHistory({
    type: 'Withdraw',
    details: `${amount.toFixed(2)} USDT → ${address.slice(0, 6)}...`,
    status: 'Pending'
  });
  pushActivity({
    title: 'Запрос на вывод',
    subtitle: `${amount.toFixed(2)} USDT → ${address.slice(0, 6)}...`
  });
  updateProfile();
  updateHistoryTable();
  updateAdminOps();
  updateAdminMetrics();
  simulateOperation({ type: 'Withdraw', from: `${amount.toFixed(2)} USDT`, to: address.slice(0, 12) });

  setTimeout(() => {
    state.pendingWithdrawals = Math.max(state.pendingWithdrawals - 1, 0);
    const operation = state.operations.find((op) => op.status === 'Pending' && op.type === 'Withdraw');
    if (operation) operation.status = 'Completed';
    pushActivity({ title: 'Вывод завершён', subtitle: `${amount.toFixed(2)} USDT отправлено` });
    pushHistory({ type: 'Withdraw', details: `${amount.toFixed(2)} USDT`, status: 'Completed' });
    updateHistoryTable();
    updateAdminOps();
    updateAdminMetrics();
  }, 4500);

  closeModal(document.getElementById('withdraw-modal'));
});

document.querySelectorAll('[data-kyc]').forEach((button) => {
  button.addEventListener('click', () => {
    const action = button.dataset.kyc;
    if (action === 'start') {
      state.kycStatus = 'Pending';
      pushActivity({ title: 'KYC начат', subtitle: 'Этап Basic' });
    } else if (action === 'submit') {
      state.kycStatus = 'Under review';
      pushActivity({ title: 'Документы отправлены', subtitle: 'Ожидает проверку' });
    } else if (action === 'verify') {
      state.kycStatus = 'Verified';
      pushActivity({ title: 'KYC подтверждён', subtitle: 'Доступен вывод' });
    } else if (action === 'reject') {
      state.kycStatus = 'Rejected';
      pushActivity({ title: 'KYC отклонён', subtitle: 'Запрошена доп. информация' });
    }
    state.kycEvents += 1;
    pushHistory({ type: 'KYC', details: action, status: state.kycStatus });
    state.operations.unshift({
      type: 'KYC',
      amount: '—',
      status: state.kycStatus,
      timestamp: new Date()
    });
    updateKyc();
    updateHistoryTable();
    updateAdminOps();
    updateAdminMetrics();
  });
});

const ticketForm = document.getElementById('ticketForm');

ticketForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const subject = formData.get('subject');
  const message = formData.get('message');
  if (!subject || !message) return;
  const ticket = {
    id: `T-${state.tickets.length + 1}`,
    subject,
    message,
    status: 'Open',
    createdAt: new Date()
  };
  state.tickets.unshift(ticket);
  renderTickets();
  pushActivity({ title: 'Создан тикет', subtitle: ticket.subject });
  pushHistory({ type: 'Ticket', details: ticket.subject, status: 'Open' });
  state.operations.unshift({
    type: 'Ticket',
    amount: '—',
    status: 'Open',
    timestamp: new Date()
  });
  updateHistoryTable();
  updateAdminOps();
  event.target.reset();
});

function renderTickets() {
  elements.ticketList.innerHTML = '';
  if (state.tickets.length === 0) {
    const empty = document.createElement('li');
    empty.textContent = 'Активных тикетов нет.';
    elements.ticketList.appendChild(empty);
    return;
  }
  state.tickets.forEach((ticket) => {
    const item = document.createElement('li');
    const title = document.createElement('strong');
    title.textContent = `${ticket.id} · ${ticket.subject}`;
    const message = document.createElement('p');
    message.textContent = ticket.message;
    const status = document.createElement('small');
    status.textContent = `${ticket.status} · ${formatDate(ticket.createdAt)}`;
    item.append(title, message, status);
    elements.ticketList.appendChild(item);
  });
}

const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  const email = formData.get('email');
  pushActivity({ title: 'Авторизация', subtitle: email });
  pushHistory({ type: 'Auth', details: email, status: 'Success' });
  state.operations.unshift({
    type: 'Auth',
    amount: '—',
    status: 'Success',
    timestamp: new Date()
  });
  state.email = email;
  updateProfile();
  updateHistoryTable();
  updateAdminOps();
  closeModal(document.getElementById('login-modal'));
});

function fluctuateRates() {
  const delta = (Math.random() - 0.5) * 0.06;
  rateState.price = Math.max(rateState.price + delta, 1.8);
  rateState.delta += delta * 10;
  rateState.volume = Math.max(rateState.volume + (Math.random() - 0.4) * 0.08, 0.95);
  rateState.trades += Math.floor(Math.random() * 30);
  updateRateCards();
}

setInterval(fluctuateRates, 10000);

function init() {
  updateProfile();
  updateKyc();
  updateHistoryTable();
  updateAdminOps();
  updateAdminMetrics();
  updateRateCards();
  renderTickets();
  updateSwapQuote(Number(swapForm.amount.value));
}

init();
