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

// E-mail do DONO: único com acesso total à Área privada (além de quem você cadastrar na aba Equipe).
const DONO_EMAIL = 'lucasclaudio86@gmail.com';
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
  regiao: 'Mansões Odisséia', lat: '-15.771585825269458', lon: '-48.281261505017945',
  abre: '9', fecha: '19', intervalo: '30', diasFechados: '0', diasAFrente: '14',
  corBotao: '#8f3b22', corMadeira: '#382a20', ceu: 'entardecer', fotoHero: '', fotoFachada: '', metaCortes: '7',
  exigirConfirmacao: '1', emailAvisos: '1'
};
const SEMENTE_MARCAS = [['m1', '', 'Fox For Men', '', 1], ['m2', '', 'QOD Barber Shop', '', 2], ['m3', '', 'Roger', '', 3], ['m4', '', 'Shark Barber', '', 4]];
const ICONES = ['tesoura', 'navalha', 'gota', 'estrela', 'crianca', 'pincel'];
const CATEGORIAS = ['corte', 'barba', 'quimica', 'outro'];
const CEUS = ['entardecer', 'noite', 'dia', 'madrugada'];

// ---- Cabeçalhos das abas ----
const CAB_AG = ['Data', 'Hora', 'Barbeiro', 'Serviço', 'Nome', 'Telefone', 'Criado em', 'Email', 'Status', 'Finalizado em', 'Antecipado (min)', 'Confirmação', 'Motivo da recusa'];
const SITE_URL = 'https://lucasnicaci0.github.io/barbearia/';
const NOMES_DIA = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const CAB_US = ['Email', 'Nome', 'Telefone', 'Salt', 'SenhaHash', 'Criado em', 'Foto'];
const CAB_FB = ['Data', 'Nome', 'Nota', 'Comentário', 'Email'];
const CAB_SV = ['Nome', 'Preço', 'Ícone', 'Descrição', 'Destaque', 'Categoria', 'Ativo'];
const CAB_EQ = ['Email', 'Nome', 'Papel', 'Comissão %', 'Atende', 'Cursos', 'Observação', 'Ativo', 'Telefone',
  'Foto', 'Instagram', 'Idade', 'Gênero', 'Especialidades', 'Anos', 'Bio', 'Horários'];
const FMT_EQ = CAB_EQ.map((c, i) => i === 3 ? '0.##' : '@');
const CAB_NT = ['Id', 'Para', 'Tipo', 'Título', 'Texto', 'Criado em', 'Lida', 'Ref'];
const CAB_AC = ['Email', 'Cliente', 'Barbeiro', 'Nota', 'Tags', 'Comentário', 'Data'];
const CAB_BQ = ['Id', 'Email', 'Cliente', 'Pedido por', 'Motivo', 'Status', 'Pedido em', 'Decidido por', 'Decidido em', 'Observação do dono'];
const CAB_GL = ['Id', 'Tipo', 'Chave', 'FileId', 'Url', 'Título', 'Ordem', 'Criado em'];
const FMT_GL = ['@', '@', '@', '@', '@', '@', '0', '@'];
const CAB_FT = ['Id', 'FileId', 'Título', 'Descrição', 'Serviço', 'Ordem', 'Criado em', 'Url'];
const FMT_FT = ['@', '@', '@', '@', '@', '0', '@', '@'];
const CAB_PR = ['Id', 'Título', 'Descrição', 'Desconto %', 'Serviço', 'De', 'Até', 'Ativa', 'FileId', 'Url', 'Ordem', 'Tema'];
const FMT_PR = ['@', '@', '@', '0.##', '@', '@', '@', '@', '@', '@', '0', '@'];
const FOTO_UNS = id => 'https://images.unsplash.com/photo-' + id + '?auto=format&fit=crop&w=1000&q=80';
// cortes que já vêm no carrossel (o dono edita, troca a foto ou apaga)
const SEMENTE_FOTOS = [
  ['Degradê', 'Baixo, médio ou alto', 'Degradê', FOTO_UNS('1634480257305-7f4ca3582e6a')],
  ['Corte social', 'Clássico e alinhado', 'Corte social', FOTO_UNS('1672642150228-3fcd5826ec26')],
  ['Barba na navalha', 'Toalha quente e acabamento', 'Barba', FOTO_UNS('1494873446894-adbfecfc407a')],
  ['Corte + Barba', 'O combo mais pedido', 'Corte + Barba', ''],
  ['Platinado', 'Descoloração e tonalização', 'Platinado / Luzes', ''],
  ['Corte infantil', 'Para os pequenos', 'Corte infantil', FOTO_UNS('1521490878864-a50e9fcb5718')]
];
const CAB_CF = ['Chave', 'Valor'];
const CAB_VD = ['Data', 'Hora', 'Barbeiro', 'Serviço', 'Categoria', 'Cliente', 'Telefone', 'Valor', 'Comissão %',
  'Comissão R$', 'Lucro R$', 'Lucro %', 'Origem', 'Concluído em', 'Por', 'Chave', 'Email', 'Resgate'];
const CAB_MC = ['Id', 'FileId', 'Nome', 'Descrição', 'Ordem'];
const FMT_VD = ['@', '@', '@', '@', '@', '@', '@', '0.00', '0.##', '0.00', '0.00', '0.##', '@', '@', '@', '@', '@', '@'];
const FMT_TXT = n => Array(n).fill('@');

const memoAbas_ = {};
// Velocidade: cada chamada à planilha custa ~0,1 a 0,3 s no Google. Por isso (1) o cabeçalho de cada aba só é conferido
// uma vez a cada 6 h e (2) nas consultas (que não gravam nada) cada aba é lida UMA vez por requisição, mesmo que várias funções peçam os dados.
let memoLeitura_ = false, memoVals_ = {};
const somaCab_ = cab => { const j = cab.join('|'); let x = 7; for (let i = 0; i < j.length; i++) x = (x * 31 + j.charCodeAt(i)) | 0; return x; };
const ESCRITAS_ = { appendRow: 1, deleteRow: 1, deleteRows: 1, insertRowAfter: 1, insertRowBefore: 1, clear: 1, clearContents: 1 };
function envolver_(sh, nome) {
  return new Proxy(sh, { get(alvo, p) {
    if (p === 'getDataRange') return () => memoLeitura_
      ? { getValues: () => (memoVals_[nome] = memoVals_[nome] || alvo.getDataRange().getValues()) }
      : alvo.getDataRange();
    const v = alvo[p];
    if (typeof v !== 'function') return v;
    return ESCRITAS_[p] ? (...a) => { memoVals_ = {}; return v.apply(alvo, a); } : v.bind(alvo);
  } });
}
function aba_(nome, cab, semente) {
  if (memoAbas_[nome]) return memoAbas_[nome];
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(nome), novo = false;
  if (!sh) {
    sh = ss.insertSheet(nome);
    sh.appendRow(cab);
    sh.setFrozenRows(1);
    if (semente) semente(sh);
    novo = true;
  }
  const cache = CacheService.getScriptCache(), chave = 'cab_' + nome + '_' + somaCab_(cab);
  if (novo || !cache.get(chave)) {
    const atual = sh.getRange(1, 1, 1, cab.length).getValues()[0];       // completa cabeçalhos que faltam (planilhas antigas)
    cab.forEach((c, i) => { if (!atual[i]) sh.getRange(1, i + 1).setValue(c); });
    try { cache.put(chave, '1', 21600); } catch (e) {}
  }
  memoAbas_[nome] = envolver_(sh, nome);
  return memoAbas_[nome];
}
function reescrever_(sh, cab, linhas, fmts) {
  memoVals_ = {};
  const ult = sh.getLastRow();
  if (ult > 1) sh.getRange(2, 1, ult - 1, cab.length).clearContent();
  if (!linhas.length) return;
  const r = sh.getRange(2, 1, linhas.length, cab.length);
  r.setNumberFormats(linhas.map(() => fmts));
  r.setValues(linhas);
}
function acrescentar_(sh, cab, linha, fmts) {
  memoVals_ = {};
  const r = sh.getRange(sh.getLastRow() + 1, 1, 1, cab.length);
  r.setNumberFormats([fmts]);
  r.setValues([linha]);
}

const ag_ = () => aba_('Agendamentos', CAB_AG);
const us_ = () => aba_('Usuarios', CAB_US);
const fb_ = () => aba_('Feedback', CAB_FB);
const vd_ = () => aba_('Vendas', CAB_VD);
const mc_ = () => aba_('Marcas', CAB_MC, sh => reescrever_(sh, CAB_MC, SEMENTE_MARCAS, ['@', '@', '@', '@', '0']));
const ft_ = () => aba_('Fotos', CAB_FT);
const pr_ = () => aba_('Promocoes', CAB_PR);
const nt_ = () => aba_('Notificacoes', CAB_NT);
const ac_ = () => aba_('AvalClientes', CAB_AC);
const bq_ = () => aba_('Bloqueios', CAB_BQ);
const gl_ = () => aba_('Galeria', CAB_GL);
const cf_ = () => aba_('Config', CAB_CF, sh => reescrever_(sh, CAB_CF, Object.keys(CFG_PADRAO).map(k => [k, CFG_PADRAO[k]]), FMT_TXT(2)));
const sv_ = () => aba_('Servicos', CAB_SV, sh =>
  reescrever_(sh, CAB_SV, SEMENTE_SERVICOS, ['@', '0.##', '@', '@', '@', '@', '@']));
const eq_ = () => aba_('Equipe', CAB_EQ, sh => reescrever_(sh, CAB_EQ, [
  linhaEq_({ email: emailOk_(DONO_EMAIL) ? DONO_EMAIL.trim().toLowerCase() : '', nome: 'Dono', papel: 'dono', comissao: 0, atende: false }),
  linhaEq_({ nome: 'Carlos', comissao: COMISSAO_PADRAO, atende: true, cursos: ['Curso de degradê e navalhado', 'Barboterapia profissional'], obs: 'Especialista em degradê e barba desenhada.' }),
  linhaEq_({ nome: 'João', comissao: COMISSAO_PADRAO, atende: true, cursos: ['Colorimetria masculina', 'Corte infantil'], obs: 'Atende crianças com paciência e capricho.' })
], FMT_EQ));

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
    cursos: String(l[5]).split('|').map(s => s.trim()).filter(Boolean), obs: String(l[6]), ativo: sim_(l[7]), telefone: String(l[8] || '').replace(/\D/g, ''),
    foto: String(l[9] || ''), instagram: String(l[10] || ''), idade: Number(l[11]) || 0, genero: String(l[12] || ''),
    especialidades: String(l[13] || '').split('|').map(x => x.trim()).filter(Boolean).slice(0, 8), anos: Number(l[14]) || 0,
    bio: String(l[15] || ''), horarios: horariosDe_(l[16])
  }));
}
const barbeiros_ = () => equipe_().filter(p => p.ativo && p.atende);
const nomesBarbeiros_ = () => barbeiros_().map(p => p.nome);

