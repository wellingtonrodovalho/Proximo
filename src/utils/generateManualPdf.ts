import { jsPDF } from 'jspdf';

export interface ManualPdfOptions {
  condoName?: string;
  totalUnits?: number;
}

export function generateManualPdf(options: ManualPdfOptions = {}): jsPDF {
  const condoName = options.condoName || 'Crystal Place Residence';
  const totalUnits = options.totalUnits || 302;
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  // Helper for adding footer with page numbers
  const addHeaderAndFooter = (currentPage: number, totalPages: number) => {
    // Header line
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 12, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(245, 158, 11); // amber-500
    doc.text('PROXIMO • SISTEMA AUTÔNOMO DE GESTÃO E ROTATIVO DE BALCÃO', margin, 8);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(`${condoName} (${totalUnits} Unidades)`, pageWidth - margin, 8, { align: 'right' });

    // Footer line
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Manual Oficial de Instruções e Diretrizes Operacionais • Validade Condominial', margin, pageHeight - 7);
    doc.text(`Página ${currentPage} de ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  };

  const checkPageBreak = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - 20) {
      doc.addPage();
      cursorY = 22;
      return true;
    }
    return false;
  };

  // ==========================================
  // PAGE 1: CAPA & SUMÁRIO EXECUTIVO
  // ==========================================
  cursorY = 24;

  // Header Banner
  doc.setFillColor(245, 158, 11); // Amber
  doc.roundedRect(margin, cursorY, contentWidth, 32, 3, 3, 'F');

  doc.setFont('helvetica', 'black');
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42); // Dark slate
  doc.text('MANUAL DE OPERAÇÃO E INSTRUÇÕES', margin + 6, cursorY + 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('SISTEMA PROXIMO • ROTATIVO DE BALCÃO AUDITÁVEL', margin + 6, cursorY + 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Condomínio ${condoName} • Diretrizes para Anfitriões, Portaria e Administração`, margin + 6, cursorY + 26);

  cursorY += 40;

  // Metadata Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, cursorY, contentWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text('OBJETIVO DO SISTEMA:', margin + 4, cursorY + 7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const introText = 
    `Eliminar o favorecimento manual na portaria do condomínio e garantir distribuição 100% justa, transparente e autônoma dos hóspedes de balcão (walk-in) entre os anfitriões cadastrados, com auditoria digital inviolável e segurança patrimonial.`;
  const splitIntro = doc.splitTextToSize(introText, contentWidth - 8);
  doc.text(splitIntro, margin + 4, cursorY + 13);

  cursorY += 32;

  // Table of Contents
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('ÍNDICE DO MANUAL', margin, cursorY);
  cursorY += 6;

  const sectionsIndex = [
    { title: '1. NÍVEL 1: GUIA PRÁTICO DO ANFITRIÃO (PROPRIETÁRIO)', desc: 'Cadastro simples, regras da fila virtual, aceite de chamados e SLA' },
    { title: '2. NÍVEL 2: GUIA OPERACIONAL DA RECEPÇÃO & PORTARIA 24H', desc: 'Atendimento do hóspede, conferência de documentos e entrega de chaves' },
    { title: '3. NÍVEL 3: GUIA DE GESTÃO DO ADMINISTRADOR / SÍNDICO', desc: 'Validação de cadastros, controle das 302 unidades, bloqueios e auditoria' },
    { title: '4. REGRAS GERAIS, POLÍTICA DE DIÁRIA E DISPOSIÇÕES FINAIS', desc: 'Piso mínimo de R$ 200, integridade do sorteio e compliance' },
  ];

  sectionsIndex.forEach((sec, idx) => {
    doc.setFillColor(idx % 2 === 0 ? 241 : 248, idx % 2 === 0 ? 245 : 250, idx % 2 === 0 ? 249 : 252);
    doc.roundedRect(margin, cursorY, contentWidth, 14, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(sec.title, margin + 4, cursorY + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(sec.desc, margin + 4, cursorY + 11);
    cursorY += 16;
  });

  cursorY += 4;

  // ==========================================
  // SECTION 1: ANFITRIÃO
  // ==========================================
  checkPageBreak(80);
  
  doc.setFillColor(30, 41, 59); // slate-800
  doc.roundedRect(margin, cursorY, contentWidth, 9, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(245, 158, 11);
  doc.text('1. NÍVEL ANFITRIÃO — GUIA DO PROPRIETÁRIO', margin + 4, cursorY + 6.5);
  cursorY += 13;

  const hostTopics = [
    {
      title: 'A. Como Solicitar o Acesso (Cadastro Simplificado):',
      content: 
        '1. Acesse o botão "Acesso Restrito" na barra superior do aplicativo.\n' +
        '2. Preencha os campos obrigatórios: Nome Completo, E-mail, Telefone (WhatsApp) e selecione o Tipo "Anfitrião" (ou Administrador, que também pode ser Anfitrião).\n' +
        '3. Digite o número da sua Unidade no condomínio (ex: 101 a 2004).\n' +
        '4. Clique em "Solicitar Acesso". Seu cadastro ficará no status "Pendente" aguardando a validação do Administrador/Síndico.'
    },
    {
      title: 'B. Notificações Multicanal Imediatas (E-mail, WhatsApp e SMS):',
      content:
        '• Assim que seu credenciamento for validado e aprovado pelo Administrador, você receberá confirmações automáticas por E-mail, WhatsApp e SMS.\n' +
        '• Todas as convocações de chamados de hóspedes de balcão são enviadas simultaneamente através de múltiplos canais para garantir resposta ágil.'
    },
    {
      title: 'C. Recebimento de Chamado e Botões de Resposta:',
      content:
        '• Quando um hóspede de balcão for alocado para sua unidade, são exibidos os botões de resposta: "ACEITAR HOSPEDAGEM (CONCRETIZAR)" e "RECUSAR HOSPEDAGEM".\n' +
        '• Campo de Justificativa / Observação: Campo de texto livre para observações à portaria ou motivo da resposta (opcional, não obrigatório).\n' +
        '• Ao Aceitar: A portaria recebe o voucher instantâneo e fica autorizada a liberar a chave ao hóspede.\n' +
        '• Ao Recusar ou Expirar: O sistema repassa a vez imediatamente para o próximo anfitrião da fila.'
    },
    {
      title: 'D. Transparência de Valores e Regras do Imóvel:',
      content:
        '• O valor da diária respeita a convenção condominial, com piso mínimo de R$ 200,00.\n' +
        '• Mantenha as configurações de camas (Casal, Solteiro, Sofá-cama) e regras de convivência sempre atualizadas no seu perfil.'
    }
  ];

  hostTopics.forEach(topic => {
    checkPageBreak(35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(topic.title, margin, cursorY);
    cursorY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const lines = doc.splitTextToSize(topic.content, contentWidth);
    doc.text(lines, margin, cursorY);
    cursorY += lines.length * 4.2 + 4;
  });

  // ==========================================
  // SECTION 2: RECEPÇÃO / PORTARIA
  // ==========================================
  checkPageBreak(80);

  doc.setFillColor(30, 41, 59); // slate-800
  doc.roundedRect(margin, cursorY, contentWidth, 9, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(59, 130, 246); // Blue
  doc.text('2. NÍVEL RECEPÇÃO — OPERAÇÃO DA PORTARIA & BALCÃO 24H', margin + 4, cursorY + 6.5);
  cursorY += 13;

  const receptionTopics = [
    {
      title: 'A. Princípio da Neutralidade Absoluta:',
      content:
        'A portaria tem papel estritamente operacional e de segurança patrimonial. Nenhum porteiro ou recepcionista possui permissão de escolher, indicar ou favorecer qualquer unidade ou proprietário. Toda alocação é 100% autônoma pelo algoritmo Round Robin.'
    },
    {
      title: 'B. Atendimento do Hóspede Walk-in (Passo a Passo):',
      content:
        '1. O hóspede que chega ao balcão sem reserva prévia aponta o celular para a Placa QR Code oficial da portaria ou utiliza o Totem Interativo do balcão.\n' +
        '2. O hóspede informa: Nome completo, CPF/Documento, Telefone, quantidade de noites e acompanhantes.\n' +
        '3. O sistema PROXIMO localiza a unidade número 1 da fila e dispara o chamado para o anfitrião correspondente.\n' +
        '4. O painel da portaria exibe em tempo real o status: "Aguardando aceite do anfitrião (tempo restante: mm:ss)".'
    },
    {
      title: 'C. Conferência Documental e Liberação de Chaves:',
      content:
        '1. Assim que o anfitrião clica em "Aceitar", o painel da recepção emite alerta visual com o Voucher Oficial.\n' +
        '2. O recepcionista solicita o documento oficial com foto (RG, CNH ou Passaporte) do hóspede e confere com os dados exibidos no sistema.\n' +
        '3. O recepcionista entrega a chave física ou cartão magnético da unidade sorteada.\n' +
        '4. Digita ou clica em "Confirmar Entrega de Chave & Check-in Realizado". O evento fica registrado no histórico auditável.'
    },
    {
      title: 'D. Protocolo para Chamados Recusados ou Expirados:',
      content:
        'Caso o anfitrião não responda nos 3 minutos, a portaria não precisa intervir manualmente: o sistema avança sozinho para o próximo da fila e avisa o hóspede na tela do totem.'
    }
  ];

  receptionTopics.forEach(topic => {
    checkPageBreak(35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(topic.title, margin, cursorY);
    cursorY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const lines = doc.splitTextToSize(topic.content, contentWidth);
    doc.text(lines, margin, cursorY);
    cursorY += lines.length * 4.2 + 4;
  });

  // ==========================================
  // SECTION 3: ADMINISTRADOR / SÍNDICO
  // ==========================================
  checkPageBreak(80);

  doc.setFillColor(30, 41, 59); // slate-800
  doc.roundedRect(margin, cursorY, contentWidth, 9, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(16, 185, 129); // Emerald
  doc.text('3. NÍVEL ADMINISTRADOR — GOVERNANÇA E GESTÃO DO SÍNDICO', margin + 4, cursorY + 6.5);
  cursorY += 13;

  const adminTopics = [
    {
      title: 'A. Validação e Aprovação Obrigatória de Novos Cadastros:',
      content:
        '• Todo novo usuário (Anfitrião, Portaria ou Administrador) entra com status PENDENTE.\n' +
        '• O Administrador pode ser também Anfitrião: Se possuir imóvel no condomínio, basta vincular sua unidade para participar do rodízio com acesso integrado.\n' +
        '• No Painel do Administrador, acesse a aba "Validação de Acessos".\n' +
        '• Ao clicar em "Validar & Aprovar", o credenciamento dispara notificações automáticas multicanal (E-mail, WhatsApp e SMS) ao condômino.\n' +
        '• O botão "Avisar no WhatsApp" envia mensagem pronta ao condômino confirmando a liberação.'
    },
    {
      title: 'B. Controle de Elegibilidade e Bloqueio Administrativo das 302 Unidades:',
      content:
        '• O Síndico tem autoridade para inativar uma unidade da fila por motivos formais (inadimplência condominial, reformas, infrações de convivência ou descumprimento de regras).\n' +
        '• Ao inativar, é obrigatório registrar a justificativa no sistema (ex: "Débito condominial em aberto", "Manutenção na rede hidráulica").\n' +
        '• A unidade bloqueada não recebe nenhum chamado de balcão até ser reabilitada pelo síndico.'
    },
    {
      title: 'C. Auditoria Imutável (Audit Trail):',
      content:
        '• Cada operação no condomínio (solicitação de acesso, aceite, timeout, entrega de chave, bloqueio) gera um registro com data, hora e responsável.\n' +
        '• Essa auditoria elimina qualquer desconfiança entre condôminos e fornece relatórios transparentes para prestação de contas em assembleias gerais ordinárias.'
    },
    {
      title: 'D. Monitoramento de Métricas e Performance:',
      content:
        '• O painel exibe taxa de ocupação de balcão, tempo médio de resposta dos anfitriões e número de reservas concluídas por período.'
    }
  ];

  adminTopics.forEach(topic => {
    checkPageBreak(35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(topic.title, margin, cursorY);
    cursorY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const lines = doc.splitTextToSize(topic.content, contentWidth);
    doc.text(lines, margin, cursorY);
    cursorY += lines.length * 4.2 + 4;
  });

  // ==========================================
  // SECTION 4: DISPOSIÇÕES FINAIS & REGRAS
  // ==========================================
  checkPageBreak(50);

  doc.setFillColor(30, 41, 59); // slate-800
  doc.roundedRect(margin, cursorY, contentWidth, 9, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(245, 158, 11);
  doc.text('4. REGRAS GERAIS E DISPOSIÇÕES CONDOMINIAIS', margin + 4, cursorY + 6.5);
  cursorY += 13;

  const rulesText = 
    '1. Piso Mínimo de Diária: Fica estipulado o valor mínimo de R$ 200,00 por diária para preservar a valorização do empreendimento e evitar concorrência predatória.\n' +
    '2. Não Discriminação: A ordem do rodízio é matemática e sequencial. Nenhum usuário pode burlar ou trocar de posição.\n' +
    '3. Higiene e Rouparia: As unidades disponíveis devem estar prontas com roupas de cama e banho limpas no momento do aceite.\n' +
    '4. Validade: Este manual passa a vigorar imediatamente a partir de sua aprovação pela administração condominial do Crystal Place Residence.';

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const ruleLines = doc.splitTextToSize(rulesText, contentWidth);
  doc.text(ruleLines, margin, cursorY);
  cursorY += ruleLines.length * 4.5 + 8;

  // Signatures block
  checkPageBreak(25);
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, cursorY + 12, margin + 70, cursorY + 12);
  doc.line(pageWidth - margin - 70, cursorY + 12, pageWidth - margin, cursorY + 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('Administração / Síndico Geral', margin + 10, cursorY + 16);
  doc.text('Conselho Consultivo & Fiscal', pageWidth - margin - 60, cursorY + 16);

  // Apply headers and footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addHeaderAndFooter(i, totalPages);
  }

  return doc;
}
