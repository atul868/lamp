const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const dir = path.join(__dirname, '/../sheets');

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}
module.exports = (data, res) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const filename = __dirname + '/../sheets/temp_' + Date.now() + '.xlsx';
  XLSX.writeFile(wb, filename);
  res.setHeader('Content-disposition', 'attachment; filename=data.xlsx');
  res.status(200).sendFile(path.resolve(filename));
};
