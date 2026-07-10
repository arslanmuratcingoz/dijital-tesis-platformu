import { NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { fallbackPlanFromPrompt } from '@/lib/projectDefaults';
import { AiCommandPlan, ProjectState } from '@/types/project';

const systemPrompt = `Sen Dijital Tesis Platformu'nun AI komut motorusun. Görevin kullanıcı komutunu güvenli JSON işlem planına çevirmektir.
Kesinlikle HTML, JS veya kaynak kod değiştirme. Sadece izinli proje veri işlemleri üret.
Çıktı yalnızca JSON olacak. Şema:
{
  "summary": "kısa Türkçe özet",
  "confidence": 0.0-1.0,
  "requiresApproval": true,
  "humanReadableSteps": ["adım"],
  "warnings": ["uyarı varsa"],
  "actions": [
    {"action":"create_asset|create_building|create_column_grid|create_sign|move_asset|delete_asset|create_layer|toggle_layer|noop", "targetId":"opsiyonel", "payload":{}}
  ]
}
Kurallar:
- Makine/raf/forklift/yangın/pano için create_asset üret.
- Levha/tabela/işaret için create_sign üret.
- Bina/fabrika/depo için create_building üret.
- Kolon/aks için create_column_grid üret.
- Ölçüler metre cinsinden sayı olmalı.
- Bilinmeyen konumlarda x=0,z=0 kullan ve warnings ekle.
- payload.category alanı machine, rack, vehicle, sign, fire, electrical, custom değerlerinden biri olsun.
- payload.layerId uygun katman olsun: machines, racks, signs, fire, electrical, buildings.
- Asla kod bloğu, açıklama metni veya markdown döndürme. Sadece JSON.`;

function parseJsonPlan(text: string): AiCommandPlan {
  const clean = text.trim().replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim();
  return JSON.parse(clean) as AiCommandPlan;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt = String(body.prompt || '');
    const projectState = body.projectState as ProjectState | undefined;
    if (!prompt.trim()) return NextResponse.json({ error: 'Komut boş olamaz.' }, { status: 400 });

    if (!env.openAiKey) {
      return NextResponse.json({ plan: fallbackPlanFromPrompt(prompt), source: 'local-fallback' });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.openAiKey}`
      },
      body: JSON.stringify({
        model: env.openAiModel,
        temperature: 0.15,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify({ prompt, projectState }, null, 2) }
        ]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: data?.error?.message || 'OpenAI API yanıtı başarısız.' }, { status: 500 });
    }
    const content = data?.choices?.[0]?.message?.content || '';
    const plan = parseJsonPlan(content);
    if (!Array.isArray(plan.actions)) throw new Error('AI yanıtı geçerli işlem planı içermiyor.');
    return NextResponse.json({ plan, source: 'openai' });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'AI planı oluşturulamadı.' }, { status: 500 });
  }
}
