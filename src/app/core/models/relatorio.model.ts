export interface RelatorioMargemItem {
  produtoId: string;
  nome: string;
  precoVenda: number;
  precoCusto: number;
  margemPercentual: number;
}

export interface RelatorioMargemResponse {
  totalProdutos: number;
  margemMedia: number;
  itens: RelatorioMargemItem[];
}
