import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { readFile } from 'fs/promises';
import { join } from 'path';

let cachedFont: Buffer | null = null;

async function getSystemFont(): Promise<Buffer> {
  if (cachedFont) return cachedFont;

  const fontPaths = [
    '/usr/share/fonts/liberation/LiberationSans-Regular.ttf',
    '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    '/usr/share/fonts/noto-sans/NotoSans-Regular.ttf',
    '/usr/share/fonts/dejavu/DejaVuSans.ttf',
    join(process.cwd(), 'public', 'fonts', 'LiberationSans-Regular.ttf'),
  ];

  for (const fontPath of fontPaths) {
    try {
      cachedFont = await readFile(fontPath);
      console.log('Successfully loaded font from:', fontPath);
      return cachedFont;
    } catch (err) {
      console.log('Font path not found:', fontPath);
      continue;
    }
  }

  console.warn('Could not load Greek-supporting font from any path, will use Helvetica fallback');
  return Buffer.alloc(0);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: appointmentId } = await params;
  const authHeader = req.headers.get('authorization');

  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');

  const supabaseUser = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: { user }, error: authError } = await supabaseUser.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: practitioner, error: practError } = await supabase
    .from('practitioners')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (practError || !practitioner) {
    return NextResponse.json({ error: 'Practitioner not found' }, { status: 404 });
  }

  const { data: appointment, error: aptError } = await supabase
    .from('v_appointment_full')
    .select('appointment_id, patient_name, patient_ref, appointment_time, raw_transcript, practitioner_id')
    .eq('appointment_id', appointmentId)
    .single();

  if (aptError || !appointment) {
    return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
  }

  if (appointment.practitioner_id !== practitioner.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    let page = pdfDoc.addPage([595, 842]);
    const { width, height } = page.getSize();

    const margin = 40;
    let yPos = height - margin;
    const lineHeight = 18;
    const textWidth = width - (2 * margin);

    const fontBuffer = await getSystemFont();
    let font;

    if (fontBuffer.length > 0) {
      try {
        font = await pdfDoc.embedFont(fontBuffer);
      } catch (err) {
        console.error('Failed to embed custom font, trying system fonts', err);
        font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      }
    } else {
      console.warn('No custom font found, falling back to Helvetica');
      font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }

    page.drawText('SOAP Note Export', {
      x: margin,
      y: yPos,
      size: 20,
      font,
      color: rgb(0, 0, 0),
    });
    yPos -= lineHeight * 1.5;

    page.drawText(`Patient: ${appointment.patient_name || 'Unknown'} (${appointment.patient_ref || 'N/A'})`, {
      x: margin,
      y: yPos,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });
    yPos -= lineHeight;

    const appointmentDate = new Date(appointment.appointment_time).toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    page.drawText(`Date: ${appointmentDate}`, {
      x: margin,
      y: yPos,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });
    yPos -= lineHeight * 1.5;

    const transcriptText = appointment.raw_transcript || 'No transcript yet';
    const maxCharsPerLine = 80;
    const lines = transcriptText.split('\n');

    for (const line of lines) {
      const wrappedLines = line.match(new RegExp(`.{1,${maxCharsPerLine}}`, 'g')) || [];
      for (const wrappedLine of wrappedLines) {
        if (yPos < margin + lineHeight) {
          page = pdfDoc.addPage([595, 842]);
          yPos = height - margin;
        }

        page.drawText(wrappedLine, {
          x: margin,
          y: yPos,
          size: 11,
          font,
          color: rgb(0, 0, 0),
        });
        yPos -= lineHeight;
      }
      yPos -= 5;
    }

    page.drawText(`Generated by BookFlow on ${new Date().toLocaleString('en-GB')}`, {
      x: margin,
      y: margin - 10,
      size: 9,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    const dateStr = new Date(appointment.appointment_time)
      .toISOString()
      .split('T')[0];
    const filename = `SOAP_${appointment.patient_ref}_${dateStr}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('PDF generation error:', err);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
