// =====================================================================
//  BARBEARIA — back-end (Google Apps Script) · versão 5 com Área privada
// =====================================================================
//  COMO CADASTRAR O E-MAIL DO DONO E DOS BARBEIROS (sem mexer em código):
//   1) Abra a planilha "Agendas Barbearia" e recarregue a página (F5).
//   2) No menu "Barbearia" (ao lado de Ajuda) escolha "Cadastrar e-mail do DONO"
//      ou "Cadastrar BARBEIRO" e responda as perguntas.
//   3) Quem foi cadastrado precisa criar conta no site com o MESMO e-mail.
//  Depois de entrar como dono, você também cadastra a equipe pelo site em
//  Área privada → Equipe. Serviços, preços, fotos, textos e horários também.
//  (A linha DONO_EMAIL abaixo é opcional: serve só como dono "de reserva".)
// =====================================================================

// OPCIONAL: e-mail de um dono de reserva, sempre com acesso total. Pode deixar assim e usar o menu da planilha.
const DONO_EMAIL = '';
const COMISSAO_PADRAO = 50;      // % de comissão usada quando o barbeiro não tem uma definida
const FUSO = 'America/Sao_Paulo';

// ---- Dados iniciais (só usados na PRIMEIRA vez, para preencher as abas) ----
const SEMENTE_SERVICOS = [
  ['Degradê', 45, 'tesoura', 'O corte mais pedido: baixo, médio ou alto.', 'sim', 'corte', 'sim'],
  ['Corte social', 35, 'tesoura', 'Clássico, alinhado e na régua.', 'não', 'corte', 'sim'],
  ['Barba', 30, 'navalha', 'Toalha quente, navalha e acabamento.', 'sim', 'barba', 'sim'],
  ['Corte + Barba', 70, 'navalha', 'Combo completo com desconto.', 'sim', 'corte', 'sim'],
  ['Sobrancelha', 15, 'pincel', 'Design na navalha, natural e alinhado.', 'não', 'outro', 'sim'],
  ['Pigmentação', 40, 'pincel', 'Preenche falhas na barba ou no cabelo.', 'não', 'quimica', 'sim'],
  ['Hidratação', 40, 'gota', 'Brilho e maciez para os fios.', 'não', 'quimica', 'sim'],
  ['Platinado / Luzes', 120, 'estrela', 'Descoloração e tonalização.', 'não', 'quimica', 'sim'],
  ['Pezinho / Acabamento', 15, 'tesoura', 'Retoque rápido entre um corte e outro.', 'não', 'corte', 'sim'],
  ['Corte infantil', 35, 'crianca', 'Para os pequenos, com todo o cuidado.', 'não', 'corte', 'sim']
];
const CFG_PADRAO = {
  nome: 'Barbearia', slogan: 'Corte e barba, do jeito certo.',
  heroTitulo: 'Corte na régua, barba na navalha.',
  heroTexto: 'Veja os horários livres e marque em menos de um minuto.',
  whatsapp: '5561999999999', instagram: 'suabarbearia',
  endereco: 'Quadra 11 Lote 1 Casa B - Mansões Odisséia, Águas Lindas de Goiás - GO, 72927-185',
  regiao: 'Mansões Odisséia', lat: '', lon: '',
  abre: '9', fecha: '19', intervalo: '30', diasFechados: '0', diasAFrente: '14',
  corBotao: '#b4491f', corMadeira: '#4d2f1a', ceu: 'entardecer', fotoHero: ''
};
const ICONES = ['tesoura', 'navalha', 'gota', 'estrela', 'crianca', 'pincel'];
const CATEGORIAS = ['corte', 'barba', 'quimica', 'outro'];
const CEUS = ['entardecer', 'noite', 'dia', 'madrugada'];

// ---- Cabeçalhos das abas ----
const CAB_AG = ['Data', 'Hora', 'Barbeiro', 'Serviço', 'Nome', 'Telefone', 'Criado em', 'Email', 'Status'];
const CAB_US = ['Email', 'Nome', 'Telefone', 'Salt', 'SenhaHash', 'Criado em'];
const CAB_FB = ['Data', 'Nome', 'Nota', 'Comentário', 'Email'];
const CAB_SV = ['Nome', 'Preço', 'Ícone', 'Descrição', 'Destaque', 'Categoria', 'Ativo'];
const CAB_EQ = ['Email', 'Nome', 'Papel', 'Comissão %', 'Atende', 'Cursos', 'Observação', 'Ativo'];
const CAB_FT = ['Id', 'FileId', 'Título', 'Descrição', 'Serviço', 'Ordem', 'Criado em'];
const CAB_CF = ['Chave', 'Valor'];
const CAB_VD = ['Data', 'Hora', 'Barbeiro', 'Serviço', 'Categoria', 'Cliente', 'Telefone', 'Valor', 'Comissão %',
  'Comissão R$', 'Lucro R$', 'Lucro %', 'Origem', 'Concluído em', 'Por', 'Chave'];
const FMT_TXT = n => Array(n).fill('@');

function aba_(nome, cab, semente) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(nome);
  if (!sh) {
    sh = ss.insertSheet(nome);
    sh.appendRow(cab);
    sh.setFrozenRows(1);
    if (semente) semente(sh);
  }
  if (!sh.getRange(1, cab.length).getValue()) sh.getRange(1, cab.length).setValue(cab[cab.length - 1]);
  return sh;
}
function reescrever_(sh, cab, linhas, fmts) {
  const ult = sh.getLastRow();
  if (ult > 1) sh.getRange(2, 1, ult - 1, cab.length).clearContent();
  if (!linhas.length) return;
  const r = sh.getRange(2, 1, linhas.length, cab.length);
  r.setNumberFormats(linhas.map(() => fmts));
  r.setValues(linhas);
}
function acrescentar_(sh, cab, linha, fmts) {
  const r = sh.getRange(sh.getLastRow() + 1, 1, 1, cab.length);
  r.setNumberFormats([fmts]);
  r.setValues([linha]);
}

