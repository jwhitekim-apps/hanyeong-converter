const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const CODE = process.env.GOOGLE_AUTH_CODE;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost:8080";

async function main() {
  if (!CLIENT_ID || !CLIENT_SECRET || !CODE) {
    throw new Error(
      "Missing required env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_AUTH_CODE"
    );
  }

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code: CODE,
    grant_type: "authorization_code",
    redirect_uri: REDIRECT_URI,
  });

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const data = await res.json();
  const fs = require('fs');

  if (!res.ok) {
    throw new Error(JSON.stringify(data, null, 2));
  }

  // 파일로 저장
  fs.writeFile('refresh-token.json', JSON.stringify(data, null, 2), (err) => {
    if (err) throw err;
    console.log('JSON 파일이 성공적으로 저장되었습니다.');
  });

  console.log(JSON.stringify(data, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
