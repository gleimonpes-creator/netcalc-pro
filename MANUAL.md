# Manual Completo — NetCalc Pro

Este manual explica como utilizar todas as funcionalidades do **NetCalc Pro** no navegador do **PC** ou do **celular** a partir do arquivo `netcalc-pro-v3.html`.

---

## 1. Visão Geral da Interface

- **Cabeçalho Superior:**
  - **Menu Hambúrguer (`≡`):** abre o menu lateral com navegação, atalhos rápidos, projetos salvos, histórico recente e backup/restauração JSON.
  - **Navegação Direta (Calculadora CIDR / Planejador VLSM / Tabela CIDR):** alterna entre os módulos principais.
  - **Indicador de Rede Ativa:** exibe a rede em foco (ex.: `192.168.1.0/24`).
  - **Salvar:** salva um novo projeto ou atualiza o projeto aberto no momento.
  - **Relatório Técnico:** abre a visualização consolidada para copiar, exportar ou imprimir/salvar em PDF.
  - **Alternar Tema:** muda entre modo claro e modo escuro (salvo automaticamente no navegador).

---

## 2. Calculadora CIDR (Tela Principal)

### 2.1 Endereço Base e Máscara CIDR
1. Em **Endereço IPv4 (Host ou Rede)**, digite um endereço IPv4 válido (ex.: `192.168.1.0`) ou já no formato `IP/CIDR` (ex.: `10.20.0.0/16`).
   - O badge ao lado indica se o endereço é **Válido** ou **Inválido**, exibindo mensagem explicativa caso haja erro de formato ou octeto fora de `0–255`.
2. Use os botões rápidos (`192.168.x`, `172.16.x`, `10.x`) para preencher exemplos comuns rapidamente.
3. Ajuste o prefixo CIDR de `/0` até `/32` pelo **seletor suspenso** ou pelo **controle deslizante (slider)**.

### 2.2 Resultados da Rede Principal
Ao informar IP e prefixo válidos, a aplicação exibe:
- **Endereço de Rede** e **Endereço de Broadcast**.
- **Primeiro Host Válido** e **Último Host Válido** (incluindo tratamento para `/31` ponto-a-ponto e `/32` host único).
- **Máscara de Sub-rede** e **Máscara Coringa (Wildcard)**.
- **Hosts Utilizáveis** e **Total de Endereços IP**.
- **Representação em Hexadecimal** e **Representação Binária de 32 bits**, destacando bits de **rede** e de **host**.
- **Classe e Escopo** do endereço (ex.: Classe C, Privado RFC 1918, Público, Loopback, Link-Local, CGNAT).

> **Dica:** Toque no ícone de copiar ao lado de qualquer campo para copiar o valor imediatamente para a área de transferência.

### 2.3 Divisão de Sub-redes (Segmentação)
Na seção **2. Dividir Rede (Segmentação)**, escolha um dos três modos:
- **Rede Única:** exibe apenas os dados da rede principal.
- **Por Sub-redes:** escolha quantas sub-redes deseja criar; o app calcula o novo prefixo, a nova máscara e os hosts úteis por sub-rede.
- **Por Hosts/Rede:** informe o mínimo de hosts válidos necessários por sub-rede; o app encontra o bloco adequado dentro da rede base.

Quando a divisão está ativa, a tabela de **Sub-redes Geradas** aparece abaixo:
- Use o campo de busca para filtrar por número (`#1`), rede, host ou broadcast.
- Em blocos grandes, use o botão **`+100`** para carregar mais linhas sem travar o navegador.
- Copie linhas individuais com o botão de copiar em cada sub-rede.

### 2.4 Verificador de Pertencimento
1. Em **3. Verificador de Pertencimento**, digite um endereço IPv4 (ex.: `192.168.1.50`).
2. Clique em **Testar**.
3. O sistema informa se o IP pertence ou não à rede principal calculada e qual é a sua função naquela faixa.

---

## 3. Planejador VLSM Completo

Acesse **Planejador VLSM** pela navegação superior ou pelo menu lateral:

1. **Bloco Base Disponível:** informe o **IP/Rede Base** e o **Prefixo** (ou clique em **Sincronizar Rede Principal** para importar a rede calculada na tela principal).
2. **Sub-redes Requisitadas:** clique em **+ Adicionar Sub-rede**, preencha o nome de cada segmento e a quantidade de hosts necessários, ou remova linhas indesejadas.
3. **Alocação Automática:**
   - As sub-redes são ordenadas automaticamente do maior bloco para o menor.
   - Os endereços são alinhados aos limites de cada bloco VLSM.
   - Os cards superiores mostram **Capacidade Base**, **IPs Alocados**, **IPs Livres (Sobra)** e **Aproveitamento (%)**.
   - Se a demanda ultrapassar a capacidade do bloco base, um alerta indica as sub-redes sem espaço suficiente.
4. **Exportar VLSM CSV:** clique no botão para baixar uma planilha `.csv` com o plano alocado e o resumo da rede base.

---

## 4. Tabela de Referência CIDR (`/0` a `/32`)

Acesse **Tabela CIDR** para consultar rapidamente todos os prefixos de `/0` a `/32`:
- Digite no campo de busca para filtrar por prefixo (`/24`), máscara decimal (`255.255.255.0`), máscara coringa ou hexadecimal.
- Clique em **Usar** na linha desejada para aplicar o prefixo diretamente na **Calculadora CIDR**.

---

## 5. Projetos, Histórico Recente e Backup JSON

### 5.1 Criar, Salvar, Carregar, Renomear e Excluir Projetos
- **Salvar / Atualizar:** clique em **Salvar** ou **Salvar Projeto**. Se for um rascunho, informe nome e descrição (opcional). Se já for um projeto salvo, ele será atualizado.
- **Salvar Como Novo Projeto:** no menu lateral, clique em **Salvar Como Novo Projeto...** para criar uma cópia independente.
- **Abrir, Renomear ou Excluir:** abra o menu lateral ou clique em **Projetos** / **Gerenciar** para carregar um projeto salvo, alterar seu nome ou excluí-lo.
- **Novo Cálculo / Limpar:** redefine a calculadora para um novo rascunho limpo.

### 5.2 Histórico Recente e Backup JSON
- A seção **Cálculos Recentes** no menu lateral guarda os últimos cálculos realizados para reabertura rápida, podendo ser limpa quando desejar.
- **Backup JSON e Restaurar:** no rodapé do menu lateral, use **Backup JSON** para baixar um arquivo `.json` com seus projetos salvos e **Restaurar** para importar esse arquivo em outro navegador ou dispositivo.

---

## 6. Relatório Técnico e Exportação

Clique no ícone de relatório no cabeçalho (ou no botão **Relatório** na tabela de sub-redes) para abrir o **Relatório Técnico**:
- **Copiar Texto:** copia o relatório formatado em texto puro.
- **TXT:** baixa o relatório em formato `.txt`.
- **CSV / Excel:** baixa os dados da rede ou das sub-redes geradas em `.csv` (separado por ponto e vírgula, com suporte a acentuação).
- **Imprimir / PDF:** abre a janela de impressão do navegador para imprimir ou salvar como **PDF**.