const ag_ = () => aba_('Agendamentos', CAB_AG);
const us_ = () => aba_('Usuarios', CAB_US);
const fb_ = () => aba_('Feedback', CAB_FB);
const vd_ = () => aba_('Vendas', CAB_VD);
const ft_ = () => aba_('Fotos', CAB_FT);
const cf_ = () => aba_('Config', CAB_CF, sh => reescrever_(sh, CAB_CF, Object.keys(CFG_PADRAO).map(k => [k, CFG_PADRAO[k]]), FMT_TXT(2)));
const sv_ = () => aba_('Servicos', CAB_SV, sh =>
  reescrever_(sh, CAB_SV, SEMENTE_SERVICOS, ['@', '0.##', '@', '@', '@', '@', '@']));
const eq_ = () => aba_('Equipe', CAB_EQ, sh => reescrever_(sh, CAB_EQ, [
  [emailOk_(DONO_EMAIL) ? DONO_EMAIL.trim().toLowerCase() : '', 'Dono', 'dono', 0, 'não', '', '', 'sim'],
  ['', 'Carlos', 'barbeiro', COMISSAO_PADRAO, 'sim', 'Curso de degradê e navalhado | Barboterapia profissional', 'Especialista em degradê e barba desenhada.', 'sim'],
  ['', 'João', 'barbeiro', COMISSAO_PADRAO, 'sim', 'Colorimetria masculina | Corte infantil', 'Atende crianças com paciência e capricho.', 'sim']
], ['@', '@', '@', '0.##', '@', '@', '@', '@']));

// evita que o Google Planilhas execute texto digitado como fórmula
const seguro_ = t => /^[=+\-@]/.test(String(t)) ? "'" + t : String(t);
const limpo_ = (t, max) => String(t == null ? '' : t).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max);
const emailOk_ = e => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(e || '').trim());
const sim_ = v => String(v).trim().toLowerCase() === 'sim';
const simnao_ = b => b ? 'sim' : 'não';

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
const erro_ = (msg, extra) => json_(Object.assign({ ok: false, erro: msg }, extra || {}));

// ---------- Configuração (lida da aba Config) ----------
let memoCfg_ = null;
function cfg_() {
  if (memoCfg_) return memoCfg_;
  const c = Object.assign({}, CFG_PADRAO);
  cf_().getDataRange().getValues().slice(1).forEach(l => { const k = String(l[0]); if (k in CFG_PADRAO) c[k] = String(l[1]); });
  memoCfg_ = c;
  return c;
}
const inteiro_ = (v, pad, min, max) => { const n = parseInt(v, 10); return isFinite(n) ? Math.min(max, Math.max(min, n)) : pad; };
function horario_() {
  const c = cfg_();
  const abre = inteiro_(c.abre, 9, 0, 23);
  let fecha = inteiro_(c.fecha, 19, 1, 24);
  if (fecha <= abre) fecha = Math.min(24, abre + 1);
  const intervalo = [10, 15, 20, 30, 45, 60].indexOf(inteiro_(c.intervalo, 30, 10, 60)) !== -1 ? inteiro_(c.intervalo, 30, 10, 60) : 30;
  const fechados = String(c.diasFechados).split(',').map(s => s.trim()).filter(s => /^[0-6]$/.test(s)).map(Number);
  return { abre: abre, fecha: fecha, intervalo: intervalo, fechados: fechados, dias: inteiro_(c.diasAFrente, 14, 1, 60) };
}

// ---------- Serviços e equipe ----------
function servicos_() {
  return sv_().getDataRange().getValues().slice(1).filter(l => String(l[0]).trim()).map(l => ({
    nome: String(l[0]), preco: Number(l[1]) || 0, icone: ICONES.indexOf(String(l[2])) !== -1 ? String(l[2]) : 'tesoura',
    desc: String(l[3]), destaque: sim_(l[4]), categoria: CATEGORIAS.indexOf(String(l[5])) !== -1 ? String(l[5]) : 'outro', ativo: sim_(l[6])
  }));
}
function equipe_() {
  return eq_().getDataRange().getValues().slice(1).filter(l => String(l[1]).trim()).map(l => ({
    email: String(l[0]).trim().toLowerCase(), nome: String(l[1]), papel: String(l[2]) === 'dono' ? 'dono' : 'barbeiro',
    comissao: l[3] === '' ? COMISSAO_PADRAO : Number(l[3]), atende: sim_(l[4]),
    cursos: String(l[5]).split('|').map(s => s.trim()).filter(Boolean), obs: String(l[6]), ativo: sim_(l[7])
  }));
}
const barbeiros_ = () => equipe_().filter(p => p.ativo && p.atende);
const nomesBarbeiros_ = () => barbeiros_().map(p => p.nome);

// Quem é essa conta? (dono, barbeiro ou ninguém). Sempre confirmado no servidor.
function quem_(email) {
  const dono = String(DONO_EMAIL).trim().toLowerCase();
  const m = equipe_().filter(p => p.ativo && p.email && p.email === email)[0];
  if (dono && email === dono) return { papel: 'dono', nome: m ? m.nome : 'Dono', email: email };
  return m ? { papel: m.papel, nome: m.nome, email: email } : null;
}
function comissaoDe_(nome) {
  const m = equipe_().filter(p => p.nome === nome)[0];
  return m && isFinite(m.comissao) ? m.comissao : COMISSAO_PADRAO;
}

