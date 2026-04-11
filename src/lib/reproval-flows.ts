import type { PieceFormat, PiecePurpose, ReprovacaoOption } from '@/lib/types'

export interface FlowStep {
  question: string
  type: 'multiple_choice' | 'open' | 'date_picker'
  options?: ReprovacaoOption[]
  placeholder?: string
  // For step 2: which step1 answer makes this step appear
  // If undefined, appears for all step1 answers
}

export interface ConditionalStep2 {
  trigger: string // step1 answer value
  question: string
  type: 'multiple_choice' | 'open' | 'date_picker'
  options?: ReprovacaoOption[]
}

const outroOption: ReprovacaoOption = {
  value: 'outro',
  label: 'Outro',
  opens_field: true,
}

const arteOptions: ReprovacaoOption[] = [
  { value: 'cores', label: 'Cores utilizadas' },
  { value: 'layout', label: 'Layout / composição' },
  { value: 'foto', label: 'Imagem ou foto escolhida' },
  { value: 'tipografia', label: 'Tipografia (fonte ou tamanho)' },
  { value: 'elementos', label: 'Elementos visuais (ícones, formas)' },
  { value: 'branding', label: 'Identidade visual / branding' },
  outroOption,
]

const textoPostagemOptions: ReprovacaoOption[] = [
  { value: 'tom', label: 'Tom de voz (muito formal ou informal)' },
  { value: 'informacao_errada', label: 'Uma informação está incorreta' },
  { value: 'tamanho', label: 'Está muito longo ou muito curto' },
  { value: 'falta_algo', label: 'Falta algo importante' },
  { value: 'excesso', label: 'Excesso de informação' },
  { value: 'hashtags', label: 'Hashtags ou emojis' },
  { value: 'cta', label: 'CTA — chamada para ação' },
  outroOption,
]

const textoAnuncioOptions: ReprovacaoOption[] = [
  { value: 'headline', label: 'Headline' },
  { value: 'texto_principal', label: 'Texto principal' },
  { value: 'botao_cta', label: 'Botão de CTA' },
  { value: 'tom', label: 'Tom de voz' },
  outroOption,
]

const ofertaOptions: ReprovacaoOption[] = [
  { value: 'oferta_nao_clara', label: 'A promoção não está clara' },
  { value: 'beneficio_perdido', label: 'O benefício principal se perde' },
  { value: 'falta_urgencia', label: 'Falta urgência ou apelo' },
  outroOption,
]

const sequenciaOptions: ReprovacaoOption[] = [
  { value: 'primeiro_slide', label: 'Primeiro slide não chama atenção' },
  { value: 'narrativa', label: 'Narrativa confusa entre slides' },
  { value: 'ultimo_slide', label: 'Último slide sem boa conclusão ou CTA' },
  { value: 'slide_especifico', label: 'Um slide específico', opens_field: true },
  outroOption,
]

const visualVideoOptions: ReprovacaoOption[] = [
  { value: 'qualidade', label: 'Qualidade da imagem' },
  { value: 'cores_filtros', label: 'Cores, filtros ou tratamento visual' },
  { value: 'elementos_graficos', label: 'Elementos gráficos (logo, texto animado)' },
  outroOption,
]

const audioOptions: ReprovacaoOption[] = [
  { value: 'musica_nao_combina', label: 'A música não combina com a mensagem' },
  { value: 'volume', label: 'Volume da música muito alto ou baixo' },
  { value: 'narracao', label: 'Narração / voz' },
  { value: 'qualidade_som', label: 'Qualidade do som' },
  outroOption,
]

const legendasOptions: ReprovacaoOption[] = [
  { value: 'informacao_errada', label: 'Uma informação está incorreta' },
  { value: 'tom', label: 'Tom de voz' },
  { value: 'falta_algo', label: 'Falta algo importante' },
  { value: 'erro_legenda', label: 'Erro nas legendas' },
  outroOption,
]

const ritmoOptions: ReprovacaoOption[] = [
  { value: 'muito_lento', label: 'Muito lento' },
  { value: 'muito_acelerado', label: 'Muito acelerado' },
  { value: 'muito_longo', label: 'Muito longo' },
  { value: 'muito_curto', label: 'Muito curto' },
  { value: 'cortes', label: 'Cortes abruptos' },
  outroOption,
]

const ganchoOptions: ReprovacaoOption[] = [
  { value: 'nao_prende', label: 'Não prende atenção rápido o suficiente' },
  { value: 'oferta_demora', label: 'A oferta demora para aparecer' },
  { value: 'primeiro_frame', label: 'Primeiro frame pouco impactante' },
  outroOption,
]

export interface ReprovacaoFlow {
  step1: {
    question: string
    options: ReprovacaoOption[]
  }
  step2Map: Record<string, {
    question: string
    type: 'multiple_choice' | 'open' | 'date_picker'
    options?: ReprovacaoOption[]
  }>
  step3: {
    question: string
    placeholder: string
  }
}

