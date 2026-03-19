const http = require('http');
http.get('http://localhost:4321/blog/hru', res => {
  let d = '';
  res.on('data', c => d+=c);
  res.on('end', () => console.log(d.substring(0, 3000)));
});
