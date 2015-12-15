call npm install typescript
IF %ERRORLEVEL% NEQ 0 (
  echo Unable to install TypeScript
  goto error
)

@echo off
if (%1%=="") goto settsc
cd %1%

:settsc
if exist ".\node_modules\.bin\tsc.cmd" (
    set tsc=call ".\node_modules\.bin\tsc.cmd"
    goto build
)
if exist "%ProgramFiles(x86)%\Microsoft Sdks\Typescript\0.9\tsc.exe" (
    set tsc="%ProgramFiles(x86)%\Microsoft Sdks\Typescript\0.9\tsc.exe"
    goto build
)
if exist "%ProgramFiles%\Microsoft Sdks\Typescript\0.9\tsc.exe" (
    set tsc="%ProgramFiles%\Microsoft Sdks\Typescript\0.9\tsc.exe"  
    goto build
)
echo TypeScript compiler not found
exit 999

:build
echo Building TypeScript: app.ts (using %tsc%)
%tsc% app.ts
echo Building TypeScript: client.ts (using %tsc%)
%tsc% client.ts