// Quem é essa conta? (dono, barbeiro ou ninguém). Sempre confirmado no servidor.
function quem_(email) {
  const dono = String(DONO_EMAIL).trim().toLowerCase();
  if (dono && email === dono) return { papel: 'dono', nome: 'Dono', email: email };      // atalho: não precisa ler a planilha
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
    id: String(l[0]), fileId: String(l[1]), titulo: String(l[2]), desc: String(l[3]), servico: String(l[4]), ordem: Number(l[5]) || 0, url: String(l[7] || '')
  })).sort((a, b) => a.ordem - b.ordem);
}
// Na primeira vez, preenche o carrossel com os cortes padrão (assim o dono consegue editar e apagar todos).
function semearFotos_() {
  const p = PropertiesService.getScriptProperties();
  if (p.getProperty('FOTOS_SEMEADAS')) return;
  const sh = ft_();
  if (sh.getLastRow() <= 1) reescrever_(sh, CAB_FT, SEMENTE_FOTOS.map((f, i) => ['c' + (i + 1), '', f[0], f[1], f[2], i + 1, agoraBR_(), f[3]]), FMT_FT);
  p.setProperty('FOTOS_SEMEADAS', '1');
}
function promos_() {
  return pr_().getDataRange().getValues().slice(1).filter(l => String(l[0]).trim()).map(l => ({
    id: String(l[0]), titulo: String(l[1]), desc: String(l[2]), desconto: Number(l[3]) || 0, servico: String(l[4]),
    de: String(l[5]).trim() ? dataTxt_(l[5]) : '', ate: String(l[6]).trim() ? dataTxt_(l[6]) : '', ativa: String(l[7]) === 'sim',
    fileId: String(l[8]), url: String(l[9] || ''), ordem: Number(l[10]) || 0, temaTxt: String(l[11] || ''), tema: temaDe_(l[11])
  })).sort((a, b) => a.ordem - b.ordem);
}
// Maior desconto vigente (ativo, dentro das datas) para o serviço naquela data
function promoPara_(promos, servico, data) {
  let m = null;
  promos.forEach(p => {
    if (!p.ativa || !(p.desconto > 0) || (p.de && p.de > data) || (p.ate && p.ate < data) || (p.servico && p.servico !== servico)) return;
    if (!m || p.desconto > m.desconto) m = p;
  });
  return m;
}
const precoPromo_ = (preco, p) => p ? r2_(preco * (100 - p.desconto) / 100) : preco;
function marcas_() {
  return mc_().getDataRange().getValues().slice(1).filter(l => String(l[0]).trim()).map(l => ({
    id: String(l[0]), fileId: String(l[1]), nome: String(l[2]), desc: String(l[3]), ordem: Number(l[4]) || 0
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
// Rode esta função UMA vez no editor: autoriza o acesso ao Google Drive (fotos) e cria
// todas as abas da planilha (Equipe, Servicos, Config, Fotos, Vendas...).
function autorizar() {
  pastaFotos_();
  [ag_, us_, fb_, vd_, ft_, cf_, sv_, eq_, mc_, pr_, nt_, ac_, bq_, gl_].forEach(f => f());
  semearFotos_();
  MailApp.getRemainingDailyQuota();            // pede a permissão de enviar e-mail (avisos para barbeiros e clientes)
}

// ---------- Cache da configuração pública ----------
const limparCache_ = () => { memoCfg_ = null; CacheService.getScriptCache().remove('pub'); };
function publico_() {
  const cache = CacheService.getScriptCache();
  let txt = cache.get('pub');
  if (!txt) {
    semearFotos_();
    const c = cfg_(), h = horario_(), limite = somarDias_(hoje_(), -1);
    const site = {};
    Object.keys(CFG_PADRAO).forEach(k => { site[k] = c[k]; });
    delete site.abre; delete site.fecha; delete site.intervalo; delete site.diasFechados; delete site.diasAFrente; delete site.emailAvisos;
    const certs = {}, porSrv = {};
    galeria_().forEach(g => { const o = { id: g.id, fileId: g.fileId, url: g.url, titulo: g.titulo }; const alvo = g.tipo === 'certificado' ? certs : porSrv; (alvo[g.chave] = alvo[g.chave] || []).push(o); });
    txt = JSON.stringify({
      barbeiros: barbeiros_().map(p => ({ nome: p.nome, cursos: p.cursos, obs: p.obs, foto: p.foto, instagram: p.instagram, especialidades: p.especialidades, anos: p.anos, bio: p.bio,
        certs: certs[p.nome] || [], folgas: Object.keys(p.horarios).filter(k => p.horarios[k] && p.horarios[k].off).map(Number) })),
      galeria: porSrv,
      servicos: servicos_().filter(s => s.ativo).map(s => ({ nome: s.nome, preco: s.preco, icone: s.icone, desc: s.desc, destaque: s.destaque })),
      fotos: fotos_().map(f => ({ id: f.id, fileId: f.fileId, url: f.url, titulo: f.titulo, desc: f.desc, servico: f.servico })), fotosOk: true,
      promos: promos_().filter(p => p.ativa && (!p.ate || p.ate >= limite)).map(p => ({ id: p.id, titulo: p.titulo, desc: p.desc, desconto: p.desconto, servico: p.servico, de: p.de, ate: p.ate, fileId: p.fileId, url: p.url, tema: p.tema })),
      marcas: marcas_().map(m => ({ id: m.id, fileId: m.fileId, nome: m.nome, desc: m.desc })),
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
    .filter(l => dataTxt_(l[0]) === data && l[2] === barbeiro && String(l[8] || '').trim() !== 'recusado')
    .map(l => horaTxt_(l[1]));
}
// Fonte única da verdade: horários realmente livres (já tira passado, dia fechado e ocupados)
function slots_(data, barbeiro) {
  if (!isoOk_(data)) return [];
  const b = barbeiros_().filter(p => p.nome === barbeiro)[0];
  if (!b) return [];
  const h = horario_(), hoje = hoje_();
  if (data < hoje || data > somarDias_(hoje, h.dias - 1)) return [];
  if (h.fechados.indexOf(diaSemana_(data)) !== -1) return [];
  const jan = janelaDe_(b, data);                                     // horário próprio do profissional (se tiver)
  if (jan === null) return [];
  const usados = ocupados_(data, barbeiro), agora = agora_();
  return horarios_().filter(x => usados.indexOf(x) === -1 && (data > hoje || x > agora) &&
    (!jan || (x >= jan.a && x < jan.f && !(jan.pa && x >= jan.pa && x < jan.pf))));
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
// Hash novo (v2): um HMAC com chave secreta do script. É rápido (1 cálculo) e a chave nunca fica na planilha.
// Senhas antigas (300 repetições) continuam valendo e são trocadas pelo hash novo no primeiro login.
function hashV2_(senha, salt) { return 'v2:' + hex_(Utilities.computeHmacSha256Signature(salt + '|' + senha, segredo_())); }
function acharUsuario_(email) {
  const cache = CacheService.getScriptCache(), chave = 'u_' + email;
  const c = cache.get(chave);
  if (c) return JSON.parse(c);
  const sh = us_(), n = sh.getLastRow();
  if (n < 2) return null;
  const emails = sh.getRange(2, 1, n - 1, 1).getValues();          // lê só a coluna de e-mails (mais rápido)
  for (let i = 0; i < emails.length; i++) {
    if (String(emails[i][0]).toLowerCase() === email) {
      const l = sh.getRange(i + 2, 1, 1, 7).getValues()[0];
      const u = { nome: String(l[1]), telefone: String(l[2]), salt: String(l[3]), hash: String(l[4]), foto: String(l[6] || '') };
      try { cache.put(chave, JSON.stringify(u), 21600); } catch (e) {}
      return u;
    }
  }
  return null;
}
function trocarHash_(email, senha) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(4000)) return;                                   // se estiver ocupado, troca no próximo login
  try {
    const sh = us_(), n = sh.getLastRow();
    if (n < 2) return;
    const emails = sh.getRange(2, 1, n - 1, 1).getValues();
    for (let i = 0; i < emails.length; i++) {
      if (String(emails[i][0]).toLowerCase() === email) {
        const salt = Utilities.getUuid(), c = sh.getRange(i + 2, 4, 1, 2);
        c.setNumberFormats([['@', '@']]); c.setValues([[salt, hashV2_(senha, salt)]]);
        CacheService.getScriptCache().remove('u_' + email);
        return;
      }
    }
  } finally { lock.releaseLock(); }
}
function sessao_(email, u) {
  const q = quem_(email);
  return json_({ ok: true, token: criarToken_(email), email: email, nome: u.nome, telefone: u.telefone, foto: u.foto || '', papel: q ? q.papel : 'cliente' });
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
  acrescentar_(us_(), CAB_US, [email, seguro_(nome), seguro_(tel), salt, hashV2_(senha, salt), agoraBR_(), ''], FMT_TXT(7));
  return sessao_(email, { nome: nome, telefone: tel });
}
function entrar_(d) {
  const email = String(d.email || '').trim().toLowerCase();
  const cache = CacheService.getScriptCache();
  const chave = 'tent_' + email;
  const n = Number(cache.get(chave) || 0);
  if (n >= 5) return erro_('Muitas tentativas. Aguarde 10 minutos e tente de novo.');
  const u = acharUsuario_(email);
  const senha = String(d.senha || '');
  let valido = false;
  if (u) {
    if (u.hash.indexOf('v2:') === 0) valido = hashV2_(senha, u.salt) === u.hash;
    else if (hash_(senha, u.salt) === u.hash) { valido = true; trocarHash_(email, senha); }
  }
  if (!valido) {
    cache.put(chave, String(n + 1), 600);
    return erro_('E-mail ou senha incorretos.');
  }
  cache.remove(chave);
  return sessao_(email, u);
}
function perfil_(email) {
  const u = acharUsuario_(email), q = quem_(email);
  if (!u) return erro_('Conta não encontrada.', { expirada: true });
  return json_({ ok: true, nome: u.nome, papel: q ? q.papel : 'cliente', foto: u.foto || '' });
}
// O cliente troca ou remove a própria foto de perfil: {imagem (data URL) | remover}
function fotoPerfil_(d, email) {
  const sh = us_(), n = sh.getLastRow();
  if (n < 2) return erro_('Conta não encontrada.');
  const emails = sh.getRange(2, 1, n - 1, 1).getValues();
  for (let i = 0; i < emails.length; i++) {
    if (String(emails[i][0]).toLowerCase() !== email) continue;
    const c = sh.getRange(i + 2, 7), antiga = String(c.getValue() || '');
    let novo = '';
    if (!d.remover) {
      if (!d.imagem) return erro_('Escolha uma foto.');
      const r = salvarImagem_(d.imagem, 'cli-' + Date.now()); if (r.erro) return erro_(r.erro); novo = r.id;
    }
    c.setNumberFormat('@'); c.setValue(novo);
    if (antiga) lixeira_(antiga);
    CacheService.getScriptCache().remove('u_' + email);
    return json_({ ok: true, foto: novo });
  }
  return erro_('Conta não encontrada.');
}

// ---------- Agendamentos (cliente) ----------
function agendar_(d, email) {
  const u = acharUsuario_(email);
  if (!u) return erro_('Conta não encontrada.', { expirada: true });
  if (!servicos_().some(s => s.ativo && s.nome === d.servico)) return erro_('Serviço inválido.');
  if (bloqueioAtivo_(email)) return erro_('Não foi possível concluir o agendamento por aqui. Fale com a barbearia pelo WhatsApp.');
  if (slots_(d.data, d.barbeiro).indexOf(d.hora) === -1) return erro_('Esse horário não está mais disponível. Escolha outro.');
  const hoje = hoje_();
  const abertos = ag_().getDataRange().getValues().slice(1).filter(l => String(l[7]).toLowerCase() === email && dataTxt_(l[0]) >= hoje && !String(l[8] || '').trim()).length;
  if (abertos >= 6) return erro_('Você já tem 6 horários em aberto. Cancele ou aguarde um deles para marcar outro.');
  const barb = equipe_().filter(p => p.nome === d.barbeiro && p.ativo)[0];
  const exige = String(cfg_().exigirConfirmacao) !== '0' && !!barb && !!barb.email;      // sem e-mail cadastrado ninguém confirmaria: já vale
  const conf = exige ? 'pendente' : 'confirmado';
  acrescentar_(ag_(), CAB_AG, [d.data, d.hora, d.barbeiro, d.servico, u.nome, u.telefone, agoraBR_(), email, '', '', '', conf, ''], FMT_TXT(13));
  if (barb && barb.email) {
    notificar_(barb.email, 'agendamento', exige ? 'Novo cliente marcando' : 'Novo horário marcado',
      u.nome + ' · ' + d.servico + ' · ' + dataBR_(d.data) + ' às ' + d.hora + (exige ? '. Confirme ou recuse na Agenda.' : '.'), d.data + '|' + d.hora + '|' + d.barbeiro, true);
  }
  return json_({ ok: true, conf: conf });
}
function meus_(email) {
  const hoje = hoje_();
  const v = ag_().getDataRange().getValues().slice(1).filter(l => String(l[7]).toLowerCase() === email && dataTxt_(l[0]) >= hoje);
  const lista = v.filter(l => !String(l[8] || '').trim())
    .map(l => ({ data: dataTxt_(l[0]), hora: horaTxt_(l[1]), barbeiro: String(l[2]), servico: String(l[3]), conf: String(l[11] || '') || 'confirmado' }))
    .sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));
  const recusados = v.filter(l => String(l[8] || '').trim() === 'recusado')
    .map(l => ({ data: dataTxt_(l[0]), hora: horaTxt_(l[1]), barbeiro: String(l[2]), servico: String(l[3]), motivo: String(l[12] || '') }))
    .sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));
  return json_({ ok: true, lista: lista, recusados: recusados });
}
function cancelar_(d, email) {
  const sh = ag_(), v = sh.getDataRange().getValues();
  const alvoStatus = d.recusado ? 'recusado' : '';                    // "recusado": o cliente só está dispensando o aviso
  for (let i = 1; i < v.length; i++) {
    if (dataTxt_(v[i][0]) === d.data && horaTxt_(v[i][1]) === d.hora && v[i][2] === d.barbeiro &&
        String(v[i][7]).toLowerCase() === email && String(v[i][8] || '').trim() === alvoStatus) {
      sh.deleteRow(i + 1);
      if (!d.recusado) {
        const be = emailDe_(String(v[i][2]));
        if (be) notificar_(be, 'cancelado', 'Cliente cancelou', String(v[i][4]) + ' cancelou ' + String(v[i][3]) + ' de ' + dataBR_(d.data) + ' às ' + d.hora + '.', '', false);
      }
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
//  CARTÃO FIDELIDADE: a cada N cortes concluídos, 1 corte grátis
// =====================================================================
const metaCortes_ = () => inteiro_(cfg_().metaCortes, 7, 0, 30);        // 0 = desligado
// Conta, por e-mail, os cortes concluídos e os cortes grátis já resgatados
function mapaFid_() {
  const m = {};
  vd_().getDataRange().getValues().slice(1).forEach(l => {
    const e = String(l[16] || '').trim().toLowerCase();
    if (!e || String(l[4]) !== 'corte') return;
    const o = m[e] = m[e] || { cortes: 0, resg: 0, ult: '' };
    if (String(l[17]) === 'sim') o.resg++; else o.cortes++;
    const dt = dataTxt_(l[0]); if (dt > o.ult) o.ult = dt;
  });
  return m;
}
function fidDe_(mapa, email, meta) {
  const o = mapa[email] || { cortes: 0, resg: 0 };
  if (!meta) return { ativo: false, meta: 0, cortes: o.cortes, progresso: 0, faltam: 0, creditos: 0, resgatados: o.resg };
  const creditos = Math.max(0, Math.floor(o.cortes / meta) - o.resg), progresso = o.cortes % meta;
  return { ativo: true, meta: meta, cortes: o.cortes, progresso: progresso, faltam: meta - progresso, creditos: creditos, resgatados: o.resg };
}
function fidelidade_(email) {
  return json_(Object.assign({ ok: true }, fidDe_(mapaFid_(), email, metaCortes_())));
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
  const preco = {}, cat = {}; servicos_().forEach(s => { preco[s.nome] = s.preco; cat[s.nome] = s.categoria; });
  const promos = promos_(), meta = metaCortes_(), fid = mapaFid_(), av = avalMapa_();
  const todas = ag_().getDataRange().getValues().slice(1), falt = {}, bloq = {};
  todas.forEach(l => { if (String(l[8] || '').trim() === 'faltou') { const e = String(l[7] || '').toLowerCase(); if (e) falt[e] = (falt[e] || 0) + 1; } });
  bloqueios_().forEach(b => { if (b.status === 'ativo') bloq[b.email] = 1; });
  const lista = todas
    .filter(l => { const dt = dataTxt_(l[0]); return dt >= de && dt <= ate && (q.papel === 'dono' || String(l[2]) === q.nome) && String(l[8] || '').trim() !== 'recusado'; })
    .map(l => {
      const pm = promoPara_(promos, String(l[3]), dataTxt_(l[0])), tab = preco[String(l[3])] || 0, em = String(l[7] || '').toLowerCase();
      const x = fid[em] || { cortes: 0, resg: 0 };
      return {
      data: dataTxt_(l[0]), hora: horaTxt_(l[1]), barbeiro: String(l[2]), servico: String(l[3]), cliente: String(l[4]),
      telefone: String(l[5]), status: String(l[8] || '').trim(), finalizadoEm: String(l[9] || ''), antecipado: Number(l[10]) || 0, valor: precoPromo_(tab, pm),
      conf: String(l[11] || '') || 'confirmado', email: em,
      cli: em ? cliResumo_(x.cortes + x.resg, av[em], falt[em] || 0, !!bloq[em]) : null,
      promo: pm ? { titulo: pm.titulo, desconto: pm.desconto, tabela: tab } : null,
      gratis: !!meta && !String(l[8] || '').trim() && cat[String(l[3])] === 'corte' && fidDe_(fid, em, meta).creditos > 0
      };
    })
    .sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));
  return json_({ ok: true, de: de, ate: ate, hoje: hoje, lista: lista, pendentes: lista.filter(x => !x.status && x.conf === 'pendente').length });
}

// Relatório detalhado da Agenda (dono: todos ou um barbeiro; barbeiro: só o dele). Não grava nada.
function adminAgendaRelatorio_(d, q) {
  const hoje = hoje_(), ehDono = q.papel === 'dono';
  let de = isoOk_(d.de) ? d.de : somarDias_(hoje, -29), ate = isoOk_(d.ate) ? d.ate : hoje;
  if (ate < de) ate = de;
  if (diasEntre_(de, ate) > 366) de = somarDias_(ate, -366);
  const filtroB = ehDono ? String(d.barbeiro || '') : q.nome;
  const preco = {}; servicos_().forEach(s => { preco[s.nome] = s.preco; });
  const promos = promos_(), real = {}, fid = mapaFid_();
  let avulsas = { qtd: 0, valor: 0 };
  vd_().getDataRange().getValues().slice(1).forEach(l => {
    const dt = dataTxt_(l[0]); if (dt < de || dt > ate) return;
    if (filtroB && String(l[2]) !== filtroB) return;
    if (String(l[12]) === 'avulsa') { avulsas.qtd++; avulsas.valor += Number(l[7]) || 0; }
    else real[String(l[15])] = { valor: Number(l[7]) || 0, gratis: String(l[17]) === 'sim' };
  });
  const tot = { marcados: 0, concluidos: 0, faltas: 0, abertos: 0, aConfirmar: 0, confirmados: 0, semBaixa: 0, recusados: 0, antecipados: 0 };
  const rec = { prevista: 0, realizada: 0, perdida: 0, gratis: 0 };
  const porB = {}, porS = {}, porD = {}, porC = {}, motivos = {}, semana = [0, 0, 0, 0, 0, 0, 0], semanaF = [0, 0, 0, 0, 0, 0, 0], horas = {}, linhas = [];
  let antecSoma = 0, antecN = 0;
  ag_().getDataRange().getValues().slice(1).forEach(l => {
    const dt = dataTxt_(l[0]); if (!dt || dt < de || dt > ate) return;
    const barb = String(l[2]); if (filtroB && barb !== filtroB) return;
    const st = String(l[8] || '').trim(), conf = String(l[11] || '') || 'confirmado', hora = horaTxt_(l[1]), srv = String(l[3]), em = String(l[7] || '').toLowerCase();
    const tab = precoPromo_(preco[srv] || 0, promoPara_(promos, srv, dt));
    const rv = real[dt + '|' + hora + '|' + barb];
    const valorReal = st === 'concluido' ? (rv ? rv.valor : tab) : 0;
    let estado = st === 'concluido' ? 'concluido' : st === 'faltou' ? 'faltou' : st === 'recusado' ? 'recusado' : (dt < hoje ? 'sem baixa' : 'aberto');
    if (st === 'recusado') {
      tot.recusados++; const m = limpo_(l[12], 80) || 'Sem motivo informado'; motivos[m] = (motivos[m] || 0) + 1;
    } else {
      tot.marcados++;
      const b = porB[barb] = porB[barb] || { nome: barb, marcados: 0, concluidos: 0, faltas: 0, abertos: 0, receita: 0, perdida: 0 };
      const s = porS[srv] = porS[srv] || { nome: srv, marcados: 0, concluidos: 0, faltas: 0, receita: 0 };
      const x = porD[dt] = porD[dt] || { data: dt, marcados: 0, concluidos: 0, faltas: 0 };
      b.marcados++; s.marcados++; x.marcados++;
      const w = diaSemana_(dt); semana[w]++;
      const hh = hora.slice(0, 2); if (/^\d\d$/.test(hh)) horas[hh] = (horas[hh] || 0) + 1;
      if (st === 'concluido') {
        tot.concluidos++; b.concluidos++; s.concluidos++; x.concluidos++; b.receita += valorReal; s.receita += valorReal; rec.realizada += valorReal;
        if (rv && rv.gratis) rec.gratis++;
        if (Number(l[10]) > 0) tot.antecipados++;
      } else if (st === 'faltou') { tot.faltas++; b.faltas++; s.faltas++; x.faltas++; semanaF[w]++; rec.perdida += tab; b.perdida += tab; }
      else {
        if (dt < hoje) tot.semBaixa++; else { tot.abertos++; b.abertos++; rec.prevista += tab; if (conf === 'pendente') tot.aConfirmar++; else tot.confirmados++; }
      }
      if (em) { const c = porC[em] = porC[em] || { email: em, cliente: String(l[4]), marcacoes: 0, concluidos: 0, faltas: 0, gasto: 0 }; c.marcacoes++; if (st === 'concluido') { c.concluidos++; c.gasto += valorReal; } if (st === 'faltou') c.faltas++; }
      const cr = String(l[6] || '').match(/^(\d\d)\/(\d\d)\/(\d{4})/);
      if (cr) { const dif = diasEntre_(cr[3] + '-' + cr[2] + '-' + cr[1], dt); if (dif >= 0 && dif < 400) { antecSoma += dif; antecN++; } }
    }
    if (linhas.length < 1500) linhas.push({ data: dt, hora: hora, barbeiro: barb, servico: srv, cliente: String(l[4]), telefone: String(l[5]), email: em, estado: estado, conf: st === 'recusado' ? 'recusado' : conf, valor: tab, valorReal: r2_(valorReal), antecipado: Number(l[10]) || 0, motivo: String(l[12] || '') });
  });
  const taxa = (a, b) => b ? r2_(a / b * 100) : 0;
  tot.comparecimento = taxa(tot.concluidos, tot.concluidos + tot.faltas);
  tot.taxaFaltas = taxa(tot.faltas, tot.concluidos + tot.faltas);
  tot.ticket = tot.concluidos ? r2_(rec.realizada / tot.concluidos) : 0;
  Object.keys(rec).forEach(k => { rec[k] = r2_(rec[k]); });
  const arr = o => Object.keys(o).map(k => o[k]);
  const fixo = o => { Object.keys(o).forEach(k => { if (typeof o[k] === 'number') o[k] = r2_(o[k]); }); return o; };
  const clientes = arr(porC).map(fixo);
  const meta = metaCortes_();
  return json_({
    ok: true, de: de, ate: ate, hoje: hoje, barbeiro: filtroB, totais: tot, receita: rec, avulsas: { qtd: avulsas.qtd, valor: r2_(avulsas.valor) },
    porBarbeiro: arr(porB).map(b => { b.comparecimento = taxa(b.concluidos, b.concluidos + b.faltas); return fixo(b); }).sort((a, b) => b.marcados - a.marcados),
    porServico: arr(porS).map(fixo).sort((a, b) => b.marcados - a.marcados),
    porDia: arr(porD).sort((a, b) => a.data.localeCompare(b.data)),
    semana: semana, semanaFaltas: semanaF, horas: Object.keys(horas).sort().map(h => ({ h: h, n: horas[h] })),
    clientes: { unicos: clientes.length, recorrentes: clientes.filter(c => c.marcacoes >= 2).length,
      top: clientes.sort((a, b) => b.marcacoes - a.marcacoes || b.gasto - a.gasto).slice(0, 8),
      faltosos: clientes.filter(c => c.faltas > 0).sort((a, b) => b.faltas - a.faltas).slice(0, 5) },
    motivosRecusa: Object.keys(motivos).map(m => ({ motivo: m, n: motivos[m] })).sort((a, b) => b.n - a.n).slice(0, 6),
    antecedenciaMedia: antecN ? Math.round(antecSoma / antecN * 10) / 10 : 0,
    linhas: linhas.sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora)), truncado: linhas.length >= 1500
  });
}

function registrarVenda_(o) {
  const com = comissaoDe_(o.barbeiro), valor = r2_(o.valor), base = o.resgate ? r2_(o.base) : valor;   // corte grátis: a casa paga a comissão sobre o preço de tabela
  const vCom = r2_(base * com / 100), lucro = r2_(valor - vCom);
  acrescentar_(vd_(), CAB_VD, [o.data, o.hora, o.barbeiro, seguro_(o.servico), o.categoria, seguro_(o.cliente || ''), seguro_(o.telefone || ''),
    valor, com, vCom, lucro, valor ? r2_(lucro / valor * 100) : 0, o.origem, agoraBR_(), o.por, o.chave,
    String(o.email || '').toLowerCase(), o.resgate ? 'sim' : ''], FMT_VD);
  // corte vinculado a um cadastro = mais uma munição no revólver do cliente (avisa no sino dele)
  try {
    const em = String(o.email || '').toLowerCase(), meta = metaCortes_();
    if (em && meta && o.categoria === 'corte' && !o.resgate) {
      const f = fidDe_(mapaFid_(), em, meta);
      if (f.progresso === 0) notificar_(em, 'municao', 'Tambor cheio! Corte grátis', 'Você completou ' + meta + ' cortes e ganhou 1 corte grátis. Avise o barbeiro ao chegar.', '', false);
      else notificar_(em, 'municao', 'Nova munição no seu revólver', 'Corte registrado: ' + f.progresso + ' de ' + meta + ' balas. Faltam ' + f.faltam + (f.faltam === 1 ? ' corte' : ' cortes') + ' para o grátis.', '', false);
    }
  } catch (e) {}
}
const valorOk_ = v => { const n = Number(String(v).replace(',', '.')); return isFinite(n) && n >= 0 && n <= 99999 ? n : null; };

// Quantos minutos antes do horário marcado o cliente foi atendido (0 = no horário ou atrasado; menos de 15 min de folga não conta)
function minutosAntes_(data, hora) {
  const m = String(hora).split(':'), marc = Number(m[0]) * 60 + (Number(m[1]) || 0);
  const a = agora_().split(':'), agora = Number(a[0]) * 60 + Number(a[1]);
  const dif = diasEntre_(hoje_(), data) * 1440 + marc - agora;
  return dif >= 15 ? dif : 0;
}

// Núcleo: marca o horário como concluído (vira venda) ou "faltou". Devolve {ok, antecipado} ou {erro}
function concluirAgenda_(d, q, servicoNome) {
  const status = d.status === 'faltou' ? 'faltou' : 'concluido';
  const sh = ag_(), v = sh.getDataRange().getValues();
  for (let i = 1; i < v.length; i++) {
    if (dataTxt_(v[i][0]) !== d.data || horaTxt_(v[i][1]) !== d.hora || v[i][2] !== d.barbeiro) continue;
    if (String(v[i][8] || '').trim() === 'recusado') continue;
    if (q.papel !== 'dono' && v[i][2] !== q.nome) return { erro: 'Sem permissão para este horário.' };
    if (String(v[i][8] || '').trim()) return { erro: 'Este horário já foi finalizado.' };
    const sv = servicos_().filter(s => s.nome === (servicoNome || v[i][3]))[0];
    let valor = sv ? precoPromo_(sv.preco, promoPara_(promos_(), sv.nome, d.data)) : 0, gratis = false;
    const emailCli = String(v[i][7] || '').toLowerCase();
    if (d.gratis && status === 'concluido') {                       // resgate do corte grátis do cartão fidelidade
      const meta = metaCortes_();
      if (!meta || !sv || sv.categoria !== 'corte' || !emailCli || fidDe_(mapaFid_(), emailCli, meta).creditos < 1) return { erro: 'Este cliente não tem corte grátis disponível para este serviço.' };
      gratis = true; valor = 0;
    } else if (q.papel === 'dono' && d.valor !== undefined && d.valor !== '') {
      const x = valorOk_(d.valor); if (x === null) return { erro: 'Valor inválido.' }; valor = x;
    }
    const antes = status === 'concluido' ? minutosAntes_(d.data, d.hora) : 0;
    const c = sh.getRange(i + 1, 9, 1, 3); c.setNumberFormats([['@', '@', '@']]); c.setValues([[status, agoraBR_(), antes ? String(antes) : '']]);
    if (String(v[i][11] || '') === 'pendente') { const cc = sh.getRange(i + 1, 12); cc.setNumberFormat('@'); cc.setValue('confirmado'); }
    if (status === 'concluido') {
      registrarVenda_({ data: dataTxt_(v[i][0]), hora: horaTxt_(v[i][1]), barbeiro: String(v[i][2]), servico: sv ? sv.nome : String(v[i][3]),
        categoria: sv ? sv.categoria : 'outro', cliente: String(v[i][4]), telefone: String(v[i][5]), valor: valor, origem: 'agenda',
        email: emailCli, resgate: gratis, base: sv ? sv.preco : 0, por: q.email, chave: [dataTxt_(v[i][0]), horaTxt_(v[i][1]), v[i][2]].join('|') });
    }
    return { ok: true, antecipado: antes };
  }
  return { erro: 'Agendamento não encontrado.' };
}
function adminConcluir_(d, q) {
  const r = concluirAgenda_(d, q, null);
  return r.erro ? erro_(r.erro) : json_({ ok: true, antecipado: r.antecipado });
}

// Horário ainda aberto do mesmo cliente (e-mail, ou nome igual) com o mesmo barbeiro, hoje ou nos próximos dias
function acharAgendaAberta_(barbeiro, emailCli, nome) {
  const hoje = hoje_(), nm = String(nome || '').trim().toLowerCase();
  if (!emailCli && !nm) return null;
  const v = ag_().getDataRange().getValues();
  let melhor = null;
  for (let i = 1; i < v.length; i++) {
    const dt = dataTxt_(v[i][0]);
    if (!dt || dt < hoje || String(v[i][8] || '').trim() || String(v[i][2]) !== barbeiro) continue;
    const ok = emailCli ? String(v[i][7]).toLowerCase() === emailCli : String(v[i][4]).trim().toLowerCase() === nm;
    if (!ok) continue;
    const k = dt + ' ' + horaTxt_(v[i][1]);
    if (!melhor || k < melhor.k) melhor = { k: k, data: dt, hora: horaTxt_(v[i][1]) };
  }
  return melhor;
}

// Cliente que chegou sem marcar
function adminVendaAvulsa_(d, q) {
  const sv = servicos_().filter(s => s.nome === d.servico)[0];
  if (!sv) return erro_('Escolha um serviço.');
  const barbeiro = q.papel === 'dono' ? String(d.barbeiro || '') : q.nome;
  if (!equipe_().some(p => p.nome === barbeiro && p.ativo)) return erro_('Escolha o barbeiro.');
  let valor = precoPromo_(sv.preco, promoPara_(promos_(), sv.nome, hoje_())), gratis = false;
  const emailCli = emailOk_(d.email) ? String(d.email).trim().toLowerCase() : '';
  if (d.gratis) {
    const meta = metaCortes_();
    if (!meta || sv.categoria !== 'corte' || !emailCli || fidDe_(mapaFid_(), emailCli, meta).creditos < 1) return erro_('Este cliente não tem corte grátis disponível. Informe o e-mail da conta dele no site.');
    gratis = true; valor = 0;
  } else if (q.papel === 'dono' && d.valor !== undefined && d.valor !== '') {
    const x = valorOk_(d.valor); if (x === null) return erro_('Valor inválido.'); valor = x;
  }
  const aberta = acharAgendaAberta_(barbeiro, emailCli, d.cliente);     // o cliente tinha horário marcado? então ele sai da agenda
  if (aberta) {
    const r = concluirAgenda_({ status: 'concluido', data: aberta.data, hora: aberta.hora, barbeiro: barbeiro, gratis: !!d.gratis, valor: d.valor }, q, sv.nome);
    if (r.erro) return erro_(r.erro);
    return json_({ ok: true, agenda: { data: aberta.data, hora: aberta.hora }, antecipado: r.antecipado });
  }
  registrarVenda_({ data: hoje_(), hora: agora_(), barbeiro: barbeiro, servico: sv.nome, categoria: sv.categoria,
    cliente: limpo_(d.cliente, 80) || 'Sem agendamento', telefone: '', valor: valor, origem: 'avulsa', email: emailCli, resgate: gratis, base: sv.preco,
    por: q.email, chave: 'avulsa|' + Utilities.getUuid() });
  return json_({ ok: true });
}

// Cancelar um horário em nome do cliente (ex.: pediu pelo WhatsApp)
function adminCancelar_(d, q) {
  const sh = ag_(), v = sh.getDataRange().getValues();
  for (let i = 1; i < v.length; i++) {
    if (dataTxt_(v[i][0]) === d.data && horaTxt_(v[i][1]) === d.hora && v[i][2] === d.barbeiro) {
      if (String(v[i][8] || '').trim() === 'recusado') continue;
      if (q.papel !== 'dono' && v[i][2] !== q.nome) return erro_('Sem permissão para este horário.');
      if (String(v[i][8] || '').trim()) return erro_('Este horário já foi finalizado.');
      sh.deleteRow(i + 1);
      const em = String(v[i][7] || '').toLowerCase();
      if (em) notificar_(em, 'cancelado', 'Horário cancelado', 'A barbearia cancelou seu horário de ' + dataBR_(d.data) + ' às ' + d.hora + ' (' + String(v[i][3]) + '). Marque outro quando quiser.', '', true);
      return json_({ ok: true });
    }
  }
  return erro_('Agendamento não encontrado.');
}

// Relatório de vendas (só dono)
function adminRelatorio_(d, q) {
  const hoje = hoje_(), ehDono = !q || q.papel === 'dono';   // barbeiro só enxerga as próprias vendas, sem o lucro da casa
  let de = isoOk_(d.de) ? d.de : hoje.slice(0, 8) + '01', ate = isoOk_(d.ate) ? d.ate : hoje;
  if (ate < de) ate = de;
  const rows = vd_().getDataRange().getValues().slice(1).filter(l => String(l[0]).trim()).map(l => ({
    data: dataTxt_(l[0]), hora: horaTxt_(l[1]), barbeiro: String(l[2]), servico: String(l[3]), categoria: String(l[4]), cliente: String(l[5]),
    valor: Number(l[7]) || 0, comissaoPct: Number(l[8]) || 0, comissao: Number(l[9]) || 0, lucro: Number(l[10]) || 0,
    margem: Number(l[11]) || 0, origem: String(l[12]), chave: String(l[15]), gratis: String(l[17]) === 'sim'
  })).filter(r => r.data >= de && r.data <= ate && (ehDono || r.barbeiro === q.nome));
  if (!ehDono) rows.forEach(r => { r.lucro = 0; r.margem = 0; });
  const tot = { qtd: rows.length, bruto: 0, comissao: 0, lucro: 0, cortes: 0, gratis: 0 };
  const porSrv = {}, porBar = {}, porDia = {};
  rows.forEach(r => {
    tot.bruto += r.valor; tot.comissao += r.comissao; tot.lucro += r.lucro;
    if (r.categoria === 'corte') tot.cortes++;
    if (r.gratis) tot.gratis++;
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
    historico: rows.sort((a, b) => (b.data + b.hora).localeCompare(a.data + a.hora)).slice(0, Math.min(2000, Math.max(50, Number(d.limite) || 300))), total: rows.length
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
        if (dataTxt_(a[j][0]) === p[0] && horaTxt_(a[j][1]) === p[1] && a[j][2] === p[2] && String(a[j][8] || '').trim() !== 'recusado') { ag.getRange(j + 1, 9, 1, 3).setValues([['', '', '']]); break; }
      }
    }
    return json_({ ok: true });
  }
  return erro_('Venda não encontrada.');
}


