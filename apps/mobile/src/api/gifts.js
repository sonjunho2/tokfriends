import { apiClient } from './client';

const normalizeAmount = (value) => {
  const numeric = typeof value === 'number' ? value : Number.parseInt(value, 10);
  return Number.isFinite(numeric) ? numeric : 0;
};

const pickGiftId = (gift, index) => {
  return (
    gift?.id ??
    gift?.giftId ??
    gift?.value ??
    gift?.amount ??
    `gift-${index}`
  ).toString();
};

const pickGiftName = (gift, amount) => {
  if (gift?.name) return String(gift.name);
  if (gift?.label) return String(gift.label);
  if (gift?.title) return String(gift.title);
  if (amount > 0) return `${amount}P 선물`;
  return '선물';
};

export async function listGiftOptions() {
  const data = await apiClient.getGiftOptions();
  const candidates = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : [];

  return candidates
    .map((gift, index) => {
      const amount = normalizeAmount(gift?.amount ?? gift?.points ?? gift?.value);
      return {
        id: pickGiftId(gift, index),
        name: pickGiftName(gift, amount),
        amount,
        description: gift?.description ?? gift?.details ?? '',
      };
    })
    .filter((gift) => gift.amount > 0);
}

export default { listGiftOptions };
