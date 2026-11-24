NetCalc Pro — Calculadora de Sub-redes IPv4 & VLSM
O NetCalc Pro é uma aplicação web local e responsiva para cálculos de endereçamento IPv4, CIDR, segmentação de sub-redes, planejamento VLSM, consulta rápida de prefixos (/0 a /32), verificação de pertencimento de IP e geração de relatórios técnicos.
Projetado para rodar diretamente no navegador no PC ou no celular (Android/iOS), sem necessidade de instalação de dependências ou backend obrigatório, com armazenamento local (localStorage), backup/restauração em JSON e exportação de relatórios.
Funcionalidades Principais
Calculadora CIDR: Cálculo de endereço de rede, broadcast, primeiro e último host válido, máscara decimal, máscara coringa (wildcard), representação hexadecimal, classe/escopo e visualização binária de 32 bits (rede vs. host).
Divisão de Sub-redes (Segmentação): Divisão por quantidade de sub-redes desejadas ou por número mínimo de hosts válidos por sub-rede, com filtro e paginação para blocos grandes.
Verificador de Pertencimento: Testa se um IP de destino pertence à rede principal calculada e identifica sua função (rede, broadcast ou host válido).
Planejador VLSM Completo: Ordenação automática decrescente por demanda de hosts, alinhamento estrito de limites de bloco, cálculo de IPs alocados/livres, percentual de aproveitamento e exportação em CSV.
Tabela de Referência CIDR (/0 a /32): Consulta rápida com máscaras decimal, coringa e hexadecimal, total de IPs e hosts úteis, com aplicação direta na calculadora.
Projetos, Histórico e Backup: Gerenciamento de projetos salvos localmente, histórico recente, tema claro/escuro e backup/restauração em arquivo .json.
Relatórios e Exportação: Visualização de relatório técnico com cópia de texto, exportação em .txt e .csv e impressão/salvamento em PDF.
Como Abrir e Usar Localmente
1. Abrir direto no navegador (PC ou Celular)
1. Baixe ou clone este repositório para o seu computador ou aparelho.
2. Localize o arquivo principal da aplicação na raiz do projeto: netcalc-pro-v3.html.
3. No PC: dê um duplo clique em netcalc-pro-v3.html para abri-lo no navegador padrão (Chrome, Edge, Firefox, Brave etc.).
4. No celular: abra o arquivo netcalc-pro-v3.html pelo gerenciador de arquivos ou navegador do aparelho. Se quiser acesso rápido, utilize a opção "Adicionar à tela inicial" do navegador.
Observação: Alguns recursos externos (como fontes e estilos via CDN) podem exigir conexão com a internet na primeira abertura, enquanto o cálculo e o armazenamento local continuam funcionando no navegador.
2. Rodar em um servidor local (Opcional)
Se preferir servir os arquivos via HTTP local (por exemplo, para testes em rede local ou desenvolvimento):