// ---------- Fotos ----------
function fotos_() {
  return ft_().getDataRange().getValues().slice(1).filter(l => String(l[0]).trim()).map(l => ({
    id: String(l[0]), fileId: String(l[1]), titulo: String(l[2]), desc: String(l[3]), servico: String(l[4]), ordem: Number(l[5]) || 0
  })).sort((a, b) => a.ordem - b.ordem);
}
function pastaFotos_() {
  const p = PropertiesService.getScriptProperties();
  const id = p.getProperty('PASTA_FOTOS');
  if (id) { try { return DriveApp.getFolderById(id); } catch (e) {} }
  const f = DriveApp.createFolder('Barbearia - fotos do site');
  p.setProperty('PASTA_FOTOS', f.getId());
  return f;
}
// Recebe uma imagem JPEG (o site já reduz o tamanho) e devolve o id do arquivo no Drive
function salvarImagem_(dataUrl, nome) {
  const pre = 'data:image/jpeg;base64,', s = String(dataUrl || '');
  if (s.indexOf(pre) !== 0) return { erro: 'Imagem inválida. Use uma foto JPG ou PNG.' };
  const b64 = s.slice(pre.length);
  if (b64.length > 3000000) return { erro: 'Imagem muito grande. Escolha uma foto menor.' };
  let bytes;
  try { bytes = Utilities.base64Decode(b64); } catch (e) { return { erro: 'Imagem inválida.' }; }
  if (bytes.length < 200 || bytes[0] !== -1 || bytes[1] !== -40) return { erro: 'Imagem inválida.' };
  const arq = pastaFotos_().createFile(Utilities.newBlob(bytes, 'image/jpeg', nome + '.jpg'));
  arq.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { id: arq.getId() };
}
function lixeira_(fileId) {
  if (!/^[\w-]{10,80}$/.test(String(fileId))) return;
  try { DriveApp.getFileById(fileId).setTrashed(true); } catch (e) {}
}
// Rode esta função UMA vez no editor para autorizar o acesso ao Google Drive (fotos).
function autorizar() { pastaFotos_(); }

// ---------- Cache da configuração pública ----------
const limparCache_ = () => { memoCfg_ = null; CacheService.getScriptCache().remove('pub'); };
function publico_() {
  const cache = CacheService.getScriptCache();
  let txt = cache.get('pub');
  if (!txt) {
    const c = cfg_(), h = horario_();
    const site = {};
    Object.keys(CFG_PADRAO).forEach(k => { site[k] = c[k]; });
    delete site.abre; delete site.fecha; delete site.intervalo; delete site.diasFechados; delete site.diasAFrente;
    txt = JSON.stringify({
      barbeiros: barbeiros_().map(p => ({ nome: p.nome, cursos: p.cursos, obs: p.obs })),
      servicos: servicos_().filter(s => s.ativo).map(s => ({ nome: s.nome, preco: s.preco, icone: s.icone, desc: s.desc, destaque: s.destaque })),
      fotos: fotos_().map(f => ({ id: f.id, fileId: f.fileId, titulo: f.titulo, desc: f.desc, servico: f.servico })),
      site: site, diasFechados: h.fechados, dias: h.dias, abre: h.abre, fecha: h.fecha
    });
    try { cache.put('pub', txt, 300); } catch (e) {}
  }
  const o = JSON.parse(txt);
  o.hoje = hoje_();
  return o;
}

// ---------- Datas e horários ----------
const hoje_ = () => Utilities.formatDate(new Date(), FUSO, 'yyyy-MM-dd');
const agora_ = () => Utilities.formatDate(new Date(), FUSO, 'HH:mm');
const agoraBR_ = () => Utilities.formatDate(new Date(), FUSO, 'dd/MM/yyyy HH:mm:ss');
const isoOk_ = s => /^\d{4}-\d{2}-\d{2}$/.test(String(s || ''));
function partes_(iso) { return iso.split('-').map(Number); }
function somarDias_(iso, n) {
  const p = partes_(iso);
  return new Date(Date.UTC(p[0], p[1] - 1, p[2]) + n * 86400000).toISOString().slice(0, 10);
}
function diaSemana_(iso) {
  const p = partes_(iso);
  return new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay();
}
function diasEntre_(a, b) { return Math.round((Date.parse(b) - Date.parse(a)) / 86400000); }
function tzPlanilha_() { return SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(); }
// Se alguém editar a planilha e o Google converter texto em data/hora, ainda funciona:
function dataTxt_(v) { return v instanceof Date ? Utilities.formatDate(v, tzPlanilha_(), 'yyyy-MM-dd') : String(v).trim(); }
function horaTxt_(v) { return v instanceof Date ? Utilities.formatDate(v, tzPlanilha_(), 'HH:mm') : String(v).trim(); }

function horarios_() {
  const h = horario_(), lista = [];
  for (let m = h.abre * 60; m < h.fecha * 60; m += h.intervalo) {
    lista.push(String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'));
  }
  return lista;
}
function ocupados_(data, barbeiro) {
  return ag_().getDataRange().getValues().slice(1)
    .filter(l => dataTxt_(l[0]) === data && l[2] === barbeiro)
    .map(l => horaTxt_(l[1]));
}
// Fonte única da verdade: horários realmente livres (já tira passado, dia fechado e ocupados)
function slots_(data, barbeiro) {
  if (!isoOk_(data) || nomesBarbeiros_().indexOf(barbeiro) === -1) return [];
  const h = horario_(), hoje = hoje_();
  if (data < hoje || data > somarDias_(hoje, h.dias - 1)) return [];
  if (h.fechados.indexOf(diaSemana_(data)) !== -1) return [];
  const usados = ocupados_(data, barbeiro), agora = agora_();
  return horarios_().filter(x => usados.indexOf(x) === -1 && (data > hoje || x > agora));
}

// ---------- Segurança: senha com hash e sessão assinada ----------
function hex_(bytes) { return bytes.map(b => ('0' + (b & 0xff).toString(16)).slice(-2)).join(''); }
function hash_(senha, salt) {
  let h = salt + senha;
  for (let i = 0; i < 300; i++) h = hex_(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, h + salt));
  return h;
}
function segredo_() {
  const p = PropertiesService.getScriptProperties();
  let s = p.getProperty('SEGREDO');
  if (!s) { s = Utilities.getUuid() + Utilities.getUuid(); p.setProperty('SEGREDO', s); }
  return s;
}
function assinar_(txt) { return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(txt, segredo_())); }
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
  const q = quem_(email);
  return json_({ ok: true, token: criarToken_(email), email: email, nome: u.nome, telefone: u.telefone, papel: q ? q.papel : 'cliente' });
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
  acrescentar_(us_(), CAB_US, [email, seguro_(nome), seguro_(tel), salt, hash_(senha, salt), agoraBR_()], FMT_TXT(6));
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
function perfil_(email) {
  const u = acharUsuario_(email), q = quem_(email);
  if (!u) return erro_('Conta não encontrada.', { expirada: true });
  return json_({ ok: true, nome: u.nome, papel: q ? q.papel : 'cliente' });
}

