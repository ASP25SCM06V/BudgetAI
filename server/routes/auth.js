import express from 'express'
import { google } from 'googleapis'
import { setGmailTokens } from '../store.js'

const router = express.Router()

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback'
  )
}

// Initiates Google OAuth flow — opened in a popup by the client
router.get('/auth/google', (req, res) => {
  const oauth2Client = getOAuth2Client()
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly'],
    prompt: 'consent',
  })
  res.redirect(url)
})

// Google redirects here after user grants/denies access
router.get('/auth/google/callback', async (req, res) => {
  const { code, error } = req.query

  if (error || !code) {
    return res.send(`
      <html><body><script>
        window.opener && window.opener.postMessage(
          { type: 'GMAIL_AUTH_ERROR', error: '${error || 'No code returned'}' },
          'http://localhost:5173'
        );
        window.close();
      </script></body></html>
    `)
  }

  try {
    const oauth2Client = getOAuth2Client()
    const { tokens } = await oauth2Client.getToken(code)
    setGmailTokens(tokens)
    res.send(`
      <html><body><script>
        window.opener && window.opener.postMessage(
          { type: 'GMAIL_AUTH_SUCCESS' },
          'http://localhost:5173'
        );
        window.close();
      </script></body></html>
    `)
  } catch (e) {
    res.send(`
      <html><body><script>
        window.opener && window.opener.postMessage(
          { type: 'GMAIL_AUTH_ERROR', error: '${e.message.replace(/'/g, "\\'")}' },
          'http://localhost:5173'
        );
        window.close();
      </script></body></html>
    `)
  }
})

export default router
