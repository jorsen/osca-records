import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { verifyToken } from '@/lib/auth';

function getToken(request: NextRequest): string | null {
  const token = request.cookies.get('auth_token')?.value;
  if (token) return token;
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.substring(7);
  return null;
}

/** Try every reasonable way to pull a JSON object out of a model response. */
function extractJson(text: string): Record<string, string | null> | null {
  // 1. Strip markdown fences
  let cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  // 2. Try direct parse first
  try { return JSON.parse(cleaned); } catch { /* continue */ }

  // 3. Find the first { ... } block
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { /* continue */ }
  }

  // 4. Build partial object from key: value lines (fallback)
  const partial: Record<string, string | null> = {};
  const patterns: [string, RegExp][] = [
    ['fullName',      /"?fullName"?\s*:\s*"([^"]+)"/i],
    ['birthday',      /"?birthday"?\s*:\s*"([^"]+)"/i],
    ['gender',        /"?gender"?\s*:\s*"(male|female)"/i],
    ['address',       /"?address"?\s*:\s*"([^"]+)"/i],
    ['birthplace',    /"?birthplace"?\s*:\s*"([^"]+)"/i],
    ['seniorIdNumber',/"?seniorIdNumber"?\s*:\s*"([^"]+)"/i],
    ['philsysId',     /"?philsysId"?\s*:\s*"([^"]+)"/i],
  ];
  let found = false;
  for (const [key, re] of patterns) {
    const m = text.match(re);
    if (m) { partial[key] = m[1]; found = true; }
  }
  return found ? partial : null;
}

export async function POST(request: NextRequest) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = verifyToken(token);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Scan service not configured. Please add GEMINI_API_KEY.' }, { status: 503 });

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const idType = (formData.get('idType') as string) || '';

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Only JPG, PNG, or WEBP images are supported' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString('base64');

  const isPhilSys = idType.toLowerCase().includes('philsys');
  const isSenior  = idType.toLowerCase().includes('senior');

  const fields = isPhilSys
    ? `fullName, birthday (YYYY-MM-DD), gender (male/female), address, birthplace, philsysId (PCN number)`
    : isSenior
    ? `fullName, birthday (YYYY-MM-DD), gender (male/female), address, birthplace, seniorIdNumber (digits only)`
    : `fullName, birthday (YYYY-MM-DD), gender (male/female), address, birthplace`;

  const idLabel = isPhilSys ? 'PhilSys ID' : isSenior ? 'Senior Citizen / OSCA ID' : 'Philippine government ID';

  const prompt = `You are reading a ${idLabel} card image.
Extract these fields: ${fields}.
Respond with ONLY a raw JSON object. Do not use markdown. Do not explain. Example format:
{"fullName":"Juan Dela Cruz","birthday":"1950-03-15","gender":"male","address":"123 Rizal St, Quezon City","birthplace":"Manila","seniorIdNumber":"1234567890123456"}
Use null for any field that is not clearly visible. If the image is unclear, still return valid JSON with null values.`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: { temperature: 0, maxOutputTokens: 512 },
    });

    const result = await model.generateContent([
      { inlineData: { data: base64, mimeType: file.type as 'image/jpeg' | 'image/png' | 'image/webp' } },
      prompt,
    ]);

    const text = result.response.text();
    console.log('[scan-id] raw response:', text);

    const data = extractJson(text);
    if (!data) {
      console.error('[scan-id] could not parse JSON from:', text);
      return NextResponse.json(
        { error: 'Could not read the ID clearly. Make sure the photo is well-lit, in focus, and the full card is visible.' },
        { status: 422 }
      );
    }

    // Normalise gender to lowercase
    if (data.gender) data.gender = data.gender.toLowerCase();

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('[scan-id] API error:', err);
    return NextResponse.json(
      { error: 'Scan service error. Please try again or fill in the details manually.' },
      { status: 500 }
    );
  }
}
