#!/bin/bash
# zstheme Color Editor - 키 입력 처리

# ============================================================
# 키 입력 읽기
# ============================================================

read_editor_key() {
    local key key2 key3

    # 첫 번째 문자 읽기
    read -rsn1 key

    # ESC 시퀀스 처리
    if [[ "$key" == $'\x1b' ]]; then
        # 추가 문자 읽기 (타임아웃 적용)
        read -rsn1 -t 0.1 key2
        read -rsn1 -t 0.1 key3

        case "${key2}${key3}" in
            '[A')
                echo "up"
                return
                ;;
            '[B')
                echo "down"
                return
                ;;
            '[C')
                echo "right"
                return
                ;;
            '[D')
                echo "left"
                return
                ;;
            # Shift + 화살표 (터미널에 따라 다를 수 있음)
            '[1')
                read -rsn1 -t 0.1 key4
                read -rsn1 -t 0.1 key5
                case "${key4}${key5}" in
                    ';2')
                        read -rsn1 -t 0.1 key6
                        case "$key6" in
                            'C') echo "right10"; return ;;
                            'D') echo "left10"; return ;;
                        esac
                        ;;
                esac
                ;;
        esac

        # ESC 단독 = quit 아님 (다른 시퀀스일 수 있음)
        echo "unknown"
        return
    fi

    # 일반 문자 처리
    case "$key" in
        q|Q)
            echo "quit"
            ;;
        s|S)
            echo "save"
            ;;
        r|R)
            echo "reset"
            ;;
        $'\t')  # Tab
            echo "tab"
            ;;
        '+' | '=')
            echo "plus"
            ;;
        '-' | '_')
            echo "minus"
            ;;
        'k' | 'K')  # vim 스타일
            echo "up"
            ;;
        'j' | 'J')
            echo "down"
            ;;
        'h' | 'H')
            echo "left"
            ;;
        'l' | 'L')
            echo "right"
            ;;
        '[')
            echo "left10"
            ;;
        ']')
            echo "right10"
            ;;
        *)
            echo "unknown"
            ;;
    esac
}