// ---------- Agendamentos (cliente) ----------
function agendar_(d, email) {
  const u = acharUsuario_(email);
  if (!u) return erro_('Conta não encontrada.', { expirada: true });
  if (!servicos_().some(s => s.ativo && s.nome === d.servico)) return erro_('Serviço inválido.');
  if (slots_(d.data, d.barbeiro).indexOf(d.hora) === -1) return erro_('Esse horário não está mais disponível. Escolha outro.');
  acrescentar_(ag_(), CAB_AG, [d.data, d.hora, d.barbeiro, d.servico, u.nome, u.telefone, agoraBR_(), email, ''], FMT_TXT(9));
  return json_({ ok: true });
}
function meus_(email) {
  const hoje = hoje_();
  const lista = ag_().getDataRange().getValues().slice(1)
    .filter(l => String(l[7]).toLowerCase() === email && dataTxt_(l[0]) >= hoje && !String(l[8] || '').trim())
    .map(l => ({ data: dataTxt_(l[0]), hora: horaTxt_(l[1]), barbeiro: String(l[2]), servico: String(l[3]) }))
    .sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));
  return json_({ ok: true, lista: lista });
}
function cancelar_(d, email) {
  const sh = ag_(), v = sh.getDataRange().getValues();
  for (let i = 1; i < v.length; i++) {
    if (dataTxt_(v[i][0]) === d.data && horaTxt_(v[i][1]) === d.hora && v[i][2] === d.barbeiro &&
        String(v[i][7]).toLowerCase() === email && !String(v[i][8] || '').trim()) {
      sh.deleteRow(i + 1);
      return json_({ ok: true });
    }
  }
  return erro_('Agendamento não encontrado.');
}

// ---------- Feedback ----------
function enviarFeedback_(d, email) {
  const u = acharUsuario_(email);
  if (!u) return erro_('Conta não encontrada.', { expirada: true });
  const nota = Math.round(Number(d.nota));
  const texto = String(d.comentario || '').trim().slice(0, 300);
  if (!(nota >= 1 && nota <= 5)) return erro_('Escolha de 1 a 5 estrelas.');
  if (texto.length < 3) return erro_('Escreva um comentário.');
  const cache = CacheService.getScriptCache();
  if (cache.get('fb_' + email)) return erro_('Aguarde um minuto para enviar outro comentário.');
  acrescentar_(fb_(), CAB_FB, [agoraBR_(), seguro_(u.nome.split(' ')[0]), String(nota), seguro_(texto), email], FMT_TXT(5));
  cache.put('fb_' + email, '1', 60);
  return json_({ ok: true });
}
function listarFeedbacks_() {
  const v = fb_().getDataRange().getValues().slice(1);
  const notas = v.map(l => Number(l[2])).filter(n => n >= 1 && n <= 5);
  const media = notas.length ? Math.round(notas.reduce((a, b) => a + b, 0) / notas.length * 10) / 10 : 0;
  const lista = v.slice(-12).reverse().map(l => ({ data: String(l[0]).slice(0, 10), nome: String(l[1]), nota: Number(l[2]), texto: String(l[3]) }));
  return json_({ ok: true, lista: lista, media: media, total: notas.length });
}

// =====================================================================
//  ÁREA PRIVADA (dono e barbeiro) — toda ação confere o papel aqui no servidor
// =====================================================================
const r2_ = n => Math.round(n * 100) / 100;

// Agenda: barbeiro vê só os próprios clientes; dono vê todos
function adminAgenda_(d, q) {
  const hoje = hoje_();
  let de = isoOk_(d.de) ? d.de : hoje, ate = isoOk_(d.ate) ? d.ate : somarDias_(de, 7);
  if (ate < de) ate = de;
  if (diasEntre_(de, ate) > 62) ate = somarDias_(de, 62);
  const preco = {}; servicos_().forEach(s => { preco[s.nome] = s.preco; });
  const lista = ag_().getDataRange().getValues().slice(1)
    .filter(l => { const dt = dataTxt_(l[0]); return dt >= de && dt <= ate && (q.papel === 'dono' || String(l[2]) === q.nome); })
    .map(l => ({
      data: dataTxt_(l[0]), hora: horaTxt_(l[1]), barbeiro: String(l[2]), servico: String(l[3]), cliente: String(l[4]),
      telefone: String(l[5]), status: String(l[8] || '').trim(), valor: preco[String(l[3])] || 0
    }))
    .sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));
  return json_({ ok: true, de: de, ate: ate, hoje: hoje, lista: lista });
}

function registrarVenda_(o) {
  const com = comissaoDe_(o.barbeiro), valor = r2_(o.valor), vCom = r2_(valor * com / 100), lucro = r2_(valor - vCom);
  acrescentar_(vd_(), CAB_VD, [o.data, o.hora, o.barbeiro, seguro_(o.servico), o.categoria, seguro_(o.cliente || ''), seguro_(o.telefone || ''),
    valor, com, vCom, lucro, valor ? r2_(lucro / valor * 100) : 0, o.origem, agoraBR_(), o.por, o.chave],
    ['@', '@', '@', '@', '@', '@', '@', '0.00', '0.##', '0.00', '0.00', '0.##', '@', '@', '@', '@']);
}
const valorOk_ = v => { const n = Number(String(v).replace(',', '.')); return isFinite(n) && n >= 0 && n <= 99999 ? n : null; };

