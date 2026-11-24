# NetCalc Pro — Calculadora de Sub-redes IPv4 & Planejador VLSM

Aplicação web local para cálculo de sub-redes IPv4, segmentação (FLSM), planejador VLSM com ordenação por demanda e alinhamento de blocos, tabela de referência CIDR (/0 a /32) e exportação de relatórios.

## Como usar localmente

### 1. Direto no navegador (PC ou celular)
Abra o arquivo `netcalc-pro-v3.html` diretamente no navegador (Chrome, Edge, Firefox, Safari etc.).

### 2. Via servidor local
Se preferir servir via HTTP local (ex.: Python):
```bash
python -m http.server 8080
```
Depois acesse `http://localhost:8080/netcalc-pro-v3.html` no navegador.

## Publicação no GitHub e GitHub Pages
Envie `netcalc-pro-v3.html`, `README.md`, `.gitignore` e `MANUAL.md` ao repositório. Em **Settings > Pages**, selecione a branch `main` e a pasta `/ (root)` para publicar.