// Cadastra UM barbeiro novo pela Área privada. Quem tem o e-mail na equipe entra na Área privada só da própria agenda.
function adminBarbeiroCadastrar_(d) {
  const email = limpo_(d.email, 80).toLowerCase(), ehDono = d.papel === 'dono';
  if (!limpo_(d.nome, 40)) return erro_(ehDono ? 'Informe o nome do dono.' : 'Informe o nome do barbeiro.');
  if (!emailOk_(email)) return erro_('Informe um e-mail válido. É com ele que a pessoa entra no site.');
  if (email === dono_()) return erro_('Esse e-mail é o do dono principal.');
  const r = validarPessoa_(Object.assign({}, d, { email: email, atende: ehDono ? !!d.atende : d.atende !== false, ativo: true }), ehDono ? 0 : COMISSAO_PADRAO);
  if (r.erro) return erro_(r.erro);
  const p = r.pessoa, atuais = equipe_();
  const igual = atuais.filter(x => x.email === email)[0];
  if (igual) return erro_('Esse e-mail já está cadastrado como ' + igual.nome + (igual.ativo ? '.' : ' (inativo): reative na lista abaixo.'));
  const mesmoNome = atuais.filter(x => x.nome.toLowerCase() === p.nome.toLowerCase())[0];
  if (mesmoNome) return erro_('Já existe alguém com o nome ' + p.nome + '. Use outro nome (ex.: com sobrenome).');
  acrescentar_(eq_(), CAB_EQ, linhaEq_(p), FMT_EQ);
  limparCache_();
  return json_({ ok: true, temConta: !!acharUsuario_(email) });
}

