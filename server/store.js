// In-memory store — fine for hackathon, single user
let accessToken = null
let gmailTokens = null

export const setAccessToken = (token) => { accessToken = token }
export const getAccessToken = () => accessToken

export const setGmailTokens = (tokens) => { gmailTokens = tokens }
export const getGmailTokens = () => gmailTokens
