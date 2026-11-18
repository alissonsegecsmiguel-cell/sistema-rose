@echo off
chcp 65001 >nul
setlocal EnableExtensions DisableDelayedExpansion
title Sistema Rose - Protótipo
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 goto sem_node
where npm.cmd >nul 2>nul
if errorlevel 1 goto sem_npm

if exist "node_modules\" goto iniciar
echo Instalando os arquivos necessários. Aguarde...
call npm install
if errorlevel 1 goto erro_instalacao

:iniciar
echo Iniciando o protótipo. O navegador abrirá quando estiver pronto.
echo Se a porta 3000 estiver ocupada, o endereço escolhido aparecerá abaixo.
echo.
rem Acompanha a saída do Next.js para abrir o endereço real, somente após iniciar.
rem PowerShell faz parte do Windows; nenhuma dependência adicional é necessária.
powershell.exe -NoLogo -NoProfile -Command ^
  "$url = 'http://localhost:3000'; $aberto = $false;" ^
  "& npm.cmd run dev 2>&1 | ForEach-Object {" ^
  "  $linha = $_.ToString(); Write-Host $linha;" ^
  "  $limpa = [regex]::Replace($linha, '\x1B\[[0-9;]*[A-Za-z]', '');" ^
  "  if ($limpa -match '^\s*-\s*Local:\s+(http://localhost:\d+)') {" ^
  "    $url = $Matches[1];" ^
  "    if ($url -ne 'http://localhost:3000') { Write-Host 'A porta 3000 está ocupada. O Next.js escolheu outro endereço.'; }" ^
  "    Write-Host ('Endereço do protótipo: ' + $url);" ^
  "  }" ^
  "  if (-not $aberto -and $limpa -match 'Ready in') {" ^
  "    Write-Host 'Protótipo rodando. Para parar, feche esta janela.';" ^
  "    try { Start-Process $url -ErrorAction Stop; } catch { Write-Host ('Não foi possível abrir o navegador. Abra este endereço: ' + $url); }" ^
  "    $aberto = $true;" ^
  "  }" ^
  "}; exit $LASTEXITCODE"
if errorlevel 1 goto erro_servidor
echo Protótipo encerrado.
exit /b 0

:sem_node
echo Node.js não encontrado. Instale em https://nodejs.org e tente de novo.
goto aguardar_erro

:sem_npm
echo npm não encontrado. Reinstale o Node.js em https://nodejs.org e tente de novo.
goto aguardar_erro

:erro_instalacao
echo Não foi possível instalar os arquivos. Confira sua conexão e tente de novo.
goto aguardar_erro

:erro_servidor
echo Não foi possível manter o protótipo aberto. Confira as mensagens acima e tente de novo.

:aguardar_erro
echo Pressione qualquer tecla para fechar esta janela.
pause >nul
exit /b 1