// Importa a foto de uma marca a partir de um link (o servidor baixa e guarda no Drive)
// Baixa uma imagem de um link https, confere que é mesmo imagem e guarda no Drive. Devolve {id} ou {erro}
function imagemDeUrl_(url0, prefixo) {
  const url = String(url0 || '').trim();
  if (url.length > 1500 || !/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}(:\d+)?(\/\S*)?$/i.test(url)) return { erro: 'Cole o endereço completo da imagem, começando com https://' };
  let resp;
  try { resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true, followRedirects: true, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BarbeariaSite/1.0)' } }); }
  catch (e) { return { erro: 'Não consegui abrir esse link. Confira o endereço.' }; }
  if (resp.getResponseCode() !== 200) return { erro: 'O site respondeu com erro ' + resp.getResponseCode() + '. Tente outro link.' };
  const b = resp.getBlob().getBytes();
  if (b.length < 500 || b.length > 8000000) return { erro: 'A imagem é pequena ou grande demais (máximo 8 MB).' };
  let tipo = '';
  if (b[0] === -1 && b[1] === -40) tipo = 'jpg';
  else if (b[0] === -119 && b[1] === 80 && b[2] === 78 && b[3] === 71) tipo = 'png';
  else if (b[0] === 71 && b[1] === 73 && b[2] === 70 && b[3] === 56) tipo = 'gif';
  else if (b[0] === 82 && b[1] === 73 && b[2] === 70 && b[3] === 70 && b[8] === 87 && b[9] === 69 && b[10] === 66 && b[11] === 80) tipo = 'webp';
  if (!tipo) return { erro: 'Esse link não é de uma imagem JPG, PNG, WEBP ou GIF. Na foto, clique com o botão direito e escolha "Copiar endereço da imagem".' };
  const mime = { jpg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' }[tipo];
  const arq = pastaFotos_().createFile(Utilities.newBlob(b, mime, (prefixo || 'foto') + '-' + Date.now() + '.' + tipo));
  arq.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { id: arq.getId() };
}
// Foto vinda de upload (data URL) ou de link
function novaImagem_(d, prefixo) {
  if (d.imagem) return salvarImagem_(d.imagem, prefixo + '-' + Date.now());
  if (d.url) return imagemDeUrl_(d.url, prefixo);
  return { erro: 'Escolha uma foto ou cole o link dela.' };
}
function adminMarcaFotoUrl_(d) {
  const sh = mc_(), v = sh.getDataRange().getValues();
  let linha = -1;
  for (let i = 1; i < v.length; i++) if (String(v[i][0]) === String(d.id)) { linha = i; break; }
  if (linha < 0) return erro_('Marca não encontrada.');
  const r = imagemDeUrl_(d.url, 'marca');
  if (r.erro) return erro_(r.erro);
  const c = sh.getRange(linha + 1, 2); c.setNumberFormat('@'); c.setValue(r.id);
  if (v[linha][1]) lixeira_(String(v[linha][1]));
  limparCache_();
  return json_({ ok: true });
}
// Troca ou remove a foto de uma linha (corte do carrossel ou promoção): {id, imagem | url | remover}
function trocarFotoLinha_(sh, colFile, colUrl, d, prefixo) {
  const v = sh.getDataRange().getValues();
  for (let i = 1; i < v.length; i++) {
    if (String(v[i][0]) !== String(d.id)) continue;
    let novo = '';
    if (!d.remover) { const r = novaImagem_(d, prefixo); if (r.erro) return erro_(r.erro); novo = r.id; }
    const cf = sh.getRange(i + 1, colFile); cf.setNumberFormat('@'); cf.setValue(novo);      // só as duas células da imagem
    const cu = sh.getRange(i + 1, colUrl); cu.setNumberFormat('@'); cu.setValue('');
    if (v[i][colFile - 1]) lixeira_(String(v[i][colFile - 1]));
    limparCache_();
    return json_({ ok: true });
  }
  return erro_('Item não encontrado.');
}
const adminFotoImg_ = d => trocarFotoLinha_(ft_(), 2, 8, d, 'corte');
const adminPromoImg_ = d => trocarFotoLinha_(pr_(), 9, 10, d, 'promo');

