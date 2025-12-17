export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const buildHtml = (redirectPath: string) => `<!doctype html>
<html lang="bg">
<head>
  <meta charset="utf-8" />
  <meta http-equiv="refresh" content="0;url=${redirectPath}" />
  <title>Плащането е неуспешно</title>
  <script>window.location.replace(${JSON.stringify(redirectPath)});</script>
</head>
<body style="font-family: system-ui, sans-serif; background:#fff1f1; display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0;">
  <div style="background:white; padding:2rem 2.5rem; border-radius:18px; box-shadow:0 10px 40px rgba(0,0,0,0.08); text-align:center; max-width:380px;">
    <h1 style="color:#5f000b; margin-bottom:0.5rem;">Плащането е неуспешно</h1>
    <p style="margin:0.35rem 0; color:#444;">Ако сумата не е изтеглена от картата, можете да опитате отново.</p>
    <a href="${redirectPath}" style="display:inline-block; margin-top:1.5rem; padding:0.7rem 1.4rem; border-radius:999px; background:#5f000b; color:white; text-decoration:none; font-weight:600; text-transform:uppercase; font-size:0.85rem; letter-spacing:0.06em;">Назад към количката</a>
  </div>
</body>
</html>`;

const respond = (redirectPath: string) =>
  new Response(buildHtml(redirectPath), {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
  });

const handle = () => {
  const redirectPath = "/checkout/failure";
  return respond(redirectPath);
};

export async function GET() {
  return handle();
}

export async function POST() {
  return handle();
}
