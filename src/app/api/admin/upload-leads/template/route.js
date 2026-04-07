export async function GET() {
  const csv = [
    'Name,Phone,Email,Company,Product Interest,Source,Lead Value,Priority,Notes',
    'Rahul Sharma,9876543210,rahul@example.com,Acme Pvt Ltd,Web Development,Website,50000,High,Interested in e-commerce project',
    'Priya Patel,9123456780,priya@biz.in,StartupXYZ,,Cold Call,,Medium,Follow up next week',
    'Amit Kumar,8800001234,,,Mobile App,Referral,25000,Low,',
  ].join('\n');

  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="leads_upload_template.csv"',
    },
  });
}