// Promoções: o dono manda a lista inteira; o que não vier na lista é apagado
function adminPromosSalvar_(d) {
  const lista = Array.isArray(d.promos) ? d.promos : [];
  if (lista.length > 30) return erro_('Promoções demais (máximo 30). Apague as antigas.');
  const atuais = {}; promos_().forEach(p => { atuais[p.id] = p; });
  const nomesServ = servicos_().map(x => x.nome), usados = {}, linhas = [];
  for (let i = 0; i < lista.length; i++) {
    const p = lista[i] || {}, titulo = limpo_(p.titulo, 50);
    if (!titulo) return erro_('Toda promoção precisa de um título.');
    const desc = p.desconto === '' || p.desconto == null ? 0 : Number(String(p.desconto).replace(',', '.'));
    if (!isFinite(desc) || desc < 0 || desc > 100) return erro_('Desconto inválido em "' + titulo + '" (use de 0 a 100).');
    const servico = String(p.servico || '');
    if (servico && nomesServ.indexOf(servico) === -1) return erro_('O serviço de "' + titulo + '" não existe mais. Escolha outro.');
    const de = String(p.de || ''), ate = String(p.ate || '');
    if ((de && !isoOk_(de)) || (ate && !isoOk_(ate))) return erro_('Data inválida em "' + titulo + '".');
    if (de && ate && ate < de) return erro_('Em "' + titulo + '" a data final vem antes da inicial.');
    let id = String(p.id || ''); if (!atuais[id] || usados[id]) id = Utilities.getUuid().slice(0, 8);
    usados[id] = 1; const antigo = atuais[id] || {};
    let temaJson = antigo.temaTxt || '';
    if (p.tema !== undefined) { const t = temaOk_(p.tema); if (t.erro) return erro_(t.erro + ' (' + titulo + ')'); temaJson = t.json; }
    linhas.push([id, seguro_(titulo), seguro_(limpo_(p.desc, 140)), r2_(desc), servico, de, ate, simnao_(p.ativa !== false), antigo.fileId || '', antigo.url || '', i + 1, temaJson]);
  }
  Object.keys(atuais).forEach(id => { if (!usados[id]) lixeira_(atuais[id].fileId); });
  reescrever_(pr_(), CAB_PR, linhas, FMT_PR);
  limparCache_();
  return json_({ ok: true });
}

// ---------- Dashboard ----------
// Dono: tudo. Barbeiro: só os próprios números (e a comissão dele, não o lucro da casa).
function adminDashboard_(d, q) {
  const hoje = hoje_(), ehDono = q.papel === 'dono', p = hoje.split('-').map(Number);
  const mesIni = hoje.slice(0, 8) + '01';
  const fimMes = iso => { const x = iso.split('-').map(Number); return new Date(Date.UTC(x[0], x[1], 0)).toISOString().slice(0, 10); };
  let de, ate, rotulo;
  switch (String(d.periodo || 'mes')) {
    case 'hoje': de = ate = hoje; rotulo = 'Hoje'; break;
    case '7d': de = somarDias_(hoje, -6); ate = hoje; rotulo = 'Últimos 7 dias'; break;
    case '30d': de = somarDias_(hoje, -29); ate = hoje; rotulo = 'Últimos 30 dias'; break;
    case 'mes_ant': { const a = somarDias_(mesIni, -1); de = a.slice(0, 8) + '01'; ate = a; rotulo = 'Mês passado'; break; }
    case 'ano': de = p[0] + '-01-01'; ate = hoje; rotulo = 'Este ano'; break;
    default: de = mesIni; ate = hoje; rotulo = 'Este mês';
  }
  const dias = diasEntre_(de, ate) + 1, deAnt = somarDias_(de, -dias), ateAnt = somarDias_(de, -1);
  const bruto = vd_().getDataRange().getValues().slice(1).filter(l => String(l[0]).trim()).map(l => ({
    data: dataTxt_(l[0]), hora: horaTxt_(l[1]), barbeiro: String(l[2]), servico: String(l[3]), categoria: String(l[4]), cliente: String(l[5]),
    valor: Number(l[7]) || 0, comissao: Number(l[9]) || 0, lucro: Number(l[10]) || 0, email: String(l[16] || '').toLowerCase(), gratis: String(l[17]) === 'sim'
  })).filter(r => ehDono || r.barbeiro === q.nome);
  const todas = bruto.filter(r => r.data >= deAnt && r.data <= ate);
  const vHoje = bruto.filter(r => r.data === hoje), resumoHoje = { qtd: vHoje.length, bruto: r2_(vHoje.reduce((a, r) => a + r.valor, 0)), lucro: r2_(vHoje.reduce((a, r) => a + r.lucro, 0)) };
  const atual = todas.filter(r => r.data >= de), ant = todas.filter(r => r.data <= ateAnt);
  const soma = rows => {
    const t = { qtd: rows.length, bruto: 0, comissao: 0, lucro: 0, cortes: 0, gratis: 0, clientes: 0 }, cli = {};
    rows.forEach(r => {
      t.bruto += r.valor; t.comissao += r.comissao; t.lucro += r.lucro;
      if (r.categoria === 'corte') t.cortes++;
      if (r.gratis) t.gratis++;
      const k = r.email || r.cliente.toLowerCase(); if (k) cli[k] = 1;
    });
    t.clientes = Object.keys(cli).length;
    t.ticket = t.qtd ? t.bruto / t.qtd : 0;
    t.margem = t.bruto ? t.lucro / t.bruto * 100 : 0;
    Object.keys(t).forEach(k => { t[k] = r2_(t[k]); });
    if (!ehDono) { delete t.lucro; delete t.margem; }
    return t;
  };
  // série para o gráfico: por dia (até ~2 meses) ou por mês
  const mensal = dias > 62, mapa = {};
  atual.forEach(r => {
    const k = mensal ? r.data.slice(0, 7) : r.data, o = mapa[k] = mapa[k] || { qtd: 0, valor: 0, lucro: 0 };
    o.qtd++; o.valor += r.valor; o.lucro += ehDono ? r.lucro : r.comissao;
  });
  const serie = [];
  if (mensal) { for (let m = Number(de.slice(5, 7)); m <= Number(ate.slice(5, 7)); m++) { const k = de.slice(0, 4) + '-' + (m < 10 ? '0' : '') + m, o = mapa[k] || { qtd: 0, valor: 0, lucro: 0 }; serie.push({ k: k, qtd: o.qtd, valor: r2_(o.valor), lucro: r2_(o.lucro) }); } }
  else { for (let i = 0; i < dias; i++) { const k = somarDias_(de, i), o = mapa[k] || { qtd: 0, valor: 0, lucro: 0 }; serie.push({ k: k, qtd: o.qtd, valor: r2_(o.valor), lucro: r2_(o.lucro) }); } }
  const porBar = {}, porSrv = {}, semana = [0, 0, 0, 0, 0, 0, 0], semanaV = [0, 0, 0, 0, 0, 0, 0], hora = {};
  atual.forEach(r => {
    const b = porBar[r.barbeiro] = porBar[r.barbeiro] || { nome: r.barbeiro, qtd: 0, cortes: 0, valor: 0, comissao: 0, lucro: 0 };
    b.qtd++; b.valor += r.valor; b.comissao += r.comissao; b.lucro += r.lucro; if (r.categoria === 'corte') b.cortes++;
    const s = porSrv[r.servico] = porSrv[r.servico] || { nome: r.servico, qtd: 0, valor: 0 };
    s.qtd++; s.valor += r.valor;
    const w = diaSemana_(r.data); semana[w]++; semanaV[w] += r.valor;
    const h = String(r.hora).slice(0, 2); if (/^\d\d$/.test(h)) hora[h] = (hora[h] || 0) + 1;
  });
  const fix = o => { Object.keys(o).forEach(k => { if (typeof o[k] === 'number') o[k] = r2_(o[k]); }); return o; };
  const arr = o => Object.keys(o).map(k => fix(o[k]));
  // equipe sem vendas também aparece (zerada)
  if (ehDono) barbeiros_().forEach(b => { if (!porBar[b.nome]) porBar[b.nome] = { nome: b.nome, qtd: 0, cortes: 0, valor: 0, comissao: 0, lucro: 0 }; });
  const porBarbeiro = arr(porBar).map(b => { b.ticket = b.qtd ? r2_(b.valor / b.qtd) : 0; if (!ehDono) delete b.lucro; return b; }).sort((a, b) => b.valor - a.valor);
  // agenda
  const nomeOk = x => ehDono || String(x[2]) === q.nome;
  const ag = ag_().getDataRange().getValues().slice(1).filter(l => String(l[0]).trim() && nomeOk(l) && String(l[8] || '').trim() !== 'recusado');
  const fim7 = somarDias_(hoje, 7), agenda = { hoje: 0, hojeFeitos: 0, hojeFaltas: 0, hojeAbertos: 0, proximos7: 0, faltas: 0, semBaixa: 0, pendentes: 0 };
  ag.forEach(l => {
    const dt = dataTxt_(l[0]), st = String(l[8] || '').trim();
    if (dt === hoje) { agenda.hoje++; if (st === 'concluido') agenda.hojeFeitos++; else if (st === 'faltou') agenda.hojeFaltas++; else agenda.hojeAbertos++; }
    if (dt > hoje && dt <= fim7 && !st) agenda.proximos7++;
    if (!st && dt >= hoje && String(l[11] || '') === 'pendente') agenda.pendentes++;
    if (dt >= de && dt <= ate && st === 'faltou') agenda.faltas++;
    if (dt < hoje && dt >= somarDias_(hoje, -30) && !st) agenda.semBaixa++;
  });
  const out = {
    ok: true, papel: q.papel, nome: q.nome, periodo: String(d.periodo || 'mes'), rotulo: rotulo, de: de, ate: ate, deAnt: deAnt, ateAnt: ateAnt, hoje: hoje,
    totais: soma(atual), anterior: soma(ant), mensal: mensal, serie: serie, porBarbeiro: porBarbeiro,
    porServico: arr(porSrv).sort((a, b) => b.qtd - a.qtd).slice(0, 8),
    semana: semana, semanaValor: semanaV.map(r2_),
    horas: Object.keys(hora).sort().map(h => ({ h: h, qtd: hora[h] })), agenda: agenda, hojeVendas: resumoHoje
  };
  if (ehDono) {
    const meta = metaCortes_(), f = { ativo: !!meta, meta: meta, clientesComCredito: 0, creditosAbertos: 0, quaseLa: 0, custoGratis: 0 };
    if (meta) {
      const mf = mapaFid_();
      Object.keys(mf).forEach(e => { const x = fidDe_(mf, e, meta); if (x.creditos > 0) { f.clientesComCredito++; f.creditosAbertos += x.creditos; } else if (x.progresso >= meta - 1 && meta > 1) f.quaseLa++; });
      f.custoGratis = r2_(-atual.filter(r => r.gratis).reduce((a, r) => a + r.lucro, 0));
    }
    out.fid = f;
    out.equipe = { ativos: equipe_().filter(x => x.ativo && x.papel === 'barbeiro').length };
    out.bloqPendentes = bloqueios_().filter(b => b.status === 'pendente').length;
  }
  return json_(out);
}

// Tudo o que o painel do dono precisa para editar
function adminDados_() {
  const c = cfg_(), conf = {};
  Object.keys(CFG_PADRAO).forEach(k => { conf[k] = c[k]; });
  semearFotos_();
  return json_({ ok: true, servicos: servicos_(), equipe: equipe_(), fotos: fotos_(), promos: promos_(), galeria: galeria_(), hoje: hoje_(), marcas: marcas_(), config: conf, comissaoPadrao: COMISSAO_PADRAO, dono: String(DONO_EMAIL).trim().toLowerCase() });
}

function adminSalvarServicos_(d) {
  const lista = Array.isArray(d.servicos) ? d.servicos : [];
  if (lista.length > 60) return erro_('Serviços demais.');
  const vistos = {}, linhas = [], renomes = [];
  for (let i = 0; i < lista.length; i++) {
    const s = lista[i] || {}, nome = limpo_(s.nome, 40);
    if (!nome) return erro_('Todo serviço precisa de nome.');
    if (vistos[nome.toLowerCase()]) return erro_('Nome de serviço repetido: ' + nome);
    vistos[nome.toLowerCase()] = 1;
    if (s.antigo && String(s.antigo) !== nome) renomes.push([String(s.antigo), nome]);
    const preco = valorOk_(s.preco);
    if (preco === null) return erro_('Preço inválido em ' + nome + '.');
    linhas.push([seguro_(nome), r2_(preco), ICONES.indexOf(s.icone) !== -1 ? s.icone : 'tesoura', seguro_(limpo_(s.desc, 90)),
      simnao_(!!s.destaque), CATEGORIAS.indexOf(s.categoria) !== -1 ? s.categoria : 'outro', simnao_(s.ativo !== false)]);
  }
  if (!linhas.some(l => l[6] === 'sim')) return erro_('Deixe pelo menos um serviço ativo.');
  reescrever_(sv_(), CAB_SV, linhas, ['@', '0.##', '@', '@', '@', '@', '@']);
  renomes.forEach(r => renomearChaveGaleria_('servico', r[0], r[1]));
  limparCache_();
  return json_({ ok: true });
}

