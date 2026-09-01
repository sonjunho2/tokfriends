import fetch from 'node-fetch';
import { TranslateClient, TranslateTextCommand } from '@aws-sdk/client-translate';

export class TranslateService {
  async translate(text: string, source: string, target: string) {
    const provider = (process.env.TRANSLATE_PROVIDER || 'none').toLowerCase();
    if (!text || source === target) return { text, provider, mode: 'bypass' };

    if (provider === 'papago') {
      const res = await fetch('https://openapi.naver.com/v1/papago/n2mt', {
        method: 'POST',
        headers: {
          'X-Naver-Client-Id': process.env.PAPAGO_CLIENT_ID || '',
          'X-Naver-Client-Secret': process.env.PAPAGO_CLIENT_SECRET || '',
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        body: new URLSearchParams({ source, target, text })
      });
      if (!res.ok) return { text, provider, mode: 'fallback', error: 'papago_failed' };
      const json: any = await res.json();
      return { text: json.message?.result?.translatedText || text, provider };
    }

    if (provider === 'google') {
      const key = process.env.GOOGLE_TRANSLATE_API_KEY || '';
      const url = `https://translation.googleapis.com/language/translate/v2?key=${key}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, source, target, format: 'text' })
      });
      if (!res.ok) return { text, provider, mode: 'fallback', error: 'google_failed' };
      const json: any = await res.json();
      return { text: json.data?.translations?.[0]?.translatedText || text, provider };
    }

    if (provider === 'aws') {
      const client = new TranslateClient({ region: process.env.AWS_REGION || 'ap-northeast-2' });
      try {
        const out = await client.send(new TranslateTextCommand({ Text: text, SourceLanguageCode: source, TargetLanguageCode: target }));
        return { text: out.TranslatedText || text, provider };
      } catch (e) {
        return { text, provider, mode: 'fallback', error: 'aws_failed' };
      }
    }

    // test mode
    return { text, provider: 'none', mode: 'test' };
  }
}
