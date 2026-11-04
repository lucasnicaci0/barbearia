// ====== CONFIGURAÇÕES (edite aqui) ======
const ABRE = 9;            // hora de abertura
const FECHA = 19;          // hora de fechamento
const INTERVALO = 30;      // minutos entre horários
const BARBEIROS = ['Carlos', 'João'];
const SERVICOS = [
  { nome: 'Corte', preco: 40 },
  { nome: 'Barba', preco: 30 },
  { nome: 'Corte + Barba', preco: 65 }
];
// ========================================

const CAB_AG = ['Data', 'Hora', 'Barbeiro', 'Serviço', 'Nome', 'Telefone', 'Criado em', 'Email'];
const CAB_US = ['Email', 'Nome', 'Telefone', 'Salt', 'SenhaHash', 'Criado em'];

function aba_(nome, cab) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(nome);
  if (!sh) {
    sh = ss.insertSheet(nome);
    sh.appendRow(cab);
    sh.setFrozenRows(1);
  }
  if (!sh.getRange(1, cab.length).getValue()) sh.getRange(1, cab.length).setValue(cab[cab.length - 1]);
  return sh;
}
const ag_ = () => aba_('Agendamentos', CAB_AG);
const us_ = () => aba_('Usuarios', CAB_US);

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
const erro_ = (msg, extra) => json_(Object.assign({ ok: false, erro: msg }, extra || {}));

function horarios_() {
  const lista = [];
  for (let m = ABRE * 60; m < FECHA * 60; m += INTERVALO) {
    lista.push(String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'));
  }
  return lista;
}
const hoje_ = () => Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

function ocupados_(data, barbeiro) {
  return ag_().getDataRange().getValues().slice(1)
    .filter(l => String(l[0]) === data && l[2] === barbeiro)
    .map(l => String(l[1]));
}

// ---------- Segurança: senha com hash e sessão assinada ----------
function hex_(bytes) {
  return bytes.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}
function hash_(senha, salt) {
  let h = salt + senha;
  for (let i = 0; i < 300; i++) {
    h = hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, h + salt));
  }
  return h;
}
function segredo_() {
  const p = PropertiesService.getScriptProperties();
  let s = p.getProperty('SEGREDO');
  if (!s) { s = Utilities.getUuid() + Utilities.getUuid(); p.setProperty('SEGREDO', s); }
  return s;
}
function assinar_(txt) {
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(txt, segredo_()));
}
function criarToken_(email) {
  const corpo = Utilities.base64EncodeWebSafe(email + '|' + (Date.now() + 30 * 24 * 3600 * 1000));
  return corpo + '.' + assinar_(corpo);
}
function validarToken_(token) {
  if (!token) return null;
  const partes = String(token).split('.');
  if (partes.length !== 2 || assinar_(partes[0]) !== partes[1]) return null;
  const txt = Utilities.newBlob(Utilities.base64DecodeWebSafe(partes[0])).getDataAsString().split('|');
  return Date.now() > Number(txt[1]) ? null : txt[0];
}

// ---------- Usuários ----------
function acharUsuario_(email) {
  const v = us_().getDataRange().getValues();
  for (let i = 1; i < v.length; i++) {
    if (String(v[i][0]).toLowerCase() === email) {
      return { nome: String(v[i][1]), telefone: String(v[i][2]), salt: String(v[i][3]), hash: String(v[i][4]) };
    }
  }
  return null;
}
function sessao_(email, u) {
  return json_({ ok: true, token: criarToken_(email), email: email, nome: u.nome, telefone: u.telefone });
}

function registrar_(d) {
  const email = String(d.email || '').trim().toLowerCase();
  const nome = String(d.nome || '').trim().slice(0, 80);
  const tel = String(d.telefone || '').trim().slice(0, 20);
  const senha = String(d.senha || '');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return erro_('E-mail inválido.');
  if (!nome || !tel) return erro_('Preencha nome e telefone.');
  if (senha.length < 6) return erro_('A senha precisa ter pelo menos 6 caracteres.');
  if (acharUsuario_(email)) return erro_('Já existe uma conta com esse e-mail.');
  const salt = Utilities.getUuid();
  const sh = us_();
  const faixa = sh.getRange(sh.getLastRow() + 1, 1, 1, 6);
  faixa.setNumberFormat('@');
  faixa.setValues([[email, nome, tel, salt, hash_(senha, salt), new Date().toLocaleString('pt-BR')]]);
  return sessao_(email, { nome: nome, telefone: tel });
}

