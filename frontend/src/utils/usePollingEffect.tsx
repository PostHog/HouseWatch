import { useEffect, useRef } from 'react'

export function usePollingEffect(
    asyncCallback: any,
    dependencies = [],
    {
        interval = 3000, // 3 seconds,
        onCleanUp = () => { },
    } = {}
) {
    const timeoutIdRef = useRef<number | null>(null)
    useEffect(() => {
        let _stopped = false
        ;(async function pollingCallback() {
            try {
                await asyncCallback()
            } finally {
                // Set timeout after it finished, unless stopped
                timeoutIdRef.current = !_stopped && window.setTimeout(pollingCallback, interval)
            }
        })()
        // Clean up if dependencies change
        return () => {
            _stopped = true // prevent racing conditions
            if (timeoutIdRef.current) {
                clearTimeout(timeoutIdRef.current)
            }
            onCleanUp()
        }
    }, [...dependencies, interval])
}
