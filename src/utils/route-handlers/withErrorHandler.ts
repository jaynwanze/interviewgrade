type Handler = () => Promise<Response>;

export const withErrorHandler = async (handler: Handler) => {
  try {
    return await handler();
  } catch (err) {
    console.log('an error occured');
    console.error(err);
    return new Response(err.message, { status: 500 });
  }
};
