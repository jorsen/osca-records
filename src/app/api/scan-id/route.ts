import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { verifyToken } from '@/lib/auth';

const client = new Anthropic();

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

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const idType = (formData.get('idType') as string) || '';

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return NextResponse.json({ error: 'Only JPG, PNG, or WEBP images are supported' }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString('base64');
  const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/webp';

  const isPhilSys = idType.toLowerCase().includes('philsys');
  const isSenior = idType.toLowerCase().includes('senior');

  const prompt = isPhilSys
    ? `This is a Philippine PhilSys (Philippine Identification System) ID card. Carefully extract the following fields and return ONLY a valid JSON object — no markdown, no explanation:
{
  "fullName": "full name exactly as printed (Last Name, First Name Middle Name)",
  "birthday": "date of birth in YYYY-MM-DD format",
  "gender": "male or female (lowercase)",
  "address": "complete permanent address",
  "birthplace": "place/city/municipality of birth",
  "philsysId": "PCN number — the long ID number on the card"
}
Use null for any field that is not clearly visible or readable.`
    : isSenior
    ? `This is a Philippine Senior Citizen ID (OSCA ID) card. Carefully extract the following fields and return ONLY a valid JSON object — no markdown, no explanation:
{
  "fullName": "full name exactly as printed",
  "birthday": "date of birth in YYYY-MM-DD format",
  "gender": "male or female (lowercase)",
  "address": "complete address",
  "birthplace": "place/city/municipality of birth",
  "seniorIdNumber": "the OSCA ID number printed on the card (digits only, no spaces)"
}
Use null for any field that is not clearly visible or readable.`
    : `This appears to be a Philippine government ID card. Extract whatever personal information you can find and return ONLY a valid JSON object — no markdown, no explanation:
{
  "fullName": "full name as printed",
  "birthday": "date of birth in YYYY-MM-DD format if visible",
  "gender": "male or female (lowercase) if visible",
  "address": "address if visible",
  "birthplace": "birthplace if visible"
}
Use null for any field not found.`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          },
          { type: 'text', text: prompt },
        ],
      }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonStr = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const data = JSON.parse(jsonStr);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Scan ID error:', err);
    return NextResponse.json({ error: 'Could not extract data from this image. Please fill in the details manually.' }, { status: 422 });
  }
}