export function getReprovacaoFlow(
  format: PieceFormat,
  purpose: PiecePurpose
): ReprovacaoFlow {
  const step3 = {
    question: 'Descreve com suas palavras o que gostaria de ajustar:',
    placeholder:
      'Ex: gostaria que a foto fosse mais clara e o texto mencionasse o desconto de 10%...',
  }

  if (format === 'imagem_unica' && purpose === 'postagem') {
    return {
      step1: {
        question: 'O que não te agradou?',
        options: [
          { value: 'arte', label: 'A arte / visual' },
          { value: 'texto', label: 'O texto / copy' },
          { value: 'data', label: 'A data de postagem' },
          outroOption,
        ],
      },
      step2Map: {
        arte: { question: 'O que na arte precisa mudar?', type: 'multiple_choice', options: arteOptions },
        texto: { question: 'O que no texto precisa mudar?', type: 'multiple_choice', options: textoPostagemOptions },
        data: { question: 'Qual seria a melhor data?', type: 'date_picker' },
      },
      step3,
    }
  }

  if (format === 'imagem_unica' && purpose === 'anuncio') {
    return {
      step1: {
        question: 'O que não te agradou?',
        options: [
          { value: 'arte', label: 'A arte / visual' },
          { value: 'texto', label: 'O texto do anúncio' },
          { value: 'oferta', label: 'A oferta ou mensagem' },
          { value: 'data', label: 'A data de veiculação' },
          outroOption,
        ],
      },
      step2Map: {
        arte: { question: 'O que na arte precisa mudar?', type: 'multiple_choice', options: arteOptions },
        texto: { question: 'O que no texto precisa mudar?', type: 'multiple_choice', options: textoAnuncioOptions },
        oferta: { question: 'O que na oferta precisa mudar?', type: 'multiple_choice', options: ofertaOptions },
        data: { question: 'Qual seria a melhor data?', type: 'date_picker' },
      },
      step3,
    }
  }

  if (format === 'carrossel' && purpose === 'postagem') {
    return {
      step1: {
        question: 'O que não te agradou?',
        options: [
          { value: 'arte', label: 'A arte / visual' },
          { value: 'texto', label: 'O texto / copy' },
          { value: 'sequencia', label: 'A sequência dos slides' },
          { value: 'data', label: 'A data de postagem' },
          outroOption,
        ],
      },
      step2Map: {
        arte: { question: 'O que na arte precisa mudar?', type: 'multiple_choice', options: arteOptions },
        texto: { question: 'O que no texto precisa mudar?', type: 'multiple_choice', options: textoPostagemOptions },
        sequencia: { question: 'O que na sequência precisa mudar?', type: 'multiple_choice', options: sequenciaOptions },
        data: { question: 'Qual seria a melhor data?', type: 'date_picker' },
      },
      step3,
    }
  }

  if (format === 'carrossel' && purpose === 'anuncio') {
    return {
      step1: {
        question: 'O que não te agradou?',
        options: [
          { value: 'arte', label: 'A arte / visual' },
          { value: 'texto', label: 'O texto do anúncio' },
          { value: 'oferta', label: 'A oferta ou mensagem' },
          { value: 'sequencia', label: 'A sequência dos slides' },
          outroOption,
        ],
      },
      step2Map: {
        arte: { question: 'O que na arte precisa mudar?', type: 'multiple_choice', options: arteOptions },
        texto: { question: 'O que no texto precisa mudar?', type: 'multiple_choice', options: textoAnuncioOptions },
        oferta: { question: 'O que na oferta precisa mudar?', type: 'multiple_choice', options: ofertaOptions },
        sequencia: { question: 'O que na sequência precisa mudar?', type: 'multiple_choice', options: sequenciaOptions },
      },
      step3,
    }
  }

  if (format === 'video' && purpose === 'postagem') {
    return {
      step1: {
        question: 'O que não te agradou?',
        options: [
          { value: 'visual', label: 'O visual / imagem (qualidade, cores, edição)' },
          { value: 'audio', label: 'O áudio (música, narração, volume)' },
          { value: 'legendas', label: 'O texto ou legendas' },
          { value: 'ritmo', label: 'O ritmo / edição / cortes' },
          { value: 'data', label: 'A data de postagem' },
          outroOption,
        ],
      },
      step2Map: {
        visual: { question: 'O que no visual precisa mudar?', type: 'multiple_choice', options: visualVideoOptions },
        audio: { question: 'O que no áudio precisa mudar?', type: 'multiple_choice', options: audioOptions },
        legendas: { question: 'O que no texto/legendas precisa mudar?', type: 'multiple_choice', options: legendasOptions },
        ritmo: { question: 'O que no ritmo precisa mudar?', type: 'multiple_choice', options: ritmoOptions },
        data: { question: 'Qual seria a melhor data?', type: 'date_picker' },
      },
      step3,
    }
  }

  // video + anuncio
  return {
    step1: {
      question: 'O que não te agradou?',
      options: [
        { value: 'visual', label: 'O visual / imagem (qualidade, cores, edição)' },
        { value: 'audio', label: 'O áudio (música, narração, volume)' },
        { value: 'legendas', label: 'O texto ou legendas' },
        { value: 'ritmo', label: 'O ritmo / edição / cortes' },
        { value: 'gancho', label: 'O gancho inicial (primeiros segundos)' },
        outroOption,
      ],
    },
    step2Map: {
      visual: { question: 'O que no visual precisa mudar?', type: 'multiple_choice', options: visualVideoOptions },
      audio: { question: 'O que no áudio precisa mudar?', type: 'multiple_choice', options: audioOptions },
      legendas: { question: 'O que no texto/legendas precisa mudar?', type: 'multiple_choice', options: legendasOptions },
      ritmo: { question: 'O que no ritmo precisa mudar?', type: 'multiple_choice', options: ritmoOptions },
      gancho: { question: 'O que no gancho precisa mudar?', type: 'multiple_choice', options: ganchoOptions },
    },
    step3,
  }
}
