# Manual Completo — NetCalc Pro

## 1. Visão Geral
O **NetCalc Pro** (`index.html`) roda localmente no navegador de computadores ou celulares, salvando projetos e histórico recente no `localStorage` do dispositivo, com suporte a backup e restauração em JSON.

## 2. Calculadora CIDR e Divisão de Sub-redes
- Informe um endereço IPv4 válido (ex.: `192.168.1.0`) e escolha o prefixo CIDR (`/0` a `/32`) pelo seletor ou controle deslizante.
- Veja rede, broadcast, primeiro e último host válido, máscara decimal, máscara coringa (wildcard), representação binária de 32 bits e classe/escopo.
- Use **Dividir Rede** para segmentar por quantidade de sub-redes ou por mínimo de hosts úteis por sub-rede.
- Use o **Verificador de Pertencimento** para testar se um IP pertence à rede principal.

## 3. Planejador VLSM
- Defina o bloco base e adicione sub-redes com nomes e demandas de hosts.
- O cálculo ordena as demandas do maior para o menor bloco, alinha os limites de endereço e exibe capacidade, IPs alocados, sobra e percentual de aproveitamento, com exportação em CSV.

## 4. Tabela CIDR, Projetos e Relatórios
- Consulte a **Tabela CIDR** (`/0` a `/32`) e aplique prefixos com um clique.
- Salve, renomeie, abra ou exclua projetos pelo menu lateral ou gerenciador, exporte backup JSON e gere relatórios para impressão/PDF, TXT ou CSV.
