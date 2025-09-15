#!/bin/sh

# FreeBSDでのBash確認・インストールスクリプト
echo "🔍 FreeBSD Bash環境確認"

echo "現在のシェル: $SHELL"
echo "利用可能なシェル:"
cat /etc/shells

echo "Bashの確認:"
which bash 2>/dev/null && echo "✅ Bash利用可能: $(bash --version | head -1)" || echo "❌ Bash未インストール"

echo "パッケージ管理システム確認:"
which pkg >/dev/null 2>&1 && echo "✅ pkg利用可能" || echo "❌ pkg未利用可能"

echo "Bashインストール方法:"
echo "1. pkg install bash"
echo "2. または ports: cd /usr/ports/shells/bash && make install clean"

echo "SSH接続でBashを使用する方法:"
echo '1. ssh user@host "bash -c \"command\""'
echo "2. または ~/.bashrc を設定"

echo "現在のユーザー情報:"
whoami
id
pwd