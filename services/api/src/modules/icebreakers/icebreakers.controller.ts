import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

const templates: Record<string,string[]> = {
  movie: ['최근에 본 영화 추천해 주세요!','영화관 vs. OTT, 뭐가 좋아요?'],
  music: ['요즘 반복 재생하는 노래 있어요?','첫 콘서트 기억나요?'],
  travel: ['가장 기억에 남는 여행지는?','국내 vs 해외, 어디파세요?'],
  food: ['최애 야식은?','라면 끓일 때 꼭 넣는 재료?'],
};

@ApiTags('icebreakers')
@Controller('icebreakers')
export class IcebreakersController {
  @Get()
  list(@Query('interests') interests?: string) {
    const set = new Set<string>();
    (interests || '').split(',').map(s=>s.trim().toLowerCase()).forEach(k => {
      const mapped = templates[k] || [];
      mapped.forEach(t => set.add(t));
    });
    if (set.size === 0) {
      ['movie','music','travel','food'].forEach(k => (templates[k] || []).forEach(t => set.add(t)));
    }
    return Array.from(set).slice(0, 6);
  }
}
