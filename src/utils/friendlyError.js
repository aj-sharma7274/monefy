// Turns a technical error into a short, plain message for the person using the app.
// The technical detail is never shown on screen; it goes to the browser console only,
// so it is still there if we ever need to investigate.
//
//   friendlyError(error, "Couldn't save this entry. Please try again.")
//
// `fallback` is used when the error is not one of the common cases below.

export function friendlyError(err, fallback = "Something went wrong. Please try again.") {
  if (err) console.error("[Monefy]", err);

  const text = `${err?.message || ""} ${err?.details || ""} ${err?.error || ""}`.toLowerCase();

  const offline = typeof navigator !== "undefined" && navigator.onLine === false;
  if (offline || /failed to fetch|networkerror|network request failed|load failed|network error/.test(text)) {
    return "No internet connection. Please check your connection and try again.";
  }
  if (/jwt expired|invalid jwt|not_signed_in|not authenticated|refresh token/.test(text)) {
    return "Your session has expired. Please sign in again.";
  }
  if (/maximum allowed size|payload too large|too large/.test(text)) {
    return "That file is too large. Please choose a smaller file.";
  }
  if (/mime type|not supported|invalid file/.test(text)) {
    return "That file type isn't supported. Please use a photo or a PDF.";
  }
  if (/not_found/.test(text)) {
    return "We couldn't find that. It may already have been removed. Please refresh the page.";
  }
  if (/already_exists/.test(text)) {
    return "That already exists.";
  }
  if (/row-level security|permission denied|violates row/.test(text)) {
    return "You don't have permission to do that. Please sign in again.";
  }
  return fallback;
}