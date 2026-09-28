"""hunspell-dict-ko 사전에서 조각으로 만들 수 있는 명사를 뽑아 app/dictionary.ts를 만듭니다.

    npm pack dictionary-ko && tar xzf dictionary-ko-*.tgz
    python3 scripts/build-dictionary.py package/index.dic
"""
import collections
import pathlib
import sys
import unicodedata

CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ"
JUNG = "ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ"
JONG = [""] + list("ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ")
# app/hangul.ts와 같은 규칙: 기본 자음 14개, 홑모음과 합칠 수 있는 겹모음
CONSONANTS = set("ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ")
VOWELS = set("ㅏㅐㅑㅓㅔㅕㅗㅛㅜㅠㅡㅣㅘㅙㅚㅝㅞㅟㅢ")
# 사전의 명사 플래그 (10: 하다가 붙는 명사, 25: 그 밖의 명사)
NOUN_FLAGS = {"10", "25"}


def buildable(syllable):
    code = ord(syllable) - 0xAC00
    if not 0 <= code < 11172:
        return False
    cho, jung, jong = CHO[code // 588], JUNG[code % 588 // 28], JONG[code % 28]
    return cho in CONSONANTS and jung in VOWELS and (not jong or jong in CONSONANTS)


flags = collections.defaultdict(set)
for line in pathlib.Path(sys.argv[1]).read_text(encoding="utf-8").splitlines()[1:]:
    word, _, flag = line.partition("/")
    flags[unicodedata.normalize("NFC", word)].add(flag)

words = sorted(
    word for word, flag in flags.items()
    if flag & NOUN_FLAGS and 2 <= len(word) <= 5 and all(buildable(s) for s in word)
)

out = pathlib.Path(__file__).resolve().parent.parent / "app" / "dictionary.ts"
out.write_text(
    "// scripts/build-dictionary.py가 만든 파일입니다. 손으로 고치지 마세요.\n"
    "// 출처: hunspell-dict-ko (https://github.com/spellcheck-ko/hunspell-dict-ko), npm dictionary-ko 2.0.0\n"
    "// 라이선스: GPL-2.0 / LGPL-2.1 / MPL-1.1 가운데 MPL-1.1을 따릅니다.\n"
    f"// 명사 {len(words)}개\n\n"
    f'export const DICTIONARY = "{" ".join(words)}";\n',
    encoding="utf-8",
)
print(f"{len(words)} words -> {out}")