// Marca como concluído (vira venda) ou "faltou"
function adminConcluir_(d, q) {
  const status = d.status === 'faltou' ? 'faltou' : 'concluido';
  const sh = ag_(), v = sh.getDataRange().getValues();
  for (let i = 1; i < v.length; i++) {
    if (dataTxt_(v[i][0]) !== d.data || horaTxt_(v[i][1]) !== d.hora || v[i][2] !== d.barbeiro) continue;
    if (q.papel !== 'dono' && v[i][2] !== q.nome) return erro_('Sem permissão para este horário.');
    if (String(v[i][8] || '').trim()) return erro_('Este horário já foi finalizado.');
    const sv = servicos_().filter(s => s.nome === v[i][3])[0];
    let valor = sv ? sv.preco : 0;
    if (q.papel === 'dono' && d.valor !== undefined && d.valor !== '') {
      const x = valorOk_(d.valor); if (x === null) return erro_('Valor inválido.'); valor = x;
    }
    const c = sh.getRange(i + 1, 9); c.setNumberFormat('@'); c.setValue(status);
    if (status === 'concluido') {
      registrarVenda_({ data: dataTxt_(v[i][0]), hora: horaTxt_(v[i][1]), barbeiro: String(v[i][2]), servico: String(v[i][3]),
        categoria: sv ? sv.categoria : 'outro', cliente: String(v[i][4]), telefone: String(v[i][5]), valor: valor, origem: 'agenda',
        por: q.email, chave: [dataTxt_(v[i][0]), horaTxt_(v[i][1]), v[i][2]].join('|') });
    }
    return json_({ ok: true });
  }
  return erro_('Agendamento não encontrado.');
}

// Cliente que chegou sem marcar
function adminVendaAvulsa_(d, q) {
  const sv = servicos_().filter(s => s.nome === d.servico)[0];
  if (!sv) return erro_('Escolha um serviço.');
  const barbeiro = q.papel === 'dono' ? String(d.barbeiro || '') : q.nome;
  if (!equipe_().some(p => p.nome === barbeiro && p.ativo)) return erro_('Escolha o barbeiro.');
  let valor = sv.preco;
  if (q.papel === 'dono' && d.valor !== undefined && d.valor !== '') {
    const x = valorOk_(d.valor); if (x === null) return erro_('Valor inválido.'); valor = x;
  }
  registrarVenda_({ data: hoje_(), hora: agora_(), barbeiro: barbeiro, servico: sv.nome, categoria: sv.categoria,
    cliente: limpo_(d.cliente, 80) || 'Sem agendamento', telefone: '', valor: valor, origem: 'avulsa', por: q.email, chave: 'avulsa|' + Utilities.getUuid() });
  return json_({ ok: true });
}

// Cancelar um horário em nome do cliente (ex.: pediu pelo WhatsApp)
function adminCancelar_(d, q) {
  const sh = ag_(), v = sh.getDataRange().getValues();
  for (let i = 1; i < v.length; i++) {
    if (dataTxt_(v[i][0]) === d.data && horaTxt_(v[i][1]) === d.hora && v[i][2] === d.barbeiro) {
      if (q.papel !== 'dono' && v[i][2] !== q.nome) return erro_('Sem permissão para este horário.');
      if (String(v[i][8] || '').trim()) return erro_('Este horário já foi finalizado.');
      sh.deleteRow(i + 1);
      return json_({ ok: true });
    }
  }
  return erro_('Agendamento não encontrado.');
}

// Relatório de vendas (só dono)
function adminRelatorio_(d) {
  const hoje = hoje_();
  let de = isoOk_(d.de) ? d.de : hoje.slice(0, 8) + '01', ate = isoOk_(d.ate) ? d.ate : hoje;
  if (ate < de) ate = de;
  const rows = vd_().getDataRange().getValues().slice(1).filter(l => String(l[0]).trim()).map(l => ({
    data: dataTxt_(l[0]), hora: horaTxt_(l[1]), barbeiro: String(l[2]), servico: String(l[3]), categoria: String(l[4]), cliente: String(l[5]),
    valor: Number(l[7]) || 0, comissaoPct: Number(l[8]) || 0, comissao: Number(l[9]) || 0, lucro: Number(l[10]) || 0,
    margem: Number(l[11]) || 0, origem: String(l[12]), chave: String(l[15])
  })).filter(r => r.data >= de && r.data <= ate);
  const tot = { qtd: rows.length, bruto: 0, comissao: 0, lucro: 0, cortes: 0 };
  const porSrv = {}, porBar = {}, porDia = {};
  rows.forEach(r => {
    tot.bruto += r.valor; tot.comissao += r.comissao; tot.lucro += r.lucro;
    if (r.categoria === 'corte') tot.cortes++;
    const s = porSrv[r.servico] = porSrv[r.servico] || { nome: r.servico, categoria: r.categoria, qtd: 0, valor: 0 };
    s.qtd++; s.valor += r.valor;
    const b = porBar[r.barbeiro] = porBar[r.barbeiro] || { nome: r.barbeiro, qtd: 0, valor: 0, comissao: 0, lucro: 0 };
    b.qtd++; b.valor += r.valor; b.comissao += r.comissao; b.lucro += r.lucro;
    const x = porDia[r.data] = porDia[r.data] || { data: r.data, qtd: 0, valor: 0 };
    x.qtd++; x.valor += r.valor;
  });
  const arr = o => Object.keys(o).map(k => o[k]);
  const fix = o => { Object.keys(o).forEach(k => { if (typeof o[k] === 'number') o[k] = r2_(o[k]); }); return o; };
  tot.margem = tot.bruto ? r2_(tot.lucro / tot.bruto * 100) : 0;
  return json_({
    ok: true, de: de, ate: ate, totais: fix(tot),
    porServico: arr(porSrv).map(fix).sort((a, b) => b.qtd - a.qtd),
    porBarbeiro: arr(porBar).map(fix).sort((a, b) => b.valor - a.valor),
    porDia: arr(porDia).map(fix).sort((a, b) => a.data.localeCompare(b.data)),
    historico: rows.sort((a, b) => (b.data + b.hora).localeCompare(a.data + a.hora)).slice(0, 300)
  });
}
function adminExcluirVenda_(d) {
  const chave = String(d.chave || ''), sh = vd_(), v = sh.getDataRange().getValues();
  for (let i = 1; i < v.length; i++) {
    if (String(v[i][15]) !== chave) continue;
    sh.deleteRow(i + 1);
    if (chave.indexOf('avulsa|') !== 0) {            // devolve o horário para "pendente"
      const p = chave.split('|'), ag = ag_(), a = ag.getDataRange().getValues();
      for (let j = 1; j < a.length; j++) {
        if (dataTxt_(a[j][0]) === p[0] && horaTxt_(a[j][1]) === p[1] && a[j][2] === p[2]) { ag.getRange(j + 1, 9).setValue(''); break; }
      }
    }
    return json_({ ok: true });
  }
  return erro_('Venda não encontrada.');
}

