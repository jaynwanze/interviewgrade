export async function POST() {
  return Response.json(
    {
      error:
        'This legacy application-email endpoint has been retired. Use the current Practice sharing flow instead.',
    },
    { status: 410 },
  );
}
