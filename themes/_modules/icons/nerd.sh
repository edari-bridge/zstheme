#!/bin/bash
# Nerd Font Icon Module - Nerd Font 아이콘
# Nerd Font 설치 필요 (https://www.nerdfonts.com/)

# ============================================================
# Nerd Font 아이콘 정의 (nf-md-* 계열)
# ============================================================

# nf-md-* (Material Design Icons) - Private Use Area
# Unicode: U+F0000 - U+F9999 (Nerd Fonts v3 범위)
# 참고: https://www.nerdfonts.com/cheat-sheet

# U+F062C = 󰘬 (source_branch)
ICON_BRANCH=$'\U000F062C'
# U+F0645 = 󰙅 (tree)
ICON_TREE=$'\U000F0645'
# U+F024B = 󰉋 (folder_open)
ICON_DIR=$'\U000F024B'
# U+F02A2 = 󰊢 (source_commit)
ICON_GIT_STATUS=$'\U000F02A2'
# U+F04E6 = 󰓦 (sync)
ICON_SYNC=$'\U000F04E6'
# U+F09D9 = 󰧙 (brain)
ICON_MODEL=$'\U000F09D9'
# U+F0954 = 󰥔 (clock_outline)
ICON_TIME=$'\U000F0954'
# U+F017A = 󰅺 (comment)
ICON_SESSION=$'\U000F017A'
# ASCII dollar for maximum compatibility
ICON_COST="$"
# U+F03D8 = 󰏘 (palette)
ICON_THEME=$'\U000F03D8'

# 컨텍스트 아이콘 (상태별)
# U+F0079 = 󰁹 (battery)
ICON_CTX_NORM=$'\U000F0079'
# U+F007B = 󰁻 (battery_50)
ICON_CTX_WARN=$'\U000F007B'
# U+F008E = 󰂎 (fire) - battery_alert로 변경 가능
ICON_CTX_CRIT=$'\U000F008E'
