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

export async function POST(request: NextRequest) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = verifyToken(token);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Scan service not configured.' }, { status: 503 });

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const idType = (formData.get('idType') as string) || '';

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return NextResponse.json({ error: 'Only JPG, PNG, or WEBP images are supported' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString('base64');

  const isPhilSys = idType.toLowerCase().includes('philsys');
  const isSenior = idType.toLowerCase().includes('senior');

  const prompt = isPhilSys
    ? `This is a Philippine PhilSys (Philippine Identification System) ID card. Extract the following and return ONLY valid JSON, no markdown:
{"fullName":"full name as printed","birthday":"YYYY-MM-DD","gender":"male or female","address":"complete address","birthplace":"place of birth","philsysId":"PCN number on the card"}
Use null for fields not visible.`
    : isSenior
    ? `This is a Philippine Senior Citizen ID (OSCA ID). Extract the following and return ONLY valid JSON, no markdown:
{"fullName":"full name as printed","birthday":"YYYY-MM-DD","gender":"male or female","address":"complete address","birthplace":"place of birth","seniorIdNumber":"OSCA ID number digits only"}
Use null for fields not visible.`
    : `This is a Philippine government ID. Extract personal information and return ONLY valid JSON, no markdown:
{"fullName":"full name if visible","birthday":"YYYY-MM-DD if visible","gender":"male or female if visible","address":"address if visible","birthplace":"birthplace if visible"}
Use null for fields not found.`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent([
      { inlineData: { data: base64, mimeType: file.type as 'image/jpeg' | 'image/png' | 'image/webp' } },
      prompt,
    ]);

    const text = result.response.text().replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const data = JSON.parse(text);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Scan ID error:', err);
    return NextResponse.json({ error: 'Could not extract data from this image. Please fill in the details manually.' }, { status: 422 });
  }
}
