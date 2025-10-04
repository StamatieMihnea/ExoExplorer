import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the form data from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;

    // Validate that a file was uploaded
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type (CSV)
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a CSV file.' },
        { status: 400 }
      );
    }

    // Read the file content as text
    const fileContent = await file.text();

    // Parse CSV content into rows
    const rows = fileContent.split('\n').filter(row => row.trim() !== '');
    
    // Get headers from first row
    const headers = rows[0].split(',').map(h => h.trim());
    
    // Parse data rows into array of objects
    const csvData = [];
    for (let i = 1; i < rows.length; i++) {
      const values = rows[i].split(',');
      const rowData: { [key: string]: string } = {};
      
      headers.forEach((header, index) => {
        rowData[header] = values[index]?.trim() || '';
      });
      
      csvData.push(rowData);
    }

    // Store the data in a variable (data is now in csvData array)
    // You can process this data further here...
    
    console.log('CSV Data loaded:', {
      fileName: file.name,
      fileSize: file.size,
      totalRows: csvData.length,
      headers: headers,
      firstRow: csvData[0]
    });

    // TODO: Process the csvData variable here
    // The csvData variable contains all the parsed CSV data
    // Each item in csvData is an object with headers as keys
    
    // For now, return info about the uploaded file
    return NextResponse.json({
      message: 'File uploaded and parsed successfully',
      fileName: file.name,
      fileSize: file.size,
      rowCount: csvData.length,
      headers: headers,
      sampleData: csvData.slice(0, 3) // First 3 rows as sample
    });

  } catch (error) {
    console.error('Error processing file upload:', error);
    return NextResponse.json(
      { error: 'Failed to process file upload' },
      { status: 500 }
    );
  }
}

