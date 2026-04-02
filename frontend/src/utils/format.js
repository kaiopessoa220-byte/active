export const MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

export const MONTHS_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

export function formatNum(n) {
  if (!n && n !== 0) return '—';
  return Number(n).toLocaleString('pt-BR');
}

export function formatRate(n) {
  if (!n && n !== 0) return '—';
  return `${Number(n).toFixed(2)}%`;
}

export const COLORS = [
  '#6366f1','#8b5cf6','#ec4899','#06b6d4','#10b981',
  '#f59e0b','#ef4444','#84cc16','#f97316','#14b8a6'
];

export const COLUMN_TYPES = [
  { key: 'sends', label: 'Envios', icon: '📤', color: '#6366f1' },
  { key: 'opens', label: 'Aberturas', icon: '📬', color: '#10b981' },
  { key: 'clicks', label: 'Cliques', icon: '🖱️', color: '#06b6d4' },
  { key: 'unsubs', label: 'Unsubs', icon: '🚪', color: '#f59e0b' },
  { key: 'bounces', label: 'Bounces', icon: '↩️', color: '#ef4444' },
];
