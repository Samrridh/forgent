/** Read an API response without displaying raw HTML or a JSON parser error to users. */
export async function readApiResponse<T>(response: Response): Promise<T> {
  try { return await response.json() as T; }
  catch { throw new Error(`The server returned an unexpected response (HTTP ${response.status}). Refresh the page and try again.`); }
}