function adminSalvarEquipe_(d) {
  const lista = Array.isArray(d.equipe) ? d.equipe : [];
  if (lista.length > 30) return erro_('Equipe grande demais.');
  const dono = dono_(), antigos = equipe_();
  const nomes = {}, emails = {}, pessoas = [], renomes = [];
  for (let i = 0; i < lista.length; i++) {
    const r = validarPessoa_(lista[i] || {}, 0);
    if (r.erro) return erro_(r.erro);
    const p = r.pessoa;
    if (nomes[p.nome.toLowerCase()]) return erro_('Nome repetido: ' + p.nome);
    nomes[p.nome.toLowerCase()] = 1;
    if (p.email) { if (emails[p.email]) return erro_('E-mail repetido: ' + p.email); emails[p.email] = 1; }
    const ant = (p.email && antigos.filter(o => o.email === p.email)[0]) || antigos.filter(o => o.nome.toLowerCase() === p.nome.toLowerCase())[0];
    p.foto = ant ? ant.foto : '';                                      // a foto é trocada só pelo envio de imagem
    if (dono && p.email === dono) p.papel = 'dono';
    if (lista[i].antigo && String(lista[i].antigo) !== p.nome) renomes.push([String(lista[i].antigo), p.nome]);
    pessoas.push(p);
  }
  const linhas = pessoas.map(linhaEq_);
  if (emailOk_(dono) && !emails[dono]) linhas.unshift(linhaEq_({ email: dono, nome: 'Dono', papel: 'dono', comissao: 0, atende: false }));
  // quem sumiu da lista continua existindo como "inativo" (não perde o histórico de agendas e vendas)
  antigos.forEach(old => {
    if (!nomes[old.nome.toLowerCase()] && !(dono && old.email && old.email === dono) && !(old.email && emails[old.email])) {
      linhas.push(linhaEq_(Object.assign({}, old, { atende: false, ativo: false })));
    }
  });
  if (!linhas.some(l => l[7] === 'sim' && l[4] === 'sim')) return erro_('Deixe pelo menos um barbeiro ativo que atende clientes.');
  if (!linhas.some(l => l[2] === 'dono' && l[0] && l[7] === 'sim')) return erro_('Precisa existir pelo menos um dono ativo com e-mail, senão ninguém acessa a Área privada.');
  reescrever_(eq_(), CAB_EQ, linhas, FMT_EQ);
  renomes.forEach(r => renomearChaveGaleria_('certificado', r[0], r[1]));
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
  ['exigirConfirmacao', 'emailAvisos'].forEach(k => { if (n[k] !== undefined) novo[k] = (n[k] === true || n[k] === 1 || n[k] === '1' || n[k] === 'sim') ? '1' : '0'; });
  if (n.metaCortes !== undefined) novo.metaCortes = String(inteiro_(n.metaCortes, 7, 0, 30));
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
  if (fotos.length >= 30) return erro_('Limite de 30 cortes no carrossel. Apague algum para adicionar outro.');
  const titulo = limpo_(d.titulo, 40);
  if (!titulo) return erro_('Dê um título para o corte.');
  let fileId = '';
  if (d.imagem || d.url) { const r = novaImagem_(d, 'corte'); if (r.erro) return erro_(r.erro); fileId = r.id; }
  const ordem = fotos.length ? Math.max.apply(null, fotos.map(f => f.ordem)) + 1 : 1;
  acrescentar_(ft_(), CAB_FT, [Utilities.getUuid().slice(0, 8), fileId, seguro_(titulo), seguro_(limpo_(d.desc, 60)), seguro_(limpo_(d.servico, 40)), ordem, agoraBR_(), ''], FMT_FT);
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
      n.ordem !== undefined ? inteiro_(n.ordem, a.ordem, 0, 999) : a.ordem, '', a.url];
  });
  reescrever_(ft_(), CAB_FT, linhas, FMT_FT);
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
function trocarImagemCfg_(chave, imagem, prefixo) {
  const r = salvarImagem_(imagem, prefixo + '-' + Date.now());
  if (r.erro) return erro_(r.erro);
  const c = cfg_(), antigo = c[chave];
  c[chave] = r.id;
  reescrever_(cf_(), CAB_CF, Object.keys(CFG_PADRAO).map(k => [k, String(c[k] == null ? '' : c[k])]), FMT_TXT(2));
  if (antigo) lixeira_(antigo);
  limparCache_();
  return json_({ ok: true });
}
function removerImagemCfg_(chave) {
  const c = cfg_(), antigo = c[chave];
  c[chave] = '';
  reescrever_(cf_(), CAB_CF, Object.keys(CFG_PADRAO).map(k => [k, String(c[k] == null ? '' : c[k])]), FMT_TXT(2));
  if (antigo) lixeira_(antigo);
  limparCache_();
  return json_({ ok: true });
}
const adminFotoFachada_ = d => trocarImagemCfg_('fotoFachada', d.imagem, 'fachada');
const adminFotoFachadaDel_ = () => removerImagemCfg_('fotoFachada');

// Marcas dos produtos usadas na barbearia (carrossel). Lista completa: nomes, textos, ordem. Fotos vão por admin_marca_foto.
function adminMarcasSalvar_(d) {
  const lista = Array.isArray(d.marcas) ? d.marcas : [];
  if (lista.length > 30) return erro_('Marcas demais.');
  const atuais = marcas_(), porId = {}; atuais.forEach(m => { porId[m.id] = m; });
  const vistos = {}, linhas = [];
  for (let i = 0; i < lista.length; i++) {
    const m = lista[i] || {}, nome = limpo_(m.nome, 40);
    if (!nome) return erro_('Toda marca precisa de nome.');
    if (vistos[nome.toLowerCase()]) return erro_('Marca repetida: ' + nome);
    vistos[nome.toLowerCase()] = 1;
    const antiga = porId[String(m.id)];
    linhas.push([antiga ? antiga.id : 'm' + Utilities.getUuid().slice(0, 7), antiga ? antiga.fileId : '', seguro_(nome), seguro_(limpo_(m.desc, 70)), i + 1]);
  }
  const mantidos = {}; linhas.forEach(l => { mantidos[l[0]] = 1; });
  atuais.forEach(a => { if (!mantidos[a.id] && a.fileId) lixeira_(a.fileId); });     // marca apagada: foto vai para a lixeira
  reescrever_(mc_(), CAB_MC, linhas, ['@', '@', '@', '@', '0']);
  limparCache_();
  return json_({ ok: true });
}
function adminMarcaFoto_(d) {
  const sh = mc_(), v = sh.getDataRange().getValues();
  for (let i = 1; i < v.length; i++) {
    if (String(v[i][0]) !== String(d.id)) continue;
    const r = d.remover ? { id: '' } : salvarImagem_(d.imagem, 'marca-' + Date.now());
    if (r.erro) return erro_(r.erro);
    const c = sh.getRange(i + 1, 2); c.setNumberFormat('@'); c.setValue(r.id);
    if (v[i][1]) lixeira_(String(v[i][1]));
    limparCache_();
    return json_({ ok: true });
  }
  return erro_('Marca não encontrada.');
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
//  PERFIL DA EQUIPE · CONFIRMAÇÃO DE HORÁRIOS · AVISOS · CLIENTES · AVALIAÇÕES · BLOQUEIOS · GALERIAS
// =====================================================================
const HORA_OK = s => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(s || ''));
const dono_ = () => String(DONO_EMAIL).trim().toLowerCase();
const dataBR_ = iso => NOMES_DIA[diaSemana_(iso)].slice(0, 3) + ' ' + iso.slice(8, 10) + '/' + iso.slice(5, 7);
const lista_ = (txt, max) => String(txt || '').split('|').map(s => s.trim()).filter(Boolean).slice(0, max);
function horariosDe_(txt) { try { const o = JSON.parse(txt || '{}'); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } }

// Linha da aba Equipe a partir de uma pessoa (tolera campos que faltam)
function linhaEq_(p) {
  const l = a => (Array.isArray(a) ? a : []).join(' | ');
  return [p.email || '', seguro_(p.nome), p.papel === 'dono' ? 'dono' : 'barbeiro', p.comissao === undefined || p.comissao === '' ? COMISSAO_PADRAO : p.comissao,
    simnao_(!!p.atende), seguro_(l(p.cursos)), seguro_(p.obs || ''), simnao_(p.ativo !== false), p.telefone || '',
    p.foto || '', seguro_(p.instagram || ''), p.idade ? String(p.idade) : '', p.genero || '', seguro_(l(p.especialidades)),
    p.anos ? String(p.anos) : '', seguro_(p.bio || ''), p.horarios && Object.keys(p.horarios).length ? JSON.stringify(p.horarios) : ''];
}

// Horário de trabalho de cada dia da semana: { "1": {a:"09:00", f:"18:00", pa:"12:00", pf:"13:00"}, "0": {off:true} }
function horariosOk_(h, nome) {
  const out = {};
  if (!h || typeof h !== 'object') return { h: out };
  for (let d = 0; d <= 6; d++) {
    const x = h[d] !== undefined ? h[d] : h[String(d)];
    if (!x || typeof x !== 'object') continue;
    if (x.off) { out[d] = { off: true }; continue; }
    if (!HORA_OK(x.a) || !HORA_OK(x.f) || x.a >= x.f) return { erro: 'Horário de ' + nome + ' (' + NOMES_DIA[d] + '): o fim precisa ser depois do início.' };
    const o = { a: x.a, f: x.f };
    if (x.pa || x.pf) {
      if (!HORA_OK(x.pa) || !HORA_OK(x.pf) || x.pa >= x.pf || x.pa < x.a || x.pf > x.f) return { erro: 'Pausa de ' + nome + ' (' + NOMES_DIA[d] + ') inválida: ela precisa ficar dentro do expediente.' };
      o.pa = x.pa; o.pf = x.pf;
    }
    out[d] = o;
  }
  return { h: out };
}
// Confere e limpa todos os campos de um profissional. Devolve {erro} ou {pessoa}
function validarPessoa_(p, comPadrao) {
  const nome = limpo_(p.nome, 40);
  if (!nome) return { erro: 'Todo profissional precisa de nome.' };
  const email = limpo_(p.email, 80).toLowerCase();
  if (email && !emailOk_(email)) return { erro: 'E-mail inválido de ' + nome + '.' };
  const com = valorOk_(p.comissao === undefined || p.comissao === null || p.comissao === '' ? comPadrao : p.comissao);
  if (com === null || com > 100) return { erro: 'A comissão de ' + nome + ' deve ficar entre 0 e 100.' };
  const tel = String(p.telefone || '').replace(/\D/g, '');
  if (tel && (tel.length < 10 || tel.length > 13)) return { erro: 'Telefone inválido de ' + nome + '. Use DDD + número.' };
  const insta = String(p.instagram || '').trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').replace(/[\/?].*$/, '');
  if (!/^[A-Za-z0-9._]{0,30}$/.test(insta)) return { erro: 'Instagram inválido de ' + nome + '.' };
  const num = (v, min, max, rot) => {
    if (v === undefined || v === null || String(v).trim() === '' || Number(v) === 0) return 0;      // vazio ou 0 = não informado
    const n = parseInt(v, 10);
    return n >= min && n <= max ? n : null;
  };
  const idade = num(p.idade, 14, 90); if (idade === null) return { erro: 'Idade inválida de ' + nome + ' (use de 14 a 90).' };
  const anos = num(p.anos, 0, 60); if (anos === null) return { erro: 'Anos de experiência inválidos de ' + nome + ' (use de 0 a 60).' };
  const itens = (v, n, max) => (Array.isArray(v) ? v : []).map(c => limpo_(String(c).replace(/\|/g, ' '), max)).filter(Boolean).slice(0, n);
  const hr = horariosOk_(p.horarios, nome); if (hr.erro) return hr;
  return { pessoa: {
    email: email, nome: nome, papel: p.papel === 'dono' ? 'dono' : 'barbeiro', comissao: r2_(com), atende: !!p.atende,
    cursos: itens(p.cursos, 10, 70), obs: limpo_(p.obs, 160), ativo: p.ativo !== false, telefone: tel, foto: '',
    instagram: insta, idade: idade, genero: ['masculino', 'feminino', 'outro'].indexOf(p.genero) !== -1 ? p.genero : '',
    especialidades: itens(p.especialidades, 8, 40), anos: anos, bio: limpo_(p.bio, 400), horarios: hr.h
  } };
}

// Janela de trabalho do profissional naquele dia: undefined = vale o horário da barbearia, null = folga
function janelaDe_(p, data) {
  const x = p.horarios && p.horarios[diaSemana_(data)];
  if (!x) return undefined;
  return x.off ? null : x;
}

function renomearChaveGaleria_(tipo, de, para) {
  if (!de || !para || de === para) return;
  const sh = gl_(), v = sh.getDataRange().getValues(); let mudou = false;
  const col = v.slice(1).map(l => { if (String(l[1]) === tipo && String(l[2]) === de) { mudou = true; return [para]; } return [l[2]]; });
  if (mudou) { const r = sh.getRange(2, 3, col.length, 1); r.setNumberFormat('@'); r.setValues(col); limparCache_(); }
}

