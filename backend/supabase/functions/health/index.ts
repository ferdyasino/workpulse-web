Deno.serve(() => {
  return Response.json({
    status: "ok",
    service: "workpulse-edge",
    timestamp: new Date().toISOString(),
  });
});
