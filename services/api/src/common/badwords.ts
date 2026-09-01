// 아주 작은 금칙어 리스트 (테스트용). 필요 시 자유롭게 확장하세요.
const BADWORDS = ['badword1', 'badword2', 'spam'];

export function containsBadWord(text: string): boolean {
  const t = (text || '').toLowerCase();
  return BADWORDS.some(w => t.includes(w));
}
