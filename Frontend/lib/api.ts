export async function sendMessage(task: string) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/executor/run`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        task,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to call backend");
  }

  return await response.json();
}