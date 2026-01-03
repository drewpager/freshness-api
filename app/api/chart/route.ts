import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { NextResponse } from 'next/server';
import { corsHeaders } from '@/lib/cors';
import dotenv from 'dotenv'

dotenv.config({})

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    // 1. Auth
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    if (!process.env.GOOGLE_SHEET_ID) {
      throw new Error('GOOGLE_SHEET_ID is not defined');
    }

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    const chartSheetID: number | undefined = Number(process.env.GOOGLE_CSID);

    if (!chartSheetID) {
      throw new Error('GOOGLE_CSID is not defined');
    }

    // 2. Load Data
    await doc.loadInfo(); // loads document properties and worksheets
    console.log(doc.title);
    // const sheet = doc.sheetsByIndex[0]; // get the first sheet
    const sheet = doc.sheetsById[chartSheetID ? chartSheetID : 1234613033];
    const rows = await sheet.getRows(); // can pass { limit, offset }

    // 3. Format Data (convert to plain JSON)
    const data = rows.map((row) => {
      // row.toObject() converts the row to a key-value object based on header row
      return row.toObject();
    });

    // 4. Return Response with Caching
    // Cache for 60 seconds to avoid hitting Google's rate limits
    return NextResponse.json(
      { data },
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Cache-Control': 's-maxage=60, stale-while-revalidate',
        },
      }
    );
  } catch (error: Error | any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}