# NetCalc Pro — Calculadora de Sub-redes IPv4 & Planejador VLSM

Aplicação web modular para cálculo de sub-redes IPv4, segmentação (FLSM), planejador VLSM com ordenação por demanda e alinhamento de blocos, tabela de referência CIDR (/0 a /32) e exportação de relatórios.

## Estrutura do Projeto

```text
netcalc-pro/
├── index.html          # Estrutura principal da aplicação
├── css/
│   └── styles.css      # Estilos customizados, controles e impressão (@media print)
├── js/
│   ├── app.js          # Estado global, validação IPv4, cálculos CIDR e VLSM
│   └── ui.js           # Interface, tabelas, modais, drawer, relatórios e eventos
├── README.md           # Documentação do repositório
├── MANUAL.md           # Manual completo de uso
└── .gitignore          # Regras de arquivos ignorados pelo Git
```

## Como executar

### 1. Servidor local (recomendado)
Na pasta raiz do projeto, inicie um servidor HTTP local (ex.: Python, VS Code Live Server ou Apache/XAMPP):
```bash
python -m http.server 8080
```
Acesse `http://localhost:8080/` no navegador do PC ou pelo IP da rede local no celular.

### 2. Hospedagem / GitHub Pages
Envie toda a estrutura de pastas (`index.html`, `css/`, `js/`, `README.md`, `MANUAL.md`, `.gitignore`) para o repositório. No GitHub, ative o **GitHub Pages** em **Settings > Pages** apontando para a branch `main` e pasta `/ (root)`.