// Tudo o que o painel do dono precisa para editar
function adminDados_() {
  const c = cfg_(), conf = {};
  Object.keys(CFG_PADRAO).forEach(k => { conf[k] = c[k]; });
  return json_({ ok: true, servicos: servicos_(), equipe: equipe_(), fotos: fotos_(), config: conf, comissaoPadrao: COMISSAO_PADRAO, dono: String(DONO_EMAIL).trim().toLowerCase() });
}

function adminSalvarServicos_(d) {
  const lista = Array.isArray(d.servicos) ? d.servicos : [];
  if (lista.length > 60) return erro_('Serviços demais.');
  const vistos = {}, linhas = [];
  for (let i = 0; i < lista.length; i++) {
    const s = lista[i] || {}, nome = limpo_(s.nome, 40);
    if (!nome) return erro_('Todo serviço precisa de nome.');
    if (vistos[nome.toLowerCase()]) return erro_('Nome de serviço repetido: ' + nome);
    vistos[nome.toLowerCase()] = 1;
    const preco = valorOk_(s.preco);
    if (preco === null) return erro_('Preço inválido em ' + nome + '.');
    linhas.push([seguro_(nome), r2_(preco), ICONES.indexOf(s.icone) !== -1 ? s.icone : 'tesoura', seguro_(limpo_(s.desc, 90)),
      simnao_(!!s.destaque), CATEGORIAS.indexOf(s.categoria) !== -1 ? s.categoria : 'outro', simnao_(s.ativo !== false)]);
  }
  if (!linhas.some(l => l[6] === 'sim')) return erro_('Deixe pelo menos um serviço ativo.');
  reescrever_(sv_(), CAB_SV, linhas, ['@', '0.##', '@', '@', '@', '@', '@']);
  limparCache_();
  return json_({ ok: true });
}

function adminSalvarEquipe_(d) {
  const lista = Array.isArray(d.equipe) ? d.equipe : [];
  if (lista.length > 30) return erro_('Equipe grande demais.');
  const dono = String(DONO_EMAIL).trim().toLowerCase();
  const nomes = {}, emails = {}, linhas = [];
  for (let i = 0; i < lista.length; i++) {
    const p = lista[i] || {}, nome = limpo_(p.nome, 40), email = limpo_(p.email, 80).toLowerCase();
    if (!nome) return erro_('Todo profissional precisa de nome.');
    if (nomes[nome.toLowerCase()]) return erro_('Nome repetido: ' + nome);
    nomes[nome.toLowerCase()] = 1;
    if (email) {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return erro_('E-mail inválido de ' + nome + '.');
      if (emails[email]) return erro_('E-mail repetido: ' + email);
      emails[email] = 1;
    }
    const com = valorOk_(p.comissao);
    if (com === null || com > 100) return erro_('A comissão de ' + nome + ' deve ficar entre 0 e 100.');
    const cursos = (Array.isArray(p.cursos) ? p.cursos : []).map(c => limpo_(String(c).replace(/\|/g, ' '), 70)).filter(Boolean).slice(0, 10);
    linhas.push([email, seguro_(nome), (dono && email === dono) || p.papel === 'dono' ? 'dono' : 'barbeiro', r2_(com), simnao_(!!p.atende),
      seguro_(cursos.join(' | ')), seguro_(limpo_(p.obs, 160)), simnao_(p.ativo !== false)]);
  }
  if (emailOk_(dono) && !emails[dono]) linhas.unshift([dono, 'Dono', 'dono', 0, 'não', '', '', 'sim']);
  // quem sumiu da lista continua existindo como "inativo" (não perde o histórico de agendas e vendas)
  equipe_().forEach(old => {
    if (!nomes[old.nome.toLowerCase()] && !(dono && old.email && old.email === dono)) {
      linhas.push([old.email, seguro_(old.nome), old.papel, old.comissao, 'não', seguro_(old.cursos.join(' | ')), seguro_(old.obs), 'não']);
    }
  });
  if (!linhas.some(l => l[7] === 'sim' && l[4] === 'sim')) return erro_('Deixe pelo menos um barbeiro ativo que atende clientes.');
  if (!linhas.some(l => l[2] === 'dono' && l[0] && l[7] === 'sim')) return erro_('Precisa existir pelo menos um dono ativo com e-mail, senão ninguém acessa a Área privada.');
  reescrever_(eq_(), CAB_EQ, linhas, ['@', '@', '@', '0.##', '@', '@', '@', '@']);
  limparCache_();
  return json_({ ok: true });
}

