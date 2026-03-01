import axios from 'axios'
import React from 'react'

async function emitEventHandler(event:string,data:any,socketId?:string) {
  const baseUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER
  if (!baseUrl) {
    // Socket server not configured; fail silently
    return
  }

  try {
    await axios.post(
      `${baseUrl}/notify`,
      { socketId, event, data },
      { timeout: 1500 }
    )
  } catch (error: any) {
    // Swallow connection issues so order flow isn’t blocked
    if (error?.code === "ECONNREFUSED") {
      console.warn("socket server unavailable, skipping notify")
    } else {
      console.warn("socket notify error", error?.message || error)
    }
  }
}

export default emitEventHandler