function entrar_(d) {
  const email = String(d.email || '').trim().toLowerCase();
  const cache = CacheService.getScriptCache();
  const chave = 'tent_' + email;
  const n = Number(cache.get(chave) || 0);
  if (n >= 5) return erro_('Muitas tentativas. Aguarde 10 minutos e tente de novo.');
  const u = acharUsuario_(email);
  if (!u || hash_(String(d.senha || ''), u.salt) !== u.hash) {
    cache.put(chave, String(n + 1), 600);
    return erro_('E-mail ou senha incorretos.');
  }
  cache.remove(chave);
  return sessao_(email, u);
}

// ---------- Agendamentos ----------
function agendar_(d, email) {
  const u = acharUsuario_(email);
  if (!u) return erro_('Conta não encontrada.', { expirada: true });
  const okServ = SERVICOS.some(s => s.nome === d.servico);
  if (!okServ || BARBEIROS.indexOf(d.barbeiro) === -1) return erro_('Serviço ou barbeiro inválido.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.data || '') || d.data < hoje_()) return erro_('Escolha uma data válida.');
  if (horarios_().indexOf(d.hora) === -1) return erro_('Horário inválido.');
  if (ocupados_(d.data, d.barbeiro).indexOf(d.hora) !== -1) {
    return erro_('Esse horário acabou de ser ocupado. Escolha outro.');
  }
  const sh = ag_();
  const faixa = sh.getRange(sh.getLastRow() + 1, 1, 1, 8);
  faixa.setNumberFormat('@');
  faixa.setValues([[d.data, d.hora, d.barbeiro, d.servico, u.nome, u.telefone,
    new Date().toLocaleString('pt-BR'), email]]);
  return json_({ ok: true });
}

function meus_(email) {
  const lista = ag_().getDataRange().getValues().slice(1)
    .filter(l => String(l[7]).toLowerCase() === email && String(l[0]) >= hoje_())
    .map(l => ({ data: String(l[0]), hora: String(l[1]), barbeiro: String(l[2]), servico: String(l[3]) }))
    .sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));
  return json_({ ok: true, lista: lista });
}

function cancelar_(d, email) {
  const sh = ag_();
  const v = sh.getDataRange().getValues();
  for (let i = 1; i < v.length; i++) {
    if (String(v[i][0]) === d.data && String(v[i][1]) === d.hora && v[i][2] === d.barbeiro &&
        String(v[i][7]).toLowerCase() === email) {
      sh.deleteRow(i + 1);
      return json_({ ok: true });
    }
  }
  return erro_('Agendamento não encontrado.');
}

// ---------- Entradas da API ----------
function doGet(e) {
  const p = e.parameter;
  if (p.action === 'config') return json_({ barbeiros: BARBEIROS, servicos: SERVICOS });
  if (p.action === 'slots') {
    const usados = ocupados_(p.data, p.barbeiro);
    return json_({ livres: horarios_().filter(h => usados.indexOf(h) === -1) });
  }
  return json_({ erro: 'ação inválida' });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.action === 'registrar') return registrar_(d);
    if (d.action === 'entrar') return entrar_(d);
    const email = validarToken_(d.token);
    if (!email) return erro_('Sua sessão expirou. Entre novamente.', { expirada: true });
    if (d.action === 'agendar') return agendar_(d, email);
    if (d.action === 'meus') return meus_(email);
    if (d.action === 'cancelar') return cancelar_(d, email);
    return erro_('Ação inválida.');
  } catch (err) {
    return erro_('Erro no servidor. Tente novamente.');
  } finally {
    lock.releaseLock();
  }
}
