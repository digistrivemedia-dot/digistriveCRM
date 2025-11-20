import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Lead from '@/models/Lead';
import Product from '@/models/Product';
import Source from '@/models/Source';
import { authenticateUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await authenticateUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const formData = await request.formData();
    const csvFile = formData.get('csvFile');
    const assignedTo = formData.get('assignedTo') || null; // Can be null for unassigned

    if (!csvFile) {
      return NextResponse.json(
        { error: 'CSV file is required' },
        { status: 400 }
      );
    }

    // Read CSV content
    const csvContent = await csvFile.text();
    const lines = csvContent.split('\n').filter(line => line.trim() !== '');
    
    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV file must contain at least a header row and one data row' },
        { status: 400 }
      );
    }

    // Parse CSV header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Expected columns mapping
    const columnMap = {
      'name': ['name', 'full name', 'fullname', 'customer name'],
      'phone': ['phone', 'phone number', 'mobile', 'contact'],
      'email': ['email', 'email address', 'e-mail'],
      'companyName': ['company', 'company name', 'companyname', 'organization'],
      'productInterest': ['product', 'product interest', 'productinterest', 'service'],
      'source': ['source', 'lead source', 'leadsource', 'referral'],
      'leadValue': ['value', 'lead value', 'leadvalue', 'amount', 'price'],
      'priority': ['priority', 'importance'],
      'notes': ['notes', 'comments', 'description', 'remarks']
    };

    // Find column indices
    const getColumnIndex = (field) => {
      const possibleNames = columnMap[field] || [field];
      for (let i = 0; i < headers.length; i++) {
        if (possibleNames.includes(headers[i])) {
          return i;
        }
      }
      return -1;
    };

    // Get default product and source for missing data, create if none exist
    let defaultProduct = await Product.findOne({ isActive: true }).sort({ createdAt: 1 });
    let defaultSource = await Source.findOne({ isActive: true }).sort({ createdAt: 1 });

    // Create default product if none exists
    if (!defaultProduct) {
      defaultProduct = await Product.create({
        name: 'General Service',
        description: 'Default product for CSV uploads',
        createdBy: user.userId,
        isActive: true
      });
    }

    // Create default source if none exists
    if (!defaultSource) {
      defaultSource = await Source.create({
        name: 'CSV Upload',
        description: 'Default source for CSV uploads',
        createdBy: user.userId,
        isActive: true
      });
    }

    const leadData = [];
    const errors = [];
    let successCount = 0;
    let skipCount = 0;

    // Process each data row
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      try {
        const nameIndex = getColumnIndex('name');
        const phoneIndex = getColumnIndex('phone');
        
        // Skip if missing required fields
        if (nameIndex === -1 || phoneIndex === -1 || 
            !values[nameIndex] || !values[phoneIndex]) {
          errors.push(`Row ${i + 1}: Missing required name or phone`);
          skipCount++;
          continue;
        }

        // Get product by name or create/use default
        let productId = defaultProduct?._id;
        const productIndex = getColumnIndex('productInterest');
        if (productIndex !== -1 && values[productIndex]) {
          let product = await Product.findOne({ 
            name: { $regex: values[productIndex], $options: 'i' },
            isActive: true 
          });
          
          // If product doesn't exist, create it
          if (!product) {
            product = await Product.create({
              name: values[productIndex],
              description: `Auto-created from CSV upload: ${values[productIndex]}`,
              createdBy: user.userId,
              isActive: true
            });
          }
          productId = product._id;
        }

        // Get source by name or create/use default
        let sourceId = defaultSource?._id;
        const sourceIndex = getColumnIndex('source');
        if (sourceIndex !== -1 && values[sourceIndex]) {
          let source = await Source.findOne({ 
            name: { $regex: values[sourceIndex], $options: 'i' },
            isActive: true 
          });
          
          // If source doesn't exist, create it
          if (!source) {
            source = await Source.create({
              name: values[sourceIndex],
              description: `Auto-created from CSV upload: ${values[sourceIndex]}`,
              createdBy: user.userId,
              isActive: true
            });
          }
          sourceId = source._id;
        }

        // Parse lead value
        const leadValueIndex = getColumnIndex('leadValue');
        let leadValue = 0;
        if (leadValueIndex !== -1 && values[leadValueIndex]) {
          leadValue = parseFloat(values[leadValueIndex].replace(/[^0-9.-]+/g, '')) || 0;
        }

        // Get priority
        const priorityIndex = getColumnIndex('priority');
        let priority = 'Medium';
        if (priorityIndex !== -1 && values[priorityIndex]) {
          const priorityValue = values[priorityIndex].toLowerCase();
          if (['low', 'medium', 'high'].includes(priorityValue)) {
            priority = values[priorityIndex].charAt(0).toUpperCase() + values[priorityIndex].slice(1).toLowerCase();
          }
        }

        const leadObj = {
          name: values[nameIndex],
          phone: values[phoneIndex],
          email: getColumnIndex('email') !== -1 ? values[getColumnIndex('email')] || '' : '',
          companyName: getColumnIndex('companyName') !== -1 ? values[getColumnIndex('companyName')] || '' : '',
          productInterest: productId,
          source: sourceId,
          leadValue,
          assignedTo,
          priority,
          notes: getColumnIndex('notes') !== -1 ? values[getColumnIndex('notes')] || '' : '',
          createdBy: user.userId,
        };

        // Validate required fields exist
        if (!leadObj.productInterest || !leadObj.source) {
          errors.push(`Row ${i + 1}: Could not find valid product or source`);
          skipCount++;
          continue;
        }

        leadData.push(leadObj);
        successCount++;

      } catch (error) {
        errors.push(`Row ${i + 1}: ${error.message}`);
        skipCount++;
      }
    }

    // Insert valid leads
    if (leadData.length > 0) {
      await Lead.insertMany(leadData);
    }

    return NextResponse.json({
      message: 'CSV upload completed',
      count: successCount,
      skipped: skipCount,
      errors: errors,
      total: lines.length - 1,
    });

  } catch (error) {
    console.error('CSV upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}