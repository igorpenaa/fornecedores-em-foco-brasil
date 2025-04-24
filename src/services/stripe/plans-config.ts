
// IDs dos preços no Stripe
export const PRICE_IDS = {
  MONTHLY: "price_1RHSBjF8ZVI3gHwEhAFQHohQ",      // Mensal - R$ 47,00
  SEMI_ANNUAL: "price_1RHSCpF8ZVI3gHwEvCvRPy3w",  // Semestral - R$ 145,00
  ANNUAL: "price_1RHSCpF8ZVI3gHwEDBNsrmXI"        // Anual - R$ 193,00
} as const;

export const getAvailablePlans = () => [
  {
    id: 'free',
    title: 'Gratuito',
    price: 0,
    description: 'Acesso a 5 fornecedores gratuitos',
    features: [
      'Acesso a 5 fornecedores gratuitos',
      'Visualização básica de fornecedores'
    ],
    maxCategories: 0
  },
  {
    id: 'monthly',
    title: 'Mensal',
    price: 47,
    description: 'Acesso a até 10 categorias diferentes',
    features: [
      'Escolha 10 categorias',
      'Acesso aos fornecedores gratuitos',
      'Visualização de destaques',
      'Suporte básico'
    ],
    priceId: PRICE_IDS.MONTHLY,
    maxCategories: 10
  },
  {
    id: 'semi_annual',
    title: 'Semestral',
    price: 145,
    description: 'Acesso a até 20 categorias diferentes',
    features: [
      'Escolha 20 categorias',
      'Acesso aos fornecedores gratuitos',
      'Visualização de destaques',
      'Suporte premium',
      'Filtros avançados'
    ],
    priceId: PRICE_IDS.SEMI_ANNUAL,
    savings: 'Economize R$ 137,00',
    maxCategories: 20,
    highlighted: true
  },
  {
    id: 'annual',
    title: 'Anual',
    price: 193,
    description: 'Acesso a todas as categorias e recursos',
    features: [
      'Acesso a todas as categorias',
      'Produtos em destaque',
      'Filtros por categoria',
      'Filtro por avaliação',
      'Perfil completo da empresa',
      'Link direto para WhatsApp',
      'Suporte prioritário'
    ],
    priceId: PRICE_IDS.ANNUAL,
    savings: 'Economize R$ 371,00',
    maxCategories: Infinity
  }
];