function adminSalvarConfig_(d) {
  const n = d.config || {}, atual = Object.assign({}, cfg_()), novo = {};
  const txt = (k, max) => { if (n[k] !== undefined) novo[k] = limpo_(n[k], max); };
  txt('nome', 40); txt('slogan', 80); txt('heroTitulo', 70); txt('heroTexto', 140); txt('endereco', 200); txt('regiao', 60);
  if (n.whatsapp !== undefined) {
    const w = String(n.whatsapp).replace(/\D/g, '');
    if (w && (w.length < 10 || w.length > 15)) return erro_('WhatsApp inválido. Use 55 + DDD + número.');
    novo.whatsapp = w;
  }
  if (n.instagram !== undefined) {
    const i = String(n.instagram).trim().replace(/^@/, '');
    if (!/^[A-Za-z0-9._]{0,30}$/.test(i)) return erro_('Instagram inválido.');
    novo.instagram = i;
  }
  ['lat', 'lon'].forEach(k => {
    if (n[k] === undefined) return;
    const s = String(n[k]).trim().replace(',', '.');
    novo[k] = s === '' ? '' : (isFinite(Number(s)) && Math.abs(Number(s)) <= 180 ? s : null);
  });
  if (novo.lat === null || novo.lon === null) return erro_('Coordenadas inválidas.');
  if ((novo.lat === '') !== (novo.lon === '') && (novo.lat !== undefined || novo.lon !== undefined)) {
    const la = novo.lat !== undefined ? novo.lat : atual.lat, lo = novo.lon !== undefined ? novo.lon : atual.lon;
    if ((la === '') !== (lo === '')) return erro_('Preencha latitude e longitude juntas.');
  }
  ['corBotao', 'corMadeira'].forEach(k => { if (n[k] !== undefined) { if (!/^#[0-9a-fA-F]{6}$/.test(String(n[k]))) return; novo[k] = String(n[k]).toLowerCase(); } });
  if (n.ceu !== undefined && CEUS.indexOf(n.ceu) !== -1) novo.ceu = n.ceu;
  if (n.abre !== undefined) novo.abre = String(inteiro_(n.abre, 9, 0, 23));
  if (n.fecha !== undefined) novo.fecha = String(inteiro_(n.fecha, 19, 1, 24));
  if (n.intervalo !== undefined) novo.intervalo = String([10, 15, 20, 30, 45, 60].indexOf(inteiro_(n.intervalo, 30, 10, 60)) !== -1 ? inteiro_(n.intervalo, 30, 10, 60) : 30);
  if (n.diasAFrente !== undefined) novo.diasAFrente = String(inteiro_(n.diasAFrente, 14, 1, 60));
  if (n.diasFechados !== undefined) {
    const arr = (Array.isArray(n.diasFechados) ? n.diasFechados : String(n.diasFechados).split(',')).map(s => String(s).trim()).filter(s => /^[0-6]$/.test(s));
    novo.diasFechados = arr.filter((x, i) => arr.indexOf(x) === i).join(',');
  }
  const f = Object.assign(atual, novo);
  if (Number(f.fecha) <= Number(f.abre)) return erro_('O horário de fechar precisa ser depois do de abrir.');
  reescrever_(cf_(), CAB_CF, Object.keys(CFG_PADRAO).map(k => [k, String(f[k] == null ? '' : f[k])]), FMT_TXT(2));
  limparCache_();
  return json_({ ok: true });
}

function adminFotoAdd_(d) {
  const fotos = fotos_();
  if (fotos.length >= 24) return erro_('Limite de 24 fotos no carrossel. Apague alguma para subir outra.');
  const titulo = limpo_(d.titulo, 40);
  if (!titulo) return erro_('Dê um título para a foto.');
  const r = salvarImagem_(d.imagem, 'corte-' + Date.now());
  if (r.erro) return erro_(r.erro);
  const ordem = fotos.length ? Math.max.apply(null, fotos.map(f => f.ordem)) + 1 : 1;
  acrescentar_(ft_(), CAB_FT, [Utilities.getUuid().slice(0, 8), r.id, seguro_(titulo), seguro_(limpo_(d.desc, 60)), seguro_(limpo_(d.servico, 40)), ordem, agoraBR_()],
    ['@', '@', '@', '@', '@', '0', '@']);
  limparCache_();
  return json_({ ok: true });
}
function adminFotoSalvar_(d) {
  const lista = Array.isArray(d.fotos) ? d.fotos : [], atuais = fotos_(), mapa = {};
  lista.forEach(f => { if (f && f.id) mapa[String(f.id)] = f; });
  const linhas = atuais.map(a => {
    const n = mapa[a.id] || {};
    return [a.id, a.fileId, seguro_(limpo_(n.titulo !== undefined ? n.titulo : a.titulo, 40) || a.titulo),
      seguro_(limpo_(n.desc !== undefined ? n.desc : a.desc, 60)), seguro_(limpo_(n.servico !== undefined ? n.servico : a.servico, 40)),
      n.ordem !== undefined ? inteiro_(n.ordem, a.ordem, 0, 999) : a.ordem, ''];
  });
  reescrever_(ft_(), CAB_FT, linhas, ['@', '@', '@', '@', '@', '0', '@']);
  limparCache_();
  return json_({ ok: true });
}
function adminFotoDel_(d) {
  const sh = ft_(), v = sh.getDataRange().getValues();
  for (let i = 1; i < v.length; i++) {
    if (String(v[i][0]) === String(d.id)) { lixeira_(v[i][1]); sh.deleteRow(i + 1); limparCache_(); return json_({ ok: true }); }
  }
  return erro_('Foto não encontrada.');
}
function adminFotoHero_(d) {
  const r = salvarImagem_(d.imagem, 'topo-' + Date.now());
  if (r.erro) return erro_(r.erro);
  const c = cfg_(), antigo = c.fotoHero;
  c.fotoHero = r.id;
  reescrever_(cf_(), CAB_CF, Object.keys(CFG_PADRAO).map(k => [k, String(c[k] == null ? '' : c[k])]), FMT_TXT(2));
  if (antigo) lixeira_(antigo);
  limparCache_();
  return json_({ ok: true });
}
function adminFotoHeroDel_() {
  const c = cfg_(), antigo = c.fotoHero;
  c.fotoHero = '';
  reescrever_(cf_(), CAB_CF, Object.keys(CFG_PADRAO).map(k => [k, String(c[k] == null ? '' : c[k])]), FMT_TXT(2));
  if (antigo) lixeira_(antigo);
  limparCache_();
  return json_({ ok: true });
}

// =====================================================================
//  MENU "Barbearia" NA PLANILHA: cadastrar e-mail do dono e dos barbeiros
// =====================================================================
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Barbearia')
    .addItem('Cadastrar e-mail do DONO', 'menuDono')
    .addItem('Cadastrar BARBEIRO', 'menuBarbeiro')
    .addToUi();
}
function perguntar_(ui, titulo, texto) {
  const r = ui.prompt(titulo, texto, ui.ButtonSet.OK_CANCEL);
  return r.getSelectedButton() === ui.Button.OK ? String(r.getResponseText()).trim() : null;
}
// Grava na aba Equipe. Reaproveita linha do mesmo e-mail, ou a linha do mesmo nome sem e-mail.
function cadastrarEquipe_(email, nome, papel, comissao, atende) {
  const sh = eq_(), v = sh.getDataRange().getValues();
  let alvo = -1;
  for (let i = 1; i < v.length && alvo < 0; i++) if (String(v[i][0]).trim().toLowerCase() === email) alvo = i;
  for (let i = 1; i < v.length && alvo < 0; i++) if (!String(v[i][0]).trim() && String(v[i][1]).trim().toLowerCase() === nome.toLowerCase()) alvo = i;
  if (alvo < 0 && papel === 'dono') for (let i = 1; i < v.length && alvo < 0; i++) if (!String(v[i][0]).trim() && String(v[i][2]) === 'dono') alvo = i;
  const linha = [email, seguro_(nome), papel, comissao, simnao_(atende), alvo >= 0 ? v[alvo][5] : '', alvo >= 0 ? v[alvo][6] : '', 'sim'];
  const fmts = ['@', '@', '@', '0.##', '@', '@', '@', '@'];
  if (alvo >= 0) { const r = sh.getRange(alvo + 1, 1, 1, 8); r.setNumberFormats([fmts]); r.setValues([linha]); }
  else acrescentar_(sh, CAB_EQ, linha, fmts);
  limparCache_();
}
function menuDono() {
  const ui = SpreadsheetApp.getUi();
  const email = perguntar_(ui, 'E-mail do dono', 'Digite o e-mail da conta do dono no site:'); if (email === null) return;
  if (!emailOk_(email)) { ui.alert('E-mail inválido. Tente de novo.'); return; }
  const nome = perguntar_(ui, 'Nome do dono', 'Como aparece o nome do dono? (deixe "Dono" se quiser)'); if (nome === null) return;
  cadastrarEquipe_(email.toLowerCase(), nome || 'Dono', 'dono', 0, false);
  ui.alert('Dono cadastrado: ' + email.toLowerCase() + '\n\nAgora crie uma conta no site com esse mesmo e-mail (ou entre, se já tiver). A opção "Área privada" aparece no final do site.');
}
function menuBarbeiro() {
  const ui = SpreadsheetApp.getUi();
  const email = perguntar_(ui, 'E-mail do barbeiro', 'Digite o e-mail da conta do barbeiro no site:'); if (email === null) return;
  if (!emailOk_(email)) { ui.alert('E-mail inválido. Tente de novo.'); return; }
  const nome = perguntar_(ui, 'Nome do barbeiro', 'Nome que aparece no site (se ele já existe na aba Equipe, use o mesmo nome):'); if (!nome) return;
  const c = perguntar_(ui, 'Comissão', 'Comissão do barbeiro em % (ex.: 50):'); if (c === null) return;
  const com = c === '' ? COMISSAO_PADRAO : valorOk_(c);
  if (com === null || com > 100) { ui.alert('Comissão inválida. Use um número de 0 a 100.'); return; }
  cadastrarEquipe_(email.toLowerCase(), nome.slice(0, 40), 'barbeiro', com, true);
  ui.alert('Barbeiro cadastrado: ' + nome + ' (' + email.toLowerCase() + ')\n\nEle precisa criar conta no site com esse mesmo e-mail. Depois disso vê a própria agenda na Área privada.');
}

// ---------- Entradas da API ----------
function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === 'config') return json_(publico_());
  if (p.action === 'slots') return json_({ livres: slots_(p.data, p.barbeiro) });
  if (p.action === 'feedbacks') return listarFeedbacks_();
  return json_({ erro: 'ação inválida' });
}

const ACOES_EQUIPE = ['admin_agenda', 'admin_concluir', 'admin_venda_avulsa', 'admin_cancelar'];
const ACOES_DONO = ['admin_dados', 'admin_relatorio', 'admin_excluir_venda', 'admin_salvar_servicos', 'admin_salvar_equipe',
  'admin_salvar_config', 'admin_foto_add', 'admin_foto_salvar', 'admin_foto_del', 'admin_foto_hero', 'admin_foto_hero_del'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.action === 'registrar') return registrar_(d);
    if (d.action === 'entrar') return entrar_(d);
    const email = validarToken_(d.token);
    if (!email) return erro_('Sua sessão expirou. Entre novamente.', { expirada: true });
    memoCfg_ = null;
    if (d.action === 'agendar') return agendar_(d, email);
    if (d.action === 'meus') return meus_(email);
    if (d.action === 'cancelar') return cancelar_(d, email);
    if (d.action === 'feedback') return enviarFeedback_(d, email);
    if (d.action === 'perfil') return perfil_(email);
    if (String(d.action).indexOf('admin_') === 0) {
      const q = quem_(email);
      const ehDono = q && q.papel === 'dono';
      if (!q || (ACOES_EQUIPE.indexOf(d.action) === -1 && !(ehDono && ACOES_DONO.indexOf(d.action) !== -1))) {
        return erro_('Você não tem permissão para isso.');
      }
      switch (d.action) {
        case 'admin_agenda': return adminAgenda_(d, q);
        case 'admin_concluir': return adminConcluir_(d, q);
        case 'admin_venda_avulsa': return adminVendaAvulsa_(d, q);
        case 'admin_cancelar': return adminCancelar_(d, q);
        case 'admin_dados': return adminDados_();
        case 'admin_relatorio': return adminRelatorio_(d);
        case 'admin_excluir_venda': return adminExcluirVenda_(d);
        case 'admin_salvar_servicos': return adminSalvarServicos_(d);
        case 'admin_salvar_equipe': return adminSalvarEquipe_(d);
        case 'admin_salvar_config': return adminSalvarConfig_(d);
        case 'admin_foto_add': return adminFotoAdd_(d);
        case 'admin_foto_salvar': return adminFotoSalvar_(d);
        case 'admin_foto_del': return adminFotoDel_(d);
        case 'admin_foto_hero': return adminFotoHero_(d);
        case 'admin_foto_hero_del': return adminFotoHeroDel_();
      }
    }
    return erro_('Ação inválida.');
  } catch (err) {
    return erro_('Erro no servidor. Tente novamente.');
  } finally {
    lock.releaseLock();
  }
}
