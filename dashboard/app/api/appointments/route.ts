import { NextResponse } from 'next/server';
import { pool } from '../../../lib/db';

export async function GET() {
  try {
    // This query fetches the appointment details and joins the patient name 
    // from the patients table so you don't just see IDs.
    const query = `
      SELECT 
        a.id, 
        p.patient_name, 
        a.appointment_time, 
        a.status
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      ORDER BY a.appointment_time DESC;
    `;
    
    const result = await pool.query(query);
    
    // Returns the data as JSON to your frontend
    return NextResponse.json(result.rows);
  } catch (error) {
    // This helps us debug in the terminal if the database connection fails
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Database connection failed' }, 
      { status: 500 }
    );
  }
}