// ---------- Avisos (sino dentro do site + e-mail opcional) ----------
function emailAviso_(para, assunto, corpo) {
  try {
    if (!emailOk_(para) || String(cfg_().emailAvisos) === '0') return;
    const nome = cfg_().nome || 'Barbearia';
    MailApp.sendEmail({ to: para, subject: '[' + nome + '] ' + assunto, body: corpo + '\n\nAbra o site: ' + SITE_URL, name: nome });
  } catch (e) {}
}
function notificar_(para, tipo, titulo, texto, ref, comEmail) {
  para = String(para || '').trim().toLowerCase();
  if (!para) return;
  try {
    const sh = nt_();
    acrescentar_(sh, CAB_NT, [Utilities.getUuid().slice(0, 8), para, tipo, seguro_(limpo_(titulo, 80)), seguro_(limpo_(texto, 240)), agoraBR_(), '', limpo_(ref || '', 120)], FMT_TXT(8));
    if (sh.getLastRow() > 600) sh.deleteRows(2, 300);                 // mantém a aba pequena
    CacheService.getScriptCache().remove('nt_' + para);
  } catch (e) {}
  if (comEmail) emailAviso_(para, titulo, texto);
}
function notifLer_(email) {
  return nt_().getDataRange().getValues().slice(1).filter(l => String(l[1]).toLowerCase() === email).map(l => ({
    id: String(l[0]), tipo: String(l[2]), titulo: String(l[3]), texto: String(l[4]), quando: String(l[5]), lida: String(l[6]) === 'sim', ref: String(l[7] || '')
  }));
}
// Consulta barata (usa cache): devolve só o contador; a lista vem quando algo mudou ou quando pedida
function notificacoes_(d, email) {
  const cache = CacheService.getScriptCache(), chave = 'nt_' + email;
  let todas = null, r = null;
  const c = cache.get(chave);
  if (c) r = JSON.parse(c);
  else {
    todas = notifLer_(email);
    r = { n: todas.filter(x => !x.lida).length, ult: todas.length ? todas[todas.length - 1].id : '' };
    try { cache.put(chave, JSON.stringify(r), 21600); } catch (e) {}
  }
  const out = { ok: true, n: r.n, ult: r.ult };
  if (d.lista || String(d.ult || '') !== r.ult) { todas = todas || notifLer_(email); out.lista = todas.slice(-30).reverse(); }
  return json_(out);
}
function notificacoesLidas_(d, email) {
  const sh = nt_(), n = sh.getLastRow();
  if (n < 2) return json_({ ok: true });
  const v = sh.getRange(2, 1, n - 1, 7).getValues(), ids = Array.isArray(d.ids) ? d.ids.map(String) : [];
  let mudou = false;
  const col = v.map(l => {
    if (String(l[1]).toLowerCase() === email && String(l[6]) !== 'sim' && (d.todas || ids.indexOf(String(l[0])) !== -1)) { mudou = true; return ['sim']; }
    return [String(l[6])];
  });
  if (mudou) { const r = sh.getRange(2, 7, col.length, 1); r.setNumberFormat('@'); r.setValues(col); CacheService.getScriptCache().remove('nt_' + email); }
  return json_({ ok: true });
}
function donos_() {
  const m = {};
  if (emailOk_(dono_())) m[dono_()] = 1;
  equipe_().forEach(p => { if (p.papel === 'dono' && p.ativo && p.email) m[p.email] = 1; });
  return Object.keys(m);
}
const emailDe_ = nome => (equipe_().filter(p => p.nome === nome && p.email)[0] || {}).email || '';

// ---------- Confirmar / recusar horários ----------
function decidirAgenda_(d, q, recusar) {
  const sh = ag_(), v = sh.getDataRange().getValues();
  for (let i = 1; i < v.length; i++) {
    if (dataTxt_(v[i][0]) !== d.data || horaTxt_(v[i][1]) !== d.hora || v[i][2] !== d.barbeiro) continue;
    if (String(v[i][8] || '').trim() === 'recusado') continue;
    if (q.papel !== 'dono' && v[i][2] !== q.nome) return erro_('Sem permissão para este horário.');
    if (String(v[i][8] || '').trim()) return erro_('Este horário já foi finalizado.');
    const em = String(v[i][7] || '').toLowerCase(), quando = dataBR_(d.data) + ' às ' + d.hora;
    if (recusar) {
      const motivo = limpo_(d.motivo, 160) || 'Horário indisponível.';
      const c = sh.getRange(i + 1, 9, 1, 5); c.setNumberFormats([FMT_TXT(5)]); c.setValues([['recusado', agoraBR_(), '', 'recusado', seguro_(motivo)]]);
      if (em) notificar_(em, 'recusado', 'Horário não confirmado', 'Seu horário de ' + quando + ' com ' + v[i][2] + ' não foi confirmado. Motivo: ' + motivo, '', true);
    } else {
      const era = String(v[i][11] || '');
      const c = sh.getRange(i + 1, 12); c.setNumberFormat('@'); c.setValue('confirmado');
      if (em && era === 'pendente') notificar_(em, 'confirmado', 'Horário confirmado', v[i][2] + ' confirmou seu horário: ' + v[i][3] + ', ' + quando + '.', '', true);
    }
    return json_({ ok: true });
  }
  return erro_('Agendamento não encontrado.');
}
const adminConfirmar_ = (d, q) => decidirAgenda_(d, q, false);
const adminRecusar_ = (d, q) => decidirAgenda_(d, q, true);

// Recusa (sem justificativa de barbeiro) os horários ainda pendentes de um cliente bloqueado
function recusarPendentes_(email, motivo) {
  const sh = ag_(), v = sh.getDataRange().getValues(), hoje = hoje_();
  let n = 0;
  for (let i = 1; i < v.length; i++) {
    if (String(v[i][7]).toLowerCase() !== email || String(v[i][8] || '').trim() || String(v[i][11] || '') !== 'pendente' || dataTxt_(v[i][0]) < hoje) continue;
    const c = sh.getRange(i + 1, 9, 1, 5); c.setNumberFormats([FMT_TXT(5)]); c.setValues([['recusado', agoraBR_(), '', 'recusado', motivo]]);
    n++;
  }
  return n;
}

// ---------- Avaliação de clientes (feita pelos barbeiros) e bloqueios ----------
const TAGS_AVAL = ['Pontual', 'Educado', 'Paga bem', 'Fiel', 'Indeciso', 'Atrasa', 'Faltou', 'Pechincha', 'Difícil'];
function avalMapa_() {
  const m = {};
  ac_().getDataRange().getValues().slice(1).forEach(l => {
    const e = String(l[0]).trim().toLowerCase(); if (!e) return;
    const o = m[e] = m[e] || { soma: 0, n: 0, tags: {}, lista: [] };
    const nota = Number(l[3]) || 0, tags = lista_(l[4], 6);
    o.soma += nota; o.n++;
    tags.forEach(t => { o.tags[t] = (o.tags[t] || 0) + 1; });
    o.lista.push({ barbeiro: String(l[2]), nota: nota, tags: tags, comentario: String(l[5] || ''), data: String(l[6] || '').slice(0, 10) });
  });
  return m;
}
// Resumo para ajudar o barbeiro a decidir se vale a pena aceitar o cliente
function cliResumo_(cortes, av, faltas, bloqueado) {
  const n = av ? av.n : 0, media = n ? Math.round(av.soma / n * 10) / 10 : 0;
  let risco = 'bom';
  if (bloqueado) risco = 'bloqueado';
  else if (!n && !faltas) risco = cortes > 0 ? 'conhecido' : 'novo';
  else if (faltas >= 3 || (n && media < 2.5)) risco = 'risco';
  else if (faltas >= 1 || (n && media < 3.5)) risco = 'atencao';
  return { media: media, n: n, faltas: faltas, risco: risco };
}
function bloqueios_() {
  return bq_().getDataRange().getValues().slice(1).filter(l => String(l[0]).trim()).map(l => ({
    id: String(l[0]), email: String(l[1]).toLowerCase(), cliente: String(l[2]), por: String(l[3]), motivo: String(l[4]), status: String(l[5]),
    pedidoEm: String(l[6] || ''), decididoPor: String(l[7] || ''), decididoEm: String(l[8] || ''), nota: String(l[9] || '')
  }));
}
const bloqueioAtivo_ = email => bloqueios_().filter(b => b.email === email && b.status === 'ativo')[0] || null;

function adminClienteAvaliar_(d, q) {
  const email = String(d.email || '').trim().toLowerCase(), u = acharUsuario_(email);
  if (!u) return erro_('Cliente não encontrado.');
  const sh = ac_(), v = sh.getDataRange().getValues();
  let linha = -1;
  for (let i = 1; i < v.length; i++) if (String(v[i][0]).toLowerCase() === email && String(v[i][2]) === q.nome) { linha = i; break; }
  if (d.remover) { if (linha >= 0) sh.deleteRow(linha + 1); return json_({ ok: true }); }
  const nota = Math.round(Number(d.nota));
  if (!(nota >= 1 && nota <= 5)) return erro_('Escolha de 1 a 5 estrelas.');
  const tags = (Array.isArray(d.tags) ? d.tags : []).filter((t, i, a) => TAGS_AVAL.indexOf(t) !== -1 && a.indexOf(t) === i).slice(0, 6);
  const row = [email, seguro_(u.nome), seguro_(q.nome), String(nota), tags.join(' | '), seguro_(limpo_(d.comentario, 200)), agoraBR_()];
  if (linha >= 0) { const r = sh.getRange(linha + 1, 1, 1, 7); r.setNumberFormats([FMT_TXT(7)]); r.setValues([row]); }
  else acrescentar_(sh, CAB_AC, row, FMT_TXT(7));
  return json_({ ok: true });
}

// Lista de clientes: cortes feitos, munições que faltam, corte grátis, avaliação e bloqueio
function adminClientes_(d, q) {
  const meta = metaCortes_(), fid = mapaFid_(), av = avalMapa_(), bl = bloqueios_(), hoje = hoje_();
  const equipeEmails = {}; equipe_().forEach(p => { if (p.email) equipeEmails[p.email] = 1; });
  equipeEmails[dono_()] = 1;
  const st = {};
  ag_().getDataRange().getValues().slice(1).forEach(l => {
    const e = String(l[7] || '').toLowerCase(), s = String(l[8] || '').trim();
    if (!e || s === 'recusado') return;
    const o = st[e] = st[e] || { marc: 0, faltas: 0, prox: '' };
    o.marc++;
    if (s === 'faltou') o.faltas++;
    const dt = dataTxt_(l[0]);
    if (!s && dt >= hoje && (!o.prox || dt < o.prox)) o.prox = dt;
  });
  const bloq = {}; bl.forEach(b => { if (b.status === 'ativo' || b.status === 'pendente') bloq[b.email] = b; });
  const lista = [];
  us_().getDataRange().getValues().slice(1).forEach(l => {
    const e = String(l[0]).trim().toLowerCase(); if (!e || equipeEmails[e]) return;
    const f = fidDe_(fid, e, meta), o = st[e] || { marc: 0, faltas: 0, prox: '' }, a = av[e], b = bloq[e], x = fid[e] || { cortes: 0, resg: 0, ult: '' };
    const total = x.cortes + x.resg, minha = a ? a.lista.filter(z => z.barbeiro === q.nome)[0] : null;
    lista.push({
      email: e, nome: String(l[1]), telefone: String(l[2]), desde: String(l[5] || '').slice(0, 10), foto: String(l[6] || ''),
      cortes: total, pagos: x.cortes, gratisUsados: x.resg, balas: f.progresso, faltam: f.faltam, creditos: f.creditos,
      ultimo: x.ult || '', marcacoes: o.marc, faltas: o.faltas, proxima: o.prox,
      aval: cliResumo_(total, a, o.faltas, !!b && b.status === 'ativo'),
      tags: a ? Object.keys(a.tags).sort((p, r) => a.tags[r] - a.tags[p]).slice(0, 4) : [],
      minha: minha ? { nota: minha.nota, tags: minha.tags, comentario: minha.comentario } : null,
      avaliacoes: a ? a.lista.slice(-30).reverse() : [],
      bloqueio: b ? { id: b.id, status: b.status, motivo: b.motivo, por: b.por } : null
    });
  });
  lista.sort((p, r) => p.nome.localeCompare(r.nome));
  const resumo = {
    total: lista.length, comGratis: lista.filter(c => c.creditos > 0).length,
    quaseLa: meta ? lista.filter(c => c.creditos === 0 && c.faltam === 1).length : 0,
    bloqueados: lista.filter(c => c.bloqueio && c.bloqueio.status === 'ativo').length,
    pedidos: bl.filter(b => b.status === 'pendente').length
  };
  const ehDono = q.papel === 'dono';
  return json_({ ok: true, meta: meta, resumo: resumo, lista: lista, tags: TAGS_AVAL, eu: q.nome,
    bloqueios: bl.filter(b => ehDono || b.por === q.nome).reverse().slice(0, 60) });
}

function adminBloqueioPedir_(d, q) {
  const email = String(d.email || '').trim().toLowerCase(), u = acharUsuario_(email);
  if (!u) return erro_('Cliente não encontrado.');
  if (email === dono_() || equipe_().some(p => p.email === email)) return erro_('Esse e-mail é da equipe e não pode ser bloqueado.');
  const motivo = limpo_(d.motivo, 300);
  if (motivo.length < 10) return erro_('Explique o motivo do bloqueio (mínimo de 10 letras). O dono usa essa justificativa para decidir.');
  const atual = bloqueios_().filter(b => b.email === email && (b.status === 'ativo' || b.status === 'pendente'))[0];
  if (atual) return erro_(atual.status === 'ativo' ? 'Este cliente já está bloqueado.' : 'Já existe um pedido de bloqueio em análise para este cliente.');
  const ehDono = q.papel === 'dono', id = Utilities.getUuid().slice(0, 8);
  acrescentar_(bq_(), CAB_BQ, [id, email, seguro_(u.nome), seguro_(q.nome), seguro_(motivo), ehDono ? 'ativo' : 'pendente', agoraBR_(),
    ehDono ? seguro_(q.nome) : '', ehDono ? agoraBR_() : '', ''], FMT_TXT(10));
  if (ehDono) recusarPendentes_(email, 'Atendimento indisponível para esta conta.');
  else donos_().forEach(e => notificar_(e, 'bloqueio', 'Pedido de bloqueio', q.nome + ' quer bloquear ' + u.nome + '. Motivo: ' + motivo, id, true));
  return json_({ ok: true, status: ehDono ? 'ativo' : 'pendente' });
}
function adminBloqueioDecidir_(d, q) {
  const aprovar = d.decisao === 'aprovar';
  if (!aprovar && d.decisao !== 'negar') return erro_('Decisão inválida.');
  const sh = bq_(), v = sh.getDataRange().getValues();
  for (let i = 1; i < v.length; i++) {
    if (String(v[i][0]) !== String(d.id)) continue;
    if (String(v[i][5]) !== 'pendente') return erro_('Este pedido já foi decidido.');
    const c = sh.getRange(i + 1, 6, 1, 5); c.setNumberFormats([FMT_TXT(5)]);
    c.setValues([[aprovar ? 'ativo' : 'negado', String(v[i][6] || ''), seguro_(q.nome), agoraBR_(), seguro_(limpo_(d.nota, 200))]]);
    if (aprovar) recusarPendentes_(String(v[i][1]).toLowerCase(), 'Atendimento indisponível para esta conta.');
    const alvo = emailDe_(String(v[i][3]));
    if (alvo) notificar_(alvo, 'bloqueio', aprovar ? 'Bloqueio aprovado' : 'Bloqueio negado', String(v[i][2]) + (aprovar ? ' foi bloqueado.' : ' continua liberado.') + (d.nota ? ' Dono: ' + limpo_(d.nota, 200) : ''), '', false);
    return json_({ ok: true });
  }
  return erro_('Pedido não encontrado.');
}
function adminBloqueioRemover_(d, q) {
  const sh = bq_(), v = sh.getDataRange().getValues();
  for (let i = 1; i < v.length; i++) {
    if (String(v[i][0]) !== String(d.id)) continue;
    if (String(v[i][5]) !== 'ativo' && String(v[i][5]) !== 'pendente') return erro_('Este bloqueio já foi encerrado.');
    const c = sh.getRange(i + 1, 6, 1, 5); c.setNumberFormats([FMT_TXT(5)]);
    c.setValues([['removido', String(v[i][6] || ''), seguro_(q.nome), agoraBR_(), seguro_(limpo_(d.nota, 200))]]);
    return json_({ ok: true });
  }
  return erro_('Bloqueio não encontrado.');
}

