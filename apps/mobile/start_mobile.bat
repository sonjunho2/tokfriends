@echo off
set PATH=%LOCALAPPDATA%\Android\Sdk\platform-tools;%LOCALAPPDATA%\Android\Sdk\emulator;%PATH%
set ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk
cd /d C:\Users\ION\Downloads\work\tokfriends\apps\mobile
call npx expo start --clear
