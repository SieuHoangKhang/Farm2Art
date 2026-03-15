import fetch from 'node-fetch';

async function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

const maxAttempts = 30;
for(let i=1;i<=maxAttempts;i++){
  try{
    const res = await fetch('http://localhost:3000/api/chat',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ message: 'Xin chào' }),
    });
    if(res.ok){
      const j = await res.json();
      console.log('Success:', j);
      process.exit(0);
    } else {
      console.log(`Attempt ${i}: status ${res.status}`);
    }
  }catch(err){
    console.log(`Attempt ${i}: ${err.message}`);
  }
  await sleep(1000);
}
console.error('Failed to contact /api/chat after retries');
process.exit(1);