// ---------- Galerias: fotos de cortes por serviço (aparecem na hora de marcar) e certificados de cada barbeiro ----------
function galeria_() {
  return gl_().getDataRange().getValues().slice(1).filter(l => String(l[0]).trim()).map(l => ({
    id: String(l[0]), tipo: String(l[1]), chave: String(l[2]), fileId: String(l[3]), url: String(l[4] || ''), titulo: String(l[5] || ''), ordem: Number(l[6]) || 0
  })).sort((a, b) => a.ordem - b.ordem);
}
function adminGaleriaAdd_(d) {
  const tipo = d.tipo === 'certificado' ? 'certificado' : 'servico', chave = limpo_(d.chave, 40);
  if (tipo === 'servico' && !servicos_().some(s => s.nome === chave)) return erro_('Serviço não encontrado. Salve o serviço antes de anexar fotos.');
  if (tipo === 'certificado' && !equipe_().some(p => p.nome === chave)) return erro_('Profissional não encontrado. Salve o cadastro antes de anexar certificados.');
  const todas = galeria_(), mesmas = todas.filter(g => g.tipo === tipo && g.chave === chave);
  if (mesmas.length >= (tipo === 'servico' ? 12 : 8)) return erro_(tipo === 'servico' ? 'Máximo de 12 fotos por serviço. Apague alguma para adicionar outra.' : 'Máximo de 8 certificados por profissional.');
  const r = novaImagem_(d, tipo === 'servico' ? 'galeria' : 'certificado');
  if (r.erro) return erro_(r.erro);
  const ordem = mesmas.length ? Math.max.apply(null, mesmas.map(g => g.ordem)) + 1 : 1;
  const id = 'g' + Utilities.getUuid().slice(0, 7);
  acrescentar_(gl_(), CAB_GL, [id, tipo, seguro_(chave), r.id, '', seguro_(limpo_(d.titulo, 60)), ordem, agoraBR_()], FMT_GL);
  limparCache_();
  return json_({ ok: true, id: id });
}
function adminGaleriaDel_(d) {
  const sh = gl_(), v = sh.getDataRange().getValues();
  for (let i = 1; i < v.length; i++) {
    if (String(v[i][0]) === String(d.id)) { lixeira_(v[i][3]); sh.deleteRow(i + 1); limparCache_(); return json_({ ok: true }); }
  }
  return erro_('Foto não encontrada.');
}
// Foto de perfil do profissional (envia imagem, link ou pede para remover)
function adminEquipeFoto_(d) {
  const sh = eq_(), v = sh.getDataRange().getValues();
  for (let i = 1; i < v.length; i++) {
    if (String(v[i][1]) !== String(d.nome)) continue;
    let novo = '';
    if (!d.remover) { const r = novaImagem_(d, 'perfil'); if (r.erro) return erro_(r.erro); novo = r.id; }
    const c = sh.getRange(i + 1, 10); c.setNumberFormat('@'); c.setValue(novo);
    if (v[i][9]) lixeira_(String(v[i][9]));
    limparCache_();
    return json_({ ok: true });
  }
  return erro_('Profissional não encontrado. Salve o cadastro antes de enviar a foto.');
}

// ---------- Tema de uma promoção (muda o visual do site enquanto ela vale) ----------
const TEMAS_OK = ['custom', 'natal', 'blackfriday', 'criancas', 'pais', 'namorados', 'carnaval', 'halloween', 'pagamento', 'anonovo', 'junino', 'copa', 'neon'];
const EFEITOS_OK = ['neve', 'confete', 'estrelas', 'brasas', 'coracoes', 'bolhas', 'nenhum'];     // 'nenhum' = sem efeito (vazio = efeito padrão do tema)
function temaOk_(t) {
  if (!t || typeof t !== 'object' || !t.preset) return { json: '' };
  if (TEMAS_OK.indexOf(t.preset) === -1) return { erro: 'Tema inválido.' };
  const cor = v => /^#[0-9a-fA-F]{6}$/.test(String(v || '')) ? String(v).toLowerCase() : '';
  return { json: JSON.stringify({
    preset: t.preset, nivel: inteiro_(t.nivel, 2, 1, 3), faixa: limpo_(t.faixa, 60), emoji: limpo_(t.emoji, 4),
    efeito: EFEITOS_OK.indexOf(t.efeito) !== -1 ? t.efeito : '', cor1: cor(t.cor1), cor2: cor(t.cor2), fundo: cor(t.fundo), heroTitulo: limpo_(t.heroTitulo, 70)
  }) };
}
function temaDe_(txt) { try { const o = JSON.parse(txt || ''); return o && o.preset ? o : null; } catch (e) { return null; } }

// =====================================================================
//  MENU "Barbearia" NA PLANILHA: cadastrar e-mail do dono e dos barbeiros
// =====================================================================
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Barbearia')
    .addItem('Cadastrar e-mail do DONO', 'menuDono')
    .addItem('Cadastrar BARBEIRO', 'menuBarbeiro')
    .addItem('Manter o site rápido (ligar/desligar aquecimento)', 'menuAquecimento')
    .addToUi();
}
// O Google "adormece" o script quando ninguém usa por alguns minutos, e a primeira visita demora. Uma tarefa a cada 5 min mantém tudo acordado.
function aquecer() { try { cfg_(); publico_(); } catch (e) {} }
function menuAquecimento() {
  const ui = SpreadsheetApp.getUi(), ts = ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'aquecer');
  if (ts.length) { ts.forEach(t => ScriptApp.deleteTrigger(t)); ui.alert('Aquecimento DESLIGADO.\n\nO site volta a ficar lento só na primeira visita depois de um tempo parado.'); return; }
  ScriptApp.newTrigger('aquecer').timeBased().everyMinutes(5).create();
  ui.alert('Aquecimento LIGADO.\n\nA cada 5 minutos o script acorda sozinho. Isso reduz bastante a demora da primeira visita. Rode este menu de novo para desligar.');
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
  const linha = [email, seguro_(nome), papel, comissao, simnao_(atende), alvo >= 0 ? v[alvo][5] : '', alvo >= 0 ? v[alvo][6] : '', 'sim', alvo >= 0 ? String(v[alvo][8] || '') : ''];
  if (alvo >= 0) { const r = sh.getRange(alvo + 1, 1, 1, 9); r.setNumberFormats([FMT_EQ.slice(0, 9)]); r.setValues([linha]); }   // só as 9 primeiras colunas: o perfil não é apagado
  else acrescentar_(sh, CAB_EQ, linha.concat(Array(CAB_EQ.length - 9).fill('')), FMT_EQ);
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
  memoVals_ = {}; memoLeitura_ = true;
  if (p.action === 'config') return json_(publico_());
  if (p.action === 'slots') return json_({ livres: slots_(p.data, p.barbeiro) });
  if (p.action === 'feedbacks') return listarFeedbacks_();
  return json_({ erro: 'ação inválida' });
}

const ACOES_EQUIPE = ['admin_agenda', 'admin_agenda_relatorio', 'admin_concluir', 'admin_venda_avulsa', 'admin_cancelar', 'admin_dashboard', 'admin_relatorio', 'admin_confirmar', 'admin_recusar', 'admin_clientes', 'admin_cliente_avaliar', 'admin_bloqueio_pedir'];
const LEITURAS = ['entrar', 'perfil', 'meus', 'fidelidade', 'notificacoes', 'admin_agenda', 'admin_agenda_relatorio', 'admin_dados', 'admin_relatorio', 'admin_dashboard', 'admin_clientes'];   // não travam a fila (mais rápido)
const ACOES_DONO = ['admin_dados', 'admin_relatorio', 'admin_excluir_venda', 'admin_salvar_servicos', 'admin_salvar_equipe',
  'admin_salvar_config', 'admin_marcas_salvar', 'admin_marca_foto', 'admin_marca_foto_url', 'admin_barbeiro_cadastrar', 'admin_foto_fachada', 'admin_foto_fachada_del', 'admin_foto_add', 'admin_foto_salvar', 'admin_foto_del', 'admin_foto_img', 'admin_promos_salvar', 'admin_promo_img', 'admin_foto_hero', 'admin_foto_hero_del',
  'admin_bloqueio_decidir', 'admin_bloqueio_remover', 'admin_galeria_add', 'admin_galeria_del', 'admin_equipe_foto'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  let travou = false;
  try {
    const d = JSON.parse(e.postData.contents);
    memoVals_ = {};
    if (LEITURAS.indexOf(d.action) === -1) { memoLeitura_ = false; lock.waitLock(25000); travou = true; }   // só escritas entram na fila
    else memoLeitura_ = true;
    return rotear_(d);
  } catch (err) {
    return erro_('Erro no servidor. Tente novamente.');
  } finally {
    if (travou) lock.releaseLock();
  }
}
function rotear_(d) {
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
    if (d.action === 'foto_perfil') return fotoPerfil_(d, email);
    if (d.action === 'fidelidade') return fidelidade_(email);
    if (d.action === 'notificacoes') return notificacoes_(d, email);
    if (d.action === 'notificacoes_lidas') return notificacoesLidas_(d, email);
    if (String(d.action).indexOf('admin_') === 0) {
      const q = quem_(email);
      const ehDono = q && q.papel === 'dono';
      if (!q || (ACOES_EQUIPE.indexOf(d.action) === -1 && !(ehDono && ACOES_DONO.indexOf(d.action) !== -1))) {
        return erro_('Você não tem permissão para isso.');
      }
      switch (d.action) {
        case 'admin_agenda': return adminAgenda_(d, q);
        case 'admin_agenda_relatorio': return adminAgendaRelatorio_(d, q);
        case 'admin_concluir': return adminConcluir_(d, q);
        case 'admin_venda_avulsa': return adminVendaAvulsa_(d, q);
        case 'admin_cancelar': return adminCancelar_(d, q);
        case 'admin_dados': return adminDados_();
        case 'admin_relatorio': return adminRelatorio_(d, q);
        case 'admin_excluir_venda': return adminExcluirVenda_(d);
        case 'admin_salvar_servicos': return adminSalvarServicos_(d);
        case 'admin_salvar_equipe': return adminSalvarEquipe_(d);
        case 'admin_salvar_config': return adminSalvarConfig_(d);
        case 'admin_foto_add': return adminFotoAdd_(d);
        case 'admin_foto_salvar': return adminFotoSalvar_(d);
        case 'admin_foto_del': return adminFotoDel_(d);
        case 'admin_foto_img': return adminFotoImg_(d);
        case 'admin_promos_salvar': return adminPromosSalvar_(d);
        case 'admin_promo_img': return adminPromoImg_(d);
        case 'admin_foto_hero': return adminFotoHero_(d);
        case 'admin_foto_hero_del': return adminFotoHeroDel_();
        case 'admin_marcas_salvar': return adminMarcasSalvar_(d);
        case 'admin_marca_foto': return adminMarcaFoto_(d);
        case 'admin_marca_foto_url': return adminMarcaFotoUrl_(d);
        case 'admin_barbeiro_cadastrar': return adminBarbeiroCadastrar_(d);
        case 'admin_dashboard': return adminDashboard_(d, q);
        case 'admin_confirmar': return adminConfirmar_(d, q);
        case 'admin_recusar': return adminRecusar_(d, q);
        case 'admin_clientes': return adminClientes_(d, q);
        case 'admin_cliente_avaliar': return adminClienteAvaliar_(d, q);
        case 'admin_bloqueio_pedir': return adminBloqueioPedir_(d, q);
        case 'admin_bloqueio_decidir': return adminBloqueioDecidir_(d, q);
        case 'admin_bloqueio_remover': return adminBloqueioRemover_(d, q);
        case 'admin_galeria_add': return adminGaleriaAdd_(d);
        case 'admin_galeria_del': return adminGaleriaDel_(d);
        case 'admin_equipe_foto': return adminEquipeFoto_(d);
        case 'admin_foto_fachada': return adminFotoFachada_(d);
        case 'admin_foto_fachada_del': return adminFotoFachadaDel_();
      }
    }
  return erro_('Ação inválida.');
}
