import { NextResponse } from 'next/server';

interface Match {
  id: number;
  category: string;
  date: string;
  time: string;
  match: string;
  phase: string;
  competition: string;
  stream: string;
  streamUrl?: string;
}

// Google Sheets configuration
const SHEET_ID = '1i3ji5iDuACafqPPR0CPGI4ARk6Z2d853KeKcHef2Wto';
const RANGE = 'A3:H100'; // Starting from row 3 to skip headers, adjust range as needed
const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;

export async function GET() {
  try {
    if (!API_KEY) {
      return NextResponse.json(
        { error: 'Google Sheets API key not configured' },
        { status: 500 }
      );
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${RANGE}?key=${API_KEY}`;
    
    const response = await fetch(url, {
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`Google Sheets API error: ${response.status}`);
    }

    const data = await response.json();
    const rows = data.values || [];

    // Transform the data into Match objects
    // Based on the REAL Google Sheet structure from console.log:
    // A=Categoría/Juego, B=Fecha, C=Hora, D=Partido, E=Fase, F=Competición, G=Stream
    const matches: Match[] = rows
      .filter((row: string[]) => row.length >= 5 && row[0]) // Filter out empty rows
      .map((row: string[], index: number) => {
        return {
          id: index + 1,
          category: row[0] || 'Otros', // Categoría/Juego (primera columna)
          date: row[1] || '', // Fecha
          time: row[2] || '', // Hora
          match: row[3] || '', // Partido
          phase: row[4] || '', // Fase
          competition: row[5] || '', // Competición
          stream: row[6] || '', // Stream
          // Note: We can't easily get hyperlink URLs from the basic API
          // For hyperlinks, we'd need to use the more complex batchGet method
        };
      });

    return NextResponse.json({ matches, total: matches.length });
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches from Google Sheets' },
      { status: 500 }
    );
  }
}